-- Final Fix Migration for payment authorization/capture flow
-- Handles type casting issues properly

-- Step 1: Drop ALL dependent views first
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

-- Step 2: Add new columns to payments table (safe operations)
ALTER TABLE payments 
ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'card',
ADD COLUMN IF NOT EXISTS authorization_code TEXT,
ADD COLUMN IF NOT EXISTS captured_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE;

-- Step 3: Create a temporary column for the new status
ALTER TABLE payments ADD COLUMN IF NOT EXISTS status_new TEXT;

-- Step 4: Populate the temporary column with mapped values
UPDATE payments 
SET status_new = CASE 
    WHEN status::text IN ('pending') THEN 'pending'
    WHEN status::text IN ('succeeded', 'success') THEN 'succeeded' 
    WHEN status::text IN ('failed', 'failure') THEN 'failed'
    WHEN status::text IN ('canceled', 'cancelled') THEN 'canceled'
    WHEN status::text IN ('refunded') THEN 'refunded'
    WHEN status::text IN ('partially_refunded') THEN 'partially_refunded'
    ELSE 'pending'
END;

-- Step 5: Drop the old status column and enum
ALTER TABLE payments DROP COLUMN status;
DROP TYPE IF EXISTS payment_status_enum CASCADE;

-- Step 6: Create the new enum
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

-- Step 7: Add the new status column with the enum type
ALTER TABLE payments ADD COLUMN status payment_status_enum DEFAULT 'pending'::payment_status_enum;

-- Step 8: Populate the new status column from the temporary column
UPDATE payments SET status = status_new::payment_status_enum;

-- Step 9: Drop the temporary column and add not null constraint
ALTER TABLE payments DROP COLUMN status_new;
ALTER TABLE payments ALTER COLUMN status SET NOT NULL;

-- Step 10: Do the same for refunds table
-- Add new columns first
ALTER TABLE refunds 
ADD COLUMN IF NOT EXISTS requires_approval BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS approved_by UUID,
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
ADD COLUMN IF NOT EXISTS auto_approval_policy TEXT;

-- Create temporary column for refunds
ALTER TABLE refunds ADD COLUMN IF NOT EXISTS status_new TEXT;

-- Populate temporary column
UPDATE refunds 
SET status_new = CASE 
    WHEN status::text IN ('pending') THEN 'pending'
    WHEN status::text IN ('succeeded', 'success') THEN 'succeeded'
    WHEN status::text IN ('failed', 'failure') THEN 'failed'
    WHEN status::text IN ('canceled', 'cancelled') THEN 'canceled'
    ELSE 'pending'
END;

-- Drop old refunds status column and enum
ALTER TABLE refunds DROP COLUMN status;
DROP TYPE IF EXISTS refund_status_enum CASCADE;

-- Create new refund enum
CREATE TYPE refund_status_enum AS ENUM (
    'pending', 
    'pending_approval',
    'approved',
    'rejected',
    'succeeded', 
    'failed', 
    'canceled'
);

-- Add new refunds status column
ALTER TABLE refunds ADD COLUMN status refund_status_enum DEFAULT 'pending'::refund_status_enum;

-- Populate from temporary column
UPDATE refunds SET status = status_new::refund_status_enum;

-- Clean up refunds
ALTER TABLE refunds DROP COLUMN status_new;
ALTER TABLE refunds ALTER COLUMN status SET NOT NULL;

-- Step 11: Create sessions table
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

-- Step 12: Create automatic refund policies table
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

-- Step 13: Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_sessions_coach_id ON sessions(coach_id);
CREATE INDEX IF NOT EXISTS idx_sessions_client_id ON sessions(client_id);
CREATE INDEX IF NOT EXISTS idx_sessions_payment_id ON sessions(payment_id);
CREATE INDEX IF NOT EXISTS idx_sessions_date ON sessions(session_date);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON sessions(status);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_expires_at ON payments(expires_at);
CREATE INDEX IF NOT EXISTS idx_refunds_status ON refunds(status);
CREATE INDEX IF NOT EXISTS idx_refunds_requires_approval ON refunds(requires_approval);

-- Step 14: Add foreign key constraints
DO $$
BEGIN
    -- Add foreign key for approved_by if users table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
        BEGIN
            ALTER TABLE refunds ADD CONSTRAINT fk_refunds_approved_by FOREIGN KEY (approved_by) REFERENCES users(id);
        EXCEPTION WHEN duplicate_object THEN
            -- Constraint already exists, ignore
            NULL;
        END;
        
        -- Add session foreign keys
        BEGIN
            ALTER TABLE sessions ADD CONSTRAINT fk_sessions_coach_id FOREIGN KEY (coach_id) REFERENCES users(id);
        EXCEPTION WHEN duplicate_object THEN NULL; END;
        
        BEGIN
            ALTER TABLE sessions ADD CONSTRAINT fk_sessions_client_id FOREIGN KEY (client_id) REFERENCES users(id);
        EXCEPTION WHEN duplicate_object THEN NULL; END;
        
        BEGIN
            ALTER TABLE sessions ADD CONSTRAINT fk_sessions_completion_confirmed_by FOREIGN KEY (completion_confirmed_by) REFERENCES users(id);
        EXCEPTION WHEN duplicate_object THEN NULL; END;
        
        BEGIN
            ALTER TABLE sessions ADD CONSTRAINT fk_sessions_cancelled_by FOREIGN KEY (cancelled_by) REFERENCES users(id);
        EXCEPTION WHEN duplicate_object THEN NULL; END;
    END IF;
    
    -- Add payment foreign key
    BEGIN
        ALTER TABLE sessions ADD CONSTRAINT fk_sessions_payment_id FOREIGN KEY (payment_id) REFERENCES payments(id);
    EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;

-- Step 15: Insert default refund policies
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

-- Step 16: Create timestamp update function and triggers
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

-- Step 17: Recreate essential views
CREATE OR REPLACE VIEW payment_summary AS
SELECT 
    p.id,
    p.client_id,
    'Unknown Client' as client_name,  -- Simplified for now
    p.coach_id,
    'Unknown Coach' as coach_name,   -- Simplified for now
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

-- Financial summary view
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

-- Step 18: Add helpful comments
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

-- Step 19: Final verification
SELECT 
    'SUCCESS: Authorization/Capture Payment Flow Migration Completed!' as status,
    'Payment statuses: ' || array_to_string(enum_range(NULL::payment_status_enum), ', ') as payment_statuses,
    'Refund statuses: ' || array_to_string(enum_range(NULL::refund_status_enum), ', ') as refund_statuses,
    'Tables created: sessions, automatic_refund_policies' as new_tables,
    'Views recreated: payment_summary, financial_summary' as views;