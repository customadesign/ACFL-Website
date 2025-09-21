-- Safe migration: Update payment status enum without dropping columns
-- Works around existing views that depend on the status column

-- Step 1: Add new columns to payments table if they don't exist
ALTER TABLE payments
ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'card',
ADD COLUMN IF NOT EXISTS authorization_code TEXT,
ADD COLUMN IF NOT EXISTS captured_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE;

-- Step 2: Try to add new enum values directly (PostgreSQL 9.1+)
DO $$
BEGIN
    -- Check if payment_status_enum exists
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_status_enum') THEN
        -- Try to add new values to existing enum
        BEGIN
            -- Add 'authorized' if it doesn't exist
            IF NOT EXISTS (
                SELECT 1 FROM pg_enum e
                JOIN pg_type t ON e.enumtypid = t.oid
                WHERE t.typname = 'payment_status_enum' AND e.enumlabel = 'authorized'
            ) THEN
                ALTER TYPE payment_status_enum ADD VALUE 'authorized' AFTER 'pending';
                RAISE NOTICE 'Added "authorized" to payment_status_enum';
            ELSE
                RAISE NOTICE '"authorized" already exists in payment_status_enum';
            END IF;

            -- Add 'requires_capture' if it doesn't exist
            IF NOT EXISTS (
                SELECT 1 FROM pg_enum e
                JOIN pg_type t ON e.enumtypid = t.oid
                WHERE t.typname = 'payment_status_enum' AND e.enumlabel = 'requires_capture'
            ) THEN
                ALTER TYPE payment_status_enum ADD VALUE 'requires_capture' AFTER 'authorized';
                RAISE NOTICE 'Added "requires_capture" to payment_status_enum';
            ELSE
                RAISE NOTICE '"requires_capture" already exists in payment_status_enum';
            END IF;

        EXCEPTION
            WHEN others THEN
                RAISE NOTICE 'Could not add enum values directly: %. Will try alternative approach.', SQLERRM;

                -- Alternative: Create new enum and use a different approach
                -- First, temporarily drop dependent views
                DROP VIEW IF EXISTS payment_summary CASCADE;
                DROP VIEW IF EXISTS financial_summary CASCADE;

                -- Create a temporary column
                ALTER TABLE payments ADD COLUMN status_temp TEXT;
                UPDATE payments SET status_temp = status::text;

                -- Now we can drop the status column
                ALTER TABLE payments DROP COLUMN status;

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

                -- Add status column back with new enum
                ALTER TABLE payments ADD COLUMN status payment_status_enum DEFAULT 'pending'::payment_status_enum;

                -- Restore data from temp column
                UPDATE payments SET status =
                    CASE status_temp
                        WHEN 'pending' THEN 'pending'::payment_status_enum
                        WHEN 'succeeded' THEN 'succeeded'::payment_status_enum
                        WHEN 'failed' THEN 'failed'::payment_status_enum
                        WHEN 'canceled' THEN 'canceled'::payment_status_enum
                        WHEN 'cancelled' THEN 'canceled'::payment_status_enum
                        WHEN 'refunded' THEN 'refunded'::payment_status_enum
                        WHEN 'partially_refunded' THEN 'partially_refunded'::payment_status_enum
                        ELSE 'pending'::payment_status_enum
                    END;

                -- Clean up temp column and set constraints
                ALTER TABLE payments DROP COLUMN status_temp;
                ALTER TABLE payments ALTER COLUMN status SET NOT NULL;

                -- Recreate the views
                CREATE OR REPLACE VIEW payment_summary AS
                SELECT
                    p.id,
                    p.client_id,
                    'Unknown Client' as client_name,
                    p.coach_id,
                    'Unknown Coach' as coach_name,
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

                RAISE NOTICE 'Successfully recreated enum and views with new status values';
        END;
    ELSE
        -- Enum doesn't exist, create it
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

        -- Update payments table to use the enum if status column exists as text
        IF EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'payments' AND column_name = 'status' AND data_type = 'text'
        ) THEN
            ALTER TABLE payments ALTER COLUMN status TYPE payment_status_enum USING status::payment_status_enum;
        END IF;

        RAISE NOTICE 'Created new payment_status_enum';
    END IF;
END $$;

-- Step 3: Verify the result
SELECT
    'Migration completed!' as status,
    'Available payment statuses: ' || array_to_string(enum_range(NULL::payment_status_enum), ', ') as available_statuses;