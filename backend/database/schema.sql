-- ACT Coaching For Life - Complete Database Schema
-- This script creates all tables, indexes, triggers, and security policies

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- 1. CORE AUTHENTICATION & USER MANAGEMENT
-- =============================================================================

-- Users table (core authentication)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('client', 'coach', 'admin')),
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  is_active BOOLEAN DEFAULT true,
  email_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- 2. CLIENT PROFILES & PREFERENCES
-- =============================================================================

-- Clients table
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  date_of_birth DATE,
  emergency_contact_name VARCHAR(200),
  emergency_contact_phone VARCHAR(20),
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id)
);

-- Client assessments (detailed matching preferences)
CREATE TABLE client_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  areas_of_concern TEXT[] NOT NULL, -- ['anxiety', 'depression', 'work-stress']
  treatment_modalities TEXT[], -- ['cbt', 'act', 'dbt']
  location VARCHAR(10) NOT NULL, -- State code
  gender_identity VARCHAR(50) NOT NULL,
  gender_identity_other VARCHAR(100),
  ethnic_identity VARCHAR(50) NOT NULL,
  ethnic_identity_other VARCHAR(100),
  religious_background VARCHAR(50) NOT NULL,
  religious_background_other VARCHAR(100),
  preferred_therapist_gender VARCHAR(50) NOT NULL,
  preferred_therapist_gender_other VARCHAR(100),
  preferred_therapist_ethnicity VARCHAR(50) NOT NULL,
  preferred_therapist_ethnicity_other VARCHAR(100),
  preferred_therapist_religion VARCHAR(50) NOT NULL,
  preferred_therapist_religion_other VARCHAR(100),
  payment_method VARCHAR(50) NOT NULL,
  availability TEXT[] NOT NULL, -- ['weekday-mornings', 'weekends']
  language VARCHAR(50) NOT NULL,
  language_other VARCHAR(100),
  is_current BOOLEAN DEFAULT true, -- latest assessment
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- 3. COACH PROFILES & CAPABILITIES
-- =============================================================================

-- Coaches table
CREATE TABLE coaches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  bio TEXT,
  specialties TEXT[] NOT NULL, -- ['Anxiety', 'Depression', 'PTSD']
  languages TEXT[] NOT NULL, -- ['English', 'Spanish']
  qualifications TEXT[], -- ['Licensed Clinical Psychologist', 'Certified ACT Coach']
  experience INTEGER, -- years of experience
  hourly_rate DECIMAL(10, 2),
  session_rate DECIMAL(10, 2), -- per session rate
  is_available BOOLEAN DEFAULT true,
  is_verified BOOLEAN DEFAULT false, -- for admin approval
  accepts_new_clients BOOLEAN DEFAULT true,
  rating DECIMAL(3, 2) DEFAULT 0,
  total_sessions INTEGER DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,
  profile_image_url VARCHAR(500),
  video_intro_url VARCHAR(500),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id)
);

-- Coach demographics (for detailed matching)
CREATE TABLE coach_demographics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID NOT NULL REFERENCES coaches(id) ON DELETE CASCADE,
  gender VARCHAR(50),
  ethnicity VARCHAR(100),
  religion VARCHAR(50),
  sexual_orientation VARCHAR(50),
  available_times TEXT[], -- ['weekday-mornings', 'weekends']
  location_states TEXT[], -- ['CA', 'NY']
  video_available BOOLEAN DEFAULT true,
  in_person_available BOOLEAN DEFAULT false,
  phone_available BOOLEAN DEFAULT true,
  insurance_accepted TEXT[], -- ['Blue Cross Blue Shield', 'Aetna']
  min_age INTEGER DEFAULT 18,
  max_age INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(coach_id)
);

-- =============================================================================
-- 4. APPOINTMENTS/SESSIONS SYSTEM
-- =============================================================================

