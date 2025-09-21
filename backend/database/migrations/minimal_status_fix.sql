-- Minimal migration to fix payment status enum
-- This only updates the status values to allow 'authorized'

-- Check if payments table exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'payments') THEN
        RAISE EXCEPTION 'Payments table does not exist. Please run the base payment table migration first.';
    END IF;
END $$;

-- Add new columns to payments table (safe operations)
ALTER TABLE payments
ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'card',
ADD COLUMN IF NOT EXISTS authorization_code TEXT,
ADD COLUMN IF NOT EXISTS captured_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE;

-- Handle status enum update safely
DO $$
DECLARE
    current_status_type TEXT;
BEGIN
    -- Check current status column type
    SELECT data_type INTO current_status_type
    FROM information_schema.columns
    WHERE table_name = 'payments' AND column_name = 'status';

    -- If status is already an enum, we need to update it carefully
    IF current_status_type = 'USER-DEFINED' THEN
        -- Method 1: Add new enum values to existing enum (PostgreSQL 9.1+)
        BEGIN
            ALTER TYPE payment_status_enum ADD VALUE IF NOT EXISTS 'authorized';
            ALTER TYPE payment_status_enum ADD VALUE IF NOT EXISTS 'requires_capture';
        EXCEPTION
            WHEN others THEN
                -- Method 2: If adding values fails, recreate the enum
                RAISE NOTICE 'Could not add enum values, trying full recreation...';

                -- Create a temporary column
                ALTER TABLE payments ADD COLUMN status_temp TEXT;

                -- Copy current values to temporary column
                UPDATE payments SET status_temp = status::text;

                -- Drop the old status column and enum
                ALTER TABLE payments DROP COLUMN status;
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

                -- Add new status column
                ALTER TABLE payments ADD COLUMN status payment_status_enum DEFAULT 'pending'::payment_status_enum;

                -- Copy values back from temporary column
                UPDATE payments SET status = status_temp::payment_status_enum;

                -- Drop temporary column and set not null
                ALTER TABLE payments DROP COLUMN status_temp;
                ALTER TABLE payments ALTER COLUMN status SET NOT NULL;
        END;
    ELSE
        -- Status is not an enum (probably VARCHAR/TEXT), convert it
        RAISE NOTICE 'Status column is not an enum, converting...';

        -- Create the enum if it doesn't exist
        DROP TYPE IF EXISTS payment_status_enum;
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

        -- Update any invalid status values
        UPDATE payments SET status = 'pending' WHERE status NOT IN ('pending', 'succeeded', 'failed', 'canceled', 'refunded', 'partially_refunded');

        -- Convert column to enum type
        ALTER TABLE payments ALTER COLUMN status TYPE payment_status_enum USING status::payment_status_enum;
        ALTER TABLE payments ALTER COLUMN status SET DEFAULT 'pending'::payment_status_enum;
    END IF;
END $$;

-- Handle refunds table if it exists
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'refunds') THEN
        -- Add new columns to refunds table
        ALTER TABLE refunds
        ADD COLUMN IF NOT EXISTS requires_approval BOOLEAN DEFAULT false,
        ADD COLUMN IF NOT EXISTS approved_by UUID,
        ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE,
        ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
        ADD COLUMN IF NOT EXISTS auto_approval_policy TEXT;

        -- Update refunds status enum similarly
        BEGIN
            ALTER TYPE refund_status_enum ADD VALUE IF NOT EXISTS 'pending_approval';
            ALTER TYPE refund_status_enum ADD VALUE IF NOT EXISTS 'approved';
            ALTER TYPE refund_status_enum ADD VALUE IF NOT EXISTS 'rejected';
        EXCEPTION
            WHEN others THEN
                -- Recreate refund enum if needed
                ALTER TABLE refunds ADD COLUMN status_temp TEXT;
                UPDATE refunds SET status_temp = status::text;
                ALTER TABLE refunds DROP COLUMN status;
                DROP TYPE IF EXISTS refund_status_enum;

                CREATE TYPE refund_status_enum AS ENUM (
                    'pending',
                    'pending_approval',
                    'approved',
                    'rejected',
                    'succeeded',
                    'failed',
                    'canceled'
                );

                ALTER TABLE refunds ADD COLUMN status refund_status_enum DEFAULT 'pending'::refund_status_enum;
                UPDATE refunds SET status = status_temp::refund_status_enum;
                ALTER TABLE refunds DROP COLUMN status_temp;
                ALTER TABLE refunds ALTER COLUMN status SET NOT NULL;
        END;
    END IF;
END $$;

-- Verify the changes
SELECT
    'SUCCESS: Payment status enum updated!' as message,
    'Available statuses: ' || array_to_string(enum_range(NULL::payment_status_enum), ', ') as payment_statuses;