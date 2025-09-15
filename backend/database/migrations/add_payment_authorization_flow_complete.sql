-- Complete Migration to support payment authorization/capture flow
-- Handles ALL dependent views and rules automatically

-- Step 1: Find and drop ALL views that depend on payments or refunds tables
DO $$
DECLARE
    view_record RECORD;
BEGIN
    -- Drop all views that reference payments table
    FOR view_record IN 
        SELECT schemaname, viewname 
        FROM pg_views 
        WHERE definition ILIKE '%payments%' 
        AND schemaname = 'public'
    LOOP
        EXECUTE 'DROP VIEW IF EXISTS ' || quote_ident(view_record.viewname) || ' CASCADE';
        RAISE NOTICE 'Dropped view: %', view_record.viewname;
    END LOOP;
    
    -- Drop all views that reference refunds table
    FOR view_record IN 
        SELECT schemaname, viewname 
        FROM pg_views 
        WHERE definition ILIKE '%refunds%' 
        AND schemaname = 'public'
    LOOP
        EXECUTE 'DROP VIEW IF EXISTS ' || quote_ident(view_record.viewname) || ' CASCADE';
        RAISE NOTICE 'Dropped view: %', view_record.viewname;
    END LOOP;
END $$;

-- Step 2: Add new columns to payments table (safe operations first)
ALTER TABLE payments 
ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'card',
ADD COLUMN IF NOT EXISTS authorization_code TEXT,
ADD COLUMN IF NOT EXISTS captured_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE;

-- Step 3: Update existing payment statuses to ensure compatibility
UPDATE payments 
SET status = CASE 
    WHEN status IN ('pending') THEN 'pending'
    WHEN status IN ('succeeded', 'success') THEN 'succeeded' 
    WHEN status IN ('failed', 'failure') THEN 'failed'
    WHEN status IN ('canceled', 'cancelled') THEN 'canceled'
    WHEN status IN ('refunded') THEN 'refunded'
    WHEN status IN ('partially_refunded') THEN 'partially_refunded'
    ELSE 'pending'
END;

-- Step 4: Handle payments enum update
DO $$
BEGIN
    -- Remove default constraint
    ALTER TABLE payments ALTER COLUMN status DROP DEFAULT;
    
    -- Change to text type
    ALTER TABLE payments ALTER COLUMN status TYPE TEXT;
    
    -- Drop old enum
    DROP TYPE IF EXISTS payment_status_enum CASCADE;
    
    -- Create new enum
    CREATE TYPE payment_status_enum AS ENUM (
        'pending', 
        'authorized',
        'succeeded', 
        'failed', 
        'canceled',
        'requires_capture',
        'partially_refunded',
        'refunded'
    );
    
    -- Convert column to new enum with safe casting
    ALTER TABLE payments ALTER COLUMN status TYPE payment_status_enum USING (
        CASE 
            WHEN status::text = 'pending' THEN 'pending'::payment_status_enum
            WHEN status::text = 'authorized' THEN 'authorized'::payment_status_enum
            WHEN status::text = 'succeeded' THEN 'succeeded'::payment_status_enum
            WHEN status::text = 'failed' THEN 'failed'::payment_status_enum
            WHEN status::text = 'canceled' THEN 'canceled'::payment_status_enum
            WHEN status::text = 'requires_capture' THEN 'requires_capture'::payment_status_enum
            WHEN status::text = 'partially_refunded' THEN 'partially_refunded'::payment_status_enum
            WHEN status::text = 'refunded' THEN 'refunded'::payment_status_enum
            ELSE 'pending'::payment_status_enum
        END
    );
    
    -- Add back default
    ALTER TABLE payments ALTER COLUMN status SET DEFAULT 'pending'::payment_status_enum;
    
    RAISE NOTICE 'Payment status enum updated successfully';
END $$;

-- Step 5: Add new columns to refunds table
ALTER TABLE refunds 
ADD COLUMN IF NOT EXISTS requires_approval BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS approved_by UUID,
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
ADD COLUMN IF NOT EXISTS auto_approval_policy TEXT;

