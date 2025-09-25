-- Enhance existing invoice tables with tax functionality
-- This migration extends the current invoice system with comprehensive tax support

-- First, let's check if invoices table exists and enhance it
DO $$
BEGIN
    -- Add tax and business information columns to existing invoices table
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'invoices') THEN
        -- Add tax jurisdiction and compliance fields
        ALTER TABLE invoices
        ADD COLUMN IF NOT EXISTS tax_jurisdiction TEXT,
        ADD COLUMN IF NOT EXISTS tax_type TEXT,
        ADD COLUMN IF NOT EXISTS tax_exempt BOOLEAN DEFAULT FALSE,
        ADD COLUMN IF NOT EXISTS tax_exemption_reason TEXT,

        -- Add business information for tax compliance
        ADD COLUMN IF NOT EXISTS business_name TEXT,
        ADD COLUMN IF NOT EXISTS business_address JSONB,
        ADD COLUMN IF NOT EXISTS business_tax_id TEXT,

        -- Add client tax information
        ADD COLUMN IF NOT EXISTS client_address JSONB,
        ADD COLUMN IF NOT EXISTS client_tax_id TEXT,

        -- Add invoice footer and terms
        ADD COLUMN IF NOT EXISTS footer_text TEXT;

        -- Update tax rate column to be more precise
        ALTER TABLE invoices
        ALTER COLUMN tax_rate TYPE DECIMAL(7,4);

        -- Add constraints for tax compliance
        ALTER TABLE invoices
        ADD CONSTRAINT check_tax_exempt_reason
        CHECK ((tax_exempt = FALSE) OR (tax_exempt = TRUE AND tax_exemption_reason IS NOT NULL));

        -- Add indexes for tax reporting
        CREATE INDEX IF NOT EXISTS idx_invoices_tax_jurisdiction ON invoices(tax_jurisdiction);
        CREATE INDEX IF NOT EXISTS idx_invoices_tax_exempt ON invoices(tax_exempt);
        CREATE INDEX IF NOT EXISTS idx_invoices_business_tax_id ON invoices(business_tax_id);

        RAISE NOTICE 'Enhanced existing invoices table with tax functionality';
    ELSE
        RAISE NOTICE 'Invoices table does not exist, will be created by main invoice migration';
    END IF;

    -- Enhance invoice_items table if it exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'invoice_items') THEN
        ALTER TABLE invoice_items
        ADD COLUMN IF NOT EXISTS service_type TEXT,
        ADD COLUMN IF NOT EXISTS service_date DATE,
        ADD COLUMN IF NOT EXISTS session_duration_minutes INTEGER,
        ADD COLUMN IF NOT EXISTS taxable BOOLEAN DEFAULT TRUE,
        ADD COLUMN IF NOT EXISTS tax_category TEXT;

        -- Update tax_rate column precision
        ALTER TABLE invoice_items
        ALTER COLUMN tax_rate TYPE DECIMAL(7,4);

        RAISE NOTICE 'Enhanced existing invoice_items table with service tracking';
    END IF;

END $$;

