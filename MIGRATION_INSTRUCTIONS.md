# Database Migration Instructions

## IMPORTANT: Run this SQL in your Supabase SQL Editor

The following SQL migration must be executed in your Supabase dashboard to complete the coach application system:

```sql
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
ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);

-- Add user_id field to coaches table for linking to Supabase Auth
ALTER TABLE public.coaches 
ADD COLUMN IF NOT EXISTS user_id UUID UNIQUE;

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
ADD CONSTRAINT IF NOT EXISTS fk_coaches_application 
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
```

## Steps to Apply Migration:

1. **Login to Supabase Dashboard**: Go to https://supabase.com/dashboard
2. **Select Your Project**: Choose your ACT Coaching For Life project
3. **Navigate to SQL Editor**: Click on "SQL Editor" in the left sidebar
4. **Create New Query**: Click "New Query"
5. **Copy and Paste**: Copy the entire SQL block above and paste it into the editor
6. **Execute**: Click "Run" to execute the migration
7. **Verify**: Check that all columns were added successfully

## After Migration:

- Test coach application submission with passwords
- Test admin approval flow creating complete coach profiles
- Verify all application data transfers to coach profiles
- Check that auth users are created properly

## Fields Added to Coaches Table:

The migration adds these comprehensive fields from coach applications:

### Professional Background
- `educational_background` - Education level/background
- `professional_certifications` - Array of certifications
- `age_groups_comfortable` - Age groups they work with

### Expertise & Approach  
- `act_training_level` - ACT therapy training level
- `coaching_techniques` - Array of techniques used
- `session_structure` - Preferred session format
- `scope_handling_approach` - How they handle scope issues
- `boundary_maintenance_approach` - Professional boundary approach

### Crisis Management
- `comfortable_with_suicidal_thoughts` - Comfort level with crisis situations
- `self_harm_protocol` - Their self-harm handling protocol

### Availability & Technology
- `weekly_hours_available` - Hours available per week
- `preferred_session_length` - Preferred session duration
- `availability_times` - Array of available time slots
- `video_conferencing_comfort` - Tech comfort level
- `internet_connection_quality` - Connection quality rating

### System Fields
- `password_hash` - Hashed password for login
- `status` - Coach status (pending, approved, rejected, suspended, active, inactive)
- `user_id` - Links to Supabase Auth user
- `application_id` - Links to original application
- `approved_at` - Approval timestamp
- `verification_status` - Verification status

This ensures complete data transfer from coach applications to coach profiles!