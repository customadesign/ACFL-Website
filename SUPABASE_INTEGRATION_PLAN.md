# ACT Coaching For Life - Supabase Integration Plan

**Project:** ACT Coaching For Life Platform  
**Lead Developer:** Gabe  
**Date:** December 2024  
**Version:** 1.0  

---

## Executive Summary

This document outlines the migration from CSV-based data storage to Supabase for the ACT Coaching For Life platform. Supabase will provide a robust PostgreSQL database with real-time capabilities, authentication, and storage - significantly improving the platform's scalability, security, and functionality.

---

## Why Supabase?

### Benefits for ACT Coaching For Life
- **PostgreSQL Database:** Enterprise-grade database with advanced querying capabilities
- **Real-time Features:** Live updates for messaging, appointments, and notifications
- **Built-in Authentication:** Secure user management with role-based access
- **Row Level Security:** Fine-grained data protection
- **Storage:** File uploads for coach profiles, documents, and session recordings
- **Edge Functions:** Serverless functions for complex business logic
- **Scalability:** Handles growth from hundreds to thousands of users

### Cost Benefits
- **Free Tier:** 500MB database, 1GB file storage, 50MB bandwidth
- **Pro Plan:** $25/month for 8GB database, 100GB storage, 250GB bandwidth
- **No Infrastructure Management:** Fully managed service

---

## Database Schema Design

### 1. Authentication Tables (Managed by Supabase Auth)
```sql
-- Automatically created by Supabase Auth
auth.users
auth.identities
auth.sessions
```

### 2. Core Application Tables

#### Users Table
```sql
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
```

#### Coach Profiles Table
```sql
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
```

#### Member Assessments Table
```sql
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
```

#### Appointments Table
```sql
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
```

#### Saved Coaches Table
```sql
CREATE TABLE saved_coaches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID REFERENCES users(id) ON DELETE CASCADE,
  coach_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(member_id, coach_id)
);
```

#### Messages Table
```sql
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID REFERENCES users(id) ON DELETE CASCADE,
  receiver_id UUID REFERENCES users(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES appointments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Session Notes Table
```sql
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
```

---

## Row Level Security (RLS) Policies

### Users Table Policies
```sql
-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Users can view their own profile
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Admins can view all users
CREATE POLICY "Admins can view all users" ON users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND user_type = 'admin'
    )
  );
```

### Coach Profiles Policies
```sql
ALTER TABLE coach_profiles ENABLE ROW LEVEL SECURITY;

-- Anyone can view coach profiles
CREATE POLICY "Anyone can view coach profiles" ON coach_profiles
  FOR SELECT USING (true);

-- Coaches can update their own profile
CREATE POLICY "Coaches can update own profile" ON coach_profiles
  FOR UPDATE USING (
    user_id = auth.uid() AND 
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND user_type = 'coach')
  );
```

### Appointments Policies
```sql
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Members can view their own appointments
CREATE POLICY "Members can view own appointments" ON appointments
  FOR SELECT USING (
    member_id = auth.uid() AND 
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND user_type = 'member')
  );

-- Coaches can view appointments where they are the coach
CREATE POLICY "Coaches can view their appointments" ON appointments
  FOR SELECT USING (
    coach_id = auth.uid() AND 
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND user_type = 'coach')
  );

-- Admins can view all appointments
CREATE POLICY "Admins can view all appointments" ON appointments
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND user_type = 'admin')
  );
```

---

## Authentication Flow

### User Registration Process
1. **Member Registration:**
   - User signs up with email/password
   - Supabase creates auth.users record
   - Trigger creates users record with user_type = 'member'
   - User completes assessment questionnaire
   - Assessment data stored in member_assessments

2. **Coach Registration:**
   - Coach signs up with email/password
   - Supabase creates auth.users record
   - Trigger creates users record with user_type = 'coach'
   - Coach completes profile setup
   - Admin approves coach (sets is_verified = true)

3. **Admin Creation:**
   - Admin users created manually or through admin interface
   - user_type = 'admin' for administrative access

### Authentication Triggers
```sql
-- Function to handle new user creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO users (id, email, user_type, full_name)
  VALUES (NEW.id, NEW.email, 'member', NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

---

## API Integration Strategy

### Backend Changes Required

#### 1. Update Backend Dependencies
```json
{
  "dependencies": {
    "@supabase/supabase-js": "^2.38.0",
    "dotenv": "^16.3.1"
  }
}
```

#### 2. Supabase Client Configuration
```typescript
// backend/src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export const supabase = createClient(supabaseUrl, supabaseServiceKey)
```

#### 3. Update API Routes
```typescript
// Example: Updated matching service
export const matchMembersWithCoaches = async (assessmentData: any) => {
  const { data: coaches, error } = await supabase
    .from('coach_profiles')
    .select(`
      *,
      users!inner(*)
    `)
    .eq('is_verified', true)
    .eq('is_active', true)

  if (error) throw error

  // Apply matching algorithm
  return applyMatchingAlgorithm(coaches, assessmentData)
}
```

### Frontend Changes Required

#### 1. Update Frontend Dependencies
```json
{
  "dependencies": {
    "@supabase/supabase-js": "^2.38.0"
  }
}
```

#### 2. Supabase Client for Frontend
```typescript
// frontend/src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

#### 3. Authentication Components
```typescript
// Example: Auth component with Supabase
import { supabase } from '../lib/supabase'

export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  })
  
  if (error) throw error
  return data
}
```

---

## Migration Strategy

### Phase 1: Setup and Infrastructure (Week 1)
1. **Create Supabase Project**
   - Set up new Supabase project
   - Configure environment variables
   - Set up database schema

2. **Update Development Environment**
   - Install Supabase dependencies
   - Configure Supabase clients
   - Update environment files

3. **Data Migration**
   - Export existing CSV data
   - Transform data to match new schema
   - Import data into Supabase

### Phase 2: Authentication Integration (Week 2)
1. **Replace Current Auth System**
   - Implement Supabase Auth
   - Update login/signup flows
   - Add role-based access control

2. **Update User Management**
   - Migrate user profiles
   - Implement user type management
   - Add admin user creation

### Phase 3: Core Features Migration (Week 3-4)
1. **Coach Matching System**
   - Update matching algorithm
   - Integrate with Supabase queries
   - Add real-time updates

2. **Appointment System**
   - Migrate appointment booking
   - Add real-time status updates
   - Implement approval workflow

3. **Messaging System**
   - Implement real-time messaging
   - Add message threading
   - Include file attachments

### Phase 4: Advanced Features (Week 5-6)
1. **Real-time Features**
   - Live appointment updates
   - Real-time messaging
   - Push notifications

2. **File Storage**
   - Coach profile images
   - Session recordings
   - Document uploads

### Phase 5: Testing and Optimization (Week 7-8)
1. **Performance Testing**
   - Query optimization
   - Load testing
   - Security audit

2. **User Acceptance Testing**
   - End-to-end testing
   - Bug fixes
   - Performance improvements

---

## Environment Configuration

### Backend Environment Variables
```env
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_ANON_KEY=your-anon-key

