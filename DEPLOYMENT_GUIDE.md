# ACFL Website Deployment Guide

## Overview

This guide covers deploying the ACFL Website to production using:
- **Backend:** Render.com
- **Frontend:** Vercel.com

---

## Prerequisites

- [x] Code pushed to GitHub
- [x] Database migrations applied in Supabase
- [ ] Render.com account (sign up with GitHub)
- [ ] Vercel.com account (sign up with GitHub)

---

## Part 1: Deploy Backend to Render

### Step 1: Create Web Service

1. Go to https://render.com/
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository: `customadesign/ACFL-Website`

### Step 2: Configure Service

**Basic Settings:**
```
Name: acfl-backend
Region: Oregon (US West) or closest to you
Branch: main
Root Directory: backend
Runtime: Node
```

**Build & Start:**
```
Build Command: npm install && npm run build
Start Command: npm start
```

**Instance Type:**
- Free tier (for testing)
- Starter ($7/month) for production

### Step 3: Environment Variables

Click **"Advanced"** → **"Add Environment Variable"**

Copy ALL variables from `backend/.env`:

```bash
# Server Configuration
NODE_ENV=production
PORT=3001

# CORS (UPDATE AFTER FRONTEND DEPLOYMENT)
CORS_ORIGIN=http://localhost:4000
FRONTEND_URL=http://localhost:4000

# Supabase
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
SUPABASE_ANON_KEY=your_supabase_anon_key

# VideoSDK
VIDEOSDK_API_KEY=your_videosdk_api_key
VIDEOSDK_SECRET_KEY=your_videosdk_secret_key
VIDEOSDK_TOKEN=your_videosdk_token

# Square
SQUARE_ACCESS_TOKEN=your_square_production_access_token
SQUARE_APPLICATION_ID=your_square_production_application_id
SQUARE_ENVIRONMENT=production
SQUARE_LOCATION_ID=your_square_location_id
SQUARE_WEBHOOK_SECRET=your_square_webhook_secret

# Email (Resend)
RESEND_API_KEY=your_resend_api_key
FROM_EMAIL=noreply@actcoachingforlife.com
RESEND_FROM_NAME=ACT Coaching For Life

# SendGrid (backup)
SENDGRID_API_KEY=your_sendgrid_api_key
VERIFIED_FROM_EMAIL=your_verified_email@gmail.com
SENDGRID_FROM_NAME=ACT Family Coaching

# SMTP (backup)
SMTP_HOST=your_smtp_host
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=your_smtp_user
SMTP_PASS=your_smtp_password
SMTP_FROM_NAME=ACT Coaching For Life
SMTP_FROM_EMAIL=your_smtp_from_email

# JWT
JWT_SECRET=your_jwt_secret_here_use_a_long_random_string
JWT_EXPIRES_IN=7d

# Google Calendar
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=https://acfl-backend.onrender.com/api/calendar-integration/callback

# Logging
LOG_LEVEL=info
LOG_FILE=logs/app.log

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads

# Security
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX=100
```

### Step 4: Deploy

1. Click **"Create Web Service"**
2. Wait for deployment (5-10 minutes)
3. Note your backend URL: `https://acfl-backend.onrender.com`

---

## Part 2: Deploy Frontend to Vercel

### Step 1: Import Project

1. Go to https://vercel.com/
2. Click **"Add New..."** → **"Project"**
3. Import: `customadesign/ACFL-Website`

### Step 2: Configure Project

**Framework Preset:** Next.js (auto-detected)

**Build Settings:**
```
Root Directory: frontend
Build Command: npm run build (auto)
Output Directory: .next (auto)
Install Command: npm install (auto)
```

### Step 3: Environment Variables

Add these variables:

