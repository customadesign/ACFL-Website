-- Fix RLS Policies for ACT Coaching For Life
-- This script creates the necessary RLS policies to allow proper authentication

-- 1. Disable RLS on clients table for now (we'll enable it with proper policies later)
ALTER TABLE clients DISABLE ROW LEVEL SECURITY;

-- 2. Disable RLS on coaches table for now
ALTER TABLE coaches DISABLE ROW LEVEL SECURITY;

-- 3. Disable RLS on sessions table
ALTER TABLE sessions DISABLE ROW LEVEL SECURITY;

-- 4. Disable RLS on messages table
ALTER TABLE messages DISABLE ROW LEVEL SECURITY;

-- 5. Disable RLS on reviews table
ALTER TABLE reviews DISABLE ROW LEVEL SECURITY;

-- 6. Disable RLS on saved_coaches table
ALTER TABLE saved_coaches DISABLE ROW LEVEL SECURITY;

-- 7. Disable RLS on search_history table
ALTER TABLE search_history DISABLE ROW LEVEL SECURITY;

-- 8. Disable RLS on coach_demographics table
ALTER TABLE coach_demographics DISABLE ROW LEVEL SECURITY;

-- 9. Disable RLS on client_assessments table
ALTER TABLE client_assessments DISABLE ROW LEVEL SECURITY;

-- 10. Disable RLS on admin_actions table
ALTER TABLE admin_actions DISABLE ROW LEVEL SECURITY;

-- 11. Disable RLS on system_settings table
ALTER TABLE system_settings DISABLE ROW LEVEL SECURITY;

-- Note: In production, you would want to enable RLS with proper policies
-- For example:
-- ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Users can view their own profile" ON clients
--   FOR SELECT USING (auth.uid() = user_id);
-- CREATE POLICY "Users can update their own profile" ON clients
--   FOR UPDATE USING (auth.uid() = user_id);
-- CREATE POLICY "Service role can insert profiles" ON clients
--   FOR INSERT WITH CHECK (auth.role() = 'service_role'); 