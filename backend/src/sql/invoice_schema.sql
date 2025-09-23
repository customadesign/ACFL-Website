-- Invoice Tables Schema

-- Invoices table
CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    coach_id UUID NOT NULL REFERENCES coaches(id) ON DELETE CASCADE,
    payment_id UUID REFERENCES payments(id) ON DELETE SET NULL,
    booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN (
        'draft', 'pending', 'sent', 'paid', 'partially_paid',
        'overdue', 'cancelled', 'refunded'
    )),
    issue_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    due_date TIMESTAMP WITH TIME ZONE NOT NULL,
    paid_date TIMESTAMP WITH TIME ZONE,
    subtotal_cents BIGINT NOT NULL DEFAULT 0,
    tax_rate DECIMAL(5,4) DEFAULT 0,
    tax_amount_cents BIGINT NOT NULL DEFAULT 0,
    discount_cents BIGINT NOT NULL DEFAULT 0,
    total_cents BIGINT NOT NULL DEFAULT 0,
    amount_paid_cents BIGINT NOT NULL DEFAULT 0,
    balance_due_cents BIGINT NOT NULL DEFAULT 0,
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    payment_terms TEXT,
    notes TEXT,
    terms_and_conditions TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Invoice items table
CREATE TABLE IF NOT EXISTS invoice_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    quantity DECIMAL(10,2) NOT NULL DEFAULT 1,
    unit_price_cents BIGINT NOT NULL,
    amount_cents BIGINT NOT NULL,
    tax_rate DECIMAL(5,4) DEFAULT 0,
    tax_amount_cents BIGINT DEFAULT 0,
    discount_percentage DECIMAL(5,2) DEFAULT 0,
    discount_amount_cents BIGINT DEFAULT 0,
    coach_rate_id UUID REFERENCES coach_rates(id) ON DELETE SET NULL,
    session_id UUID REFERENCES sessions(id) ON DELETE SET NULL,
    service_date TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Invoice payments table (for tracking multiple payments against an invoice)
CREATE TABLE IF NOT EXISTS invoice_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    payment_id UUID REFERENCES payments(id) ON DELETE SET NULL,
    amount_cents BIGINT NOT NULL,
    payment_method VARCHAR(100) NOT NULL,
    payment_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    transaction_reference VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Invoice templates table
CREATE TABLE IF NOT EXISTS invoice_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    coach_id UUID REFERENCES coaches(id) ON DELETE CASCADE,
    is_default BOOLEAN DEFAULT FALSE,
    header_content TEXT,
    footer_content TEXT,
    logo_url TEXT,
    color_scheme JSONB DEFAULT '{}',
    font_family VARCHAR(100) DEFAULT 'Arial',
    payment_instructions TEXT,
    terms_and_conditions TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Invoice reminders table
CREATE TABLE IF NOT EXISTS invoice_reminders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    reminder_type VARCHAR(20) NOT NULL CHECK (reminder_type IN ('before_due', 'on_due', 'overdue')),
    days_offset INTEGER NOT NULL DEFAULT 0,
    sent_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'cancelled')),
    email_template_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Recurring invoices table
CREATE TABLE IF NOT EXISTS recurring_invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    coach_id UUID NOT NULL REFERENCES coaches(id) ON DELETE CASCADE,
    template_id UUID REFERENCES invoice_templates(id) ON DELETE SET NULL,
    frequency VARCHAR(20) NOT NULL CHECK (frequency IN ('weekly', 'biweekly', 'monthly', 'quarterly', 'annually')),
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE,
    next_invoice_date TIMESTAMP WITH TIME ZONE NOT NULL,
    last_invoice_date TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,
    auto_send BOOLEAN DEFAULT FALSE,
    auto_charge BOOLEAN DEFAULT FALSE,
    payment_schedule_id UUID REFERENCES payment_schedules(id) ON DELETE SET NULL,
    subtotal_cents BIGINT NOT NULL DEFAULT 0,
    tax_rate DECIMAL(5,4) DEFAULT 0,
    discount_cents BIGINT DEFAULT 0,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Recurring invoice items table
