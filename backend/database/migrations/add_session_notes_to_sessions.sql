-- Add session_notes column to sessions table
ALTER TABLE sessions 
ADD COLUMN IF NOT EXISTS session_notes JSONB DEFAULT '{}';

-- The JSONB column will store:
-- {
--   "notes": "text content of the session notes",
--   "goals_met": ["goal1", "goal2", ...],
--   "next_steps": "text for next steps",
--   "updated_at": "timestamp"
-- }

-- Add an index for better query performance
CREATE INDEX IF NOT EXISTS idx_sessions_session_notes ON sessions USING GIN (session_notes);

-- Comment on the column for documentation
COMMENT ON COLUMN sessions.session_notes IS 'JSON object containing session notes, goals met, and next steps';