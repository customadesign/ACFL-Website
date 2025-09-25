-- Add relationship between sessions and invoices for automatic invoice generation
-- This migration links sessions to their auto-generated invoices

-- Add invoice_id column to sessions table if it doesn't exist
ALTER TABLE sessions
ADD COLUMN IF NOT EXISTS invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_sessions_invoice_id ON sessions(invoice_id);

-- Add session tracking to invoices table if not present
ALTER TABLE invoices
ADD COLUMN IF NOT EXISTS session_id UUID,
ADD COLUMN IF NOT EXISTS auto_generated BOOLEAN DEFAULT FALSE;

-- Create foreign key constraint if sessions table exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'sessions') THEN
        ALTER TABLE invoices
        ADD CONSTRAINT fk_invoices_session_id
        FOREIGN KEY (session_id) REFERENCES sessions(id)
        ON DELETE SET NULL;
    END IF;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Create index for invoice lookups by session
CREATE INDEX IF NOT EXISTS idx_invoices_session_id ON invoices(session_id);
CREATE INDEX IF NOT EXISTS idx_invoices_auto_generated ON invoices(auto_generated);

-- View to easily get sessions with their invoices
CREATE OR REPLACE VIEW sessions_with_invoices AS
SELECT
    s.*,
    i.id as invoice_id,
    i.invoice_number,
    i.total_cents as invoice_total_cents,
    i.status as invoice_status,
    i.due_date as invoice_due_date,
    i.paid_date as invoice_paid_date
FROM sessions s
LEFT JOIN invoices i ON s.invoice_id = i.id OR i.session_id = s.id
ORDER BY s.session_date DESC;

-- Function to check if a session has an invoice
CREATE OR REPLACE FUNCTION session_has_invoice(session_id_param UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM invoices
        WHERE session_id = session_id_param
        OR id = (SELECT invoice_id FROM sessions WHERE id = session_id_param)
    );
END;
$$ LANGUAGE plpgsql;

-- Grant permissions if needed
-- GRANT SELECT ON sessions_with_invoices TO your_app_user;
-- GRANT EXECUTE ON FUNCTION session_has_invoice TO your_app_user;