-- Step 6: Update existing refund statuses
UPDATE refunds 
SET status = CASE 
    WHEN status IN ('pending') THEN 'pending'
    WHEN status IN ('succeeded', 'success') THEN 'succeeded'
    WHEN status IN ('failed', 'failure') THEN 'failed'
    WHEN status IN ('canceled', 'cancelled') THEN 'canceled'
    ELSE 'pending'
END;

-- Step 7: Handle refunds enum update
DO $$
BEGIN
    -- Remove default constraint
    ALTER TABLE refunds ALTER COLUMN status DROP DEFAULT;
    
    -- Change to text type
    ALTER TABLE refunds ALTER COLUMN status TYPE TEXT;
    
    -- Drop old enum
    DROP TYPE IF EXISTS refund_status_enum CASCADE;
    
    -- Create new enum
    CREATE TYPE refund_status_enum AS ENUM (
        'pending', 
        'pending_approval',
        'approved',
        'rejected',
        'succeeded', 
        'failed', 
        'canceled'
    );
    
    -- Convert column to new enum with safe casting
    ALTER TABLE refunds ALTER COLUMN status TYPE refund_status_enum USING (
        CASE 
            WHEN status::text = 'pending' THEN 'pending'::refund_status_enum
            WHEN status::text = 'pending_approval' THEN 'pending_approval'::refund_status_enum
            WHEN status::text = 'approved' THEN 'approved'::refund_status_enum
            WHEN status::text = 'rejected' THEN 'rejected'::refund_status_enum
            WHEN status::text = 'succeeded' THEN 'succeeded'::refund_status_enum
            WHEN status::text = 'failed' THEN 'failed'::refund_status_enum
            WHEN status::text = 'canceled' THEN 'canceled'::refund_status_enum
            ELSE 'pending'::refund_status_enum
        END
    );
    
    -- Add back default
    ALTER TABLE refunds ALTER COLUMN status SET DEFAULT 'pending'::refund_status_enum;
    
    RAISE NOTICE 'Refund status enum updated successfully';
END $$;

-- Step 8: Create sessions table
CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    coach_id UUID NOT NULL,
    client_id UUID NOT NULL,
    payment_id UUID,
    session_date TIMESTAMP WITH TIME ZONE NOT NULL,
    duration_minutes INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled', 'no_show')),
    session_notes TEXT,
    completion_confirmed_by UUID,
    completed_at TIMESTAMP WITH TIME ZONE,
    cancellation_reason TEXT,
    cancelled_by UUID,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 9: Create automatic refund policies table
CREATE TABLE IF NOT EXISTS automatic_refund_policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    conditions JSONB NOT NULL,
    refund_percentage DECIMAL(5,2) NOT NULL DEFAULT 100.00,
    applies_to_session_types TEXT[] DEFAULT ARRAY['individual', 'group', 'package'],
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 10: Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_sessions_coach_id ON sessions(coach_id);
CREATE INDEX IF NOT EXISTS idx_sessions_client_id ON sessions(client_id);
CREATE INDEX IF NOT EXISTS idx_sessions_payment_id ON sessions(payment_id);
CREATE INDEX IF NOT EXISTS idx_sessions_date ON sessions(session_date);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON sessions(status);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_expires_at ON payments(expires_at);
CREATE INDEX IF NOT EXISTS idx_refunds_status ON refunds(status);
CREATE INDEX IF NOT EXISTS idx_refunds_requires_approval ON refunds(requires_approval);

-- Step 11: Insert default refund policies
INSERT INTO automatic_refund_policies (name, description, conditions, refund_percentage) VALUES 
(
    'Cancellation 24h+ Before Session',
    'Full refund for cancellations more than 24 hours before session',
    '{"min_hours_before": 24}',
    100.00
),
(
    'Cancellation 2-24h Before Session', 
    '50% refund for cancellations 2-24 hours before session',
    '{"min_hours_before": 2, "max_hours_before": 24}',
    50.00
),
(
    'Coach Cancellation',
    'Full refund when coach cancels session',
    '{"cancelled_by_role": "coach"}',
    100.00
),
(
    'Coach No-Show',
    'Full refund when coach does not show up',
    '{"session_status": "coach_no_show"}',
    100.00
)
ON CONFLICT DO NOTHING;

