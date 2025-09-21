-- Complete migration from Stripe to Square payments
-- Removes all Stripe references and fully migrates to Square

-- Step 1: Check current payments table structure and drop old constraints
DO $$
DECLARE
    constraint_name TEXT;
BEGIN
    -- Find and drop the old payments_status_check constraint
    SELECT conname INTO constraint_name
    FROM pg_constraint
    WHERE conrelid = 'payments'::regclass
    AND (conname LIKE '%status%check%' OR conname = 'payments_status_check');

    IF constraint_name IS NOT NULL THEN
        EXECUTE 'ALTER TABLE payments DROP CONSTRAINT ' || constraint_name;
        RAISE NOTICE 'Dropped constraint: %', constraint_name;
    END IF;
END $$;

-- Step 2: Add Square columns and prepare for Stripe column removal
ALTER TABLE payments
ADD COLUMN IF NOT EXISTS square_payment_id TEXT,
ADD COLUMN IF NOT EXISTS square_customer_id TEXT,
ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'card',
ADD COLUMN IF NOT EXISTS authorization_code TEXT,
ADD COLUMN IF NOT EXISTS captured_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE;

-- Step 3: Migrate existing Stripe data to Square columns
DO $$
BEGIN
    -- Copy existing Stripe data to Square columns if Stripe columns exist and have data
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payments' AND column_name = 'stripe_payment_intent_id') THEN
        UPDATE payments
        SET square_payment_id = stripe_payment_intent_id
        WHERE stripe_payment_intent_id IS NOT NULL AND square_payment_id IS NULL;

        UPDATE payments
        SET square_customer_id = stripe_customer_id
        WHERE stripe_customer_id IS NOT NULL AND square_customer_id IS NULL;

        RAISE NOTICE 'Migrated existing Stripe data to Square columns';
    END IF;
END $$;

-- Step 4: Drop Stripe columns completely
DO $$
BEGIN
    -- Drop Stripe columns if they exist
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payments' AND column_name = 'stripe_payment_intent_id') THEN
        ALTER TABLE payments DROP COLUMN stripe_payment_intent_id;
        RAISE NOTICE 'Dropped stripe_payment_intent_id column';
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payments' AND column_name = 'stripe_customer_id') THEN
        ALTER TABLE payments DROP COLUMN stripe_customer_id;
        RAISE NOTICE 'Dropped stripe_customer_id column';
    END IF;
END $$;

-- Step 3: Handle status column - remove old constraint and update enum
DO $$
BEGIN
    -- First, let's see what type the status column currently is
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'payments' AND column_name = 'status' AND data_type = 'text'
    ) THEN
        -- Status is text, need to convert to enum
        RAISE NOTICE 'Status column is text type, converting to enum...';

        -- Create the enum if it doesn't exist
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

        -- Update any invalid status values first
        UPDATE payments SET status = 'pending'
        WHERE status NOT IN ('pending', 'succeeded', 'failed', 'canceled', 'cancelled', 'refunded', 'partially_refunded');

        -- Convert cancelled to canceled for consistency
        UPDATE payments SET status = 'canceled' WHERE status = 'cancelled';

        -- Convert the column to enum type
        ALTER TABLE payments ALTER COLUMN status TYPE payment_status_enum USING status::payment_status_enum;

    ELSIF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'payments' AND column_name = 'status' AND data_type = 'USER-DEFINED'
    ) THEN
        -- Status is already an enum, try to add missing values
        RAISE NOTICE 'Status column is enum type, adding missing values...';

        -- Try to add missing enum values
        BEGIN
            ALTER TYPE payment_status_enum ADD VALUE IF NOT EXISTS 'authorized';
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Could not add authorized value: %', SQLERRM;
        END;

        BEGIN
            ALTER TYPE payment_status_enum ADD VALUE IF NOT EXISTS 'requires_capture';
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Could not add requires_capture value: %', SQLERRM;
        END;
    END IF;

    -- Set default for status column
    ALTER TABLE payments ALTER COLUMN status SET DEFAULT 'pending'::payment_status_enum;
END $$;

-- Step 5: Add constraints for Square-only data integrity
-- Since we've removed Stripe columns, only require Square payment ID
ALTER TABLE payments
ADD CONSTRAINT chk_square_payment_id_required CHECK (square_payment_id IS NOT NULL);

-- Step 6: Create indexes for Square columns
CREATE INDEX IF NOT EXISTS idx_payments_square_payment_id ON payments(square_payment_id);
CREATE INDEX IF NOT EXISTS idx_payments_square_customer_id ON payments(square_customer_id);

-- Step 7: Update the PaymentServiceV2 insertion to use square columns
-- We can't modify TypeScript from SQL, but we can create a function to help
CREATE OR REPLACE FUNCTION insert_square_payment(
    p_client_id UUID,
    p_coach_id UUID,
    p_coach_rate_id UUID,
    p_square_payment_id TEXT,
    p_square_customer_id TEXT,
    p_amount_cents INTEGER,
    p_currency TEXT DEFAULT 'usd',
    p_platform_fee_cents INTEGER DEFAULT 0,
    p_coach_earnings_cents INTEGER DEFAULT 0,
    p_status payment_status_enum DEFAULT 'authorized',
    p_session_id UUID DEFAULT NULL,
    p_description TEXT DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'::jsonb
) RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
    payment_id UUID;
BEGIN
    INSERT INTO payments (
        client_id,
        coach_id,
        coach_rate_id,
        square_payment_id,
        square_customer_id,
        amount_cents,
        currency,
        platform_fee_cents,
        coach_earnings_cents,
        status,
        session_id,
        description,
        metadata,
        created_at,
        updated_at
    ) VALUES (
        p_client_id,
        p_coach_id,
        p_coach_rate_id,
        p_square_payment_id,
        p_square_customer_id,
        p_amount_cents,
        p_currency,
        p_platform_fee_cents,
        p_coach_earnings_cents,
        p_status,
        p_session_id,
        p_description,
        p_metadata,
        NOW(),
        NOW()
    ) RETURNING id INTO payment_id;

    RETURN payment_id;
END;
$$;

-- Step 8: Verify the changes
SELECT
    'Migration completed successfully!' as status,
    'Payment statuses: ' || array_to_string(enum_range(NULL::payment_status_enum), ', ') as available_statuses;

-- Show the current payments table structure
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'payments'
AND column_name IN ('status', 'stripe_payment_intent_id', 'square_payment_id', 'square_customer_id')
ORDER BY column_name;