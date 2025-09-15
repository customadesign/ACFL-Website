-- Simple Migration to support payment authorization/capture flow
-- Handles defaults and views step by step

-- Step 1: Drop any dependent views first
DROP VIEW IF EXISTS payment_summary CASCADE;

-- Step 2: Add new columns to payments table (these don't affect existing enum)
ALTER TABLE payments 
ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'card',
ADD COLUMN IF NOT EXISTS authorization_code TEXT,
ADD COLUMN IF NOT EXISTS captured_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE;

-- Step 3: Update existing payment statuses to ensure they're compatible
UPDATE payments 
SET status = CASE 
    WHEN status = 'pending' THEN 'pending'
    WHEN status = 'succeeded' THEN 'succeeded' 
    WHEN status = 'failed' THEN 'failed'
    WHEN status = 'canceled' THEN 'canceled'
    WHEN status = 'cancelled' THEN 'canceled'
    WHEN status = 'refunded' THEN 'refunded'
    WHEN status = 'partially_refunded' THEN 'partially_refunded'
    ELSE 'pending'
END;

-- Step 4: Remove default constraint temporarily
ALTER TABLE payments ALTER COLUMN status DROP DEFAULT;

-- Step 5: Change to text type
ALTER TABLE payments ALTER COLUMN status TYPE TEXT;

-- Step 6: Drop old enum and create new one
DROP TYPE IF EXISTS payment_status_enum CASCADE;

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

-- Step 7: Convert column to new enum
ALTER TABLE payments ALTER COLUMN status TYPE payment_status_enum USING status::payment_status_enum;

-- Step 8: Add back the default
ALTER TABLE payments ALTER COLUMN status SET DEFAULT 'pending'::payment_status_enum;

-- Step 9: Handle refunds table similarly
-- Add new columns first
ALTER TABLE refunds 
ADD COLUMN IF NOT EXISTS requires_approval BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS approved_by UUID,
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
ADD COLUMN IF NOT EXISTS auto_approval_policy TEXT;

-- Update existing refund statuses
UPDATE refunds 
SET status = CASE 
    WHEN status = 'pending' THEN 'pending'
    WHEN status = 'succeeded' THEN 'succeeded'
    WHEN status = 'failed' THEN 'failed'
    WHEN status = 'canceled' THEN 'canceled'
    WHEN status = 'cancelled' THEN 'canceled'
    ELSE 'pending'
END;

-- Remove default from refunds status
ALTER TABLE refunds ALTER COLUMN status DROP DEFAULT;

-- Change to text
ALTER TABLE refunds ALTER COLUMN status TYPE TEXT;

-- Drop and recreate refund enum
DROP TYPE IF EXISTS refund_status_enum CASCADE;

CREATE TYPE refund_status_enum AS ENUM (
    'pending', 
    'pending_approval',
    'approved',
    'rejected',
    'succeeded', 
    'failed', 
    'canceled'
);

-- Convert refunds column
ALTER TABLE refunds ALTER COLUMN status TYPE refund_status_enum USING status::refund_status_enum;

-- Add back default
ALTER TABLE refunds ALTER COLUMN status SET DEFAULT 'pending'::refund_status_enum;

-- Step 10: Create sessions table
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

-- Step 11: Create automatic refund policies table
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

-- Step 12: Add indexes
CREATE INDEX IF NOT EXISTS idx_sessions_coach_id ON sessions(coach_id);
CREATE INDEX IF NOT EXISTS idx_sessions_client_id ON sessions(client_id);
CREATE INDEX IF NOT EXISTS idx_sessions_payment_id ON sessions(payment_id);
CREATE INDEX IF NOT EXISTS idx_sessions_date ON sessions(session_date);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON sessions(status);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_expires_at ON payments(expires_at);
CREATE INDEX IF NOT EXISTS idx_refunds_status ON refunds(status);
CREATE INDEX IF NOT EXISTS idx_refunds_requires_approval ON refunds(requires_approval);

-- Step 13: Add foreign key constraints (only if tables exist)
DO $$
BEGIN
    -- Add refunds foreign key
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
        BEGIN
            ALTER TABLE refunds ADD CONSTRAINT fk_refunds_approved_by FOREIGN KEY (approved_by) REFERENCES users(id);
        EXCEPTION WHEN duplicate_object THEN
            -- Constraint already exists, ignore
        END;
    END IF;
END $$;

-- Step 14: Insert default refund policies
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

-- Step 15: Create timestamp update function
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
DROP TRIGGER IF EXISTS update_sessions_updated_at ON sessions;
CREATE TRIGGER update_sessions_updated_at
    BEFORE UPDATE ON sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_automatic_refund_policies_updated_at ON automatic_refund_policies;
CREATE TRIGGER update_automatic_refund_policies_updated_at
    BEFORE UPDATE ON automatic_refund_policies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Step 16: Recreate the payment_summary view
CREATE OR REPLACE VIEW payment_summary AS
SELECT 
    p.id,
    p.client_id,
    COALESCE(
        (SELECT first_name || ' ' || last_name FROM clients WHERE id = p.client_id),
        (SELECT first_name || ' ' || last_name FROM users WHERE id = p.client_id),
        'Unknown Client'
    ) as client_name,
    p.coach_id,
    COALESCE(
        (SELECT first_name || ' ' || last_name FROM coaches WHERE id = p.coach_id),
        (SELECT first_name || ' ' || last_name FROM users WHERE id = p.coach_id),
        'Unknown Coach'
    ) as coach_name,
    p.amount_cents,
    p.platform_fee_cents,
    p.coach_earnings_cents,
    p.status::text as status,
    p.description,
    p.created_at,
    p.paid_at,
    COALESCE(cr.title, 'Unknown Rate') as rate_title,
    COALESCE(cr.session_type::text, 'individual') as session_type,
    COALESCE(cr.duration_minutes, 60) as duration_minutes
FROM payments p
LEFT JOIN coach_rates cr ON p.coach_rate_id = cr.id;

-- Step 17: Add helpful comments
COMMENT ON TABLE sessions IS 'Session tracking for payment authorization/capture flow';
COMMENT ON TABLE automatic_refund_policies IS 'Configurable automatic refund policies based on cancellation timing and conditions';
COMMENT ON COLUMN payments.authorization_code IS 'Stripe authorization code for manual capture';
COMMENT ON COLUMN payments.captured_at IS 'Timestamp when payment was captured after session completion';
COMMENT ON COLUMN payments.expires_at IS 'Authorization expiration timestamp (usually 7 days)';
COMMENT ON COLUMN refunds.requires_approval IS 'Whether this refund requires admin approval';
COMMENT ON COLUMN refunds.auto_approval_policy IS 'Reference to automatic refund policy that approved this refund';

-- Final verification and success message
SELECT 
    'Migration completed successfully!' as status,
    'Payment statuses: ' || array_to_string(enum_range(NULL::payment_status_enum), ', ') as payment_statuses,
    'Refund statuses: ' || array_to_string(enum_range(NULL::refund_status_enum), ', ') as refund_statuses;