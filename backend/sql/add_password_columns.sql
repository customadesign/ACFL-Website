-- Add password_hash columns to clients and coaches tables
-- Run this SQL in your Supabase SQL editor

-- Add password_hash column to clients table
ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS password_hash TEXT;

-- Add password_hash column to coaches table  
ALTER TABLE coaches 
ADD COLUMN IF NOT EXISTS password_hash TEXT;

-- Create indexes for better performance (optional but recommended)
CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email);
CREATE INDEX IF NOT EXISTS idx_coaches_email ON coaches(email);

-- Add comments for documentation
COMMENT ON COLUMN clients.password_hash IS 'Bcrypt hashed password for client authentication';
COMMENT ON COLUMN coaches.password_hash IS 'Bcrypt hashed password for coach authentication';

-- Verify the changes
SELECT 
    table_name, 
    column_name, 
    data_type, 
    is_nullable 
FROM information_schema.columns 
WHERE table_name IN ('clients', 'coaches') 
    AND column_name = 'password_hash';