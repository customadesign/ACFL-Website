# ACFL Admin System Setup Guide

This guide will help you set up and access the admin dashboard for the ACFL (ACT Coaching For Life) platform.

## 🚀 Quick Setup

### 1. Database Setup

First, ensure you have the `admins` table in your Supabase database. Run this SQL in your Supabase SQL editor:

```sql
-- Create admins table
CREATE TABLE IF NOT EXISTS admins (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  password_hash TEXT NOT NULL,
  role VARCHAR(20) DEFAULT 'admin',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create RLS policies for admins table
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- Allow service role to access all admin records
CREATE POLICY "Service role can access all admin records" ON admins
  FOR ALL USING (auth.role() = 'service_role');

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_admins_updated_at BEFORE UPDATE ON admins
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### 2. Create Default Admin User

Run the setup script to create the default admin user and test accounts:

```bash
cd backend
npm run setup-admin
```

This will create:
- **Admin User**: `admin@acfl.com` / `admin123`
- **Test Coach**: `coach@acfl.com` / `coach123`
- **Test Client**: `client@acfl.com` / `client123`

### 3. Start the Servers

Start both backend and frontend servers:

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

### 4. Access Admin Dashboard

1. Navigate to `http://localhost:3000/login`
2. Use the admin credentials (displayed on the login page):
   - **Email**: `admin@acfl.com`
   - **Password**: `admin123`
3. You'll be automatically redirected to the admin dashboard at `http://localhost:3000/admin`

**Note**: The login page now displays test credentials for easy access during development.

## 🎯 Admin Dashboard Features

### **Dashboard Overview** (`/admin`)
- Platform statistics (users, coaches, appointments, revenue)
- Recent activity feed
- Quick action buttons
- System health monitoring

### **User Management** (`/admin/users`)
- View all platform users (clients and coaches)
- Search and filter users
- Manage user status (active, suspended, inactive)
- Delete users
- User profile details

### **Coach Management** (`/admin/coaches`)
- Review coach applications
- Approve/reject coach applications
- Manage coach status
- View coach profiles and qualifications
- Suspend coaches

### **Appointments** (`/admin/appointments`)
- Monitor all platform appointments
- Filter by status, date, coach, client
- View appointment details
- Track appointment metrics

### **Analytics** (`/admin/analytics`)
- Platform performance metrics
- User and coach analytics
- Financial metrics
- Session statistics
- Top performers
- Popular specialties

### **Settings** (`/admin/settings`)
- General platform settings
- Notification preferences
- Security settings
- Payment configuration
- Scheduling settings

## 🔐 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Role-Based Access**: Admin-only access to dashboard
- **Password Hashing**: Bcrypt with salt rounds
- **Session Management**: Automatic token validation
- **Secure Logout**: Token cleanup on logout

## 🛠 API Endpoints

All admin endpoints are protected and require admin authentication:

### Authentication
- `POST /api/auth/login` - Login (supports admin role)
- `POST /api/auth/create-admin` - Create new admin (admin-only)

### Dashboard
- `GET /api/admin/dashboard` - Dashboard statistics
- `GET /api/admin/analytics` - Analytics data

### User Management
- `GET /api/admin/users` - List all users
- `PUT /api/admin/users/:id/status` - Update user status
- `DELETE /api/admin/users/:id` - Delete user

### Coach Management
- `GET /api/admin/coaches` - List all coaches
- `PUT /api/admin/coaches/:id/:action` - Coach actions (approve/reject/suspend)

### Appointments
- `GET /api/admin/appointments` - List all appointments

### Settings
- `GET /api/admin/settings` - Get platform settings
- `PUT /api/admin/settings` - Update platform settings

## 🔧 Configuration

### Environment Variables

Ensure these environment variables are set in your `.env` file:

```env
# Supabase
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_service_key

# JWT
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d

# Bcrypt
BCRYPT_ROUNDS=12
```

### Database Tables Required

The admin system requires these database tables:
- `admins` - Admin user accounts
- `clients` - Client user accounts  
- `coaches` - Coach user accounts
- `appointments` - Appointment records

## 🚨 Important Security Notes

1. **Change Default Password**: After first login, change the default admin password
2. **Environment Variables**: Keep your `.env` file secure and never commit it
3. **JWT Secret**: Use a strong, unique JWT secret in production
4. **Database Access**: Ensure proper RLS policies are in place
5. **HTTPS**: Use HTTPS in production environments

## 🐛 Troubleshooting

### Common Issues

1. **Login Failed**: 
   - Ensure the admin user was created successfully
   - Check database connection
   - Verify environment variables

2. **Dashboard Not Loading**:
   - Check if you're logged in as admin
   - Verify JWT token is valid
   - Check browser console for errors

3. **API Errors**:
   - Ensure backend server is running
   - Check Supabase connection
   - Verify API endpoints are correct

### Debug Steps

1. Check server logs for errors
2. Verify database tables exist
3. Test API endpoints with Postman
4. Check browser network tab for failed requests

## 📞 Support

If you encounter issues:
1. Check the console logs (both frontend and backend)
2. Verify your database schema matches the requirements
3. Ensure all environment variables are properly set
4. Test with the provided default credentials first

---

**Note**: This admin system is designed for development and testing. For production use, implement additional security measures such as rate limiting, audit logging, and multi-factor authentication.