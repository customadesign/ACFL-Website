# ACT Coaching For Life - Project Scope Document

**Project Manager:** Pat  
**Lead Developer:** Gabe  
**Date:** December 2024  
**Version:** 1.0  

---

## Executive Summary

ACT Coaching For Life is a comprehensive coaching platform designed to connect individuals seeking life coaching services with qualified coaches. The platform operates similarly to BetterHelp.com, providing an automated matching system, appointment scheduling, and communication tools. The system is structured as a multi-dashboard application with separate interfaces for members, coaches, and administrators.

## Project Overview

### Core Mission
To create a seamless platform that connects individuals with relationship issues, work-related challenges, family problems, and other life coaching needs with the most suitable coaches through an intelligent matching algorithm.

### Key Differentiators
- **Terminology Compliance:** All references use "coaches" instead of "therapists" to comply with regulatory requirements
- **Intelligent Matching:** Automated algorithm-based coach-patient matching
- **Multi-Dashboard Architecture:** Separate, specialized interfaces for different user types
- **Integrated Communication:** Built-in messaging system for coach-client communication
- **Video Integration:** VideoSDK integration for virtual sessions

---

## Technical Architecture

### Current Infrastructure
- **Backend API:** Express.js with TypeScript (Port 3001)
- **Members Dashboard:** Next.js frontend (Port 4000)
- **Coaches Dashboard:** Next.js frontend (Port 4002)
- **Admin Dashboard:** Next.js frontend (Port 4003)
- **Containerization:** Docker with docker-compose
- **Database:** Supabase (PostgreSQL with real-time capabilities)
- **Authentication:** Supabase Auth with role-based access control

### Technology Stack
- **Frontend:** Next.js, TypeScript, Material UI, Tailwind CSS
- **Backend:** Node.js, Express.js, TypeScript
- **Database:** Supabase (PostgreSQL with real-time capabilities)
- **Authentication:** Supabase Auth with role-based access
- **Infrastructure:** Docker, Docker Compose
- **Video Integration:** VideoSDK (planned)
- **Payment Processing:** Stripe API (future phase)

---

## Functional Requirements

### 1. Member Experience (Port 4000)

#### Core Features
- **Assessment Questionnaire:** Multi-step form to capture patient needs and preferences
- **Coach Matching:** Automated algorithm-based matching with multiple coaches
- **Coach Profiles:** Detailed coach information, specialties, and availability
- **Saved Coaches:** Ability to save and manage favorite coaches
- **Appointment Scheduling:** Book consultations with saved coaches
- **Appointment Management:** View, cancel, and reschedule appointments
- **Messaging System:** Direct communication with coaches
- **Profile Management:** Personal information and preferences

#### User Flow
1. Member completes assessment questionnaire
2. System presents matched coaches with relevance scores
3. Member reviews and saves preferred coaches
4. Member schedules consultation with saved coach
5. Appointment appears as "pending" until coach approval
6. Coach approves appointment → status changes to "confirmed"
7. VideoSDK generates meeting link automatically

### 2. Coach Experience (Port 4002)

#### Core Features
- **Profile Management:** Complete coach profile with specialties, availability, and credentials
- **Appointment Calendar:** View, approve, and manage appointments
- **Client Management:** Access to client information and history
- **Session Tracking:** Record session notes and outcomes
- **Performance Metrics:** Dashboard with booking statistics and earnings
- **Messaging Center:** Unified inbox for client communications
- **Availability Settings:** Set working hours and availability preferences

#### Coach Dashboard Workflow
1. Coach receives appointment requests
2. Coach reviews client information and assessment
3. Coach approves or declines appointment
4. Approved appointments generate VideoSDK links
5. Coach conducts sessions and tracks outcomes
6. Coach manages ongoing client relationships

### 3. Admin Experience (Port 4003)

#### Core Features
- **Platform Overview:** System-wide analytics and metrics
- **Coach Management:** Approve, suspend, or remove coaches
- **Member Management:** View member accounts and activity
- **Appointment Oversight:** Monitor all appointments and intervene if needed
- **System Administration:** Platform configuration and maintenance
- **Reporting:** Generate reports on platform usage and performance

#### Admin Capabilities
- View all coach appointments and client interactions
- Cancel or modify appointments from backend
- Access VideoSDK information for all sessions
- Monitor messaging between coaches and clients
- Generate platform analytics and reports

---

## Current Development Status

### ✅ Completed Components
- **Multi-Dashboard Architecture:** All three dashboards are set up and running
- **Docker Configuration:** Complete containerization with docker-compose
- **Backend API Structure:** Express.js backend with TypeScript
- **Route Structure:** Admin, coach, and matching routes implemented
- **Development Environment:** Start scripts and development setup
- **CORS Configuration:** Cross-origin requests configured for all services
- **Supabase Integration Plan:** Complete database schema and integration strategy
- **Authentication Framework:** Supabase Auth configuration ready for implementation

### 🔄 In Progress
- **Matching Algorithm:** Basic implementation exists, needs enhancement
- **Coach Profiles:** Initial structure in place
- **Appointment System:** Basic framework implemented

### ❌ Pending Development
- **Supabase Implementation:** Database setup and integration
- **VideoSDK Integration:** Complete implementation required
- **Messaging System:** Unified inbox functionality with real-time capabilities
- **Payment Processing:** Stripe integration (future phase)
- **Advanced Matching:** Enhanced algorithm with more criteria
- **Real-time Notifications:** Appointment updates and messaging

---

## Development Priorities

