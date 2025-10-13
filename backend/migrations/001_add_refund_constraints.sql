-- Migration: Add Foreign Key Constraint with CASCADE behavior
-- This ensures refunds table has proper referential integrity with payments table
-- When a payment is deleted, associated refunds will be automatically deleted

-- First, check if the foreign key already exists and drop it if needed
-- (Supabase may have auto-created a basic FK)
DO $$
BEGIN
    -- Drop existing foreign key if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'refunds_payment_id_fkey'
        AND table_name = 'refunds'
    ) THEN
        ALTER TABLE refunds DROP CONSTRAINT refunds_payment_id_fkey;
    END IF;
END $$;

-- Add foreign key with CASCADE delete
-- When a payment is deleted, all associated refunds will be automatically deleted
ALTER TABLE refunds
ADD CONSTRAINT refunds_payment_id_fkey
FOREIGN KEY (payment_id)
REFERENCES payments(id)
ON DELETE CASCADE;

-- Add index on payment_id for better query performance
CREATE INDEX IF NOT EXISTS idx_refunds_payment_id ON refunds(payment_id);

-- Comment explaining the constraint
COMMENT ON CONSTRAINT refunds_payment_id_fkey ON refunds IS
'Cascade delete: When a payment is deleted, all associated refunds are automatically deleted';
