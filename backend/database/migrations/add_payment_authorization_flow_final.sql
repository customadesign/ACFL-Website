-- Final Migration to support payment authorization/capture flow
-- Handles existing views and dependencies properly

-- Step 1: Store the definition of any views that depend on the payments table
-- We'll need to recreate them after the migration

-- First, let's see what views exist and store their definitions
DO $$
DECLARE
    view_record RECORD;
    view_definition TEXT;
BEGIN
    -- Create a temporary table to store view definitions
    CREATE TEMP TABLE IF NOT EXISTS temp_view_definitions (
        view_name TEXT,
        definition TEXT
    );
    
    -- Get all views that depend on the payments table
    FOR view_record IN 
        SELECT schemaname, viewname 
        FROM pg_views 
        WHERE definition LIKE '%payments%'
        AND schemaname = 'public'
    LOOP
        -- Get the view definition
        SELECT pg_get_viewdef(quote_ident(view_record.schemaname)||'.'||quote_ident(view_record.viewname), true) INTO view_definition;
        
        -- Store it
        INSERT INTO temp_view_definitions (view_name, definition) VALUES (view_record.viewname, view_definition);
        
        -- Drop the view
        EXECUTE 'DROP VIEW IF EXISTS ' || quote_ident(view_record.viewname) || ' CASCADE';
    END LOOP;
END $$;

-- Step 2: Add new columns to payments table
ALTER TABLE payments 
ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'card',
ADD COLUMN IF NOT EXISTS authorization_code TEXT,
ADD COLUMN IF NOT EXISTS captured_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE;

-- Step 3: Update existing payment statuses to map to new enum values
UPDATE payments 
SET status = CASE 
    WHEN status = 'pending' THEN 'pending'
    WHEN status = 'succeeded' THEN 'succeeded' 
    WHEN status = 'failed' THEN 'failed'
    WHEN status = 'canceled' THEN 'canceled'
    WHEN status = 'cancelled' THEN 'canceled'  -- Handle both spellings
    WHEN status = 'refunded' THEN 'refunded'
    WHEN status = 'partially_refunded' THEN 'partially_refunded'
    ELSE 'pending'
END;

-- Step 4: Update the enum type safely
DO $$ 
BEGIN
    -- Change column type to text temporarily
    ALTER TABLE payments ALTER COLUMN status TYPE TEXT;
    
    -- Drop the old enum if it exists
    DROP TYPE IF EXISTS payment_status_enum CASCADE;
    
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
    
    RAISE NOTICE 'Payment status enum updated successfully';
END $$;

-- Step 5: Update refunds table
-- Add new columns for approval workflow
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

-- Update refund status enum
DO $$ 
BEGIN
    -- Change to text temporarily
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
    
    -- Convert back to enum
    ALTER TABLE refunds ALTER COLUMN status TYPE refund_status_enum USING status::refund_status_enum;
    
    -- Set default
    ALTER TABLE refunds ALTER COLUMN status SET DEFAULT 'pending'::refund_status_enum;
    
    RAISE NOTICE 'Refund status enum updated successfully';
END $$;

-- Step 6: Create sessions table
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

-- Step 7: Create automatic refund policies table
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

-- Step 8: Add foreign key constraints if tables exist
DO $$
BEGIN
    -- Check for users table and add constraints
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
        -- Add foreign key constraints for refunds
        IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_refunds_approved_by') THEN
            ALTER TABLE refunds ADD CONSTRAINT fk_refunds_approved_by FOREIGN KEY (approved_by) REFERENCES users(id);
        END IF;
        
        -- Add foreign key constraints for sessions
        IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_sessions_coach_id') THEN
            ALTER TABLE sessions ADD CONSTRAINT fk_sessions_coach_id FOREIGN KEY (coach_id) REFERENCES users(id);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_sessions_client_id') THEN
            ALTER TABLE sessions ADD CONSTRAINT fk_sessions_client_id FOREIGN KEY (client_id) REFERENCES users(id);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_sessions_completion_confirmed_by') THEN
            ALTER TABLE sessions ADD CONSTRAINT fk_sessions_completion_confirmed_by FOREIGN KEY (completion_confirmed_by) REFERENCES users(id);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_sessions_cancelled_by') THEN
            ALTER TABLE sessions ADD CONSTRAINT fk_sessions_cancelled_by FOREIGN KEY (cancelled_by) REFERENCES users(id);
        END IF;
    END IF;
    
    -- Add payment foreign key constraint
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'payments') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_sessions_payment_id') THEN
            ALTER TABLE sessions ADD CONSTRAINT fk_sessions_payment_id FOREIGN KEY (payment_id) REFERENCES payments(id);
        END IF;
    END IF;