### Phase 1: Core Functionality (Immediate)
1. **Supabase Database Implementation**
   - Set up Supabase project and database schema
   - Migrate from CSV-based storage to PostgreSQL
   - Implement authentication and user management

2. **Complete Matching Algorithm**
   - Enhance existing algorithm with additional criteria
   - Implement relevance scoring system
   - Add coach availability filtering

3. **Appointment Management System**
   - Complete appointment booking flow
   - Implement approval/rejection workflow
   - Add appointment status tracking

4. **Coach Profile System**
   - Complete coach profile creation and editing
   - Add specialty and availability management
   - Implement profile search and filtering

### Phase 2: Communication & Integration (Short-term)
1. **Messaging System**
   - Implement unified inbox for all users
   - Add real-time messaging capabilities
   - Create message threading and history

2. **VideoSDK Integration**
   - Implement VideoSDK API integration
   - Generate meeting links automatically
   - Add session recording capabilities

3. **Enhanced Admin Features**
   - Complete appointment oversight tools
   - Add system-wide analytics
   - Implement user management features

### Phase 3: Advanced Features (Medium-term)
1. **Payment Processing**
   - Stripe API integration
   - Subscription management
   - Payment tracking and reporting

2. **Advanced Analytics**
   - Coach performance metrics
   - Client satisfaction tracking
   - Platform usage analytics

3. **Mobile Responsiveness**
   - Optimize all dashboards for mobile devices
   - Implement mobile-specific features

---

## Technical Specifications

### API Endpoints Required
- `POST /api/match` - Coach matching algorithm
- `GET /api/coaches` - Retrieve coach listings
- `POST /api/appointments` - Create appointments
- `PUT /api/appointments/:id` - Update appointment status
- `GET /api/messages` - Retrieve messages
- `POST /api/messages` - Send messages
- `GET /api/admin/overview` - Admin dashboard data

### Database Schema (Supabase Implementation)
- **Users Table:** Member and coach accounts with authentication
- **Coach Profiles Table:** Detailed coach information and specialties
- **Member Assessments Table:** Questionnaire responses for matching
- **Appointments Table:** Booking information and status tracking
- **Saved Coaches Table:** Member's favorite coaches
- **Messages Table:** Communication history with real-time capabilities
- **Session Notes Table:** Coach session documentation

### Security Requirements
- **Supabase Auth:** Built-in authentication and authorization
- **Row Level Security (RLS):** Fine-grained data access control
- **Role-based Access Control:** Member, Coach, Admin permissions
- **Secure API Endpoints:** Protected with authentication
- **Data Encryption:** Encrypted at rest and in transit
- **HIPAA Compliance:** Considerations for healthcare data

---

## Success Metrics

### Technical Metrics
- **System Uptime:** 99.9% availability
- **Response Time:** < 2 seconds for all API calls
- **Matching Accuracy:** > 85% client satisfaction with matches
- **Appointment Success Rate:** > 95% successful video sessions

### Business Metrics
- **User Engagement:** Average session duration and frequency
- **Coach Utilization:** Appointment booking rates
- **Client Retention:** Repeat booking rates
- **Platform Growth:** Monthly active users and coaches

---

## Risk Assessment

### Technical Risks
- **VideoSDK Integration Complexity:** May require significant development time
- **Scalability Challenges:** CSV-based storage may not handle growth
- **Real-time Features:** Messaging and notifications may require WebSocket implementation

### Mitigation Strategies
- **Phased Development:** Implement core features first, then advanced features
- **Database Migration:** Plan for database implementation early
- **Third-party Dependencies:** Research and test VideoSDK thoroughly before implementation

---

## Timeline and Milestones

### Week 1-2: Core Matching System
- Complete matching algorithm enhancement
- Implement coach profile management
- Basic appointment booking flow

### Week 3-4: Communication System
- Implement messaging functionality
- Add appointment approval workflow
- Basic admin oversight features

### Week 5-6: Video Integration
- VideoSDK API integration
- Automatic meeting link generation
- Session management features

### Week 7-8: Testing and Refinement
- End-to-end testing
- Bug fixes and performance optimization
- User experience improvements

---

## Next Steps for Gabe

### Immediate Actions Required
1. **Set Up Supabase:** Follow the SUPABASE_SETUP_GUIDE.md to create project and configure database
2. **Review Current Codebase:** Familiarize yourself with existing structure
3. **Set Up Development Environment:** Ensure all services run locally with Supabase integration
4. **Prioritize Feature Development:** Focus on core matching and appointment systems
5. **Database Migration:** Migrate from CSV-based storage to Supabase PostgreSQL

### Development Guidelines
- **Code Quality:** Maintain TypeScript standards and proper error handling
- **Testing:** Implement unit tests for critical functionality
- **Documentation:** Update API documentation as features are developed
- **Security:** Implement proper authentication and authorization

### Communication Protocol
- **Weekly Updates:** Provide progress reports on development milestones
- **Issue Tracking:** Use GitHub issues for bug tracking and feature requests
- **Code Reviews:** Regular code reviews for quality assurance

---

## Contact Information

**Project Manager:** Pat  
**Lead Developer:** Gabe  
**Project Repository:** ACT Coaching For Life/therapist-matcher  
**Documentation:** README.md, SETUP.md, PROJECT_SCOPE_GABE.md, SUPABASE_INTEGRATION_PLAN.md, SUPABASE_SETUP_GUIDE.md  

---

*This document serves as the primary reference for the ACT Coaching For Life platform development. All changes and updates should be reflected in this document to maintain project clarity and alignment.* 