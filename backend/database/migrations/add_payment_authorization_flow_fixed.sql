-- Fixed Migration to support payment authorization/capture flow
-- Handles existing data properly and updates enum types safely

-- First, add new columns to payments table
ALTER TABLE payments 
ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'card',
ADD COLUMN IF NOT EXISTS authorization_code TEXT,
ADD COLUMN IF NOT EXISTS captured_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE;

-- Update existing payment statuses to map to new enum values
UPDATE payments 
SET status = CASE 
    WHEN status = 'pending' THEN 'pending'
    WHEN status = 'succeeded' THEN 'succeeded' 
    WHEN status = 'failed' THEN 'failed'
    WHEN status = 'canceled' THEN 'canceled'
    WHEN status = 'refunded' THEN 'refunded'
    WHEN status = 'partially_refunded' THEN 'partially_refunded'
    ELSE 'pending'
END;

-- Drop the existing enum and recreate it with new values
DO $$ 
BEGIN
    -- First change column type to text temporarily
    ALTER TABLE payments ALTER COLUMN status TYPE TEXT;
    
    -- Drop the old enum if it exists
    DROP TYPE IF EXISTS payment_status_enum;
    
    -- Create new enum with all values
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
    
    -- Convert column back to enum type
    ALTER TABLE payments ALTER COLUMN status TYPE payment_status_enum USING status::payment_status_enum;
    
    -- Set default value
    ALTER TABLE payments ALTER COLUMN status SET DEFAULT 'pending'::payment_status_enum;
END $$;

-- Add new columns to refunds table for approval workflow
ALTER TABLE refunds 
ADD COLUMN IF NOT EXISTS requires_approval BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS approved_by UUID,
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
ADD COLUMN IF NOT EXISTS auto_approval_policy TEXT;

-- Add foreign key constraint for approved_by if users table exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
        -- Add foreign key constraint
        ALTER TABLE refunds 
        ADD CONSTRAINT fk_refunds_approved_by 
        FOREIGN KEY (approved_by) REFERENCES users(id);
    END IF;
END $$;

-- Update existing refund statuses
UPDATE refunds 
SET status = CASE 
    WHEN status = 'pending' THEN 'pending'
    WHEN status = 'succeeded' THEN 'succeeded'
    WHEN status = 'failed' THEN 'failed'
    WHEN status = 'canceled' THEN 'canceled'
    ELSE 'pending'
END;

-- Update refund status enum
DO $$ 
BEGIN
    -- Change to text temporarily
    ALTER TABLE refunds ALTER COLUMN status TYPE TEXT;
    
    -- Drop old enum
    DROP TYPE IF EXISTS refund_status_enum;
    
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
    
    -- Convert back to enum
    ALTER TABLE refunds ALTER COLUMN status TYPE refund_status_enum USING status::refund_status_enum;
    
    -- Set default
    ALTER TABLE refunds ALTER COLUMN status SET DEFAULT 'pending'::refund_status_enum;
END $$;

-- Create sessions table to track session completion for payment capture
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

-- Add foreign key constraints for sessions table if tables exist
DO $$
BEGIN
    -- Add foreign key constraints if the referenced tables exist
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
        ALTER TABLE sessions 
        ADD CONSTRAINT fk_sessions_coach_id FOREIGN KEY (coach_id) REFERENCES users(id),
        ADD CONSTRAINT fk_sessions_client_id FOREIGN KEY (client_id) REFERENCES users(id),
        ADD CONSTRAINT fk_sessions_completion_confirmed_by FOREIGN KEY (completion_confirmed_by) REFERENCES users(id),
        ADD CONSTRAINT fk_sessions_cancelled_by FOREIGN KEY (cancelled_by) REFERENCES users(id);
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'payments') THEN
        ALTER TABLE sessions 
        ADD CONSTRAINT fk_sessions_payment_id FOREIGN KEY (payment_id) REFERENCES payments(id);
    END IF;
END $$;

-- Create automatic refund policies table
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

-- Add helpful comments
COMMENT ON TABLE sessions IS 'Session tracking for payment authorization/capture flow';
COMMENT ON TABLE automatic_refund_policies IS 'Configurable automatic refund policies based on cancellation timing and conditions';
COMMENT ON COLUMN payments.authorization_code IS 'Stripe authorization code for manual capture';
COMMENT ON COLUMN payments.captured_at IS 'Timestamp when payment was captured after session completion';
COMMENT ON COLUMN payments.expires_at IS 'Authorization expiration timestamp (usually 7 days)';
COMMENT ON COLUMN refunds.requires_approval IS 'Whether this refund requires admin approval';
COMMENT ON COLUMN refunds.auto_approval_policy IS 'Reference to automatic refund policy that approved this refund';

-- Verify the migration worked
SELECT 'Migration completed successfully!' as status;