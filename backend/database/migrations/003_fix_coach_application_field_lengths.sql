-- Fix field length constraints in coach_applications table
-- These fields need longer VARCHAR lengths to accommodate the actual data

-- Increase phone field length (for international numbers with formatting)
ALTER TABLE public.coach_applications 
ALTER COLUMN phone TYPE VARCHAR(30);

-- Increase coaching_experience_years field length
ALTER TABLE public.coach_applications 
ALTER COLUMN coaching_experience_years TYPE VARCHAR(50);

-- Increase weekly_hours_available field length  
ALTER TABLE public.coach_applications 
ALTER COLUMN weekly_hours_available TYPE VARCHAR(50);

-- Increase preferred_session_length field length
ALTER TABLE public.coach_applications 
ALTER COLUMN preferred_session_length TYPE VARCHAR(50);

-- Increase internet_connection_quality field length
ALTER TABLE public.coach_applications 
ALTER COLUMN internet_connection_quality TYPE VARCHAR(50);

-- Increase educational_background field length
ALTER TABLE public.coach_applications 
ALTER COLUMN educational_background TYPE VARCHAR(100);

-- Increase act_training_level field length
ALTER TABLE public.coach_applications 
ALTER COLUMN act_training_level TYPE VARCHAR(100);

-- Increase session_structure field length
ALTER TABLE public.coach_applications 
ALTER COLUMN session_structure TYPE VARCHAR(100);

-- Increase boundary_maintenance_approach field length
ALTER TABLE public.coach_applications 
ALTER COLUMN boundary_maintenance_approach TYPE VARCHAR(200);

-- Increase comfortable_with_suicidal_thoughts field length
ALTER TABLE public.coach_applications 
ALTER COLUMN comfortable_with_suicidal_thoughts TYPE VARCHAR(100);

-- Increase video_conferencing_comfort field length
ALTER TABLE public.coach_applications 
ALTER COLUMN video_conferencing_comfort TYPE VARCHAR(100);

-- Add password field for coach account creation
ALTER TABLE public.coach_applications 
ADD COLUMN password_hash VARCHAR(255);

-- Add user_id field to coaches table for linking to Supabase Auth
ALTER TABLE public.coaches 
ADD COLUMN user_id UUID UNIQUE;

-- Add index for user_id lookups
CREATE INDEX IF NOT EXISTS idx_coaches_user_id ON public.coaches (user_id);

-- Add comprehensive coach information fields from applications
ALTER TABLE public.coaches 
ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255),
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'suspended', 'active', 'inactive')),
ADD COLUMN IF NOT EXISTS educational_background VARCHAR(100),
ADD COLUMN IF NOT EXISTS professional_certifications TEXT[],
ADD COLUMN IF NOT EXISTS age_groups_comfortable TEXT[],
ADD COLUMN IF NOT EXISTS act_training_level VARCHAR(100),
ADD COLUMN IF NOT EXISTS coaching_techniques TEXT[],
ADD COLUMN IF NOT EXISTS session_structure VARCHAR(100),
ADD COLUMN IF NOT EXISTS scope_handling_approach TEXT,
ADD COLUMN IF NOT EXISTS boundary_maintenance_approach VARCHAR(200),
ADD COLUMN IF NOT EXISTS comfortable_with_suicidal_thoughts VARCHAR(100),
ADD COLUMN IF NOT EXISTS self_harm_protocol TEXT,
ADD COLUMN IF NOT EXISTS weekly_hours_available VARCHAR(50),
ADD COLUMN IF NOT EXISTS preferred_session_length VARCHAR(50),
ADD COLUMN IF NOT EXISTS availability_times TEXT[],
ADD COLUMN IF NOT EXISTS video_conferencing_comfort VARCHAR(100),
ADD COLUMN IF NOT EXISTS internet_connection_quality VARCHAR(50),
ADD COLUMN IF NOT EXISTS application_id UUID,
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS verification_status VARCHAR(20) DEFAULT 'verified';

-- Add foreign key constraint for application_id
ALTER TABLE public.coaches 
ADD CONSTRAINT fk_coaches_application 
FOREIGN KEY (application_id) REFERENCES public.coach_applications(id) ON DELETE SET NULL;

-- Add indexes for new fields
CREATE INDEX IF NOT EXISTS idx_coaches_application_id ON public.coaches (application_id);
CREATE INDEX IF NOT EXISTS idx_coaches_verification_status ON public.coaches (verification_status);

-- Update existing status constraint to include 'inactive' if constraint already exists
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.check_constraints 
    WHERE constraint_name = 'coaches_status_check' 
    AND table_name = 'coaches'
  ) THEN
    ALTER TABLE public.coaches DROP CONSTRAINT coaches_status_check;
    ALTER TABLE public.coaches ADD CONSTRAINT coaches_status_check 
    CHECK (status IN ('pending', 'approved', 'rejected', 'suspended', 'active', 'inactive'));
  END IF;
END $$;

-- Add status column to clients table if needed for user management
ALTER TABLE public.clients 
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('pending', 'approved', 'rejected', 'suspended', 'active', 'inactive'));

-- Update existing clients status constraint to include 'inactive' if constraint already exists
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.check_constraints 
    WHERE constraint_name = 'clients_status_check' 
    AND table_name = 'clients'
  ) THEN
    ALTER TABLE public.clients DROP CONSTRAINT clients_status_check;
    ALTER TABLE public.clients ADD CONSTRAINT clients_status_check 
    CHECK (status IN ('pending', 'approved', 'rejected', 'suspended', 'active', 'inactive'));
  END IF;
END $$;