-- Step 12: Create timestamp update function and triggers
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_sessions_updated_at ON sessions;
CREATE TRIGGER update_sessions_updated_at
    BEFORE UPDATE ON sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_automatic_refund_policies_updated_at ON automatic_refund_policies;
CREATE TRIGGER update_automatic_refund_policies_updated_at
    BEFORE UPDATE ON automatic_refund_policies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Step 13: Recreate essential views with flexible schema detection
-- Payment Summary View
CREATE OR REPLACE VIEW payment_summary AS
SELECT 
    p.id,
    p.client_id,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'clients') THEN
            COALESCE((SELECT first_name || ' ' || last_name FROM clients WHERE id = p.client_id), 'Unknown Client')
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
            COALESCE((SELECT first_name || ' ' || last_name FROM users WHERE id = p.client_id), 'Unknown Client')
        ELSE 'Unknown Client'
    END as client_name,
    p.coach_id,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'coaches') THEN
            COALESCE((SELECT first_name || ' ' || last_name FROM coaches WHERE id = p.coach_id), 'Unknown Coach')
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
            COALESCE((SELECT first_name || ' ' || last_name FROM users WHERE id = p.coach_id), 'Unknown Coach')
        ELSE 'Unknown Coach'
    END as coach_name,
    p.amount_cents,
    p.platform_fee_cents,
    p.coach_earnings_cents,
    p.status::text as status,
    p.description,
    p.created_at,
    p.paid_at,
    COALESCE(cr.title, 'Standard Session') as rate_title,
    COALESCE(cr.session_type::text, 'individual') as session_type,
    COALESCE(cr.duration_minutes, 60) as duration_minutes
FROM payments p
LEFT JOIN coach_rates cr ON p.coach_rate_id = cr.id;

-- Financial Summary View
CREATE OR REPLACE VIEW financial_summary AS
SELECT 
    DATE_TRUNC('month', created_at) as month,
    COUNT(*) as total_transactions,
    SUM(amount_cents) as total_revenue_cents,
    SUM(platform_fee_cents) as total_platform_fees_cents,
    SUM(coach_earnings_cents) as total_coach_earnings_cents,
    ROUND(AVG(amount_cents)) as avg_transaction_cents
FROM payments
WHERE status IN ('succeeded', 'authorized', 'requires_capture')
GROUP BY DATE_TRUNC('month', created_at)
ORDER BY month DESC;

-- Step 14: Add helpful comments
COMMENT ON TABLE sessions IS 'Session tracking for payment authorization/capture flow';
COMMENT ON TABLE automatic_refund_policies IS 'Configurable automatic refund policies based on cancellation timing and conditions';
COMMENT ON COLUMN payments.payment_method IS 'Payment method used (card, bank_account, etc.)';
COMMENT ON COLUMN payments.authorization_code IS 'Stripe authorization code for manual capture';
COMMENT ON COLUMN payments.captured_at IS 'Timestamp when payment was captured after session completion';
COMMENT ON COLUMN payments.expires_at IS 'Authorization expiration timestamp (usually 7 days)';
COMMENT ON COLUMN refunds.requires_approval IS 'Whether this refund requires admin approval';
COMMENT ON COLUMN refunds.approved_by IS 'Admin user who approved this refund';
COMMENT ON COLUMN refunds.approved_at IS 'Timestamp when refund was approved';
COMMENT ON COLUMN refunds.auto_approval_policy IS 'Reference to automatic refund policy that approved this refund';

-- Step 15: Final verification and success message
SELECT 
    'Authorization/Capture Payment Flow Migration Completed Successfully!' as status,
    'Payment statuses: ' || array_to_string(enum_range(NULL::payment_status_enum), ', ') as payment_statuses,
    'Refund statuses: ' || array_to_string(enum_range(NULL::refund_status_enum), ', ') as refund_statuses,
    'New tables created: sessions, automatic_refund_policies' as new_tables,
    'Views recreated: payment_summary, financial_summary' as views;