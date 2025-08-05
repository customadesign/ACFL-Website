# Deployment Guide for Render

This guide walks you through deploying the Therapist Matcher application to Render.

## Prerequisites

1. **GitHub Repository**: Push your code to a GitHub repository
2. **Render Account**: Sign up at [render.com](https://render.com)
3. **Supabase Database**: Ensure your Supabase project is set up and accessible

## Deployment Steps

### Option 1: Using render.yaml (Recommended)

1. **Connect GitHub Repository**
   - Go to your Render dashboard
   - Click "New +" → "Blueprint"
   - Connect your GitHub repository
   - Render will automatically detect the `render.yaml` file

2. **Configure Environment Variables**
   
   For each service, you'll need to set these environment variables in the Render dashboard:

   **Backend Service:**
   ```
   SUPABASE_URL=https://your-project-id.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   SUPABASE_ANON_KEY=your-anon-key
   JWT_SECRET=your-jwt-secret-key
   NODE_ENV=production
   ```

   **Frontend Services:**
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   NEXT_PUBLIC_APP_NAME=ACT Coaching For Life
   ```

3. **Deploy**
   - Click "Apply" to deploy all services
   - Wait for builds to complete

### Option 2: Manual Service Creation

If you prefer to create services individually:

1. **Backend Service**
   - Type: Web Service
   - Build Command: `cd backend && npm ci && npm run build`
   - Start Command: `cd backend && npm start`
   - Environment: Node

2. **Frontend Service**
   - Type: Web Service  
   - Build Command: `cd frontend && npm ci && npm run build`
   - Start Command: `cd frontend && npm start`
   - Environment: Node

3. **Repeat for Coaches and Admin Dashboards**

## Environment Variables Setup

### Required Variables

**Backend:**
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key from Supabase
- `SUPABASE_ANON_KEY` - Anonymous key from Supabase
- `JWT_SECRET` - Random string for JWT signing
- `NODE_ENV=production`

**Frontend Applications:**
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Anonymous key from Supabase
- `NEXT_PUBLIC_API_URL` - Backend service URL (auto-configured in render.yaml)

### Optional Variables

- `VIDEOSDK_API_KEY` - For video call features
- `STRIPE_SECRET_KEY` - For payment processing
- `SMTP_*` variables - For email notifications

## Service URLs

After deployment, your services will be available at:
- **Backend API**: `https://therapist-matcher-backend.onrender.com`
- **Frontend**: `https://therapist-matcher-frontend.onrender.com`
- **Coaches Dashboard**: `https://therapist-matcher-coaches.onrender.com`
- **Admin Dashboard**: `https://therapist-matcher-admin.onrender.com`

## Database Setup

1. Ensure your Supabase project has the required tables
2. Run the SQL scripts in `/backend/database/` if needed
3. Update Row Level Security (RLS) policies for production

## Troubleshooting

### Common Issues

1. **Build Failures**
   - Check build logs in Render dashboard
   - Verify all dependencies are in package.json
   - Ensure TypeScript compiles without errors

2. **Environment Variable Issues**
   - Double-check all required variables are set
   - Verify Supabase keys are correct
   - Ensure API URLs point to correct services

3. **CORS Issues**
   - Backend automatically configures CORS for all frontend services
   - If issues persist, check CORS_ORIGIN in backend environment

### Logs

Access logs through:
- Render Dashboard → Service → Logs tab
- Use for debugging runtime issues

## Production Checklist

- [ ] All environment variables configured
- [ ] Supabase RLS policies updated for production
- [ ] HTTPS enforced on all services  
- [ ] Database backups configured
- [ ] Error monitoring set up
- [ ] Performance monitoring enabled

## Scaling

Render automatically handles scaling based on traffic. For heavy usage:
- Upgrade to Professional plans
- Consider database connection pooling
- Implement Redis caching