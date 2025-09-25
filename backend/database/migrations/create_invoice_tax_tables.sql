-- Invoice and Tax Documentation Tables
-- This migration adds comprehensive invoice generation and tax reporting functionality

-- Main invoices table
CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_number TEXT NOT NULL UNIQUE,
    client_id UUID NOT NULL REFERENCES clients(id),
    coach_id UUID NOT NULL REFERENCES coaches(id),
    payment_id UUID REFERENCES payments(id), -- Optional link to payment

    -- Invoice details
    issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled', 'refunded')),

    -- Financial information
    subtotal_cents BIGINT NOT NULL,
    tax_rate_percentage DECIMAL(5,4) DEFAULT 0.00, -- e.g., 8.75 for 8.75%
    tax_amount_cents BIGINT NOT NULL DEFAULT 0,
    total_amount_cents BIGINT NOT NULL,
    currency TEXT NOT NULL DEFAULT 'USD',

    -- Payment information
    payment_terms TEXT DEFAULT 'Due upon receipt',
    payment_method TEXT, -- 'stripe', 'square', 'manual', etc.
    paid_at TIMESTAMP WITH TIME ZONE,

    -- Business information
    business_name TEXT NOT NULL,
    business_address JSONB NOT NULL, -- {street, city, state, zip, country}
    business_tax_id TEXT, -- EIN or similar

    -- Client information (snapshot at time of invoice)
    client_name TEXT NOT NULL,
    client_email TEXT NOT NULL,
    client_address JSONB, -- {street, city, state, zip, country}
    client_tax_id TEXT, -- For B2B invoices

    -- Invoice content
    notes TEXT, -- Additional notes or terms
    footer_text TEXT, -- Footer information

    -- Metadata
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID NOT NULL -- Admin or coach who created the invoice
);

-- Invoice line items
CREATE TABLE IF NOT EXISTS invoice_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,

    -- Item details
    description TEXT NOT NULL,
    quantity DECIMAL(10,2) NOT NULL DEFAULT 1.00,
    unit_price_cents BIGINT NOT NULL,
    total_price_cents BIGINT NOT NULL,

    -- Service details (for coaching services)
    service_type TEXT, -- 'session', 'package', 'consultation', etc.
    service_date DATE,
    session_duration_minutes INTEGER,

    -- Tax information per line item
    taxable BOOLEAN NOT NULL DEFAULT TRUE,
    tax_category TEXT, -- For different tax rates if needed

    -- Metadata
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tax documentation and reporting
CREATE TABLE IF NOT EXISTS tax_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_type TEXT NOT NULL CHECK (document_type IN ('1099', 'sales_tax_report', 'quarterly_summary', 'annual_summary')),

    -- Time period
    tax_year INTEGER NOT NULL,
    quarter INTEGER CHECK (quarter IN (1, 2, 3, 4)), -- NULL for annual documents
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,

    -- Entity information
    entity_id UUID NOT NULL, -- Could be coach_id for 1099s, business_id for sales tax
    entity_type TEXT NOT NULL CHECK (entity_type IN ('coach', 'business', 'client')),
    entity_name TEXT NOT NULL,
    entity_tax_id TEXT,
    entity_address JSONB,

    -- Financial data
    total_income_cents BIGINT NOT NULL DEFAULT 0,
    total_tax_withheld_cents BIGINT NOT NULL DEFAULT 0,
    total_expenses_cents BIGINT NOT NULL DEFAULT 0,
    net_income_cents BIGINT NOT NULL DEFAULT 0,

    -- Tax calculations
    sales_tax_collected_cents BIGINT DEFAULT 0,
    sales_tax_remitted_cents BIGINT DEFAULT 0,
    sales_tax_owed_cents BIGINT DEFAULT 0,

    -- Document status
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'generated', 'sent', 'filed')),
    generated_at TIMESTAMP WITH TIME ZONE,
    sent_at TIMESTAMP WITH TIME ZONE,
    filed_at TIMESTAMP WITH TIME ZONE,

    -- File information
    document_path TEXT, -- Path to generated PDF
    document_hash TEXT, -- For integrity verification

    -- Metadata
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID NOT NULL
);

-- Tax rates by jurisdiction (for accurate tax calculation)
CREATE TABLE IF NOT EXISTS tax_rates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    jurisdiction TEXT NOT NULL, -- 'US', 'CA-ON', 'US-CA', 'US-NY', etc.
    jurisdiction_type TEXT NOT NULL CHECK (jurisdiction_type IN ('country', 'state', 'province', 'county', 'city')),
    tax_type TEXT NOT NULL CHECK (tax_type IN ('sales_tax', 'vat', 'gst', 'hst')),

    -- Rate information
    rate_percentage DECIMAL(7,4) NOT NULL, -- e.g., 8.75 for 8.75%
    effective_date DATE NOT NULL,
    expiry_date DATE, -- NULL if still active

    -- Service applicability
    applies_to_services BOOLEAN NOT NULL DEFAULT TRUE,
    applies_to_coaching BOOLEAN NOT NULL DEFAULT TRUE,
    threshold_amount_cents BIGINT DEFAULT 0, -- Minimum amount for tax to apply

    -- Metadata
    description TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Invoice payment tracking (separate from main payments table for detailed tracking)