CREATE TABLE IF NOT EXISTS recurring_invoice_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recurring_invoice_id UUID NOT NULL REFERENCES recurring_invoices(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    quantity DECIMAL(10,2) NOT NULL DEFAULT 1,
    unit_price_cents BIGINT NOT NULL,
    tax_rate DECIMAL(5,4) DEFAULT 0,
    discount_percentage DECIMAL(5,2) DEFAULT 0,
    coach_rate_id UUID REFERENCES coach_rates(id) ON DELETE SET NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_invoices_client_id ON invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_invoices_coach_id ON invoices(coach_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_issue_date ON invoices(issue_date);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON invoices(due_date);
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_number ON invoices(invoice_number);

CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id ON invoice_items(invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoice_items_coach_rate_id ON invoice_items(coach_rate_id);
CREATE INDEX IF NOT EXISTS idx_invoice_items_session_id ON invoice_items(session_id);

CREATE INDEX IF NOT EXISTS idx_invoice_payments_invoice_id ON invoice_payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoice_payments_payment_id ON invoice_payments(payment_id);

CREATE INDEX IF NOT EXISTS idx_invoice_reminders_invoice_id ON invoice_reminders(invoice_id);

CREATE INDEX IF NOT EXISTS idx_recurring_invoices_client_id ON recurring_invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_recurring_invoices_coach_id ON recurring_invoices(coach_id);
CREATE INDEX IF NOT EXISTS idx_recurring_invoices_next_date ON recurring_invoices(next_invoice_date);
CREATE INDEX IF NOT EXISTS idx_recurring_invoices_active ON recurring_invoices(is_active);

CREATE INDEX IF NOT EXISTS idx_recurring_invoice_items_recurring_id ON recurring_invoice_items(recurring_invoice_id);

-- Update trigger for invoices
CREATE OR REPLACE FUNCTION update_invoice_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_invoices_updated_at
    BEFORE UPDATE ON invoices
    FOR EACH ROW
    EXECUTE FUNCTION update_invoice_updated_at();

-- Update trigger for invoice templates
CREATE TRIGGER update_invoice_templates_updated_at
    BEFORE UPDATE ON invoice_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_invoice_updated_at();

-- Update trigger for recurring invoices
CREATE TRIGGER update_recurring_invoices_updated_at
    BEFORE UPDATE ON recurring_invoices
    FOR EACH ROW
    EXECUTE FUNCTION update_invoice_updated_at();

-- RLS Policies for secure access

-- Invoices policies
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coaches can view their own invoices" ON invoices
    FOR SELECT USING (coach_id = auth.uid());

CREATE POLICY "Clients can view their own invoices" ON invoices
    FOR SELECT USING (client_id = auth.uid());

CREATE POLICY "Coaches can create invoices for themselves" ON invoices
    FOR INSERT WITH CHECK (coach_id = auth.uid());

CREATE POLICY "Coaches can update their own invoices" ON invoices
    FOR UPDATE USING (coach_id = auth.uid());

CREATE POLICY "Coaches can delete their own draft invoices" ON invoices
    FOR DELETE USING (coach_id = auth.uid() AND status IN ('draft', 'cancelled'));

-- Invoice items policies
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view invoice items for their invoices" ON invoice_items
    FOR SELECT USING (
        invoice_id IN (
            SELECT id FROM invoices
            WHERE coach_id = auth.uid() OR client_id = auth.uid()
        )
    );

CREATE POLICY "Coaches can manage items for their invoices" ON invoice_items
    FOR ALL USING (
        invoice_id IN (
            SELECT id FROM invoices WHERE coach_id = auth.uid()
        )
    );

-- Invoice payments policies
ALTER TABLE invoice_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view payments for their invoices" ON invoice_payments
    FOR SELECT USING (
        invoice_id IN (
            SELECT id FROM invoices
            WHERE coach_id = auth.uid() OR client_id = auth.uid()
        )
    );

CREATE POLICY "Coaches can record payments for their invoices" ON invoice_payments
    FOR INSERT WITH CHECK (
        invoice_id IN (
            SELECT id FROM invoices WHERE coach_id = auth.uid()
        )
    );

-- Invoice templates policies
ALTER TABLE invoice_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coaches can view their templates" ON invoice_templates
    FOR SELECT USING (coach_id = auth.uid() OR coach_id IS NULL);

CREATE POLICY "Coaches can manage their templates" ON invoice_templates
    FOR ALL USING (coach_id = auth.uid());

-- Recurring invoices policies
ALTER TABLE recurring_invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coaches can view their recurring invoices" ON recurring_invoices
    FOR SELECT USING (coach_id = auth.uid());

CREATE POLICY "Clients can view their recurring invoices" ON recurring_invoices
    FOR SELECT USING (client_id = auth.uid());

CREATE POLICY "Coaches can manage their recurring invoices" ON recurring_invoices
    FOR ALL USING (coach_id = auth.uid());

-- Views for commonly used queries

-- Invoice summary view
CREATE OR REPLACE VIEW invoice_summary AS
SELECT
    i.id,
    i.invoice_number,
    i.status,
    i.issue_date,
    i.due_date,
    i.total_cents,
    i.balance_due_cents,
    c.first_name || ' ' || c.last_name AS client_name,
    c.email AS client_email,
    co.first_name || ' ' || co.last_name AS coach_name,
    co.email AS coach_email,
    CASE
        WHEN i.status IN ('pending', 'sent') AND i.due_date < NOW() THEN true
        ELSE false
    END AS is_overdue
FROM invoices i
JOIN clients c ON i.client_id = c.id
JOIN coaches co ON i.coach_id = co.id;

-- Invoice metrics view
CREATE OR REPLACE VIEW invoice_metrics AS
SELECT
    coach_id,
    COUNT(*) as total_invoices,
    SUM(total_cents) as total_amount_cents,
    SUM(amount_paid_cents) as total_paid_cents,
    SUM(balance_due_cents) as total_outstanding_cents,
    COUNT(*) FILTER (WHERE status = 'overdue' OR (status IN ('pending', 'sent') AND due_date < NOW())) as overdue_invoices,
    SUM(balance_due_cents) FILTER (WHERE status = 'overdue' OR (status IN ('pending', 'sent') AND due_date < NOW())) as overdue_amount_cents,
    AVG(EXTRACT(days FROM paid_date - issue_date)) FILTER (WHERE paid_date IS NOT NULL) as avg_payment_days,
    (COUNT(*) FILTER (WHERE status = 'paid')::float / COUNT(*)::float * 100) as payment_success_rate
FROM invoices
GROUP BY coach_id;