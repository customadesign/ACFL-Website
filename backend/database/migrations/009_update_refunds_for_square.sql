-- Migration: Update refunds table to use Square instead of Stripe
-- This migration updates the refunds table to support Square payment gateway

-- Step 1: Check if the column exists and rename it
DO $$
BEGIN
    -- Check if stripe_refund_id exists
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'refunds'
        AND column_name = 'stripe_refund_id'
    ) THEN
        -- Drop the unique constraint on stripe_refund_id if it exists
        IF EXISTS (
            SELECT 1
            FROM information_schema.table_constraints tc
            JOIN information_schema.constraint_column_usage ccu
                ON tc.constraint_name = ccu.constraint_name
            WHERE tc.table_schema = 'public'
            AND tc.table_name = 'refunds'
            AND ccu.column_name = 'stripe_refund_id'
            AND tc.constraint_type = 'UNIQUE'
        ) THEN
            ALTER TABLE public.refunds DROP CONSTRAINT IF EXISTS refunds_stripe_refund_id_key;
        END IF;

        -- Drop the index if it exists
        DROP INDEX IF EXISTS idx_refunds_stripe_refund;

        -- Rename the column
        ALTER TABLE public.refunds
        RENAME COLUMN stripe_refund_id TO square_refund_id;

        -- Add unique constraint back with new name
        ALTER TABLE public.refunds
        ADD CONSTRAINT refunds_square_refund_id_key UNIQUE (square_refund_id);

        -- Create new index
        CREATE INDEX idx_refunds_square_refund ON public.refunds(square_refund_id);

        RAISE NOTICE 'Successfully renamed stripe_refund_id to square_refund_id';
    ELSE
        -- Check if square_refund_id already exists
        IF NOT EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = 'public'
            AND table_name = 'refunds'
            AND column_name = 'square_refund_id'
        ) THEN
            -- Add square_refund_id column if neither exists
            ALTER TABLE public.refunds
            ADD COLUMN square_refund_id VARCHAR(255) UNIQUE NOT NULL;

            -- Create index
            CREATE INDEX idx_refunds_square_refund ON public.refunds(square_refund_id);

            RAISE NOTICE 'Added square_refund_id column';
        ELSE
            RAISE NOTICE 'square_refund_id column already exists';
        END IF;
    END IF;
END $$;

-- Step 2: Update any existing refund records (if any exist with NULL values after column rename)
-- Make the column NOT NULL if it isn't already
DO $$
BEGIN
    -- Only make NOT NULL if there are no NULL values
    IF NOT EXISTS (
        SELECT 1
        FROM public.refunds
        WHERE square_refund_id IS NULL
    ) THEN
        ALTER TABLE public.refunds
        ALTER COLUMN square_refund_id SET NOT NULL;
    END IF;
END $$;

-- Step 3: Add comment to the table
COMMENT ON COLUMN public.refunds.square_refund_id IS 'Square refund ID from Square payment gateway';

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Migration completed successfully. Refunds table now uses square_refund_id.';
END $$;