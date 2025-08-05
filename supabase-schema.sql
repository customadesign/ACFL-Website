-- ACT Coaching For Life - Supabase Database Schema
-- Run this SQL in your Supabase SQL Editor to set up the complete database

-- =====================================================
-- CORE TABLES
-- =====================================================

-- Users table (extends Supabase auth.users)
CREATE TABLE users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  user_type TEXT NOT NULL CHECK (user_type IN ('member', 'coach', 'admin')),
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Coach profiles table
CREATE TABLE coach_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  bio TEXT,
  specialties TEXT[],
  years_experience INTEGER,
  education TEXT[],
  certifications TEXT[],
  languages TEXT[],
  hourly_rate DECIMAL(10,2),
  availability JSONB,
  video_url TEXT,
  is_verified BOOLEAN DEFAULT false,
  rating DECIMAL(3,2),
  total_sessions INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Member assessments table
CREATE TABLE member_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  areas_of_concern TEXT[],
  preferred_gender TEXT,
  preferred_language TEXT,
  budget_range TEXT,
  availability_preferences JSONB,
  urgency_level TEXT,
  previous_experience TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Appointments table
CREATE TABLE appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID REFERENCES users(id) ON DELETE CASCADE,
  coach_id UUID REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  appointment_date TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_minutes INTEGER DEFAULT 60,
  session_type TEXT DEFAULT 'video',
  video_meeting_id TEXT,
  video_meeting_url TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Saved coaches table
CREATE TABLE saved_coaches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID REFERENCES users(id) ON DELETE CASCADE,
  coach_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(member_id, coach_id)
);

-- Messages table
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID REFERENCES users(id) ON DELETE CASCADE,
  receiver_id UUID REFERENCES users(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES appointments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Session notes table
CREATE TABLE session_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID REFERENCES appointments(id) ON DELETE CASCADE,
  coach_id UUID REFERENCES users(id) ON DELETE CASCADE,
  notes TEXT,
  goals_met TEXT[],
  next_steps TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Users table indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_user_type ON users(user_type);
CREATE INDEX idx_users_created_at ON users(created_at);

-- Coach profiles indexes
CREATE INDEX idx_coach_profiles_user_id ON coach_profiles(user_id);
CREATE INDEX idx_coach_profiles_is_verified ON coach_profiles(is_verified);
CREATE INDEX idx_coach_profiles_specialties ON coach_profiles USING GIN(specialties);
CREATE INDEX idx_coach_profiles_languages ON coach_profiles USING GIN(languages);

-- Appointments indexes
CREATE INDEX idx_appointments_member_id ON appointments(member_id);
CREATE INDEX idx_appointments_coach_id ON appointments(coach_id);
CREATE INDEX idx_appointments_status ON appointments(status);
CREATE INDEX idx_appointments_date ON appointments(appointment_date);

-- Messages indexes
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_receiver_id ON messages(receiver_id);
CREATE INDEX idx_messages_appointment_id ON messages(appointment_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE coach_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_coaches ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_notes ENABLE ROW LEVEL SECURITY;

-- Users table policies
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all users" ON users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND user_type = 'admin'
    )
  );

CREATE POLICY "Admins can update any user" ON users
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND user_type = 'admin'
    )
  );

-- Coach profiles policies
CREATE POLICY "Anyone can view coach profiles" ON coach_profiles
  FOR SELECT USING (true);

CREATE POLICY "Coaches can update own profile" ON coach_profiles
  FOR UPDATE USING (
    user_id = auth.uid() AND 
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND user_type = 'coach')
  );

CREATE POLICY "Coaches can insert own profile" ON coach_profiles
  FOR INSERT WITH CHECK (
    user_id = auth.uid() AND 
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND user_type = 'coach')
  );

CREATE POLICY "Admins can manage all coach profiles" ON coach_profiles
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND user_type = 'admin')
  );

-- Member assessments policies
CREATE POLICY "Members can view own assessment" ON member_assessments
  FOR SELECT USING (
    user_id = auth.uid() AND 
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND user_type = 'member')
  );

CREATE POLICY "Members can insert own assessment" ON member_assessments
  FOR INSERT WITH CHECK (
    user_id = auth.uid() AND 
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND user_type = 'member')
  );

CREATE POLICY "Admins can view all assessments" ON member_assessments
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND user_type = 'admin')
  );

-- Appointments policies
CREATE POLICY "Members can view own appointments" ON appointments
  FOR SELECT USING (
    member_id = auth.uid() AND 
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND user_type = 'member')
  );

CREATE POLICY "Members can create appointments" ON appointments
  FOR INSERT WITH CHECK (
    member_id = auth.uid() AND 
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND user_type = 'member')
  );

CREATE POLICY "Coaches can view their appointments" ON appointments
  FOR SELECT USING (
    coach_id = auth.uid() AND 
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND user_type = 'coach')
  );

CREATE POLICY "Coaches can update their appointments" ON appointments
  FOR UPDATE USING (
    coach_id = auth.uid() AND 
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND user_type = 'coach')
  );

CREATE POLICY "Admins can view all appointments" ON appointments
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND user_type = 'admin')
  );

CREATE POLICY "Admins can manage all appointments" ON appointments
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND user_type = 'admin')
  );

-- Saved coaches policies
CREATE POLICY "Members can view own saved coaches" ON saved_coaches
  FOR SELECT USING (
    member_id = auth.uid() AND 
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND user_type = 'member')
  );

CREATE POLICY "Members can manage own saved coaches" ON saved_coaches
  FOR ALL USING (
    member_id = auth.uid() AND 
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND user_type = 'member')
  );

-- Messages policies
CREATE POLICY "Users can view messages they sent or received" ON messages
  FOR SELECT USING (
    sender_id = auth.uid() OR receiver_id = auth.uid()
  );

