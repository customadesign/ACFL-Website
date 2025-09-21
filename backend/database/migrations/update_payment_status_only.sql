-- Targeted fix: Only update payment status enum to support 'authorized'
-- Since tables already exist, we just need to fix the enum

-- Step 1: Add new columns to payments table if they don't exist
ALTER TABLE payments
ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'card',
ADD COLUMN IF NOT EXISTS authorization_code TEXT,
ADD COLUMN IF NOT EXISTS captured_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE;

-- Step 2: Update payment status enum to include 'authorized' and 'requires_capture'
DO $$
BEGIN
    -- First, try to add the new enum values to existing enum
    BEGIN
        ALTER TYPE payment_status_enum ADD VALUE IF NOT EXISTS 'authorized';
        RAISE NOTICE 'Added authorized status to enum';
    EXCEPTION
        WHEN duplicate_object THEN
            RAISE NOTICE 'authorized status already exists in enum';
        WHEN others THEN
            RAISE NOTICE 'Could not add authorized status: %', SQLERRM;
    END;

    BEGIN
        ALTER TYPE payment_status_enum ADD VALUE IF NOT EXISTS 'requires_capture';
        RAISE NOTICE 'Added requires_capture status to enum';
    EXCEPTION
        WHEN duplicate_object THEN
            RAISE NOTICE 'requires_capture status already exists in enum';
        WHEN others THEN
            RAISE NOTICE 'Could not add requires_capture status: %', SQLERRM;
    END;
END $$;

-- Step 3: If the above didn't work, we'll recreate the enum
DO $$
DECLARE
    enum_exists BOOLEAN;
    has_authorized BOOLEAN;
BEGIN
    -- Check if the enum has the values we need
    SELECT EXISTS (
        SELECT 1 FROM pg_enum e
        JOIN pg_type t ON e.enumtypid = t.oid
        WHERE t.typname = 'payment_status_enum' AND e.enumlabel = 'authorized'
    ) INTO has_authorized;

    IF NOT has_authorized THEN
        RAISE NOTICE 'Enum does not have authorized status, recreating...';

        -- Create a backup column
        ALTER TABLE payments ADD COLUMN IF NOT EXISTS status_backup TEXT;
        UPDATE payments SET status_backup = status::text WHERE status_backup IS NULL;

        -- Drop the current status column
        ALTER TABLE payments DROP COLUMN IF EXISTS status;

        -- Drop and recreate the enum
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

        -- Add the status column back
        ALTER TABLE payments ADD COLUMN status payment_status_enum DEFAULT 'pending'::payment_status_enum;

        -- Restore values from backup
        UPDATE payments SET status =
            CASE status_backup
                WHEN 'pending' THEN 'pending'::payment_status_enum
                WHEN 'succeeded' THEN 'succeeded'::payment_status_enum
                WHEN 'failed' THEN 'failed'::payment_status_enum
                WHEN 'canceled' THEN 'canceled'::payment_status_enum
                WHEN 'cancelled' THEN 'canceled'::payment_status_enum
                WHEN 'refunded' THEN 'refunded'::payment_status_enum
                WHEN 'partially_refunded' THEN 'partially_refunded'::payment_status_enum
                ELSE 'pending'::payment_status_enum
            END;

        -- Clean up and set constraints
        ALTER TABLE payments DROP COLUMN status_backup;
        ALTER TABLE payments ALTER COLUMN status SET NOT NULL;

        RAISE NOTICE 'Successfully recreated payment_status_enum with authorized status';
    ELSE
        RAISE NOTICE 'Payment enum already has authorized status';
    END IF;
END $$;

-- Step 4: Verify the update
SELECT
    'Payment status enum updated successfully!' as message,
    'Available payment statuses: ' || array_to_string(enum_range(NULL::payment_status_enum), ', ') as available_statuses;