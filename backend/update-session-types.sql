-- Update session types to only support video sessions
-- This script removes in-person and phone session options

-- Update sessions table to only allow video session type
ALTER TABLE public.sessions 
DROP CONSTRAINT IF EXISTS sessions_session_type_check;

ALTER TABLE public.sessions 
ADD CONSTRAINT sessions_session_type_check 
CHECK (session_type = 'video');

-- Update existing sessions to video if they're not already
UPDATE public.sessions 
SET session_type = 'video' 
WHERE session_type IN ('phone', 'in-person');

-- Update coach_demographics table to remove in-person and phone availability
-- Since we're using a meta jsonb field, we'll just ensure video_available is true
UPDATE public.coach_demographics 
SET meta = jsonb_set(
  COALESCE(meta, '{}'::jsonb), 
  '{video_available}', 
  'true'::jsonb
)
WHERE meta IS NULL OR NOT (meta ? 'video_available');

-- Remove in-person and phone availability from meta field
UPDATE public.coach_demographics 
SET meta = meta - 'in_person_available' - 'phone_available'
WHERE meta ? 'in_person_available' OR meta ? 'phone_available';

-- Add comment to document the change
COMMENT ON TABLE public.sessions IS 'Sessions table - only video sessions supported';
COMMENT ON COLUMN public.sessions.session_type IS 'Session type - only video sessions allowed'; 