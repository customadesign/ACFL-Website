# ACFL Admin System - Complete Documentation

## 📋 Table of Contents
1. [System Overview](#system-overview)
2. [Admin Dashboard Features](#admin-dashboard-features)
3. [User Management System](#user-management-system)
4. [Coach Management System](#coach-management-system)
5. [Appointments Management](#appointments-management)
6. [Analytics & Reporting](#analytics--reporting)
7. [Settings Management](#settings-management)
8. [Security Features](#security-features)
9. [API Documentation](#api-documentation)
10. [Database Schema](#database-schema)
11. [Technical Implementation](#technical-implementation)
12. [Troubleshooting Guide](#troubleshooting-guide)

---

## 🎯 System Overview

The ACFL (ACT Coaching For Life) Admin System is a comprehensive administrative dashboard designed to manage all aspects of the coaching platform. It provides administrators with powerful tools to oversee users, coaches, appointments, analytics, and system settings.

### Key Capabilities
- **Complete User Management**: Manage clients, coaches, and staff members
- **Coach Application Processing**: Review and approve/reject coach applications
- **Appointment Monitoring**: Track all platform sessions and appointments
- **Real-time Analytics**: Monitor platform performance and user engagement
- **System Configuration**: Manage platform settings and preferences
- **Security Management**: Role-based access control and user impersonation
- **Data Export**: Export user and appointment data for analysis

### Technology Stack
- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Node.js, Express, TypeScript
- **Database**: Supabase (PostgreSQL)
- **Authentication**: JWT tokens with bcrypt password hashing
- **UI Components**: Lucide React icons, custom components

---

## 🏠 Admin Dashboard Features

### Dashboard Overview (`/admin`)

The main dashboard provides a comprehensive overview of platform activity and key metrics.

#### Key Metrics Cards
- **Total Users**: Combined count of clients and coaches
- **Total Coaches**: Number of registered coaches
- **Total Clients**: Number of registered clients
- **Total Sessions**: Completed coaching sessions
- **Pending Approvals**: Coach applications awaiting review
- **Active Matches**: Currently scheduled sessions
- **Monthly Revenue**: Revenue generated in current month

#### Recent Activity Feed
- New user registrations (clients and coaches)
- Coach application submissions
- Coach approvals and rejections
- New appointment bookings
- System events and notifications

#### Quick Actions
- Navigate to user management
- Review pending coach applications
- View recent appointments
- Access analytics dashboard

#### System Health Monitoring
- Database connection status
- API endpoint health checks
- Real-time system performance metrics

---

## 👥 User Management System

### User Management Dashboard (`/admin/users`)

Comprehensive user management interface for all platform users.

#### Core Features

**User Listing & Search**
- View all users (clients, coaches, staff) in a unified table
- Search by name, email, or phone number
- Filter by user role (client, coach, staff)
- Filter by status (active, inactive, suspended, pending, approved, rejected)
- Sortable columns with pagination support

**User Profile Management**
- View detailed user profiles with all information
- Edit user information (name, email, phone, status)
- Role-specific fields:
  - **Clients**: Date of birth, gender identity, ethnic identity, religious background
  - **Coaches**: Years of experience, hourly rate, bio, qualifications, specialties
  - **Staff**: Department, role level, permissions

**User Actions**
- **View Details**: Complete user profile information
- **Edit Profile**: Modify user information and settings
- **Login As User**: Impersonate users for support purposes
- **Status Management**: Activate, suspend, or deactivate users
- **Delete User**: Permanently remove users (with confirmation)

**Advanced Features**
- **User Impersonation**: Safely login as any user for support
- **Bulk Actions**: Perform actions on multiple users
- **Export Data**: Export user lists to CSV/Excel
- **Audit Trail**: Track all user management actions

#### User Creation Workflow
1. **Add New User**: Create clients, coaches, or staff members
2. **Role Selection**: Choose appropriate user type
3. **Information Entry**: Fill role-specific fields
4. **Status Assignment**: Set initial user status
5. **Email Notification**: Automatic welcome emails
6. **Profile Completion**: Guide users through setup

#### Status Management
- **Active**: Full platform access
- **Inactive**: Limited access, can be reactivated
- **Suspended**: Temporarily blocked access
- **Pending**: Awaiting approval (coaches)
- **Approved**: Approved coaches with full access
- **Rejected**: Rejected coach applications

---

## 🎓 Coach Management System

### Coach Management Dashboard (`/admin/coaches`)

Specialized interface for managing coach applications and profiles.

#### Coach Application Review Process

**Application Listing**
- View all coach applications with status indicators
- Filter by application status (pending, approved, rejected)
- Sort by application date, experience, or rating
- Quick status overview with color-coded badges

**Application Review**
- **Detailed Profile Review**: Complete coach information
- **Qualification Verification**: Review credentials and experience
- **Specialty Assessment**: Evaluate coaching specialties
- **Background Check**: Review provided qualifications
- **Decision Making**: Approve or reject with reasons

**Coach Actions**
- **Approve Coach**: Grant full platform access
- **Reject Application**: Decline with feedback
- **Request More Information**: Ask for additional details
- **Suspend Coach**: Temporarily disable access
- **Update Profile**: Modify coach information

#### Coach Profile Management
- **Personal Information**: Name, contact details, bio
- **Professional Details**: Experience, qualifications, specialties
- **Availability Settings**: Schedule and availability preferences
- **Pricing Information**: Hourly rates and payment preferences
- **Performance Metrics**: Session count, ratings, reviews

#### Coach Analytics
- **Performance Tracking**: Session completion rates
- **Client Feedback**: Ratings and review summaries
- **Revenue Metrics**: Earnings and session statistics
- **Specialty Analysis**: Popular coaching areas

---

## 📅 Appointments Management

### Appointments Dashboard (`/admin/appointments`)

Comprehensive appointment monitoring and management system.

#### Appointment Overview

**Real-time Appointment Tracking**
- View all platform appointments/sessions
- Real-time status updates
- Comprehensive appointment details
- Client and coach information

**Appointment Statistics**
- **Total Appointments**: All-time appointment count
- **Scheduled**: Upcoming appointments
- **Completed**: Successfully finished sessions
- **Cancelled**: Cancelled appointments
- **No Shows**: Missed appointments

#### Filtering & Search
- **Status Filter**: scheduled, completed, cancelled, no-show
- **Date Range**: Today, this week, this month, custom range
- **Coach Filter**: Filter by specific coaches
- **Client Filter**: Filter by specific clients
- **Search**: Search by client/coach name or email

#### Appointment Details
- **Participant Information**: Client and coach details
- **Session Details**: Date, time, duration, type (video/in-person)
- **Status Tracking**: Current appointment status
- **Notes**: Session notes and comments
- **Session History**: Previous sessions between same participants

#### Appointment Actions
- **View Details**: Complete appointment information
- **Reschedule**: Modify appointment time/date
- **Cancel**: Cancel appointments with reasons
- **Add Notes**: Administrative notes and comments
- **Contact Participants**: Send messages to client/coach

#### Session Types
- **Video Sessions**: Online coaching via video calls
- **In-Person Sessions**: Face-to-face coaching meetings
- **Phone Sessions**: Audio-only coaching calls

---

## 📊 Analytics & Reporting

### Analytics Dashboard (`/admin/analytics`)

Comprehensive analytics and reporting system for platform insights.

#### Overview Metrics

**Platform Growth**
- **User Growth**: Client and coach registration trends
- **Session Growth**: Appointment booking trends
- **Revenue Growth**: Financial performance over time
- **Engagement Metrics**: User activity and retention

**Key Performance Indicators**
- **Total Users**: Platform user count
- **Total Coaches**: Active coach count
- **Total Sessions**: Completed session count
- **Total Revenue**: Platform revenue
- **Growth Percentages**: Period-over-period growth

#### User Analytics

**User Metrics**
- **New Users This Month**: Recent registrations
- **Active Users**: Users with recent activity
- **User Retention Rate**: User engagement over time
- **Average Sessions Per User**: Usage patterns

**User Behavior**
- **Registration Trends**: User signup patterns
- **Activity Patterns**: Peak usage times
- **Geographic Distribution**: User location data
- **Device Usage**: Platform access methods

#### Coach Analytics

**Coach Performance**
- **Average Rating**: Overall coach ratings
- **Total Coach Hours**: Cumulative coaching time
- **Average Session Duration**: Typical session length
- **Coach Utilization Rate**: Active coach percentage

**Top Performers**
- **Top Coaches**: Highest-rated coaches
- **Most Active Coaches**: Coaches with most sessions
- **Revenue Leaders**: Highest-earning coaches
- **Popular Specialties**: Most requested coaching areas

#### Financial Analytics

**Revenue Metrics**
- **Monthly Recurring Revenue**: Subscription income
- **Average Session Value**: Revenue per session
- **Revenue Per User**: User lifetime value
- **Conversion Rate**: Visitor to customer conversion

**Financial Trends**
- **Revenue Growth**: Historical revenue trends
- **Seasonal Patterns**: Revenue seasonality
- **Payment Methods**: Preferred payment options
- **Refund Rates**: Customer satisfaction indicators

#### Session Analytics

**Session Metrics**
- **Completion Rate**: Successfully completed sessions
- **No-Show Rate**: Missed appointment percentage
- **Cancellation Rate**: Cancelled session percentage
- **Average Rating**: Session satisfaction scores

**Session Patterns**
- **Peak Hours**: Most popular booking times
- **Session Duration**: Average and preferred lengths
- **Booking Lead Time**: Advance booking patterns
- **Repeat Bookings**: Client retention indicators

---

## ⚙️ Settings Management

### Settings Dashboard (`/admin/settings`)

Comprehensive platform configuration and settings management.

#### General Settings

**Platform Configuration**
- **Site Name**: Platform branding and name
- **Site Description**: Platform description and tagline
- **Support Email**: Customer support contact
- **Maintenance Mode**: Platform maintenance toggle
- **Registration Settings**: User registration controls
- **Coach Approval**: Automatic vs manual coach approval

#### Notification Settings

**Email Notifications**
- **User Welcome Emails**: New user onboarding
- **Appointment Reminders**: Session reminder emails
- **Coach Application Updates**: Application status notifications
- **Admin Alerts**: Administrative notifications

**Communication Preferences**
- **SMS Notifications**: Text message alerts
- **Push Notifications**: Browser/app notifications
- **Email Templates**: Customizable email content
- **Notification Frequency**: Alert timing settings

#### Security Settings

**Authentication Configuration**
- **Session Timeout**: User session duration
- **Password Requirements**: Password complexity rules
- **Two-Factor Authentication**: 2FA settings
- **Login Attempt Limits**: Brute force protection
- **IP Whitelisting**: Access restriction settings

**Data Protection**
- **Data Retention**: User data storage policies
- **Privacy Settings**: Data sharing preferences
- **GDPR Compliance**: European data protection
- **Audit Logging**: System activity tracking

#### Payment Settings

**Payment Configuration**
- **Payment Processors**: Stripe, PayPal integration
- **Currency Settings**: Supported currencies
- **Tax Configuration**: Tax rates and rules
- **Processing Fees**: Platform commission rates
- **Payout Settings**: Coach payment schedules

#### Scheduling Settings

**Appointment Configuration**
- **Default Session Duration**: Standard session length
- **Booking Window**: Advance booking limits
- **Cancellation Policy**: Cancellation rules
- **Time Zone Settings**: Platform time zone
- **Business Hours**: Operating hours configuration

**Availability Settings**
- **Coach Availability**: Default availability options
- **Booking Restrictions**: Scheduling limitations
- **Holiday Calendar**: Platform holidays
- **Blackout Dates**: Unavailable dates

---

## 🔐 Security Features

### Authentication & Authorization

**JWT-Based Authentication**
- Secure token-based authentication system
- Automatic token refresh and validation
- Secure logout with token cleanup
- Session management and timeout

**Role-Based Access Control**
- **Admin Role**: Full platform access
- **Coach Role**: Coach-specific features
- **Client Role**: Client-specific features
- **Staff Role**: Limited administrative access

**Password Security**
- Bcrypt password hashing with salt rounds
- Strong password requirements
- Password reset functionality
- Account lockout protection

### User Impersonation

**Safe User Impersonation**
- Secure login as any user for support
- Audit trail of impersonation sessions
- Time-limited impersonation tokens
- Easy return to admin account

**Impersonation Features**
- Support ticket resolution
- User experience testing
- Account troubleshooting
- Training and demonstration

### Data Protection

**Data Security**
- Encrypted data transmission (HTTPS)
- Secure database connections
- Input validation and sanitization
- SQL injection prevention

**Privacy Protection**
- User data anonymization options
- GDPR compliance features
- Data export and deletion
- Privacy policy enforcement

---

## 🔌 API Documentation

### Authentication Endpoints

```typescript
// Admin Login
POST /api/auth/login
Body: { email: string, password: string }
Response: { success: boolean, token: string, user: AdminUser }

// Create Admin
POST /api/auth/create-admin
Body: { email: string, password: string, firstName: string, lastName: string }
Response: { success: boolean, token: string, user: AdminUser }

// Get Profile
GET /api/auth/profile
Headers: { Authorization: "Bearer <token>" }
Response: { success: boolean, user: AdminUser }
```

### Dashboard Endpoints

```typescript
// Dashboard Statistics
GET /api/admin/dashboard
Headers: { Authorization: "Bearer <token>" }
Response: {
  totalUsers: number,
  totalCoaches: number,
  totalClients: number,
  totalAppointments: number,
  pendingApprovals: number,
  activeMatches: number,
  monthlyRevenue: number,
  recentActivity: Activity[]
}

// System Health
GET /api/admin/health
Response: {
  status: "healthy" | "unhealthy",
  database: "connected" | "disconnected",
  timestamp: string
}
```

### User Management Endpoints

```typescript
// List Users
GET /api/admin/users?status=<status>&role=<role>
Headers: { Authorization: "Bearer <token>" }
Response: { users: User[] }

// Get User Details
GET /api/admin/users/:id?type=<userType>
Headers: { Authorization: "Bearer <token>" }
Response: { user: User }

// Create User
POST /api/admin/users
Headers: { Authorization: "Bearer <token>" }
Body: { userType: string, userData: UserData }
Response: { success: boolean, user: User }

// Update User
PUT /api/admin/users/:id
Headers: { Authorization: "Bearer <token>" }
Body: { userType: string, userData: UserData }
Response: { success: boolean, user: User }

// Delete User
DELETE /api/admin/users/:id?userType=<type>
Headers: { Authorization: "Bearer <token>" }
Response: { success: boolean, deletedUser: User }

// User Actions
POST /api/admin/users/:id/:action
Headers: { Authorization: "Bearer <token>" }
Body: { userType: string }
Response: { success: boolean, user: User }

// User Impersonation
POST /api/admin/users/:id/impersonate
Headers: { Authorization: "Bearer <token>" }
Body: { userType: string }
Response: { success: boolean, token: string, user: User }
```

### Coach Management Endpoints

```typescript
// List Coaches
GET /api/admin/coaches?status=<status>
Headers: { Authorization: "Bearer <token>" }
Response: { coaches: Coach[] }

// Coach Actions
PUT /api/admin/coaches/:id/:action
Headers: { Authorization: "Bearer <token>" }
Body: { reason?: string }
Response: { success: boolean, coach: Coach }
```

### Appointments Endpoints

```typescript
// List Appointments
GET /api/admin/appointments?status=<status>&date=<date>
Headers: { Authorization: "Bearer <token>" }
Response: { appointments: Appointment[] }
```

### Analytics Endpoints

```typescript
// Analytics Data
GET /api/admin/analytics?timeRange=<range>
Headers: { Authorization: "Bearer <token>" }
Response: {
  overview: OverviewMetrics,
  userMetrics: UserMetrics,
  coachMetrics: CoachMetrics,
  financialMetrics: FinancialMetrics,
  sessionMetrics: SessionMetrics,
  topCoaches: TopCoach[],
  topSpecialties: TopSpecialty[]
}
```

### Settings Endpoints

```typescript
// Get Settings
GET /api/admin/settings
Headers: { Authorization: "Bearer <token>" }
Response: { settings: PlatformSettings }

// Update Settings
POST /api/admin/settings
Headers: { Authorization: "Bearer <token>" }
Body: { settings: PlatformSettings }
Response: { success: boolean, message: string }
```

---

## 🗄️ Database Schema

### Core Tables

**admins**
```sql
CREATE TABLE admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  password_hash TEXT NOT NULL,
  role VARCHAR(20) DEFAULT 'admin',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**clients**
```sql
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone TEXT,
  dob DATE,
  location_state TEXT,
  gender_identity TEXT,
  ethnic_identity TEXT,
  religious_background TEXT,
  preferred_language TEXT,
  areas_of_concern TEXT[],
  availability TEXT[],
  preferred_coach_gender TEXT,
  bio TEXT,
  password_hash TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**coaches**
```sql
CREATE TABLE coaches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone TEXT,
  is_available BOOLEAN DEFAULT true,
  bio TEXT,
  years_experience INT,
  hourly_rate_usd NUMERIC(10,2),
  qualifications TEXT,
  specialties TEXT[],
  languages TEXT[],
  rating NUMERIC(3,2),
  password_hash TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**sessions**
```sql
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id),
  coach_id UUID REFERENCES coaches(id),
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  scheduled_at TIMESTAMPTZ,
  status TEXT DEFAULT 'scheduled',
  notes TEXT,
  session_type TEXT DEFAULT 'video',
  duration_minutes INT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Relationship Mapping

- **One-to-Many**: Coach → Sessions, Client → Sessions
- **Many-to-Many**: Coaches ↔ Specialties (via array)
- **Foreign Keys**: Proper referential integrity
- **Indexes**: Optimized for common queries

---

## 🛠️ Technical Implementation

### Frontend Architecture

**Next.js 14 Features**
- App Router for modern routing
- Server-side rendering (SSR)
- Static site generation (SSG)
- API routes for backend integration

**React Components**
- Functional components with hooks
- TypeScript for type safety
- Custom hooks for data fetching
- Context for state management

**Styling & UI**
- Tailwind CSS for styling
- Lucide React for icons
- Responsive design patterns
- Dark mode support

### Backend Architecture

**Express.js Server**
- RESTful API design
- Middleware for authentication
- Error handling and logging
- CORS configuration

**Database Integration**
- Supabase client for PostgreSQL
- Connection pooling
- Query optimization
- Transaction support

**Authentication System**
- JWT token generation
- Bcrypt password hashing
- Role-based middleware
- Session management

### Security Implementation

**Input Validation**
- Request body validation
- SQL injection prevention
- XSS protection
- CSRF protection

**Authentication Flow**
1. User login with credentials
2. Password verification with bcrypt
3. JWT token generation
4. Token validation on requests
5. Role-based access control

**Data Protection**
- Encrypted data transmission
- Secure password storage
- User data anonymization
- Audit trail logging

---

## 🔧 Troubleshooting Guide

### Common Issues

**Login Problems**
```
Issue: Cannot login to admin dashboard
Solutions:
1. Verify admin user exists in database
2. Check password hash in database
3. Verify JWT_SECRET environment variable
4. Check network connectivity
5. Clear browser cache and cookies
```

**Dashboard Loading Issues**
```
Issue: Dashboard shows loading indefinitely
Solutions:
1. Check browser console for errors
2. Verify API endpoints are accessible
3. Check authentication token validity
4. Verify database connection
5. Check CORS configuration
```

**User Management Errors**
```
Issue: Cannot create or update users
Solutions:
1. Check database table permissions
2. Verify required fields are provided
3. Check for duplicate email addresses
4. Verify foreign key constraints
5. Check validation rules
```

**Appointment Data Issues**
```
Issue: Appointments not loading or showing errors
Solutions:
1. Verify sessions table exists
2. Check foreign key relationships
3. Verify data transformation logic
4. Check date/time formatting
5. Verify user permissions
```

### Debug Steps

**Backend Debugging**
1. Check server logs for errors
2. Test API endpoints with Postman
3. Verify database queries
4. Check environment variables
5. Test authentication flow

**Frontend Debugging**
1. Check browser console errors
2. Verify network requests
3. Check component state
4. Test authentication flow
5. Verify routing configuration

**Database Debugging**
1. Check table existence
2. Verify data integrity
3. Test queries manually
4. Check foreign key constraints
5. Verify permissions

### Performance Optimization

**Database Optimization**
- Add indexes for common queries
- Optimize complex joins
- Use connection pooling
- Implement query caching
- Monitor query performance

**Frontend Optimization**
- Implement lazy loading
- Optimize bundle size
- Use React.memo for components
- Implement virtual scrolling
- Cache API responses

**API Optimization**
- Implement response caching
- Use pagination for large datasets
- Optimize database queries
- Implement rate limiting
- Use compression middleware

---

## 📈 Future Enhancements

### Planned Features

**Advanced Analytics**
- Custom report builder
- Data visualization charts
- Export to PDF/Excel
- Scheduled reports
- Real-time dashboards

**Enhanced Security**
- Multi-factor authentication
- Single sign-on (SSO)
- Advanced audit logging
- IP-based restrictions
- Security monitoring

**Automation Features**
- Automated coach approval
- Smart scheduling
- Automated notifications
- Workflow automation
- AI-powered insights

**Integration Capabilities**
- Third-party calendar sync
- Payment gateway integration
- CRM system integration
- Email marketing tools
- Video conferencing APIs

### Scalability Considerations

**Performance Scaling**
- Database sharding
- CDN implementation
- Caching strategies
- Load balancing
- Microservices architecture

**Feature Scaling**
- Plugin architecture
- API versioning
- Feature flags
- A/B testing framework
- Multi-tenant support

---

## 📞 Support & Maintenance

### Regular Maintenance Tasks

**Daily Tasks**
- Monitor system health
- Check error logs
- Review user feedback
- Monitor performance metrics
- Backup verification

**Weekly Tasks**
- Database maintenance
- Security updates
- Performance analysis
- User activity review
- Feature usage analysis

**Monthly Tasks**
- Security audit
- Performance optimization
- Feature planning
- User feedback analysis
- System updates

### Support Procedures

**Issue Resolution**
1. Identify and categorize issue
2. Check known issues database
3. Reproduce issue in test environment
4. Implement and test fix
5. Deploy fix to production
6. Monitor for resolution

**User Support**
- Admin user training
- Documentation updates
- Feature demonstrations
- Best practice guidance
- Troubleshooting assistance

---

**Last Updated**: January 2024  
**Version**: 1.0  
**Maintained By**: ACFL Development Team

---

*This documentation covers the complete ACFL Admin System implementation. For technical support or feature requests, please contact the development team.*