END $$;

-- Step 9: Insert default refund policies
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

-- Step 10: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_sessions_coach_id ON sessions(coach_id);
CREATE INDEX IF NOT EXISTS idx_sessions_client_id ON sessions(client_id);
CREATE INDEX IF NOT EXISTS idx_sessions_payment_id ON sessions(payment_id);
CREATE INDEX IF NOT EXISTS idx_sessions_date ON sessions(session_date);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON sessions(status);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_expires_at ON payments(expires_at);
CREATE INDEX IF NOT EXISTS idx_refunds_status ON refunds(status);
CREATE INDEX IF NOT EXISTS idx_refunds_requires_approval ON refunds(requires_approval);

-- Step 11: Create timestamp update function and triggers
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

-- Step 12: Recreate the payment_summary view with updated schema
-- Create a modern version that works with the new enum values
CREATE OR REPLACE VIEW payment_summary AS
SELECT 
    p.id,
    p.client_id,
    COALESCE(cl.first_name || ' ' || cl.last_name, 'Unknown Client') as client_name,
    p.coach_id,
    COALESCE(co.first_name || ' ' || co.last_name, 'Unknown Coach') as coach_name,
    p.amount_cents,
    p.platform_fee_cents,
    p.coach_earnings_cents,
    p.status::text as status,
    p.description,
    p.created_at,
    p.paid_at,
    cr.title as rate_title,
    cr.session_type,
    cr.duration_minutes
FROM payments p
LEFT JOIN users cl ON p.client_id = cl.id
LEFT JOIN users co ON p.coach_id = co.id  
LEFT JOIN coach_rates cr ON p.coach_rate_id = cr.id;

-- Step 13: Recreate any other views that were dropped
-- This will attempt to recreate views from the stored definitions
DO $$
DECLARE
    view_rec RECORD;
BEGIN
    FOR view_rec IN SELECT view_name, definition FROM temp_view_definitions WHERE view_name != 'payment_summary' LOOP
        BEGIN
            EXECUTE 'CREATE VIEW ' || quote_ident(view_rec.view_name) || ' AS ' || view_rec.definition;
            RAISE NOTICE 'Recreated view: %', view_rec.view_name;
        EXCEPTION WHEN OTHERS THEN
            RAISE WARNING 'Could not recreate view %: %', view_rec.view_name, SQLERRM;
        END;
    END LOOP;
    
    -- Clean up temp table
    DROP TABLE IF EXISTS temp_view_definitions;
END $$;

-- Step 14: Add helpful comments
COMMENT ON TABLE sessions IS 'Session tracking for payment authorization/capture flow';
COMMENT ON TABLE automatic_refund_policies IS 'Configurable automatic refund policies based on cancellation timing and conditions';
COMMENT ON COLUMN payments.authorization_code IS 'Stripe authorization code for manual capture';
COMMENT ON COLUMN payments.captured_at IS 'Timestamp when payment was captured after session completion';
COMMENT ON COLUMN payments.expires_at IS 'Authorization expiration timestamp (usually 7 days)';
COMMENT ON COLUMN refunds.requires_approval IS 'Whether this refund requires admin approval';
COMMENT ON COLUMN refunds.auto_approval_policy IS 'Reference to automatic refund policy that approved this refund';

-- Final verification
SELECT 
    'Migration completed successfully!' as status,
    'New payment statuses available: ' || array_to_string(enum_range(NULL::payment_status_enum), ', ') as payment_statuses,
    'New refund statuses available: ' || array_to_string(enum_range(NULL::refund_status_enum), ', ') as refund_statuses;