-- Create the comprehensive invoice system if tables don't exist
CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_number TEXT NOT NULL UNIQUE,
    client_id UUID NOT NULL,
    coach_id UUID NOT NULL,
    payment_id UUID,
    booking_id UUID,

    -- Invoice details
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'sent', 'paid', 'partially_paid', 'overdue', 'cancelled', 'refunded')),
    issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE NOT NULL,
    paid_date DATE,

    -- Financial information
    subtotal_cents BIGINT NOT NULL,
    tax_rate DECIMAL(7,4) DEFAULT 0.0000,
    tax_amount_cents BIGINT NOT NULL DEFAULT 0,
    discount_cents BIGINT DEFAULT 0,
    total_cents BIGINT NOT NULL,
    amount_paid_cents BIGINT DEFAULT 0,
    balance_due_cents BIGINT DEFAULT 0,
    currency TEXT NOT NULL DEFAULT 'USD',

    -- Tax information
    tax_jurisdiction TEXT,
    tax_type TEXT,
    tax_exempt BOOLEAN DEFAULT FALSE,
    tax_exemption_reason TEXT,

    -- Business information for tax compliance
    business_name TEXT,
    business_address JSONB,
    business_tax_id TEXT,

    -- Client tax information
    client_address JSONB,
    client_tax_id TEXT,

    -- Payment and terms
    payment_terms TEXT DEFAULT 'Due upon receipt',
    notes TEXT,
    terms_and_conditions TEXT,
    footer_text TEXT,

    -- Metadata
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS invoice_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,

    -- Item details
    description TEXT NOT NULL,
    quantity DECIMAL(10,2) NOT NULL DEFAULT 1.00,
    unit_price_cents BIGINT NOT NULL,
    amount_cents BIGINT NOT NULL,

    -- Tax information per item
    tax_rate DECIMAL(7,4) DEFAULT 0.0000,
    tax_amount_cents BIGINT DEFAULT 0,
    discount_percentage DECIMAL(5,2) DEFAULT 0.00,
    discount_amount_cents BIGINT DEFAULT 0,

    -- Service details
    service_type TEXT,
    service_date DATE,
    session_duration_minutes INTEGER,
    taxable BOOLEAN DEFAULT TRUE,
    tax_category TEXT,

    -- References
    coach_rate_id UUID,
    session_id UUID,

    -- Metadata
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ensure invoice_payments table exists (if not created by main migration)
CREATE TABLE IF NOT EXISTS invoice_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    payment_id TEXT NOT NULL,
    amount_cents BIGINT NOT NULL,
    payment_method TEXT NOT NULL,
    payment_date DATE NOT NULL,
    transaction_reference TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Function to automatically calculate invoice totals with tax
CREATE OR REPLACE FUNCTION calculate_invoice_totals()
RETURNS TRIGGER AS $$
DECLARE
    item_subtotal BIGINT := 0;
    calculated_tax_amount BIGINT := 0;
    tax_calc_result RECORD;
BEGIN
    -- Calculate subtotal from all items
    SELECT COALESCE(SUM(amount_cents - COALESCE(discount_amount_cents, 0)), 0)
    INTO item_subtotal
    FROM invoice_items
    WHERE invoice_id = NEW.id;

    -- Set subtotal
    NEW.subtotal_cents := item_subtotal;

    -- Calculate tax if not tax exempt and client address is available
    IF NOT COALESCE(NEW.tax_exempt, FALSE) AND NEW.client_address IS NOT NULL THEN
        -- Use the tax calculation function if available
        BEGIN
            SELECT * INTO tax_calc_result
            FROM calculate_tax_amount(
                NEW.subtotal_cents,
                NEW.client_address,
                COALESCE(NEW.issue_date, CURRENT_DATE)
            );

            NEW.tax_rate := tax_calc_result.tax_rate_percentage;
            NEW.tax_amount_cents := tax_calc_result.tax_amount_cents;
        EXCEPTION WHEN OTHERS THEN
            -- Fallback to manual tax calculation if function doesn't exist
            NEW.tax_amount_cents := ROUND(NEW.subtotal_cents * (COALESCE(NEW.tax_rate, 0.0) / 100.0));
        END;
    ELSE
        NEW.tax_amount_cents := 0;
    END IF;

    -- Calculate total
    NEW.total_cents := NEW.subtotal_cents + NEW.tax_amount_cents - COALESCE(NEW.discount_cents, 0);

    -- Calculate balance due
    NEW.balance_due_cents := NEW.total_cents - COALESCE(NEW.amount_paid_cents, 0);

    -- Update payment status based on balance
    IF NEW.balance_due_cents <= 0 AND NEW.total_cents > 0 THEN
        NEW.status := 'paid';
        NEW.paid_date := CURRENT_DATE;
    ELSIF NEW.amount_paid_cents > 0 AND NEW.balance_due_cents > 0 THEN
        NEW.status := 'partially_paid';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically calculate totals
DROP TRIGGER IF EXISTS trigger_calculate_invoice_totals ON invoices;
CREATE TRIGGER trigger_calculate_invoice_totals
    BEFORE INSERT OR UPDATE ON invoices
    FOR EACH ROW
    EXECUTE FUNCTION calculate_invoice_totals();

