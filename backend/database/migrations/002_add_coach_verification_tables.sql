-- =========================================================
-- COACH VERIFICATION & ONBOARDING SYSTEM
-- =========================================================

-- Coach Applications table for storing verification questionnaire responses
CREATE TABLE IF NOT EXISTS public.coach_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  
  -- Application Status
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'approved', 'rejected', 'suspended')),
  submitted_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID, -- References admin who reviewed
  rejection_reason TEXT,
  
  -- Professional Background (Section 1)
  educational_background VARCHAR(50),
  coaching_experience_years VARCHAR(20),
  professional_certifications TEXT[], -- Array of certifications
  
  -- Specialization & Expertise (Section 2)
  coaching_expertise TEXT[], -- Array of expertise areas (max 5)
  age_groups_comfortable TEXT[], -- Array of age groups
  act_training_level VARCHAR(50),
  
  -- Approach & Methodology (Section 3)
  coaching_philosophy TEXT, -- 100 words max
  coaching_techniques TEXT[], -- Array of techniques used
  session_structure VARCHAR(50),
  
  -- Professional Boundaries & Ethics (Section 4)
  scope_handling_approach TEXT, -- 200 words max
  professional_discipline_history BOOLEAN DEFAULT false,
  discipline_explanation TEXT,
  boundary_maintenance_approach VARCHAR(100),
  
  -- Crisis Management (Section 5)
  comfortable_with_suicidal_thoughts VARCHAR(50),
  self_harm_protocol TEXT, -- 200 words max
  
  -- Availability & Commitment (Section 6)
  weekly_hours_available VARCHAR(20),
  preferred_session_length VARCHAR(20),
  availability_times TEXT[], -- Array of time slots
  
  -- Technology & Communication (Section 7)
  video_conferencing_comfort VARCHAR(50),
  internet_connection_quality VARCHAR(20),
  
  -- Languages & Cultural Competency (Section 8)
  languages_fluent TEXT[], -- Array of languages
  
  -- Professional References
  references JSONB DEFAULT '[]'::jsonb, -- Array of reference objects
  
  -- Agreement Statements
  agreements_accepted JSONB DEFAULT '{}'::jsonb, -- Object tracking which agreements were accepted
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Coach Application Documents table for file uploads
CREATE TABLE IF NOT EXISTS public.coach_application_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES public.coach_applications(id) ON DELETE CASCADE,
  document_type VARCHAR(50) NOT NULL, -- 'certification', 'resume', 'license', etc.
  file_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  file_size BIGINT,
  mime_type VARCHAR(100),
  uploaded_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Coach Application Review History for audit trail
CREATE TABLE IF NOT EXISTS public.coach_application_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES public.coach_applications(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL, -- Admin who made the review
  action VARCHAR(20) NOT NULL, -- 'submitted', 'under_review', 'approved', 'rejected', 'suspended'
  previous_status VARCHAR(20),
  new_status VARCHAR(20) NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Coach Verification Email Templates
CREATE TABLE IF NOT EXISTS public.coach_verification_email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_type VARCHAR(50) NOT NULL UNIQUE, -- 'application_received', 'approved', 'rejected', 'follow_up'
  subject VARCHAR(255) NOT NULL,
  html_content TEXT NOT NULL,
  text_content TEXT NOT NULL,
  variables JSONB DEFAULT '{}'::jsonb, -- Available template variables
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Add status column to existing coaches table if it doesn't exist
DO $do$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='coaches' AND column_name='status'
  ) THEN
    ALTER TABLE public.coaches
      ADD COLUMN status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'suspended'));
  END IF;
END
$do$;

-- Add application_id reference to coaches table
DO $do$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='coaches' AND column_name='application_id'
  ) THEN
    ALTER TABLE public.coaches
      ADD COLUMN application_id UUID REFERENCES public.coach_applications(id) ON DELETE SET NULL;
  END IF;
END
$do$;

-- Add approved_at and rejected_at timestamps to coaches table
DO $do$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='coaches' AND column_name='approved_at'
  ) THEN
    ALTER TABLE public.coaches
      ADD COLUMN approved_at TIMESTAMPTZ,
      ADD COLUMN rejected_at TIMESTAMPTZ,
      ADD COLUMN status_reason TEXT;
  END IF;
END
$do$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_coach_applications_status ON public.coach_applications(status);
CREATE INDEX IF NOT EXISTS idx_coach_applications_email ON public.coach_applications(email);
CREATE INDEX IF NOT EXISTS idx_coach_applications_submitted_at ON public.coach_applications(submitted_at);
CREATE INDEX IF NOT EXISTS idx_coach_application_documents_application_id ON public.coach_application_documents(application_id);
CREATE INDEX IF NOT EXISTS idx_coach_application_reviews_application_id ON public.coach_application_reviews(application_id);
CREATE INDEX IF NOT EXISTS idx_coach_application_reviews_reviewer_id ON public.coach_application_reviews(reviewer_id);

