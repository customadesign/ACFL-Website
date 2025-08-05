-- This migration aligns the database schema with the authController.ts implementation

-- First, ensure the tables exist as expected by authController.ts
-- The controller expects: users, clients, coaches tables

-- If you already have the tables from schema.sql, you can skip this file
-- Otherwise, run this in your Supabase SQL editor

-- The existing schema.sql should work fine with the authController
-- Just make sure you've run it in your Supabase project

-- To apply this schema to Supabase:
-- 1. Go to your Supabase dashboard
-- 2. Navigate to the SQL Editor
-- 3. Copy and paste the contents of schema.sql
-- 4. Click "Run" to execute

-- Note: The authController.ts is already set up to work with:
-- - users table (id, email, password, role, created_at, updated_at)
-- - clients table (id, user_id, first_name, last_name, phone, date_of_birth, preferences, created_at, updated_at)
-- - coaches table (id, user_id, first_name, last_name, phone, specialties, languages, bio, qualifications, experience, hourly_rate, is_available, rating, total_sessions, created_at, updated_at)