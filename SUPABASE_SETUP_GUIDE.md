# ACT Coaching For Life - Supabase Setup Guide

**For:** Gabe  
**Project:** ACT Coaching For Life Platform  
**Date:** December 2024  

---

## Quick Start Checklist

- [ ] Create Supabase project
- [ ] Set up database schema
- [ ] Configure environment variables
- [ ] Install dependencies
- [ ] Test authentication
- [ ] Migrate existing data (if any)

---

## Step 1: Create Supabase Project

### 1.1 Sign Up for Supabase
1. Go to [supabase.com](https://supabase.com)
2. Click "Start your project"
3. Sign up with GitHub or email
4. Complete account setup

### 1.2 Create New Project
1. Click "New Project"
2. Choose your organization
3. Enter project details:
   - **Name:** `act-coaching-for-life`
   - **Database Password:** Create a strong password (save this!)
   - **Region:** Choose closest to your users
4. Click "Create new project"
5. Wait for project to be created (2-3 minutes)

### 1.3 Get Project Credentials
1. Go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** (e.g., `https://your-project-id.supabase.co`)
   - **Anon public key** (starts with `eyJ...`)
   - **Service role key** (starts with `eyJ...` - keep this secret!)

---

## Step 2: Set Up Database Schema

### 2.1 Access SQL Editor
1. In your Supabase dashboard, go to **SQL Editor**
2. Click **New query**

### 2.2 Run Schema Script
1. Copy the entire contents of `supabase-schema.sql`
2. Paste into the SQL Editor
3. Click **Run** to execute the script
4. Verify all tables are created in **Table Editor**

### 2.3 Verify Schema Creation
Check that these tables were created:
- [ ] `users`
- [ ] `coach_profiles`
- [ ] `member_assessments`
- [ ] `appointments`
- [ ] `saved_coaches`
- [ ] `messages`
- [ ] `session_notes`

And these views:
- [ ] `coach_search_results`
- [ ] `appointment_details`
- [ ] `unread_message_counts`

---

## Step 3: Configure Environment Variables

### 3.1 Backend Configuration
1. Navigate to `backend/` directory
2. Copy `env.example` to `.env`:
   ```bash
   cp env.example .env
   ```
3. Update `.env` with your Supabase credentials:
   ```env
   SUPABASE_URL=https://your-project-id.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   SUPABASE_ANON_KEY=your-anon-key
   ```

### 3.2 Frontend Configuration
1. Navigate to `frontend/` directory
2. Copy `env.example` to `.env.local`:
   ```bash
   cp env.example .env.local
   ```
3. Update `.env.local` with your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

### 3.3 Coaches Dashboard Configuration
1. Navigate to `coaches-dashboard/` directory
2. Create `.env.local` file:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

### 3.4 Admin Dashboard Configuration
1. Navigate to `admin-dashboard/` directory
2. Create `.env.local` file:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

---

## Step 4: Install Dependencies

### 4.1 Backend Dependencies
```bash
cd backend
npm install @supabase/supabase-js dotenv
```

### 4.2 Frontend Dependencies
```bash
cd frontend
npm install @supabase/supabase-js
```

### 4.3 Coaches Dashboard Dependencies
```bash
cd coaches-dashboard
npm install @supabase/supabase-js
```

### 4.4 Admin Dashboard Dependencies
```bash
cd admin-dashboard
npm install @supabase/supabase-js
```

---

## Step 5: Test Authentication

### 5.1 Create Test Admin User
1. Go to **Authentication** → **Users** in Supabase dashboard
2. Click **Add user**
3. Enter test admin credentials:
   - **Email:** `admin@actcoaching.com`
   - **Password:** `admin123456`
4. Click **Add user**

### 5.2 Update User Type
1. Go to **SQL Editor**
2. Run this query to set user type:
   ```sql
   UPDATE users 
   SET user_type = 'admin' 
   WHERE email = 'admin@actcoaching.com';
   ```

### 5.3 Test Authentication Flow
1. Start your development servers:
   ```bash
   ./start-all.sh
   ```
2. Navigate to `http://localhost:4000`
3. Try signing in with the admin credentials
4. Verify authentication works

---

## Step 6: Update Backend Code

### 6.1 Update Package.json
Add Supabase to backend dependencies:
```json
{
  "dependencies": {
    "@supabase/supabase-js": "^2.38.0",
    "dotenv": "^16.3.1"
  }
}
```

### 6.2 Update Matching Service
Replace the existing matching logic in `backend/src/services/matchingService.ts`:

```typescript
import { supabase } from '../lib/supabase'

export const matchMembersWithCoaches = async (assessmentData: any) => {
  try {
    // Get verified coaches
    const { data: coaches, error } = await supabase
      .from('coach_search_results')
      .select('*')
      .order('rating', { ascending: false })

    if (error) throw error

    // Apply matching algorithm
    const matchedCoaches = applyMatchingAlgorithm(coaches, assessmentData)
    
    return matchedCoaches
  } catch (error) {
    console.error('Error matching coaches:', error)
    throw error
  }
}

const applyMatchingAlgorithm = (coaches: any[], assessment: any) => {
  // Your existing matching logic here
  // Enhanced with Supabase data
  return coaches.map(coach => ({
    ...coach,
    relevanceScore: calculateRelevanceScore(coach, assessment)
  })).sort((a, b) => b.relevanceScore - a.relevanceScore)
}
```

### 6.3 Update API Routes
Update your existing routes to use Supabase instead of CSV data.

---

## Step 7: Update Frontend Code

### 7.1 Create Authentication Components
Create `frontend/src/components/Auth.tsx`:

```typescript
import { useState } from 'react'
import { authHelpers } from '../lib/supabase'

export default function Auth() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      await authHelpers.signIn(email, password)
      // Redirect or update state
    } catch (error) {
      console.error('Sign in error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSignIn}>
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button type="submit" disabled={loading}>
        {loading ? 'Signing in...' : 'Sign In'}
      </button>
    </form>
  )
}
```

### 7.2 Update App Layout
Update your main app to handle authentication state:

```typescript
import { useEffect, useState } from 'react'
import { supabase, authHelpers } from './lib/supabase'

export default function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    authHelpers.getCurrentSession().then((session) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (loading) {
    return <div>Loading...</div>
  }

  return user ? <Dashboard /> : <Auth />
}
```

---

## Step 8: Test the Integration

### 8.1 Test User Registration
1. Create a new member account
2. Verify user is created in Supabase
3. Check user_type is set correctly

### 8.2 Test Coach Profile Creation
1. Create a coach account
2. Add coach profile data
3. Verify profile is saved

### 8.3 Test Appointment Booking
1. Create an appointment
2. Verify appointment is saved
3. Test appointment status updates

### 8.4 Test Messaging
1. Send a message between users
2. Verify message is saved
3. Test real-time updates

---

## Step 9: Data Migration (If Needed)

### 9.1 Export Existing Data
If you have existing CSV data, export it to JSON format.

### 9.2 Import to Supabase
Use the Supabase dashboard or API to import existing data:

```typescript
// Example: Import coach data
const importCoaches = async (coachesData: any[]) => {
  for (const coach of coachesData) {
    // First create user
    const { data: user } = await supabase.auth.admin.createUser({
      email: coach.email,
      password: 'temporary-password',
      user_metadata: {
        user_type: 'coach',
        full_name: coach.name
      }
    })

    // Then create coach profile
    await supabase
      .from('coach_profiles')
      .insert({
        user_id: user.user.id,
        bio: coach.bio,
        specialties: coach.specialties,
        hourly_rate: coach.hourly_rate
      })
  }
}
```

---

## Step 10: Production Deployment

### 10.1 Environment Variables
Update production environment variables with production Supabase credentials.

### 10.2 Database Backups
Set up automated database backups in Supabase dashboard.

### 10.3 Monitoring
Enable monitoring and alerts in Supabase dashboard.

---

## Troubleshooting

### Common Issues

#### 1. "Missing Supabase environment variables"
- Check that `.env` files are in the correct locations
- Verify environment variable names match exactly
- Restart your development servers after adding environment variables

#### 2. "Row Level Security policy violation"
- Check that RLS policies are correctly configured
- Verify user authentication is working
- Check user permissions and roles

#### 3. "Cannot connect to Supabase"
- Verify project URL is correct
- Check that API keys are valid
- Ensure CORS settings allow your domain

#### 4. "Authentication not working"
- Check that Supabase Auth is enabled
- Verify email templates are configured
- Check user confirmation status

### Getting Help

1. **Supabase Documentation:** [supabase.com/docs](https://supabase.com/docs)
2. **Supabase Discord:** [discord.supabase.com](https://discord.supabase.com)
3. **GitHub Issues:** [github.com/supabase/supabase](https://github.com/supabase/supabase)

---

## Next Steps

After completing this setup:

1. **Implement Real-time Features:** Add real-time subscriptions for messaging and appointments
2. **Add File Storage:** Implement coach profile images and session recordings
3. **Set Up Edge Functions:** Create serverless functions for complex business logic
4. **Add Analytics:** Implement usage tracking and analytics
5. **Performance Optimization:** Add caching and query optimization

---

## Security Checklist

- [ ] Environment variables are not committed to git
- [ ] Service role key is kept secure
- [ ] RLS policies are properly configured
- [ ] Input validation is implemented
- [ ] HTTPS is enforced in production
- [ ] Regular security audits are scheduled

---

*This guide provides a complete setup for integrating Supabase into the ACT Coaching For Life platform. Follow each step carefully and test thoroughly before proceeding to the next step.* 