CREATE POLICY "Users can send messages" ON messages
  FOR INSERT WITH CHECK (sender_id = auth.uid());

CREATE POLICY "Users can mark their received messages as read" ON messages
  FOR UPDATE USING (receiver_id = auth.uid());

-- Session notes policies
CREATE POLICY "Coaches can view their session notes" ON session_notes
  FOR SELECT USING (
    coach_id = auth.uid() AND 
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND user_type = 'coach')
  );

CREATE POLICY "Coaches can create and update their session notes" ON session_notes
  FOR ALL USING (
    coach_id = auth.uid() AND 
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND user_type = 'coach')
  );

CREATE POLICY "Admins can view all session notes" ON session_notes
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND user_type = 'admin')
  );

-- =====================================================
-- TRIGGERS AND FUNCTIONS
-- =====================================================

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO users (id, email, user_type, full_name)
  VALUES (
    NEW.id, 
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data->>'user_type', 'member'),
    NEW.raw_user_meta_data->>'full_name'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers to automatically update updated_at
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_coach_profiles_updated_at
  BEFORE UPDATE ON coach_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at
  BEFORE UPDATE ON appointments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_session_notes_updated_at
  BEFORE UPDATE ON session_notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate coach rating
CREATE OR REPLACE FUNCTION calculate_coach_rating(coach_user_id UUID)
RETURNS DECIMAL(3,2) AS $$
DECLARE
  avg_rating DECIMAL(3,2);
BEGIN
  SELECT AVG(rating) INTO avg_rating
  FROM session_notes
  WHERE coach_id = coach_user_id AND rating IS NOT NULL;
  
  RETURN COALESCE(avg_rating, 0.00);
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- SAMPLE DATA (Optional - for testing)
-- =====================================================

-- Insert sample admin user (you'll need to create this user in Supabase Auth first)
-- INSERT INTO users (id, email, user_type, full_name) 
-- VALUES (
--   'your-admin-user-id-here',
--   'admin@actcoaching.com',
--   'admin',
--   'System Administrator'
-- );

-- =====================================================
-- VIEWS FOR COMMON QUERIES
-- =====================================================

-- View for coach search results
CREATE VIEW coach_search_results AS
SELECT 
  cp.id as profile_id,
  u.id as user_id,
  u.full_name,
  u.email,
  cp.bio,
  cp.specialties,
  cp.years_experience,
  cp.languages,
  cp.hourly_rate,
  cp.rating,
  cp.total_sessions,
  cp.is_verified
FROM coach_profiles cp
JOIN users u ON cp.user_id = u.id
WHERE u.is_active = true AND cp.is_verified = true;

-- View for appointment details
CREATE VIEW appointment_details AS
SELECT 
  a.id,
  a.status,
  a.appointment_date,
  a.duration_minutes,
  a.session_type,
  a.video_meeting_url,
  a.notes,
  a.created_at,
  -- Member info
  member.full_name as member_name,
  member.email as member_email,
  -- Coach info
  coach.full_name as coach_name,
  coach.email as coach_email,
  cp.hourly_rate
FROM appointments a
JOIN users member ON a.member_id = member.id
JOIN users coach ON a.coach_id = coach.id
LEFT JOIN coach_profiles cp ON coach.id = cp.user_id;

-- View for unread message counts
CREATE VIEW unread_message_counts AS
SELECT 
  receiver_id,
  COUNT(*) as unread_count
FROM messages
WHERE is_read = false
GROUP BY receiver_id;

-- =====================================================
-- STORED PROCEDURES
-- =====================================================

-- Procedure to create a new appointment
CREATE OR REPLACE PROCEDURE create_appointment(
  p_member_id UUID,
  p_coach_id UUID,
  p_appointment_date TIMESTAMP WITH TIME ZONE,
  p_duration_minutes INTEGER DEFAULT 60,
  p_session_type TEXT DEFAULT 'video'
)
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO appointments (
    member_id, 
    coach_id, 
    appointment_date, 
    duration_minutes, 
    session_type
  ) VALUES (
    p_member_id, 
    p_coach_id, 
    p_appointment_date, 
    p_duration_minutes, 
    p_session_type
  );
END;
$$;

-- Procedure to approve a coach
CREATE OR REPLACE PROCEDURE approve_coach(p_user_id UUID)
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE coach_profiles 
  SET is_verified = true 
  WHERE user_id = p_user_id;
  
  UPDATE users 
  SET user_type = 'coach' 
  WHERE id = p_user_id;
END;
$$;

-- =====================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON TABLE users IS 'Extended user profiles for members, coaches, and admins';
COMMENT ON TABLE coach_profiles IS 'Detailed profiles for coaches including specialties and availability';
COMMENT ON TABLE member_assessments IS 'Assessment responses from members for coach matching';
COMMENT ON TABLE appointments IS 'Scheduled sessions between members and coaches';
COMMENT ON TABLE saved_coaches IS 'Members saved favorite coaches';
COMMENT ON TABLE messages IS 'Direct messages between users';
COMMENT ON TABLE session_notes IS 'Notes and outcomes from coaching sessions';

COMMENT ON COLUMN users.user_type IS 'Type of user: member, coach, or admin';
COMMENT ON COLUMN appointments.status IS 'Appointment status: pending, confirmed, cancelled, completed';
COMMENT ON COLUMN coach_profiles.specialties IS 'Array of coach specialties';
COMMENT ON COLUMN coach_profiles.availability IS 'JSON object containing availability schedule';

-- =====================================================
-- GRANTS (if using custom roles)
-- =====================================================

-- Grant necessary permissions to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Grant permissions to anon users for public data
GRANT SELECT ON coach_search_results TO anon;
GRANT SELECT ON coach_profiles TO anon; 