-- Create clients table if it doesn't exist
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone TEXT,
  dob DATE,
  location_state TEXT,
  gender_identity TEXT,
  ethnic_identity TEXT,
  religious_background TEXT,
  preferred_language TEXT,
  areas_of_concern TEXT[] DEFAULT '{}'::TEXT[],
  availability TEXT[] DEFAULT '{}'::TEXT[],
  preferred_coach_gender TEXT,
  bio TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_state_len CHECK (location_state IS NULL OR char_length(location_state) BETWEEN 2 AND 32)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_clients_last_first ON clients (last_name, first_name);
CREATE INDEX IF NOT EXISTS idx_clients_areas_gin ON clients USING GIN (areas_of_concern);
CREATE INDEX IF NOT EXISTS idx_clients_availability_gin ON clients USING GIN (availability);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER IF NOT EXISTS set_timestamp_clients
  BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

-- Disable RLS on clients table
ALTER TABLE clients DISABLE ROW LEVEL SECURITY;

-- Add comment
COMMENT ON TABLE clients IS 'Clients table for user profiles'; 