```bash
NEXT_PUBLIC_API_URL=https://acfl-backend.onrender.com
NEXT_PUBLIC_SUPABASE_URL=https://zgavparhxnethbhtulap.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpnYXZwYXJoeG5ldGhiaHR1bGFwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM5NjAxMTcsImV4cCI6MjA2OTUzNjExN30.F0VvqvRffW5z1mkHYFj3iTPWzAFgPdFLPyQb4KxyxfQ
NEXT_PUBLIC_SQUARE_APPLICATION_ID=sq0idp-1ryoro_0W_X2MzznezwQdQ
NEXT_PUBLIC_SQUARE_LOCATION_ID=AA057R8Y6XFP7
```

### Step 4: Deploy

1. Click **"Deploy"**
2. Wait for deployment (3-5 minutes)
3. Note your frontend URL: `https://acfl-website-xxx.vercel.app`

---

## Part 3: Post-Deployment Configuration

### Step 1: Update Backend CORS

In Render dashboard, update environment variables:

```bash
CORS_ORIGIN=https://acfl-website-xxx.vercel.app,http://localhost:4000
FRONTEND_URL=https://acfl-website-xxx.vercel.app
```

Save and redeploy backend.

### Step 2: Update Google Calendar Redirect URI

Update in Render:
```bash
GOOGLE_REDIRECT_URI=https://acfl-backend.onrender.com/api/calendar-integration/callback
```

Also update in Google Cloud Console OAuth settings.

### Step 3: Update Square Webhook URL

1. Go to Square Developer Dashboard
2. Navigate to Webhooks
3. Update webhook URL to: `https://acfl-backend.onrender.com/api/webhooks/square`

### Step 4: Apply Database Migrations

If not already done:

1. Go to Supabase Dashboard
2. Open SQL Editor
3. Run migrations from `backend/migrations/`:
   - `001_add_refund_constraints.sql`
   - `002_add_refund_status_trigger.sql`
   - `003_add_data_integrity_checks.sql`

---

## Part 4: Verification

### Test Checklist:

- [ ] Backend health check: `https://acfl-backend.onrender.com/health`
- [ ] Frontend loads: `https://acfl-website-xxx.vercel.app`
- [ ] Login works
- [ ] Create test payment
- [ ] Check payment in Square dashboard
- [ ] Check payment in coach dashboard
- [ ] Request payout as coach
- [ ] Approve payout as admin
- [ ] Process refund in Square
- [ ] Check refund appears in coach revenue

---

## Troubleshooting

### Backend won't start
- Check Render logs for errors
- Verify all environment variables are set
- Check TypeScript compilation succeeded

### Frontend can't connect to backend
- Verify `NEXT_PUBLIC_API_URL` is correct
- Check CORS settings on backend
- Verify backend is running

### Payments not working
- Check Square environment variables
- Verify `SQUARE_LOCATION_ID` is correct
- Check Square webhook is configured

### Database errors
- Verify Supabase credentials
- Check migrations are applied
- Review Supabase logs

---

## Maintenance

### Updating the App

1. Push changes to GitHub
2. Render auto-deploys from `main` branch
3. Vercel auto-deploys from `main` branch

### Monitoring

- **Render:** View logs in dashboard
- **Vercel:** View logs and analytics
- **Supabase:** Database logs and monitoring

### Scaling

**Free Tier Limits:**
- Render: Spins down after 15min inactivity
- Vercel: 100GB bandwidth/month

**Upgrade to:**
- Render Starter: $7/month (always on)
- Vercel Pro: $20/month (more bandwidth)

---

## Cost Estimate

**Free Tier (Testing):**
- Render: Free (with spin-down)
- Vercel: Free
- Supabase: Free
- Total: $0/month

**Production (Recommended):**
- Render Starter: $7/month
- Vercel: Free or Pro $20/month
- Supabase Pro: $25/month (optional)
- Total: $7-52/month

---

## Support

- Render docs: https://render.com/docs
- Vercel docs: https://vercel.com/docs
- Next.js docs: https://nextjs.org/docs

---

## Quick Deploy Commands

```bash
# Ensure latest code is pushed
git add -A
git commit -m "Deploy to production"
git push origin main

# Both Render and Vercel will auto-deploy from main branch
```