-- Sessions table (appointments)
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  coach_id UUID NOT NULL REFERENCES coaches(id) ON DELETE CASCADE,
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  duration INTEGER NOT NULL DEFAULT 60, -- in minutes
  status VARCHAR(20) NOT NULL DEFAULT 'scheduled' 
    CHECK (status IN ('scheduled', 'confirmed', 'completed', 'cancelled', 'no-show', 'rescheduled')),
  session_type VARCHAR(20) DEFAULT 'video' CHECK (session_type IN ('video', 'phone', 'in-person')),
  meeting_link VARCHAR(500), -- Video meeting URL
  video_meeting_id VARCHAR(100), -- Video meeting ID
  session_focus TEXT, -- what client wants to work on
  client_notes TEXT, -- client's pre-session notes
  coach_notes TEXT, -- coach's post-session notes
  homework_assigned TEXT, -- coach's homework/action items
  client_rating INTEGER CHECK (client_rating >= 1 AND client_rating <= 5),
  client_feedback TEXT,
  coach_rating INTEGER CHECK (coach_rating >= 1 AND coach_rating <= 5), -- coach rates client
  amount_charged DECIMAL(10, 2),
  payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded', 'failed')),
  cancellation_reason TEXT,
  cancelled_by VARCHAR(10) CHECK (cancelled_by IN ('client', 'coach', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- 5. SAVED COACHES & FAVORITES
-- =============================================================================

-- Saved coaches table
CREATE TABLE saved_coaches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  coach_id UUID NOT NULL REFERENCES coaches(id) ON DELETE CASCADE,
  saved_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  notes TEXT, -- client's private notes about this coach
  priority INTEGER DEFAULT 1, -- 1=high, 2=medium, 3=low
  UNIQUE(client_id, coach_id)
);

-- =============================================================================
-- 6. SEARCH & MATCHING SYSTEM
-- =============================================================================

-- Search history (for analytics and improvement)
CREATE TABLE search_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  search_criteria JSONB NOT NULL, -- stores the full search form data
  results_count INTEGER NOT NULL,
  selected_coach_id UUID REFERENCES coaches(id) ON DELETE SET NULL,
  session_ip VARCHAR(45), -- for anonymous analytics
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- 7. COMMUNICATION SYSTEM
-- =============================================================================

-- Messages table
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE, -- if related to a session
  subject VARCHAR(200),
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  message_type VARCHAR(20) DEFAULT 'general' 
    CHECK (message_type IN ('general', 'booking', 'cancellation', 'emergency', 'system')),
  priority VARCHAR(10) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- 8. REVIEWS & RATINGS
-- =============================================================================

-- Reviews table (separate from sessions for detailed feedback)
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  coach_id UUID NOT NULL REFERENCES coaches(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  is_public BOOLEAN DEFAULT false, -- client can choose to make review public
  is_verified BOOLEAN DEFAULT false, -- admin verification
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(session_id)
);

-- =============================================================================
-- 9. ADMIN & MANAGEMENT SYSTEM
-- =============================================================================

-- Admin actions table
CREATE TABLE admin_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action_type VARCHAR(50) NOT NULL, -- 'approve_coach', 'suspend_user', etc.
  target_id UUID NOT NULL, -- ID of the affected user/coach/client
  target_type VARCHAR(20) NOT NULL CHECK (target_type IN ('user', 'coach', 'client', 'session', 'review')),
  details JSONB, -- additional action details
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- System settings table
CREATE TABLE system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key VARCHAR(100) UNIQUE NOT NULL,
  setting_value TEXT NOT NULL,
  description TEXT,
  updated_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- 10. PERFORMANCE INDEXES
-- =============================================================================

-- Core performance indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_active ON users(is_active);

CREATE INDEX idx_clients_user_id ON clients(user_id);
CREATE INDEX idx_coaches_user_id ON coaches(user_id);
CREATE INDEX idx_coaches_available ON coaches(is_available);
CREATE INDEX idx_coaches_verified ON coaches(is_verified);
CREATE INDEX idx_coaches_accepts_clients ON coaches(accepts_new_clients);
CREATE INDEX idx_coaches_specialties ON coaches USING GIN(specialties);
CREATE INDEX idx_coaches_languages ON coaches USING GIN(languages);
CREATE INDEX idx_coaches_rating ON coaches(rating);

-- Session-related indexes
CREATE INDEX idx_sessions_client_id ON sessions(client_id);
CREATE INDEX idx_sessions_coach_id ON sessions(coach_id);
CREATE INDEX idx_sessions_scheduled_at ON sessions(scheduled_at);
CREATE INDEX idx_sessions_status ON sessions(status);
CREATE INDEX idx_sessions_client_status ON sessions(client_id, status);
CREATE INDEX idx_sessions_coach_status ON sessions(coach_id, status);
CREATE INDEX idx_sessions_payment_status ON sessions(payment_status);

-- Assessment and matching indexes
CREATE INDEX idx_client_assessments_client_id ON client_assessments(client_id);
CREATE INDEX idx_client_assessments_current ON client_assessments(client_id, is_current);
CREATE INDEX idx_client_assessments_location ON client_assessments(location);
CREATE INDEX idx_client_assessments_concerns ON client_assessments USING GIN(areas_of_concern);
CREATE INDEX idx_coach_demographics_coach_id ON coach_demographics(coach_id);
CREATE INDEX idx_coach_demographics_location ON coach_demographics USING GIN(location_states);

-- Communication indexes
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_receiver_id ON messages(receiver_id);
CREATE INDEX idx_messages_session_id ON messages(session_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);
CREATE INDEX idx_messages_unread ON messages(receiver_id, is_read);

-- Other indexes
CREATE INDEX idx_saved_coaches_client_id ON saved_coaches(client_id);
CREATE INDEX idx_saved_coaches_coach_id ON saved_coaches(coach_id);
CREATE INDEX idx_reviews_coach_id ON reviews(coach_id);
CREATE INDEX idx_reviews_public ON reviews(is_public);
CREATE INDEX idx_search_history_client_id ON search_history(client_id);
CREATE INDEX idx_search_history_created_at ON search_history(created_at);

-- =============================================================================
-- 11. TRIGGERS FOR AUTOMATED UPDATES
-- =============================================================================

-- Function to update updated_at timestamps
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
CREATE TRIGGER set_timestamp_users
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

CREATE TRIGGER set_timestamp_clients
  BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

CREATE TRIGGER set_timestamp_coaches
  BEFORE UPDATE ON coaches
  FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

CREATE TRIGGER set_timestamp_sessions
  BEFORE UPDATE ON sessions
  FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

CREATE TRIGGER set_timestamp_client_assessments
  BEFORE UPDATE ON client_assessments
  FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

CREATE TRIGGER set_timestamp_coach_demographics
  BEFORE UPDATE ON coach_demographics
  FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

CREATE TRIGGER set_timestamp_system_settings
  BEFORE UPDATE ON system_settings
  FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

-- Function to update coach rating when new review is added
CREATE OR REPLACE FUNCTION update_coach_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE coaches 
  SET 
    rating = (
      SELECT ROUND(AVG(rating)::numeric, 2) 
      FROM reviews 
      WHERE coach_id = NEW.coach_id
    ),
    total_reviews = (
      SELECT COUNT(*) 
      FROM reviews 
      WHERE coach_id = NEW.coach_id
    )
  WHERE id = NEW.coach_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_coach_rating_trigger
  AFTER INSERT OR UPDATE ON reviews
  FOR EACH ROW EXECUTE FUNCTION update_coach_rating();

-- Function to update session count when session is completed
CREATE OR REPLACE FUNCTION update_session_count()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    UPDATE coaches 
    SET total_sessions = total_sessions + 1
    WHERE id = NEW.coach_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_session_count_trigger
  AFTER INSERT OR UPDATE ON sessions
  FOR EACH ROW EXECUTE FUNCTION update_session_count();

-- =============================================================================
-- 12. ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE coaches ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_coaches ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE coach_demographics ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- User policies (users can read/update their own data)
CREATE POLICY users_own_data ON users
  FOR ALL USING (auth.uid() = id);

-- Client policies  
CREATE POLICY clients_own_data ON clients
  FOR ALL USING (user_id = auth.uid());

-- Coach policies
CREATE POLICY coaches_own_data ON coaches
  FOR ALL USING (user_id = auth.uid());

-- Everyone can view available and verified coaches
CREATE POLICY coaches_public_view ON coaches
  FOR SELECT USING (is_available = true AND is_verified = true);

-- Coach demographics - coaches can manage their own, others can view public info
CREATE POLICY coach_demographics_own ON coach_demographics
  FOR ALL USING (coach_id IN (SELECT id FROM coaches WHERE user_id = auth.uid()));

CREATE POLICY coach_demographics_public_view ON coach_demographics
  FOR SELECT USING (coach_id IN (SELECT id FROM coaches WHERE is_available = true AND is_verified = true));

-- Session policies - only participants can access
CREATE POLICY sessions_participants_only ON sessions
  FOR ALL USING (
    client_id IN (SELECT id FROM clients WHERE user_id = auth.uid()) OR
    coach_id IN (SELECT id FROM coaches WHERE user_id = auth.uid())
  );

-- Messages policies - only sender and receiver
CREATE POLICY messages_participants_only ON messages
  FOR ALL USING (sender_id = auth.uid() OR receiver_id = auth.uid());

-- Saved coaches policies - only the client who saved them
CREATE POLICY saved_coaches_own_only ON saved_coaches
  FOR ALL USING (client_id IN (SELECT id FROM clients WHERE user_id = auth.uid()));

-- Client assessments - only the client
CREATE POLICY client_assessments_own_only ON client_assessments
  FOR ALL USING (client_id IN (SELECT id FROM clients WHERE user_id = auth.uid()));

-- Reviews policies
CREATE POLICY reviews_own_session ON reviews
  FOR ALL USING (
    client_id IN (SELECT id FROM clients WHERE user_id = auth.uid()) OR
    coach_id IN (SELECT id FROM coaches WHERE user_id = auth.uid())
  );

-- Public reviews can be viewed by anyone
CREATE POLICY reviews_public_view ON reviews
  FOR SELECT USING (is_public = true AND is_verified = true);

-- Search history - only own searches
CREATE POLICY search_history_own_only ON search_history
  FOR ALL USING (client_id IN (SELECT id FROM clients WHERE user_id = auth.uid()));

-- Admin policies - only admins
CREATE POLICY admin_actions_admin_only ON admin_actions
  FOR ALL USING (auth.uid() IN (SELECT id FROM users WHERE role = 'admin'));

CREATE POLICY system_settings_admin_only ON system_settings
  FOR ALL USING (auth.uid() IN (SELECT id FROM users WHERE role = 'admin'));

-- =============================================================================
-- 13. INITIAL DATA
-- =============================================================================

-- Insert default system settings
INSERT INTO system_settings (setting_key, setting_value, description) VALUES
  ('session_default_duration', '60', 'Default session duration in minutes'),
  ('booking_advance_days', '30', 'How many days in advance clients can book'),
  ('cancellation_hours', '24', 'Minimum hours before session to allow cancellation'),
  ('coach_approval_required', 'true', 'Whether new coaches need admin approval'),
  ('client_verification_required', 'false', 'Whether clients need email verification'),
  ('max_sessions_per_day', '8', 'Maximum sessions a coach can have per day'),
  ('platform_fee_percentage', '10', 'Platform fee as percentage of session cost'),
  ('review_moderation_required', 'true', 'Whether reviews need approval before showing');

-- =============================================================================
-- SCHEMA COMPLETE
-- =============================================================================

-- Summary of tables created:
-- 1. users - Core authentication
-- 2. clients - Client profiles  
-- 3. client_assessments - Detailed matching preferences
-- 4. coaches - Coach profiles
-- 5. coach_demographics - Detailed coach matching data
-- 6. sessions - Appointments/sessions
-- 7. saved_coaches - Client's saved coaches
-- 8. search_history - Search analytics
-- 9. messages - Communication system
-- 10. reviews - Session reviews and ratings
-- 11. admin_actions - Administrative actions
-- 12. system_settings - Configurable system settings