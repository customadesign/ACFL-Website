-- =========================================================
-- SIMPLE Migration: Fix available_durations column step by step
-- Run these commands one by one in your Supabase SQL Editor
-- =========================================================

-- Step 1: Check current data types and sample data
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'coach_availability_slots' 
  AND column_name = 'available_durations';

-- Step 2: See what data we're working with
SELECT id, available_durations, pg_typeof(available_durations) as current_type 
FROM coach_availability_slots 
LIMIT 5;

-- Step 3: Clean up all invalid data first (BEFORE adding constraints)
UPDATE coach_availability_slots 
SET available_durations = '[60]'
WHERE available_durations IS NULL;

-- Step 4: Handle empty strings and empty arrays
UPDATE coach_availability_slots 
SET available_durations = '[60]'
WHERE available_durations::text = '' 
   OR available_durations::text = '[]';

-- Step 5: Convert single numbers to arrays
UPDATE coach_availability_slots 
SET available_durations = ('[' || available_durations::text || ']')
WHERE available_durations::text ~ '^[0-9]+$';

-- Step 6: Fix any stringified JSON arrays
UPDATE coach_availability_slots 
SET available_durations = available_durations::text::jsonb
WHERE available_durations::text ~ '^\[.*\]$' 
  AND jsonb_typeof(available_durations::text::jsonb) = 'array';

-- Step 7: Fallback - set any remaining invalid data to default
UPDATE coach_availability_slots 
SET available_durations = '[60]'::jsonb
WHERE jsonb_typeof(available_durations) != 'array';

-- Step 8: Verify all data is now valid arrays
SELECT 
    COUNT(*) as total_rows,
    COUNT(CASE WHEN jsonb_typeof(available_durations) = 'array' THEN 1 END) as valid_arrays,
    COUNT(CASE WHEN jsonb_array_length(available_durations) > 0 THEN 1 END) as non_empty_arrays
FROM coach_availability_slots;

-- Step 9: Only add constraint after data is clean
ALTER TABLE coach_availability_slots 
DROP CONSTRAINT IF EXISTS chk_available_durations_array;

ALTER TABLE coach_availability_slots 
ADD CONSTRAINT chk_available_durations_array 
CHECK (jsonb_typeof(available_durations) = 'array' AND jsonb_array_length(available_durations) > 0);

-- Step 10: Set proper defaults for future inserts
ALTER TABLE coach_availability_slots 
ALTER COLUMN available_durations SET DEFAULT '[60]'::jsonb;

-- Step 11: Final verification
SELECT 'Migration completed successfully!' as status;
SELECT id, available_durations FROM coach_availability_slots LIMIT 3;