# Existing Configuration
PORT=3001
CORS_ORIGIN=http://localhost:4000,http://localhost:4002,http://localhost:4003
```

### Frontend Environment Variables
```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3001
```

---

## Security Considerations

### Data Protection
- **Row Level Security:** All tables protected with RLS policies
- **Encryption:** Data encrypted at rest and in transit
- **Access Control:** Role-based permissions for all operations
- **Audit Logging:** Track all data access and modifications

### Authentication Security
- **Password Policies:** Enforce strong password requirements
- **Session Management:** Secure session handling
- **Multi-factor Authentication:** Optional MFA for coaches and admins
- **Rate Limiting:** Prevent brute force attacks

### API Security
- **Input Validation:** Validate all user inputs
- **SQL Injection Prevention:** Use parameterized queries
- **CORS Configuration:** Restrict cross-origin requests
- **HTTPS Enforcement:** All communications encrypted

---

## Monitoring and Analytics

### Supabase Dashboard
- **Database Performance:** Monitor query performance
- **Authentication Metrics:** Track user signups and logins
- **Storage Usage:** Monitor file storage consumption
- **API Usage:** Track API call volumes

### Custom Analytics
- **User Engagement:** Track feature usage
- **Coach Performance:** Monitor booking rates and ratings
- **Platform Health:** System uptime and error rates
- **Business Metrics:** Revenue, growth, and retention

---

## Cost Estimation

### Supabase Pricing
- **Free Tier:** $0/month (500MB database, 1GB storage)
- **Pro Plan:** $25/month (8GB database, 100GB storage)
- **Team Plan:** $599/month (100GB database, 1TB storage)

### Estimated Usage
- **Year 1:** Free tier sufficient for development and initial users
- **Year 2:** Pro plan for growing user base
- **Year 3+:** Team plan for enterprise features

---

## Next Steps for Implementation

### Immediate Actions (This Week)
1. **Create Supabase Project**
   - Sign up at supabase.com
   - Create new project
   - Note down project URL and keys

2. **Set Up Development Environment**
   - Install Supabase CLI
   - Configure local development
   - Set up environment variables

3. **Database Schema Creation**
   - Run schema creation scripts
   - Set up RLS policies
   - Create initial admin user

### Week 1 Deliverables
- ✅ Supabase project created and configured
- ✅ Database schema implemented
- ✅ Development environment updated
- ✅ Basic authentication working

### Week 2 Deliverables
- ✅ User registration and login flows
- ✅ Role-based access control
- ✅ Data migration completed

### Week 3-4 Deliverables
- ✅ Coach matching system migrated
- ✅ Appointment booking system
- ✅ Basic messaging functionality

### Week 5-6 Deliverables
- ✅ Real-time features implemented
- ✅ File upload functionality
- ✅ Advanced admin features

### Week 7-8 Deliverables
- ✅ Complete testing and optimization
- ✅ Performance improvements
- ✅ Production deployment ready

---

## Support and Resources

### Documentation
- [Supabase Documentation](https://supabase.com/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)

### Community
- [Supabase Discord](https://discord.supabase.com)
- [GitHub Discussions](https://github.com/supabase/supabase/discussions)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/supabase)

### Tools
- [Supabase CLI](https://supabase.com/docs/reference/cli)
- [Supabase Studio](https://supabase.com/docs/guides/dashboard)
- [Database Schema Designer](https://supabase.com/docs/guides/database/designing-schemas)

---

*This integration plan provides a comprehensive roadmap for migrating the ACT Coaching For Life platform to Supabase, ensuring scalability, security, and enhanced functionality.* 