CREATE TABLE IF NOT EXISTS invoice_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    payment_id UUID REFERENCES payments(id), -- Link to main payment if exists

    -- Payment details
    amount_cents BIGINT NOT NULL,
    payment_date DATE NOT NULL,
    payment_method TEXT NOT NULL,
    payment_reference TEXT, -- Transaction ID, check number, etc.

    -- Status
    status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),

    -- Metadata
    notes TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID NOT NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_invoices_client_id ON invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_invoices_coach_id ON invoices(coach_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_issue_date ON invoices(issue_date);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON invoices(due_date);
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_number ON invoices(invoice_number);

CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id ON invoice_items(invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoice_items_service_date ON invoice_items(service_date);

CREATE INDEX IF NOT EXISTS idx_tax_documents_entity_id ON tax_documents(entity_id, entity_type);
CREATE INDEX IF NOT EXISTS idx_tax_documents_tax_year ON tax_documents(tax_year, quarter);
CREATE INDEX IF NOT EXISTS idx_tax_documents_status ON tax_documents(status);

CREATE INDEX IF NOT EXISTS idx_tax_rates_jurisdiction ON tax_rates(jurisdiction, jurisdiction_type);
CREATE INDEX IF NOT EXISTS idx_tax_rates_effective_date ON tax_rates(effective_date, expiry_date);

CREATE INDEX IF NOT EXISTS idx_invoice_payments_invoice_id ON invoice_payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoice_payments_payment_date ON invoice_payments(payment_date);

-- Auto-generate invoice numbers
CREATE SEQUENCE IF NOT EXISTS invoice_number_seq START 1000;

-- Function to generate invoice number
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TEXT AS $$
BEGIN
    RETURN 'INV-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(nextval('invoice_number_seq')::TEXT, 6, '0');
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate invoice numbers
CREATE OR REPLACE FUNCTION set_invoice_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.invoice_number IS NULL OR NEW.invoice_number = '' THEN
        NEW.invoice_number := generate_invoice_number();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_invoice_number
    BEFORE INSERT ON invoices
    FOR EACH ROW
    EXECUTE FUNCTION set_invoice_number();

-- Function to calculate tax amount based on jurisdiction
CREATE OR REPLACE FUNCTION calculate_tax_amount(
    subtotal_amount_cents BIGINT,
    client_address_json JSONB,
    service_date DATE DEFAULT CURRENT_DATE
) RETURNS RECORD AS $$
DECLARE
    tax_rate DECIMAL(7,4) := 0.0000;
    tax_amount_cents BIGINT := 0;
    jurisdiction_code TEXT;
    result RECORD;
BEGIN
    -- Extract jurisdiction from client address
    IF client_address_json ? 'state' AND client_address_json ? 'country' THEN
        IF client_address_json->>'country' = 'US' THEN
            jurisdiction_code := 'US-' || (client_address_json->>'state');
        ELSE
            jurisdiction_code := client_address_json->>'country';
        END IF;

        -- Get applicable tax rate
        SELECT rate_percentage INTO tax_rate
        FROM tax_rates
        WHERE jurisdiction = jurisdiction_code
          AND applies_to_coaching = TRUE
          AND effective_date <= service_date
          AND (expiry_date IS NULL OR expiry_date > service_date)
          AND subtotal_amount_cents >= COALESCE(threshold_amount_cents, 0)
        ORDER BY effective_date DESC
        LIMIT 1;

        -- Calculate tax amount
        tax_amount_cents := ROUND(subtotal_amount_cents * (COALESCE(tax_rate, 0.0000) / 100.0));
    END IF;

    -- Return both rate and amount
    SELECT tax_rate, tax_amount_cents INTO result;
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Insert some default tax rates (can be updated via admin interface)
INSERT INTO tax_rates (jurisdiction, jurisdiction_type, tax_type, rate_percentage, effective_date, applies_to_services, applies_to_coaching)
VALUES
    ('US-CA', 'state', 'sales_tax', 7.25, '2023-01-01', true, true),
    ('US-NY', 'state', 'sales_tax', 8.00, '2023-01-01', true, true),
    ('US-TX', 'state', 'sales_tax', 6.25, '2023-01-01', true, true),
    ('US-FL', 'state', 'sales_tax', 6.00, '2023-01-01', true, true),
    ('CA', 'country', 'hst', 13.00, '2023-01-01', true, true)
ON CONFLICT DO NOTHING;