-- Function to update invoice totals when items change
CREATE OR REPLACE FUNCTION update_invoice_totals_on_item_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the parent invoice totals
    UPDATE invoices
    SET updated_at = NOW()
    WHERE id = COALESCE(NEW.invoice_id, OLD.invoice_id);

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger on invoice_items to update parent invoice
DROP TRIGGER IF EXISTS trigger_update_invoice_on_item_change ON invoice_items;
CREATE TRIGGER trigger_update_invoice_on_item_change
    AFTER INSERT OR UPDATE OR DELETE ON invoice_items
    FOR EACH ROW
    EXECUTE FUNCTION update_invoice_totals_on_item_change();

-- Enhanced indexes for performance and tax reporting
CREATE INDEX IF NOT EXISTS idx_invoices_client_coach ON invoices(client_id, coach_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status_date ON invoices(status, issue_date);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date_status ON invoices(due_date, status);
CREATE INDEX IF NOT EXISTS idx_invoices_tax_reporting ON invoices(issue_date, tax_jurisdiction) WHERE NOT tax_exempt;
CREATE INDEX IF NOT EXISTS idx_invoices_business_tax_id ON invoices(business_tax_id) WHERE business_tax_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_invoice_items_service_details ON invoice_items(service_type, service_date);
CREATE INDEX IF NOT EXISTS idx_invoice_items_taxable ON invoice_items(taxable, tax_category);

-- Add constraint to ensure tax exempt invoices have a reason
ALTER TABLE invoices
DROP CONSTRAINT IF EXISTS check_tax_exempt_reason;

ALTER TABLE invoices
ADD CONSTRAINT check_tax_exempt_reason
CHECK ((tax_exempt = FALSE) OR (tax_exempt = TRUE AND tax_exemption_reason IS NOT NULL));

-- Update sequence for invoice numbers if it doesn't exist
DO $$
BEGIN
    CREATE SEQUENCE IF NOT EXISTS invoice_number_seq START 1000;
EXCEPTION WHEN duplicate_table THEN
    -- Sequence already exists
    NULL;
END $$;

-- Enhanced invoice number generation function
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TEXT AS $$
BEGIN
    RETURN 'INV-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(nextval('invoice_number_seq')::TEXT, 6, '0');
END;
$$ LANGUAGE plpgsql;

-- Update the trigger function for invoice number generation
CREATE OR REPLACE FUNCTION set_invoice_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.invoice_number IS NULL OR NEW.invoice_number = '' THEN
        NEW.invoice_number := generate_invoice_number();
    END IF;
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Ensure the trigger exists
DROP TRIGGER IF EXISTS trigger_set_invoice_number ON invoices;
CREATE TRIGGER trigger_set_invoice_number
    BEFORE INSERT ON invoices
    FOR EACH ROW
    EXECUTE FUNCTION set_invoice_number();

-- View for invoice summaries with tax information
CREATE OR REPLACE VIEW invoice_summaries AS
SELECT
    i.id,
    i.invoice_number,
    i.client_id,
    i.coach_id,
    i.status,
    i.issue_date,
    i.due_date,
    i.subtotal_cents,
    i.tax_amount_cents,
    i.total_cents,
    i.balance_due_cents,
    i.tax_jurisdiction,
    i.tax_exempt,
    i.business_tax_id,
    CASE
        WHEN i.due_date < CURRENT_DATE AND i.balance_due_cents > 0 THEN TRUE
        ELSE FALSE
    END as is_overdue,
    CONCAT(c.first_name, ' ', c.last_name) as client_name,
    CONCAT(co.first_name, ' ', co.last_name) as coach_name,
    c.email as client_email,
    co.email as coach_email
FROM invoices i
LEFT JOIN clients c ON i.client_id = c.id
LEFT JOIN coaches co ON i.coach_id = co.id;

-- Grant permissions (adjust as needed for your user roles)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON invoices TO your_app_user;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON invoice_items TO your_app_user;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON invoice_payments TO your_app_user;
-- GRANT SELECT ON invoice_summaries TO your_app_user;
-- GRANT USAGE ON SEQUENCE invoice_number_seq TO your_app_user;