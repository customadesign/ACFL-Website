-- Add foreign key constraint from payouts to coaches table
-- This allows Supabase to automatically join coach information when querying payouts

-- First, add the foreign key constraint
ALTER TABLE payouts
ADD CONSTRAINT fk_payouts_coach
FOREIGN KEY (coach_id)
REFERENCES coaches(id)
ON DELETE CASCADE;

-- Add index for faster queries on coach_id
CREATE INDEX IF NOT EXISTS idx_payouts_coach_id ON payouts(coach_id);

-- Verify the constraint was created
SELECT
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name = 'payouts';
