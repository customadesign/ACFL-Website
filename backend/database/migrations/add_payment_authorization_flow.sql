-- Migration to support payment authorization/capture flow
-- Adds new payment statuses and refund approval workflow

-- Update payments table to support authorization/capture flow
ALTER TABLE payments 
ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'card',
ADD COLUMN IF NOT EXISTS authorization_code TEXT,
ADD COLUMN IF NOT EXISTS captured_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE;

-- Update status enum to include new payment states
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_status_enum') THEN
        -- Drop and recreate the enum with new values
        ALTER TABLE payments ALTER COLUMN status TYPE TEXT;
        DROP TYPE payment_status_enum;
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
        ALTER TABLE payments ALTER COLUMN status TYPE payment_status_enum USING status::payment_status_enum;
    ELSE
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
        ALTER TABLE payments ALTER COLUMN status TYPE payment_status_enum USING status::payment_status_enum;
    END IF;
END $$;

-- Update refunds table to support approval workflow
ALTER TABLE refunds 
ADD COLUMN IF NOT EXISTS requires_approval BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
ADD COLUMN IF NOT EXISTS auto_approval_policy TEXT;

-- Update refund status enum
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'refund_status_enum') THEN
        ALTER TABLE refunds ALTER COLUMN status TYPE TEXT;
        DROP TYPE refund_status_enum;
        CREATE TYPE refund_status_enum AS ENUM (
            'pending', 
            'pending_approval',
            'approved',
            'rejected',
            'succeeded', 
            'failed', 
            'canceled'
        );
        ALTER TABLE refunds ALTER COLUMN status TYPE refund_status_enum USING status::refund_status_enum;
    ELSE
        CREATE TYPE refund_status_enum AS ENUM (
            'pending', 
            'pending_approval',
            'approved',
            'rejected',
            'succeeded', 
            'failed', 
            'canceled'
        );
        ALTER TABLE refunds ALTER COLUMN status TYPE refund_status_enum USING status::refund_status_enum;
    END IF;
END $$;

-- Create sessions table to track session completion for payment capture
CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    coach_id UUID NOT NULL REFERENCES users(id),
    client_id UUID NOT NULL REFERENCES users(id),
    payment_id UUID REFERENCES payments(id),
    session_date TIMESTAMP WITH TIME ZONE NOT NULL,
    duration_minutes INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled', 'no_show')),
    session_notes TEXT,
    completion_confirmed_by UUID REFERENCES users(id),
    completed_at TIMESTAMP WITH TIME ZONE,
    cancellation_reason TEXT,
    cancelled_by UUID REFERENCES users(id),
    cancelled_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_sessions_coach_id ON sessions(coach_id);
CREATE INDEX IF NOT EXISTS idx_sessions_client_id ON sessions(client_id);
CREATE INDEX IF NOT EXISTS idx_sessions_payment_id ON sessions(payment_id);
CREATE INDEX IF NOT EXISTS idx_sessions_date ON sessions(session_date);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON sessions(status);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_expires_at ON payments(expires_at);
CREATE INDEX IF NOT EXISTS idx_refunds_status ON refunds(status);
CREATE INDEX IF NOT EXISTS idx_refunds_requires_approval ON refunds(requires_approval);

-- Create automatic refund policies table
CREATE TABLE IF NOT EXISTS automatic_refund_policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    conditions JSONB NOT NULL, -- Flexible conditions storage
    refund_percentage DECIMAL(5,2) NOT NULL DEFAULT 100.00,
    applies_to_session_types TEXT[] DEFAULT ARRAY['individual', 'group', 'package'],
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default automatic refund policies
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

-- Add triggers to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_sessions_updated_at ON sessions;
CREATE TRIGGER update_sessions_updated_at
    BEFORE UPDATE ON sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_automatic_refund_policies_updated_at ON automatic_refund_policies;
CREATE TRIGGER update_automatic_refund_policies_updated_at
    BEFORE UPDATE ON automatic_refund_policies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

COMMENT ON TABLE sessions IS 'Session tracking for payment authorization/capture flow';
COMMENT ON TABLE automatic_refund_policies IS 'Configurable automatic refund policies based on cancellation timing and conditions';
COMMENT ON COLUMN payments.authorization_code IS 'Stripe authorization code for manual capture';
COMMENT ON COLUMN payments.captured_at IS 'Timestamp when payment was captured after session completion';
COMMENT ON COLUMN payments.expires_at IS 'Authorization expiration timestamp (usually 7 days)';
COMMENT ON COLUMN refunds.requires_approval IS 'Whether this refund requires admin approval';
COMMENT ON COLUMN refunds.auto_approval_policy IS 'Reference to automatic refund policy that approved this refund';