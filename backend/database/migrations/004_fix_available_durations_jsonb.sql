-- =========================================================
-- Migration: Fix available_durations column to proper JSONB
-- This migration ensures the available_durations column is stored as JSONB
-- and converts any existing text/varchar data to proper JSONB format
-- =========================================================

-- First, check if we need to alter the column type
DO $$
DECLARE
    col_type text;
BEGIN
    SELECT data_type INTO col_type
    FROM information_schema.columns 
    WHERE table_name = 'coach_availability_slots' 
      AND column_name = 'available_durations';
    
    -- If column exists but is not JSONB, we need to convert it
    IF col_type IS NOT NULL AND col_type != 'jsonb' THEN
        RAISE NOTICE 'Converting available_durations column from % to jsonb', col_type;
        
        -- First, set all NULL or empty values to default
        UPDATE coach_availability_slots 
        SET available_durations = '[60]'
        WHERE available_durations IS NULL 
           OR available_durations::text = '' 
           OR available_durations::text = '[]';
        
        -- Then handle text values that look like numbers
        UPDATE coach_availability_slots 
        SET available_durations = ('[' || available_durations::text || ']')
        WHERE available_durations::text ~ '^[0-9]+$';
        
        -- Finally, try to convert any remaining text to JSONB, fallback to default
        UPDATE coach_availability_slots 
        SET available_durations = COALESCE(
            CASE 
                WHEN available_durations::text ~ '^\[.*\]$' THEN 
                    available_durations::text::jsonb
                ELSE NULL 
            END, 
            '[60]'::jsonb
        )
        WHERE available_durations IS NOT NULL;
        
        -- Alter column type to JSONB if it's not already
        ALTER TABLE coach_availability_slots 
        ALTER COLUMN available_durations TYPE jsonb USING available_durations::jsonb;
        
    END IF;
END $$;

-- Ensure the column has a default value
ALTER TABLE coach_availability_slots 
ALTER COLUMN available_durations SET DEFAULT '[60]'::jsonb;

-- Update any NULL values to default
UPDATE coach_availability_slots 
SET available_durations = '[60]'::jsonb 
WHERE available_durations IS NULL;

-- Clean up any invalid data before adding constraints
UPDATE coach_availability_slots 
SET available_durations = '[60]'::jsonb 
WHERE available_durations IS NULL 
   OR available_durations::text = '' 
   OR available_durations::text = '[]' 
   OR jsonb_typeof(available_durations) != 'array';

-- Add a constraint to ensure it's always a valid JSON array
ALTER TABLE coach_availability_slots 
DROP CONSTRAINT IF EXISTS chk_available_durations_array;

ALTER TABLE coach_availability_slots 
ADD CONSTRAINT chk_available_durations_array 
CHECK (jsonb_typeof(available_durations) = 'array' AND jsonb_array_length(available_durations) > 0);

-- Verify the data
DO $$
DECLARE
    invalid_count integer;
BEGIN
    -- Check for any invalid data
    SELECT COUNT(*) INTO invalid_count
    FROM coach_availability_slots 
    WHERE jsonb_typeof(available_durations) != 'array';
    
    IF invalid_count > 0 THEN
        RAISE WARNING 'Found % rows with invalid available_durations format', invalid_count;
        
        -- Fix any remaining invalid data
        UPDATE coach_availability_slots 
        SET available_durations = '[60]'::jsonb 
        WHERE jsonb_typeof(available_durations) != 'array';
        
        RAISE NOTICE 'Fixed % rows with invalid available_durations format', invalid_count;
    END IF;
    
    RAISE NOTICE 'Migration completed successfully. All available_durations are now proper JSONB arrays.';
END $$;