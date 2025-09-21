-- Fixed Migration for payment authorization/capture flow
-- Handles missing columns and constraint issues properly

-- Step 1: Check if payments table exists and has proper structure
DO $$
BEGIN
    -- Ensure payments table exists
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'payments') THEN
        RAISE EXCEPTION 'Payments table does not exist. Please run the base payment table migration first.';
    END IF;

    -- Check if payments table has an id column
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'payments' AND column_name = 'id') THEN
        RAISE EXCEPTION 'Payments table is missing id column. Please check your base schema.';
    END IF;
END $$;

-- Step 2: Add new columns to payments table (safe operations)
ALTER TABLE payments
ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'card',
ADD COLUMN IF NOT EXISTS authorization_code TEXT,
ADD COLUMN IF NOT EXISTS captured_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE;

-- Step 3: Handle status column migration safely
DO $$
BEGIN
    -- Create a temporary column for the new status
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'payments' AND column_name = 'status_new') THEN
        ALTER TABLE payments ADD COLUMN status_new TEXT;
    END IF;

    -- Populate the temporary column with mapped values
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

    -- Drop the old status column
    ALTER TABLE payments DROP COLUMN IF EXISTS status;

    -- Drop old enum if it exists
    DROP TYPE IF EXISTS payment_status_enum CASCADE;

    -- Create the new enum
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

    -- Add the new status column with the enum type
    ALTER TABLE payments ADD COLUMN status payment_status_enum DEFAULT 'pending'::payment_status_enum;

    -- Populate the new status column from the temporary column
    UPDATE payments SET status = status_new::payment_status_enum;

    -- Drop the temporary column and add not null constraint
    ALTER TABLE payments DROP COLUMN status_new;
    ALTER TABLE payments ALTER COLUMN status SET NOT NULL;
END $$;

-- Step 4: Handle refunds table similar way
DO $$
BEGIN
    -- Check if refunds table exists
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'refunds') THEN
        -- Add new columns first
        ALTER TABLE refunds
        ADD COLUMN IF NOT EXISTS requires_approval BOOLEAN DEFAULT false,
        ADD COLUMN IF NOT EXISTS approved_by UUID,
        ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE,
        ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
        ADD COLUMN IF NOT EXISTS auto_approval_policy TEXT;

        -- Create temporary column for refunds
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'refunds' AND column_name = 'status_new') THEN
            ALTER TABLE refunds ADD COLUMN status_new TEXT;
        END IF;

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
        ALTER TABLE refunds DROP COLUMN IF EXISTS status;
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
    END IF;
END $$;

-- Step 5: Create sessions table
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

-- Step 6: Add foreign key constraints safely
DO $$
BEGIN
    -- Add foreign key for sessions.payment_id only if payments table has id column
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'payments' AND column_name = 'id') THEN
        BEGIN
            ALTER TABLE sessions ADD CONSTRAINT fk_sessions_payment_id FOREIGN KEY (payment_id) REFERENCES payments(id);
        EXCEPTION WHEN duplicate_object THEN
            -- Constraint already exists, ignore
            NULL;
        END;
    END IF;

    -- Add user foreign keys if users table exists
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'users') THEN
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

        -- Add refund foreign key if refunds table exists
        IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'refunds') THEN
            BEGIN
                ALTER TABLE refunds ADD CONSTRAINT fk_refunds_approved_by FOREIGN KEY (approved_by) REFERENCES users(id);
            EXCEPTION WHEN duplicate_object THEN NULL; END;
        END IF;
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