-- Add triggers for updated_at
DROP TRIGGER IF EXISTS set_timestamp_coach_applications ON public.coach_applications;
CREATE TRIGGER set_timestamp_coach_applications
  BEFORE UPDATE ON public.coach_applications
  FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();

DROP TRIGGER IF EXISTS set_timestamp_coach_verification_email_templates ON public.coach_verification_email_templates;
CREATE TRIGGER set_timestamp_coach_verification_email_templates
  BEFORE UPDATE ON public.coach_verification_email_templates
  FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();

-- Disable RLS for all new tables
ALTER TABLE public.coach_applications DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.coach_application_documents DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.coach_application_reviews DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.coach_verification_email_templates DISABLE ROW LEVEL SECURITY;

-- Insert default email templates
INSERT INTO public.coach_verification_email_templates (template_type, subject, html_content, text_content, variables) VALUES
(
  'application_received',
  'Application Received - ACT Coaching For Life',
  '<h2>Thank you for your application!</h2><p>Dear {{first_name}},</p><p>We have received your coach application and it is currently under review. Our team will review your qualifications and get back to you within 3-5 business days.</p><p>Application ID: {{application_id}}</p><p>Best regards,<br>ACT Coaching For Life Team</p>',
  'Thank you for your application!\n\nDear {{first_name}},\n\nWe have received your coach application and it is currently under review. Our team will review your qualifications and get back to you within 3-5 business days.\n\nApplication ID: {{application_id}}\n\nBest regards,\nACT Coaching For Life Team',
  '{"first_name": "Applicant first name", "application_id": "Application ID"}'::jsonb
),
(
  'approved',
  'Congratulations! Your Coach Application Has Been Approved',
  '<h2>Welcome to ACT Coaching For Life!</h2><p>Dear {{first_name}},</p><p>Congratulations! Your coach application has been approved. You can now log in to your coach dashboard and start helping clients.</p><p><strong>Next Steps:</strong></p><ul><li>Complete your coach profile</li><li>Set your availability</li><li>Review platform guidelines</li></ul><p><a href="{{login_url}}">Login to your dashboard</a></p><p>Welcome to the team!<br>ACT Coaching For Life Team</p>',
  'Welcome to ACT Coaching For Life!\n\nDear {{first_name}},\n\nCongratulations! Your coach application has been approved. You can now log in to your coach dashboard and start helping clients.\n\nNext Steps:\n- Complete your coach profile\n- Set your availability\n- Review platform guidelines\n\nLogin URL: {{login_url}}\n\nWelcome to the team!\nACT Coaching For Life Team',
  '{"first_name": "Applicant first name", "login_url": "Login URL"}'::jsonb
),
(
  'rejected',
  'Update on Your Coach Application',
  '<h2>Thank you for your interest</h2><p>Dear {{first_name}},</p><p>Thank you for your interest in becoming a coach with ACT Coaching For Life. After careful review, we have decided not to move forward with your application at this time.</p><p>{{rejection_reason}}</p><p>You may reapply after {{reapply_timeline}}. If you have questions, please contact support@actcoachingforlife.com.</p><p>Best regards,<br>ACT Coaching For Life Team</p>',
  'Thank you for your interest\n\nDear {{first_name}},\n\nThank you for your interest in becoming a coach with ACT Coaching For Life. After careful review, we have decided not to move forward with your application at this time.\n\n{{rejection_reason}}\n\nYou may reapply after {{reapply_timeline}}. If you have questions, please contact support@actcoachingforlife.com.\n\nBest regards,\nACT Coaching For Life Team',
  '{"first_name": "Applicant first name", "rejection_reason": "Reason for rejection", "reapply_timeline": "When they can reapply"}'::jsonb
),
(
  'follow_up',
  'Complete Your Coach Application - ACT Coaching For Life',
  '<h2>Complete Your Application</h2><p>Dear {{first_name}},</p><p>We noticed you started a coach application but haven''t completed it yet. We''d love to have you join our team of professional coaches.</p><p>Your application expires in {{days_remaining}} days. Please complete it soon to avoid having to restart.</p><p><a href="{{application_url}}">Complete your application</a></p><p>If you have questions, please contact support@actcoachingforlife.com.</p><p>Best regards,<br>ACT Coaching For Life Team</p>',
  'Complete Your Application\n\nDear {{first_name}},\n\nWe noticed you started a coach application but haven''t completed it yet. We''d love to have you join our team of professional coaches.\n\nYour application expires in {{days_remaining}} days. Please complete it soon to avoid having to restart.\n\nApplication URL: {{application_url}}\n\nIf you have questions, please contact support@actcoachingforlife.com.\n\nBest regards,\nACT Coaching For Life Team',
  '{"first_name": "Applicant first name", "days_remaining": "Days until expiration", "application_url": "Application URL"}'::jsonb
);