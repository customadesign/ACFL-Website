import { Router, Request, Response } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { requirePermission } from '../middleware/adminAuth';
import { supabase } from '../lib/supabase';
import { JWTPayload } from '../types/auth';
import { uploadAttachment, uploadToSupabase } from '../middleware/upload';
import smtpEmailService from '../services/smtpEmailService';
import { generateSecurePassword } from '../utils/passwordGenerator';
import contentRoutes from './contentRoutes';
import financialRoutes from './financialRoutes';
import staffRoutes from './staffRoutes';
import { getStaffPermissions, updateStaffPermissions } from '../controllers/staffController';
import { auditLogger, AuditRequest } from '../utils/auditLogger';
import { appointmentReminderService } from '../services/appointmentReminderService';

interface AuthRequest extends Request {
  user?: JWTPayload;
}

const router = Router();

// Apply authentication and admin authorization to all routes
router.use((req: AuthRequest, res, next) => {
  console.log('Admin route accessed:', req.path);
  console.log('Request headers auth:', req.headers.authorization ? 'Present' : 'Missing');
  next();
});
router.use(authenticate);
router.use((req: AuthRequest, res, next) => {
  console.log('After authentication - user:', req.user);
  next();
});
router.use(authorize('admin', 'staff'));

// Notification counts endpoint
router.get('/notification-counts', async (req, res) => {
  try {
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    // Count new users (clients registered in last 24 hours)
    const { count: newClientsCount } = await supabase
      .from('clients')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', twentyFourHoursAgo.toISOString());
    
    // Count new coaches (coaches registered in last 24 hours)
    const { count: newCoachesCount } = await supabase
      .from('coaches')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', twentyFourHoursAgo.toISOString());
    
    // Count new appointments (scheduled in last 24 hours)
    const { count: newAppointmentsCount } = await supabase
      .from('sessions')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', twentyFourHoursAgo.toISOString())
      .in('status', ['scheduled', 'confirmed']);
    
    // Count unread system messages (this would need a system_messages table)
    // For now, we'll return 0 or you can implement your own logic
    const systemMessagesCount = 0;
    
    res.json({
      newUsers: (newClientsCount || 0) + (newCoachesCount || 0),
      newClients: newClientsCount || 0,
      newCoaches: newCoachesCount || 0,
      newAppointments: newAppointmentsCount || 0,
      systemMessages: systemMessagesCount,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching notification counts:', error);
    res.status(500).json({ 
      error: 'Failed to fetch notification counts',
      newUsers: 0,
      newAppointments: 0,
      systemMessages: 0
    });
  }
});

// Dashboard stats endpoint
router.get('/dashboard', async (req, res) => {
  try {
    // Get total users (clients + coaches)
    const { data: clients, error: clientsError } = await supabase
      .from('clients')
      .select('id, created_at, first_name, last_name, email');
    
    const { data: coaches, error: coachesError } = await supabase
      .from('coaches')
      .select('id, created_at, first_name, last_name, email, status, hourly_rate_usd');

    if (clientsError || coachesError) {
      throw new Error('Failed to fetch user data');
    }

    // Get appointments/sessions data - try both tables
    let appointments = [];
    let appointmentsError = null;
    
    // First try appointments table
    const appointmentsResult = await supabase
      .from('appointments')
      .select('id, status, created_at, scheduled_at, price');
    
    if (!appointmentsResult.error && appointmentsResult.data) {
      appointments = appointmentsResult.data;
      console.log('Found appointments:', appointments.length);
    } else {
      // If appointments table doesn't work, try sessions table
      const sessionsResult = await supabase
        .from('sessions')
        .select('id, status, created_at, scheduled_at, starts_at, duration_minutes');
      
      if (!sessionsResult.error && sessionsResult.data) {
        // Map sessions to appointments format
        appointments = sessionsResult.data.map(s => ({
          id: s.id,
          status: s.status,
          created_at: s.created_at,
          scheduled_at: s.scheduled_at || s.starts_at,
          price: 75 // Default price per session
        }));
        console.log('Found sessions (as appointments):', appointments.length);
      } else {
        appointmentsError = appointmentsResult.error || sessionsResult.error;
        console.log('No appointments or sessions found');
      }
    }

    // Get messages count for activity
    const { data: messages } = await supabase
      .from('messages')
      .select('id, created_at')
      .order('created_at', { ascending: false })
      .limit(10);

    // Calculate stats
    const totalUsers = (clients?.length || 0) + (coaches?.length || 0);
    const totalCoaches = coaches?.length || 0;
    const totalClients = clients?.length || 0;
    
    // Count ALL appointments (not just completed)
    const totalAppointments = appointments?.length || 0;
    const completedSessions = appointments?.filter(a => a.status === 'completed').length || 0;
    
    // Calculate pending approvals (coaches with pending status)
    const pendingApprovals = coaches?.filter(c => c.status === 'pending').length || 0;
    
    // Log for debugging
    console.log('Dashboard stats:', {
      totalClients,
      totalCoaches,
      coaches: coaches?.map(c => ({ name: `${c.first_name} ${c.last_name}`, status: c.status })),
      totalAppointments,
      completedSessions,
      pendingApprovals,
      appointmentsData: appointments?.slice(0, 3) // Show first 3 appointments
    });
    
    // Calculate active matches (appointments with scheduled status)
    const activeMatches = appointments?.filter(a => a.status === 'scheduled').length || 0;
    
    // Calculate monthly revenue from sessions
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const monthlySessions = appointments?.filter(session => {
      const sessionDate = new Date(session.scheduled_at || session.created_at);
      return sessionDate.getMonth() === currentMonth && sessionDate.getFullYear() === currentYear;
    }) || [];
    
    // Calculate revenue - use price if available, otherwise estimate
    const monthlyRevenue = monthlySessions.reduce((sum, session) => {
      return sum + (session.price || 75); // Use actual price or default $75
    }, 0);
    
    console.log('Monthly revenue calculation:', {
      currentMonth,
      currentYear,
      monthlySessions: monthlySessions.length,
      monthlyRevenue
    });

    // Generate recent activity from real data
    const recentActivity = [];
    
    // Add recent client registrations
    const recentClients = clients?.slice(-3).reverse() || [];
    recentClients.forEach(client => {
      const timeAgo = getTimeAgo(new Date(client.created_at));
      recentActivity.push({
        id: `client-${client.id}`,
        type: 'user_registered',
        title: 'New Client Registration',
        description: `${client.first_name || ''} ${client.last_name || ''} registered as a new client`,
        time: timeAgo
      });
    });
    
    // Add recent coach registrations/approvals
    const recentCoaches = coaches?.slice(-2).reverse() || [];
    recentCoaches.forEach(coach => {
      const timeAgo = getTimeAgo(new Date(coach.created_at));
      if (coach.status === 'approved') {
        recentActivity.push({
          id: `coach-${coach.id}`,
          type: 'coach_approved',
          title: 'Coach Approved',
          description: `${coach.first_name || ''} ${coach.last_name || ''} was approved as a coach`,
          time: timeAgo
        });
      } else if (coach.status === 'pending') {
        recentActivity.push({
          id: `coach-${coach.id}`,
          type: 'coach_pending',
          title: 'New Coach Application',
          description: `${coach.first_name || ''} ${coach.last_name || ''} applied to be a coach`,
          time: timeAgo
        });
      }
    });
    
    // Add recent sessions (appointments)
    const recentSessions = appointments?.slice(-3).reverse() || [];
    recentSessions.forEach(session => {
      const timeAgo = getTimeAgo(new Date(session.created_at));
      recentActivity.push({
        id: `session-${session.id}`,
        type: 'appointment_booked',
        title: 'Session Scheduled',
        description: `New session scheduled for ${new Date(session.scheduled_at).toLocaleDateString()}`,
        time: timeAgo
      });
    });
    
    // Sort activity by recency and take top 10
    recentActivity.sort((a, b) => {
      // This is a simplified sort, in production you'd want to store actual timestamps
      return 0;
    }).slice(0, 10);

    res.json({
      totalUsers,
      totalCoaches,
      totalClients,
      totalAppointments,
      pendingApprovals,
      activeMatches,
      monthlyRevenue,
      recentActivity
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
});

// Helper function to calculate time ago
function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 30) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  return date.toLocaleDateString();
}

// User management endpoints
router.get('/users', async (req, res) => {
  try {
    const { status, role } = req.query;
    console.log('Admin users endpoint called with query:', { status, role });

    let users = [];

    // Test database connection first
    try {
      const { data: testData, error: testError } = await supabase
        .from('clients')
        .select('count', { count: 'exact' });
      console.log('Database connection test - clients count:', testData, testError);
    } catch (testErr) {
      console.error('Database connection test failed:', testErr);
    }

    // Get clients with error handling
    try {
      const { data: clients, error: clientsError } = await supabase
        .from('clients')
        .select('id, first_name, last_name, email, phone, created_at, last_login, status, profile_photo, is_active, deactivated_at');

      if (clientsError) {
        console.error('Clients fetch error:', clientsError);
      } else if (clients && clients.length > 0) {
        console.log(`Found ${clients.length} clients`);
        users.push(...clients.map(client => ({
          ...client,
          name: `${client.first_name || ''} ${client.last_name || ''}`.trim() || 'Unnamed User',
          role: 'client',
          status: client.is_active === false ? 'inactive' : (client.status || 'active')
        })));
      }
    } catch (clientError) {
      console.error('Client query error:', clientError);
    }

    // Get coaches with error handling
    try {
      const { data: coaches, error: coachesError } = await supabase
        .from('coaches')
        .select('id, first_name, last_name, email, phone, created_at, last_login, status, profile_photo, is_active, deactivated_at');

      if (coachesError) {
        console.error('Coaches fetch error:', coachesError);
      } else if (coaches && coaches.length > 0) {
        console.log(`Found ${coaches.length} coaches`);
        users.push(...coaches.map(coach => ({
          ...coach,
          name: `${coach.first_name || ''} ${coach.last_name || ''}`.trim() || 'Unnamed Coach',
          role: 'coach',
          status: coach.is_active === false ? 'inactive' : (coach.status || 'active')
        })));
      }
    } catch (coachError) {
      console.error('Coach query error:', coachError);
    }

    // Get staff with error handling
    try {
      const { data: staff, error: staffError } = await supabase
        .from('staff')
        .select('id, first_name, last_name, email, phone, created_at, last_login, status, profile_photo, department, role_level');

      if (staffError) {
        console.error('Staff fetch error:', staffError);
      } else if (staff && staff.length > 0) {
        console.log(`Found ${staff.length} staff members`);
        users.push(...staff.map(staffMember => ({
          ...staffMember,
          name: `${staffMember.first_name || ''} ${staffMember.last_name || ''}`.trim() || 'Unnamed Staff',
          role: 'staff',
          status: staffMember.status || 'active',
          department: staffMember.department,
          role_level: staffMember.role_level
        })));
      }
    } catch (staffError) {
      console.error('Staff query error:', staffError);
    }

    console.log(`Total users found: ${users.length}`);
    console.log('Users data:', JSON.stringify(users, null, 2));

    // Apply filters
    let filteredUsers = users;
    if (role && role !== 'all') {
      filteredUsers = filteredUsers.filter(user => user.role === role);
    }
    if (status && status !== 'all') {
      filteredUsers = filteredUsers.filter(user => user.status === status);
    }

    console.log(`Filtered users: ${filteredUsers.length}`);

    // Return array of users wrapped in an object with 'users' key
    res.json({ users: filteredUsers });
  } catch (error) {
    console.error('Users fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Export users as CSV
router.get('/users/export', async (req, res) => {
  try {
    const { status, role, search } = req.query;
    console.log('Admin users export endpoint called with query:', { status, role, search });

    let users = [];

    // Get clients
    const { data: clients, error: clientsError } = await supabase
      .from('clients')
      .select('id, first_name, last_name, email, phone, created_at, last_login, status, profile_photo, dob, gender_identity, ethnic_identity, religious_background, is_active, deactivated_at');

    if (!clientsError && clients) {
      users.push(...clients.map(client => ({
        ...client,
        role: 'client',
        name: `${client.first_name || ''} ${client.last_name || ''}`.trim(),
        status: client.is_active === false ? 'inactive' : (client.status || 'active')
      })));
    }

    // Get coaches
    const { data: coaches, error: coachesError } = await supabase
      .from('coaches')
      .select('id, first_name, last_name, email, phone, created_at, last_login, status, profile_photo, specialties, years_experience, hourly_rate_usd, bio, qualifications, is_active, deactivated_at');

    if (!coachesError && coaches) {
      users.push(...coaches.map(coach => ({
        ...coach,
        role: 'coach',
        name: `${coach.first_name || ''} ${coach.last_name || ''}`.trim(),
        status: coach.is_active === false ? 'inactive' : (coach.status || 'active')
      })));
    }

    // Get staff
    const { data: staff, error: staffError } = await supabase
      .from('staff')
      .select('id, first_name, last_name, email, phone, created_at, last_login, status, profile_photo, department, role_level');

    if (!staffError && staff) {
      users.push(...staff.map(staffMember => ({
        ...staffMember,
        role: 'staff',
        name: `${staffMember.first_name || ''} ${staffMember.last_name || ''}`.trim(),
        status: staffMember.status || 'active'
      })));
    }

    // Apply filters
    let filteredUsers = users;

    if (role && role !== 'all') {
      filteredUsers = filteredUsers.filter(user => user.role === role);
    }

    if (status && status !== 'all') {
      filteredUsers = filteredUsers.filter(user => user.status === status);
    }

    if (search) {
      const searchLower = search.toString().toLowerCase();
      filteredUsers = filteredUsers.filter(user =>
        user.name.toLowerCase().includes(searchLower) ||
        user.email?.toLowerCase().includes(searchLower)
      );
    }

    // Create CSV content
    const csvRows = [];

    // Add header row
    csvRows.push([
      'ID',
      'Role',
      'First Name',
      'Last Name',
      'Email',
      'Phone',
      'Status',
      'Created At',
      'Last Login',
      'Department',
      'Role Level',
      'Specialties',
      'Years Experience',
      'Hourly Rate (USD)',
      'Date of Birth',
      'Gender Identity',
      'Ethnic Identity',
      'Religious Background'
    ].join(','));

    // Add data rows
    filteredUsers.forEach(user => {
      const row = [
        user.id || '',
        user.role || '',
        user.first_name || '',
        user.last_name || '',
        user.email || '',
        user.phone || '',
        user.status || '',
        user.created_at || '',
        user.last_login || '',
        user.department || '',
        user.role_level || '',
        Array.isArray(user.specialties) ? user.specialties.join(';') : '',
        user.years_experience || '',
        user.hourly_rate_usd || '',
        user.dob || '',
        user.gender_identity || '',
        user.ethnic_identity || '',
        user.religious_background || ''
      ].map(field => {
        // Escape fields that contain commas, quotes, or newlines
        const stringField = String(field);
        if (stringField.includes(',') || stringField.includes('"') || stringField.includes('\n')) {
          return `"${stringField.replace(/"/g, '""')}"`;
        }
        return stringField;
      }).join(',');

      csvRows.push(row);
    });

    const csvContent = csvRows.join('\n');

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const filename = `users_export_${timestamp}.csv`;

    // Set response headers for CSV download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    res.send(csvContent);
  } catch (error) {
    console.error('Users export error:', error);
    res.status(500).json({ error: 'Failed to export users' });
  }
});

// Create new user (client, coach, or staff) - Admin only
router.post('/users', authorize('admin'), async (req, res) => {
  try {
    const { userType, userData } = req.body;
    
    console.log('User creation request:', { userType, userData: { ...userData, password: userData.password ? '[HIDDEN]' : 'none' } });
    
    if (!userType || !userData) {
      return res.status(400).json({ error: 'User type and user data are required' });
    }
    
    // Basic validation
    if (!userData.firstName || !userData.lastName || !userData.email) {
      return res.status(400).json({ error: 'First name, last name, and email are required' });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userData.email)) {
      return res.status(400).json({ error: 'Please enter a valid email address' });
    }

    // Check if email already exists across ALL user tables (clients, coaches, staff)
    console.log('Checking for existing email:', userData.email);

    const [clientCheck, coachCheck, staffCheck] = await Promise.all([
      supabase.from('clients').select('id, email').eq('email', userData.email).single(),
      supabase.from('coaches').select('id, email').eq('email', userData.email).single(),
      supabase.from('staff').select('id, email').eq('email', userData.email).single()
    ]);

    let existingUserType = null;
    if (clientCheck.data) existingUserType = 'client';
    else if (coachCheck.data) existingUserType = 'coach';
    else if (staffCheck.data) existingUserType = 'staff';

    if (existingUserType) {
      console.log(`Email ${userData.email} already exists as ${existingUserType}`);
      return res.status(409).json({
        error: 'Email already exists',
        message: `A ${existingUserType} with email "${userData.email}" already exists in the system. Please use a different email address.`,
        existingUserType: existingUserType
      });
    }
    
    console.log('Email validation passed - email is unique across all user types');

    // Generate password if not provided
    let temporaryPassword = userData.password;
    if (!temporaryPassword) {
      temporaryPassword = generateSecurePassword();
      console.log('Generated temporary password for user:', userData.email);
    }

    // Hash password
    let hashedPassword = null;
    if (temporaryPassword) {
      console.log('Hashing temporary password...');
      const bcrypt = require('bcryptjs');
      const saltRounds = parseInt(process.env.BCRYPT_ROUNDS || '12');
      hashedPassword = await bcrypt.hash(temporaryPassword, saltRounds);
      console.log('Password hashed successfully');
    }

    let result;
    
    switch (userType) {
      case 'client':
        const clientData = {
          first_name: userData.firstName,
          last_name: userData.lastName,
          email: userData.email,
          phone: userData.phone || null,
          dob: userData.dob || null,
          gender_identity: userData.genderIdentity || null,
          ethnic_identity: userData.ethnicIdentity || null,
          religious_background: userData.religiousBackground || null,
          status: userData.status || 'active',
          password_hash: hashedPassword,
          created_at: new Date().toISOString()
        };
        
        console.log('Creating client with data:', clientData);
        
        const { data: newClient, error: clientError } = await supabase
          .from('clients')
          .insert([clientData])
          .select()
          .single();
        
        if (clientError) {
          console.error('Client creation error:', clientError);
          if (clientError.code === '23505') { // Unique constraint violation
            return res.status(409).json({
              error: 'Email already exists',
              message: 'A client with this email address already exists in the system'
            });
          }
          throw new Error(`Failed to create client: ${clientError.message}`);
        }
        const { password_hash: _, ...safeClient } = newClient;
        result = { ...safeClient, role: 'client' };
        break;

      case 'coach':
        const coachData = {
          first_name: userData.firstName,
          last_name: userData.lastName,
          email: userData.email,
          phone: userData.phone || null,
          specialties: userData.specialties || [],
          years_experience: userData.yearsExperience || 1,
          hourly_rate_usd: userData.hourlyRate || 75,
          bio: userData.bio || 'Professional ACT coach ready to help you achieve your goals',
          qualifications: userData.qualifications || ['Certified Life Coach'],
          languages: userData.languages || ['English'],
          is_available: true,
          rating: userData.rating || null,
          status: userData.status || 'pending',
          password_hash: hashedPassword,
          created_at: new Date().toISOString()
        };
        
        console.log('Creating coach with data:', coachData);
        
        const { data: newCoach, error: coachError } = await supabase
          .from('coaches')
          .insert([coachData])
          .select()
          .single();
        
        if (coachError) {
          console.error('Coach creation error:', coachError);
          if (coachError.code === '23505') { // Unique constraint violation
            return res.status(409).json({
              error: 'Email already exists',
              message: 'A coach with this email address already exists in the system'
            });
          }
          throw new Error(`Failed to create coach: ${coachError.message}`);
        }
        const { password_hash: __, ...safeCoach } = newCoach;
        result = { ...safeCoach, role: 'coach' };
        break;

      case 'staff':
        const staffData = {
          first_name: userData.firstName,
          last_name: userData.lastName,
          email: userData.email,
          phone: userData.phone || null,
          department: userData.department || null,
          role_level: 'staff',
          status: userData.status || 'active',
          password_hash: hashedPassword,
          is_verified: true,
          created_at: new Date().toISOString()
        };

        console.log('Creating staff with data:', staffData);

        const { data: newStaff, error: staffError } = await supabase
          .from('staff')
          .insert([staffData])
          .select()
          .single();
        
        if (staffError) {
          console.error('Staff creation error:', staffError);
          if (staffError.code === '23505') { // Unique constraint violation
            return res.status(409).json({
              error: 'Email already exists',
              message: 'A staff member with this email address already exists in the system'
            });
          }
          throw new Error(`Failed to create staff: ${staffError.message}`);
        }
        const { password_hash: ___, ...safeStaff } = newStaff;
        result = { ...safeStaff, role: 'staff' };
        break;

      default:
        return res.status(400).json({ error: 'Invalid user type' });
    }

    // Send credentials via email
    if (temporaryPassword) {
      try {
        console.log('Sending credentials email to:', userData.email);
        const emailResult = await smtpEmailService.sendUserCredentials({
          email: userData.email,
          password: temporaryPassword,
          firstName: userData.firstName,
          lastName: userData.lastName,
          role: userType
        });
        
        if (emailResult.success) {
          console.log('Credentials email sent successfully');
        } else {
          console.error('Failed to send credentials email:', emailResult.error);
        }
      } catch (emailError) {
        console.error('Error sending credentials email:', emailError);
        // Don't fail the user creation if email fails
      }
    }

    // Log the admin action
    const auditReq = req as AuditRequest;
    await auditLogger.logAction(auditReq, {
      action: 'USER_CREATED',
      resource_type: userType,
      resource_id: result.id,
      details: `Created ${userType} user: ${userData.firstName} ${userData.lastName} (${userData.email})`,
      metadata: {
        user_type: userType,
        user_id: result.id,
        email: userData.email,
        status: userData.status || (userType === 'coach' ? 'pending' : 'active'),
        email_sent: temporaryPassword ? true : false
      }
    });

    res.status(201).json({
      success: true,
      message: `${userType} created successfully${temporaryPassword ? ' and credentials sent via email' : ''}`,
      user: result,
      emailSent: temporaryPassword ? true : false
    });
  } catch (error) {
    console.error('User creation error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to create user';
    res.status(500).json({ 
      error: errorMessage,
      details: error instanceof Error ? error.stack : error
    });
  }
});

// Get specific user details
router.get('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { type } = req.query;

    let user = null;
    let userType = type;

    // If type is not specified, search in all tables
    if (!userType) {
      // Try clients first
      const { data: client } = await supabase
        .from('clients')
        .select('*')
        .eq('id', id)
        .single();
      
      if (client) {
        user = { ...client, role: 'client' };
        userType = 'client';
      } else {
        // Try coaches
        const { data: coach } = await supabase
          .from('coaches')
          .select('*')
          .eq('id', id)
          .single();
        
        if (coach) {
          user = { ...coach, role: 'coach' };
          userType = 'coach';
        } else {
          // Try staff in staff table
          const { data: staff } = await supabase
            .from('staff')
            .select('*')
            .eq('id', id)
            .single();

          if (staff) {
            user = { ...staff, role: 'staff' };
            userType = 'staff';
          }
        }
      }
    } else {
      // Search in specific table
      let tableName;
      let query;
      
      switch (userType) {
        case 'client':
          tableName = 'clients';
          query = supabase.from(tableName).select('*').eq('id', id);
          break;
        case 'coach':
          tableName = 'coaches';
          query = supabase.from(tableName).select('*').eq('id', id);
          break;
        case 'staff':
          tableName = 'staff';
          query = supabase.from(tableName).select('*').eq('id', id);
          break;
        default:
          return res.status(400).json({ error: 'Invalid user type' });
      }
      
      const { data, error } = await query.single();
      if (error) throw error;
      user = { ...data, role: userType };
    }

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    console.error('User fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Update user - Admin only
router.put('/users/:id', authorize('admin', 'staff'), async (req, res) => {
  try {
    const { id } = req.params;
    const { userType, userData } = req.body;

    if (!userType || !userData) {
      return res.status(400).json({ error: 'User type and user data are required' });
    }

    let result;
    
    // Transform form camelCase to snake_case for database fields
    const transformToSnakeCase = (data: any) => {
      const transformed: any = {
        updated_at: new Date().toISOString()
      };
      
      // Map common fields
      if (data.firstName) transformed.first_name = data.firstName;
      if (data.lastName) transformed.last_name = data.lastName;
      if (data.email) transformed.email = data.email;
      if (data.phone !== undefined) transformed.phone = data.phone || null;
      if (data.status) transformed.status = data.status;
      
      // Client specific fields
      if (data.dob !== undefined) transformed.dob = data.dob || null;
      if (data.genderIdentity !== undefined) transformed.gender_identity = data.genderIdentity || null;
      if (data.ethnicIdentity !== undefined) transformed.ethnic_identity = data.ethnicIdentity || null;
      if (data.religiousBackground !== undefined) transformed.religious_background = data.religiousBackground || null;
      
      // Coach specific fields
      if (data.specialties !== undefined) transformed.specialties = data.specialties || [];
      if (data.yearsExperience !== undefined) transformed.years_experience = data.yearsExperience || null;
      if (data.hourlyRate !== undefined) transformed.hourly_rate_usd = data.hourlyRate || null;
      if (data.bio !== undefined) transformed.bio = data.bio || null;
      if (data.qualifications !== undefined) transformed.qualifications = data.qualifications || [];
      if (data.languages !== undefined) transformed.languages = data.languages || [];
      
      // Staff specific fields
      if (data.department !== undefined) transformed.department = data.department || null;
      if (data.permissions !== undefined) transformed.permissions = data.permissions || [];
      if (data.roleLevel !== undefined) transformed.role_level = data.roleLevel || null;
      
      return transformed;
    };

    const updateData = transformToSnakeCase(userData);

    switch (userType) {
      case 'client':
        const { data: updatedClient, error: clientError } = await supabase
          .from('clients')
          .update(updateData)
          .eq('id', id)
          .select()
          .single();
        
        if (clientError) throw clientError;
        result = { ...updatedClient, role: 'client' };
        break;

      case 'coach':
        const { data: updatedCoach, error: coachError } = await supabase
          .from('coaches')
          .update(updateData)
          .eq('id', id)
          .select()
          .single();
        
        if (coachError) throw coachError;
        result = { ...updatedCoach, role: 'coach' };
        break;

      case 'staff':
        const { data: updatedStaff, error: staffError } = await supabase
          .from('staff')
          .update(updateData)
          .eq('id', id)
          .select()
          .single();

        if (staffError) throw staffError;
        result = { ...updatedStaff, role: 'staff' };
        break;

      default:
        return res.status(400).json({ error: 'Invalid user type' });
    }

    // Log the admin action
    const auditReq = req as AuditRequest;
    await auditLogger.logAction(auditReq, {
      action: 'USER_UPDATED',
      resource_type: userType,
      resource_id: id,
      details: `Updated ${userType} user: ${result.first_name} ${result.last_name} (${result.email})`,
      metadata: {
        user_type: userType,
        user_id: id,
        updated_fields: Object.keys(userData),
        new_values: updateData
      }
    });

    res.json({
      success: true,
      message: `${userType} updated successfully`,
      user: result
    });
  } catch (error) {
    console.error('User update error:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Delete user - Admin only
router.delete('/users/:id', authorize('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { userType } = req.query;

    if (!userType) {
      return res.status(400).json({ error: 'User type is required' });
    }

    let tableName;
    let query;
    
    switch (userType) {
      case 'client':
        tableName = 'clients';
        query = supabase.from(tableName).select('*').eq('id', id);
        break;
      case 'coach':
        tableName = 'coaches';
        query = supabase.from(tableName).select('*').eq('id', id);
        break;
      case 'staff':
        tableName = 'staff';
        query = supabase.from(tableName).select('*').eq('id', id);
        break;
      default:
        return res.status(400).json({ error: 'Invalid user type' });
    }

    // First, get the user to return their info
    const { data: user, error: fetchError } = await query.single();

    if (fetchError || !user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Delete related data first (appointments, etc.)
    if (userType === 'client' || userType === 'coach') {
      await supabase
        .from('appointments')
        .delete()
        .eq(userType === 'client' ? 'client_id' : 'coach_id', id);
    }

    // Delete the user
    let deleteQuery;
    deleteQuery = supabase.from(tableName).delete().eq('id', id);
    
    const { error: deleteError } = await deleteQuery;
    if (deleteError) throw deleteError;

    // Log the admin action
    const auditReq = req as AuditRequest;
    await auditLogger.logAction(auditReq, {
      action: 'USER_DELETED',
      resource_type: userType,
      resource_id: id,
      details: `Deleted ${userType} user: ${user.first_name} ${user.last_name} (${user.email})`,
      metadata: {
        user_type: userType,
        user_id: id,
        deleted_user_data: {
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          status: user.status
        }
      }
    });

    res.json({
      success: true,
      message: `${userType} deleted successfully`,
      deletedUser: { ...user, role: userType }
    });
  } catch (error) {
    console.error('User deletion error:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// User impersonation endpoint - Admin or staff with permission
router.post('/users/:id/impersonate', requirePermission('users.impersonate'), async (req, res) => {
  try {
    const { id } = req.params;
    const { userType } = req.body;
    const adminUser = (req as any).user; // Admin making the request

    if (!userType) {
      return res.status(400).json({ error: 'User type is required' });
    }

    // Get user data based on type
    let userData = null;
    let tableName = '';
    
    switch (userType) {
      case 'client':
        tableName = 'clients';
        const { data: client, error: clientError } = await supabase
          .from('clients')
          .select('*')
          .eq('id', id)
          .single();
        if (clientError) throw clientError;
        userData = client;
        break;
      case 'coach':
        tableName = 'coaches';
        const { data: coach, error: coachError } = await supabase
          .from('coaches')
          .select('*')
          .eq('id', id)
          .single();
        if (coachError) throw coachError;
        userData = coach;
        break;
      case 'staff':
        tableName = 'staff';
        const { data: staff, error: staffError } = await supabase
          .from('staff')
          .select('*')
          .eq('id', id)
          .single();
        if (staffError) throw staffError;
        userData = staff;
        break;
      default:
        return res.status(400).json({ error: 'Invalid user type' });
    }

    if (!userData) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Create impersonation token with the same structure as regular auth tokens
    const jwt = require('jsonwebtoken');
    const impersonationToken = jwt.sign(
      {
        id: userData.id,
        userId: userData.id, // Use userId to match existing auth system
        email: userData.email,
        role: userType,
        first_name: userData.first_name,
        last_name: userData.last_name,
        impersonated_by: adminUser.id, // Track who is impersonating
        impersonation_time: new Date().toISOString()
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '2h' } // Shorter expiry for security
    );

    // Log the admin action
    const auditReq = req as AuditRequest;
    await auditLogger.logAction(auditReq, {
      action: 'USER_IMPERSONATION',
      resource_type: userType,
      resource_id: id,
      details: `Started impersonating ${userType} user: ${userData.first_name} ${userData.last_name} (${userData.email})`,
      metadata: {
        user_type: userType,
        user_id: id,
        impersonated_user_email: userData.email,
        impersonation_duration: '2h',
        admin_id: adminUser.id,
        admin_email: adminUser.email
      }
    });

    res.json({
      success: true,
      token: impersonationToken,
      user: {
        id: userData.id,
        email: userData.email,
        role: userType,
        first_name: userData.first_name,
        last_name: userData.last_name
      },
      impersonated_by: adminUser.email,
      expires_in: '2h'
    });
  } catch (error) {
    console.error('User impersonation error:', error);
    res.status(500).json({ error: 'Failed to impersonate user' });
  }
});

// Reset user password (admin only) - must come before general action route
router.post('/users/:id/reset-password', authorize('admin', 'staff'), async (req, res) => {
  try {
    const { id } = req.params;
    const { userType } = req.body;

    if (!userType) {
      return res.status(400).json({ error: 'User type is required' });
    }

    // Generate new temporary password
    const newPassword = generateSecurePassword();
    console.log('Generated new password for user:', id);

    // Hash the new password
    const bcrypt = require('bcryptjs');
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS || '12');
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Get current user data first
    let userData = null;
    let tableName = '';
    
    switch (userType) {
      case 'client':
        tableName = 'clients';
        const { data: client } = await supabase
          .from('clients')
          .select('*')
          .eq('id', id)
          .single();
        userData = client;
        break;
      case 'coach':
        tableName = 'coaches';
        const { data: coach } = await supabase
          .from('coaches')
          .select('*')
          .eq('id', id)
          .single();
        userData = coach;
        break;
      case 'staff':
        tableName = 'staff';
        const { data: staff } = await supabase
          .from('staff')
          .select('*')
          .eq('id', id)
          .single();
        userData = staff;
        break;
      default:
        return res.status(400).json({ error: 'Invalid user type' });
    }

    if (!userData) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update password in the database
    let updateQuery;
    const updateData = {
      password_hash: hashedPassword,
      updated_at: new Date().toISOString()
    };

    switch (userType) {
      case 'client':
        updateQuery = supabase.from('clients').update(updateData).eq('id', id);
        break;
      case 'coach':
        updateQuery = supabase.from('coaches').update(updateData).eq('id', id);
        break;
      case 'staff':
        updateQuery = supabase.from('staff').update(updateData).eq('id', id);
        break;
    }

    const { error: updateError } = await updateQuery;
    if (updateError) {
      console.error('Password update error:', updateError);
      throw updateError;
    }

    // Log the admin action
    const auditReq = req as AuditRequest;
    await auditLogger.logAction(auditReq, {
      action: 'PASSWORD_RESET',
      resource_type: userType,
      resource_id: id,
      details: `Reset password for ${userType} user: ${userData.first_name} ${userData.last_name} (${userData.email})`,
      metadata: {
        user_type: userType,
        user_id: id,
        user_email: userData.email
      }
    });

    // Send new credentials via email
    try {
      console.log('Sending password reset email to:', userData.email);
      const emailResult = await smtpEmailService.sendUserCredentials({
        email: userData.email,
        password: newPassword,
        firstName: userData.first_name,
        lastName: userData.last_name,
        role: userType
      });
      
      if (emailResult.success) {
        console.log('Password reset email sent successfully');
        res.json({
          success: true,
          message: 'Password reset successfully and new credentials sent via email',
          emailSent: true
        });
      } else {
        console.error('Failed to send password reset email:', emailResult.error);
        res.json({
          success: true,
          message: 'Password reset successfully but failed to send email',
          emailSent: false,
          emailError: emailResult.error
        });
      }
    } catch (emailError) {
      console.error('Error sending password reset email:', emailError);
      res.json({
        success: true,
        message: 'Password reset successfully but failed to send email',
        emailSent: false,
        emailError: emailError instanceof Error ? emailError.message : 'Unknown email error'
      });
    }

  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({ 
      error: 'Failed to reset password',
      details: error instanceof Error ? error.message : error
    });
  }
});

// User status actions (activate, suspend, etc.) - Admin only
router.post('/users/:id/:action', authorize('admin', 'staff'), async (req, res) => {
  try {
    const { id, action } = req.params;
    const { userType } = req.body;

    if (!userType) {
      return res.status(400).json({ error: 'User type is required' });
    }

    let statusValue;
    let query;

    // Determine status value based on action
    switch (action) {
      case 'activate':
        statusValue = 'active';
        break;
      case 'suspend':
        statusValue = 'suspended';
        break;
      case 'approve':
        statusValue = 'approved';
        break;
      case 'reject':
        statusValue = 'rejected';
        break;
      case 'deactivate':
        statusValue = 'inactive';
        break;
      default:
        return res.status(400).json({ error: 'Invalid action' });
    }

    // Update status based on user type
    switch (userType) {
      case 'client':
        query = supabase.from('clients').update({
          status: statusValue,
          updated_at: new Date().toISOString()
        }).eq('id', id).select().single();
        break;
      case 'coach':
        const updateData: any = {
          status: statusValue,
          updated_at: new Date().toISOString()
        };
        if (action === 'approve') {
          updateData.approved_at = new Date().toISOString();
        }
        query = supabase.from('coaches').update(updateData).eq('id', id).select().single();
        break;
      case 'staff':
        query = supabase.from('staff').update({
          status: statusValue,
          updated_at: new Date().toISOString()
        }).eq('id', id).select().single();
        break;
      default:
        return res.status(400).json({ error: 'Invalid user type' });
    }

    const { data: updatedUser, error } = await query;
    if (error) throw error;

    // Log the admin action
    const auditReq = req as AuditRequest;
    await auditLogger.logAction(auditReq, {
      action: `USER_${action.toUpperCase()}`,
      resource_type: userType,
      resource_id: id,
      details: `${action} ${userType} user: ${updatedUser.first_name} ${updatedUser.last_name} (${updatedUser.email})`,
      metadata: {
        user_type: userType,
        user_id: id,
        action: action,
        new_status: statusValue,
        user_email: updatedUser.email,
        user_name: `${updatedUser.first_name} ${updatedUser.last_name}`
      }
    });

    res.json({
      success: true,
      message: `User ${action} successful`,
      user: { ...updatedUser, role: userType }
    });
  } catch (error) {
    console.error('User action error:', error);
    res.status(500).json({ error: 'Failed to perform user action' });
  }
});


// Coach management endpoints
router.get('/coaches', async (req, res) => {
  try {
    const { status } = req.query;

    let query = supabase
      .from('coaches')
      .select(`
        id,
        first_name,
        last_name,
        email,
        phone,
        specialties,
        years_experience,
        hourly_rate_usd,
        rating,
        bio,
        qualifications,
        created_at,
        status,
        approved_at,
        coach_demographics (
          gender_identity,
          ethnic_identity,
          religious_background
        )
      `);

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    const { data: coaches, error } = await query;

    if (error) {
      throw error;
    }

    // Format coaches data
    const formattedCoaches = coaches?.map(coach => ({
      ...coach,
      name: `${coach.first_name} ${coach.last_name}`,
      experience: coach.years_experience ? `${coach.years_experience} years` : 'Not specified',
      hourlyRate: coach.hourly_rate_usd ? `$${coach.hourly_rate_usd}` : 'Not specified',
      status: coach.status || 'pending', // Use actual status from database
      totalSessions: 0 // TODO: Calculate from appointments
    })) || [];

    res.json({ coaches: formattedCoaches });
  } catch (error) {
    console.error('Coaches fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch coaches' });
  }
});

// Coach actions
router.put('/coaches/:id/:action', async (req, res) => {
  try {
    const { id, action } = req.params;
    const { reason } = req.body;
    
    // Validate action
    const validActions = ['approve', 'reject', 'suspend'];
    if (!validActions.includes(action)) {
      return res.status(400).json({ error: 'Invalid action' });
    }
    
    // Map action to status
    const statusMap = {
      'approve': 'approved',
      'reject': 'rejected',
      'suspend': 'suspended'
    };
    
    const newStatus = statusMap[action as keyof typeof statusMap];
    
    // Update coach status in database
    const updateData: any = {
      status: newStatus,
      status_reason: reason || null
    };
    
    // Add approved_at timestamp if approving
    if (action === 'approve') {
      updateData.approved_at = new Date().toISOString();
    }
    
    const { data, error } = await supabase
      .from('coaches')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Coach status update error:', error);
      return res.status(500).json({ error: 'Failed to update coach status' });
    }

    // Log the admin action
    const auditReq = req as AuditRequest;
    await auditLogger.logAction(auditReq, {
      action: `COACH_${action.toUpperCase()}`,
      resource_type: 'coach',
      resource_id: id,
      details: `${action} coach: ${data.first_name} ${data.last_name} (${data.email})`,
      metadata: {
        coach_id: id,
        action: action,
        new_status: newStatus,
        reason: reason || null,
        coach_email: data.email,
        coach_name: `${data.first_name} ${data.last_name}`
      }
    });

    res.json({
      success: true,
      message: `Coach ${action} successful`,
      coach: data
    });
  } catch (error) {
    console.error('Coach action error:', error);
    res.status(500).json({ error: 'Failed to perform coach action' });
  }
});

// Coach rating endpoints
router.post('/coaches/:coachId/ratings', async (req, res) => {
  try {
    const { coachId } = req.params;
    const { clientId, sessionId, rating, comment } = req.body;

    // Validate rating value
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    // Check if client has completed sessions with this coach
    const { data: sessions, error: sessionsError } = await supabase
      .from('sessions')
      .select('id')
      .eq('client_id', clientId)
      .eq('coach_id', coachId)
      .eq('status', 'completed');

    const hasHistory = sessions && sessions.length > 0;

    if (!hasHistory) {
      return res.status(403).json({
        error: 'You can only rate coaches after completing a session with them'
      });
    }

    // Check if a review already exists for this client-coach pair
    const { data: existingReview, error: checkError } = await supabase
      .from('reviews')
      .select('id')
      .eq('client_id', clientId)
      .eq('coach_id', coachId)
      .single();

    let reviewData;

    if (existingReview) {
      // Update existing review
      const { data, error } = await supabase
        .from('reviews')
        .update({
          session_id: sessionId,
          rating,
          comment,
          created_at: new Date().toISOString()
        })
        .eq('id', existingReview.id)
        .select()
        .single();

      if (error) throw error;
      reviewData = data;
    } else {
      // Create new review
      const { data, error } = await supabase
        .from('reviews')
        .insert([{
          session_id: sessionId,
          client_id: clientId,
          coach_id: coachId,
          rating,
          comment
        }])
        .select()
        .single();

      if (error) throw error;
      reviewData = data;
    }

    // Calculate and update the coach's average rating
    const { data: allReviews, error: reviewsError } = await supabase
      .from('reviews')
      .select('rating')
      .eq('coach_id', coachId);

    if (reviewsError) throw reviewsError;

    const averageRating = allReviews && allReviews.length > 0
      ? allReviews.reduce((sum, review) => sum + review.rating, 0) / allReviews.length
      : rating; // If this is the first review, use its rating

    // Update coach's rating in the coaches table
    const { error: updateError } = await supabase
      .from('coaches')
      .update({ rating: averageRating })
      .eq('id', coachId);

    if (updateError) throw updateError;

    res.json({
      success: true,
      review: reviewData,
      averageRating: averageRating
    });
  } catch (error) {
    console.error('Rating creation error:', error);
    res.status(500).json({ error: 'Failed to create/update rating' });
  }
});

// Get coach ratings (public endpoint - no auth required for viewing)
router.get('/coaches/:coachId/ratings', async (req, res) => {
  try {
    const { coachId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const offset = (Number(page) - 1) * Number(limit);

    // Get total count
    const { count } = await supabase
      .from('reviews')
      .select('*', { count: 'exact', head: true })
      .eq('coach_id', coachId);

    // Get paginated reviews with client info
    const { data: reviews, error } = await supabase
      .from('reviews')
      .select(`
        *,
        clients:client_id (
          id,
          first_name,
          last_name
        )
      `)
      .eq('coach_id', coachId)
      .order('created_at', { ascending: false })
      .range(offset, offset + Number(limit) - 1);

    if (error) throw error;

    // Get average rating from coaches table
    const { data: coach, error: coachError } = await supabase
      .from('coaches')
      .select('rating')
      .eq('id', coachId)
      .single();

    if (coachError && coachError.code !== 'PGRST116') {
      throw coachError;
    }

    res.json({
      reviews: reviews || [],
      averageRating: coach?.rating || 0,
      totalReviews: count || 0,
      page: Number(page),
      totalPages: Math.ceil((count || 0) / Number(limit))
    });
  } catch (error) {
    console.error('Fetch ratings error:', error);
    res.status(500).json({ error: 'Failed to fetch ratings' });
  }
});

// Get client's rating for a specific coach
router.get('/clients/:clientId/coaches/:coachId/rating', async (req, res) => {
  try {
    const { clientId, coachId } = req.params;

    const { data: review, error } = await supabase
      .from('reviews')
      .select('*')
      .eq('client_id', clientId)
      .eq('coach_id', coachId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      throw error;
    }

    res.json({
      hasRated: !!review,
      review: review || null
    });
  } catch (error) {
    console.error('Fetch client rating error:', error);
    res.status(500).json({ error: 'Failed to fetch client rating' });
  }
});

// Delete a rating (admin only)
router.delete('/ratings/:reviewId', async (req, res) => {
  try {
    const { reviewId } = req.params;

    // Get the coach_id before deleting
    const { data: review, error: fetchError } = await supabase
      .from('reviews')
      .select('coach_id')
      .eq('id', reviewId)
      .single();

    if (fetchError) throw fetchError;

    // Delete the review
    const { error } = await supabase
      .from('reviews')
      .delete()
      .eq('id', reviewId);

    if (error) throw error;

    // The database trigger will automatically update the coach's average rating

    res.json({
      success: true,
      message: 'Rating deleted successfully'
    });
  } catch (error) {
    console.error('Delete rating error:', error);
    res.status(500).json({ error: 'Failed to delete rating' });
  }
});

// Staff management endpoints
router.get('/staff', async (req, res) => {
  try {
    const { status, department } = req.query;

    let query = supabase
      .from('staff')
      .select('*');

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    if (department && department !== 'all') {
      query = query.eq('department', department);
    }

    const { data: staff, error } = await query.order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    // Format staff data
    const formattedStaff = staff?.map(member => ({
      ...member,
      name: `${member.first_name} ${member.last_name}`,
      role: 'staff',
      status: member.status || 'active'
    })) || [];

    res.json({ staff: formattedStaff });
  } catch (error) {
    console.error('Staff fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch staff' });
  }
});

// Staff actions
router.put('/staff/:id/:action', async (req, res) => {
  try {
    const { id, action } = req.params;
    const { reason, permissions, department } = req.body;
    
    // Validate action
    const validActions = ['activate', 'suspend', 'update_permissions', 'transfer'];
    if (!validActions.includes(action)) {
      return res.status(400).json({ error: 'Invalid action' });
    }
    
    let updateData: any = {
      updated_at: new Date().toISOString()
    };
    
    switch (action) {
      case 'activate':
        updateData.status = 'active';
        break;
      case 'suspend':
        updateData.status = 'suspended';
        updateData.status_reason = reason || null;
        break;
      case 'update_permissions':
        updateData.permissions = permissions || [];
        break;
      case 'transfer':
        updateData.department = department;
        break;
    }
    
    const { data, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', id)
      .eq('role', 'staff')
      .select()
      .single();
    
    if (error) {
      console.error('Staff action error:', error);
      return res.status(500).json({ error: 'Failed to perform staff action' });
    }
    
    res.json({
      success: true,
      message: `Staff ${action} successful`,
      staff: data
    });
  } catch (error) {
    console.error('Staff action error:', error);
    res.status(500).json({ error: 'Failed to perform staff action' });
  }
});

// Appointments management (using sessions table)
router.get('/appointments', async (req, res) => {
  try {
    console.log('Admin appointments endpoint called');
    console.log('User:', (req as AuthRequest).user);
    console.log('Query params:', req.query);
    
    const { status, date } = req.query;

    // Build query for sessions (appointments) with related data
    let query = supabase
      .from('sessions')
      .select(`
        id,
        client_id,
        coach_id,
        starts_at,
        ends_at,
        scheduled_at,
        duration_minutes,
        status,
        session_type,
        notes,
        admin_notes,
        cancellation_reason,
        created_at,
        clients!sessions_client_id_fkey (
          id,
          first_name,
          last_name,
          email,
          profile_photo
        ),
        coaches!sessions_coach_id_fkey (
          id,
          first_name,
          last_name,
          email,
          profile_photo
        )
      `)
      .order('starts_at', { ascending: false });

    // Apply filters if provided
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    if (date) {
      // Filter by specific date
      const startDate = new Date(date as string);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(date as string);
      endDate.setHours(23, 59, 59, 999);
      
      query = query
        .gte('starts_at', startDate.toISOString())
        .lte('starts_at', endDate.toISOString());
    }

    const { data: sessions, error } = await query;
    console.log('Sessions query result:', { 
      sessionsCount: sessions?.length || 0, 
      error: error?.message || 'No error'
    });

    if (error) {
      console.error('Sessions query error:', error);
      // If there's a foreign key error, try simpler query and manually fetch related data
      const { data: simpleSessions } = await supabase
        .from('sessions')
        .select('*')
        .order('starts_at', { ascending: false });
      
      // Manually fetch client and coach data for each session
      const formattedSimple = [];
      for (const session of simpleSessions || []) {
        const startDate = new Date(session.starts_at);
        
        // Fetch client data
        let clientData = null;
        if (session.client_id) {
          const { data: client } = await supabase
            .from('clients')
            .select('first_name, last_name, email, profile_photo')
            .eq('id', session.client_id)
            .single();
          clientData = client;
        }
        
        // Fetch coach data
        let coachData = null;
        if (session.coach_id) {
          const { data: coach } = await supabase
            .from('coaches')
            .select('first_name, last_name, email, profile_photo')
            .eq('id', session.coach_id)
            .single();
          coachData = coach;
        }
        
        formattedSimple.push({
          id: session.id,
          client_id: session.client_id,
          coach_id: session.coach_id,
          clientName: clientData ? `${clientData.first_name || ''} ${clientData.last_name || ''}`.trim() : 'Unknown Client',
          clientEmail: clientData?.email || 'N/A',
          clientPhoto: clientData?.profile_photo || '',
          coachName: coachData ? `${coachData.first_name || ''} ${coachData.last_name || ''}`.trim() : 'Unknown Coach',
          coachEmail: coachData?.email || 'N/A',
          coachPhoto: coachData?.profile_photo || '',
          date: startDate.toISOString().split('T')[0],
          time: startDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
          duration: session.duration_minutes || 60,
          status: session.status || 'scheduled',
          type: session.session_type || 'video',
          notes: session.notes || '',
          adminNotes: session.admin_notes || '',
          cancellationReason: session.cancellation_reason || '',
          created_at: session.created_at
        });
      }
      
      res.json({ appointments: formattedSimple });
      return;
    }

    // Format sessions as appointments for frontend
    const formattedAppointments = sessions?.map((session: any) => {
      const startDate = new Date(session.starts_at);
      return {
        id: session.id,
        client_id: session.client_id, // Include the actual client ID
        coach_id: session.coach_id,   // Include the actual coach ID
        clientName: session.clients ? `${session.clients.first_name || ''} ${session.clients.last_name || ''}`.trim() : 'Unknown Client',
        clientEmail: session.clients?.email || 'N/A',
        clientPhoto: session.clients?.profile_photo || '',
        coachName: session.coaches ? `${session.coaches.first_name || ''} ${session.coaches.last_name || ''}`.trim() : 'Unknown Coach',
        coachEmail: session.coaches?.email || 'N/A',
        coachPhoto: session.coaches?.profile_photo || '',
        date: startDate.toISOString().split('T')[0],
        time: startDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
        duration: session.duration_minutes || 60,
        status: session.status || 'scheduled',
        type: session.session_type || 'video',
        notes: session.notes || '',
        adminNotes: session.admin_notes || '',
        cancellationReason: session.cancellation_reason || '',
        created_at: session.created_at
      };
    }) || [];

    console.log('Returning appointments:', { 
      appointmentsCount: formattedAppointments?.length || 0,
      sample: formattedAppointments?.[0] || 'No appointments'
    });
    
    res.json({ appointments: formattedAppointments });
  } catch (error) {
    console.error('Sessions fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
});

// Update appointment status (admin only)
router.put('/appointments/:appointmentId/status', async (req, res) => {
  try {
    console.log('Admin appointment status update called');
    console.log('User:', (req as AuthRequest).user);
    console.log('Appointment ID:', req.params.appointmentId);
    console.log('New status:', req.body.status);
    
    const { appointmentId } = req.params;
    const { status, reason } = req.body;

    if (!appointmentId || !status) {
      return res.status(400).json({ error: 'Appointment ID and status are required' });
    }

    // Validate status
    const validStatuses = ['scheduled', 'confirmed', 'cancelled', 'completed', 'no-show'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    // Get current appointment details for notifications
    const { data: currentAppointment, error: fetchError } = await supabase
      .from('sessions')
      .select(`
        *,
        clients:client_id(first_name, last_name, email),
        coaches:coach_id(first_name, last_name, email)
      `)
      .eq('id', appointmentId)
      .single();

    if (fetchError || !currentAppointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    // Update appointment status
    const updateData: any = { 
      status,
      updated_at: new Date().toISOString()
    };

    // Set cancellation reason if status is cancelled and reason is provided
    if (status === 'cancelled' && reason) {
      updateData.cancellation_reason = reason;
    } else if (status === 'cancelled') {
      updateData.cancellation_reason = req.body.cancellationReason || '';
    }

    const { data: updatedAppointment, error: updateError } = await supabase
      .from('sessions')
      .update(updateData)
      .eq('id', appointmentId)
      .select()
      .single();

    if (updateError) {
      console.error('Update error:', updateError);
      throw updateError;
    }

    // Log the admin action
    const auditReq = req as AuditRequest;
    const clientName = currentAppointment.clients ? `${currentAppointment.clients.first_name} ${currentAppointment.clients.last_name}` : 'Unknown';
    const coachName = currentAppointment.coaches ? `${currentAppointment.coaches.first_name} ${currentAppointment.coaches.last_name}` : 'Unknown';

    await auditLogger.logAction(auditReq, {
      action: 'APPOINTMENT_STATUS_UPDATE',
      resource_type: 'appointment',
      resource_id: appointmentId,
      details: `Changed appointment status from "${currentAppointment.status}" to "${status}" for session between ${clientName} and ${coachName}`,
      metadata: {
        appointment_id: appointmentId,
        old_status: currentAppointment.status,
        new_status: status,
        client_id: currentAppointment.client_id,
        coach_id: currentAppointment.coach_id,
        client_name: clientName,
        coach_name: coachName,
        reason: reason || null,
        starts_at: currentAppointment.starts_at
      }
    });

    // Emit WebSocket notifications
    const io = req.app.get('io');
    if (io && currentAppointment.clients && currentAppointment.coaches) {
      const notificationData = {
        id: updatedAppointment.id,
        starts_at: updatedAppointment.starts_at,
        client_id: updatedAppointment.client_id,
        coach_id: updatedAppointment.coach_id,
        client_name: clientName,
        coach_name: coachName,
        status: status,
        reason: reason || '',
        updated_by: 'admin',
        updated_at: new Date().toISOString()
      };

      // Notify client and coach about status change
      io.to(`user:${updatedAppointment.client_id}`).emit(`appointment:${status}`, notificationData);
      io.to(`user:${updatedAppointment.coach_id}`).emit(`appointment:${status}`, notificationData);

      // Emit specific admin notification
      io.to('admin:notifications').emit(`admin:appointment_${status}`, notificationData);
    }

    console.log('Appointment status updated successfully');
    res.json({
      success: true,
      message: `Appointment status updated to ${status}`,
      appointment: updatedAppointment
    });
  } catch (error) {
    console.error('Update appointment status error:', error);
    res.status(500).json({ error: 'Failed to update appointment status' });
  }
});

// Admin notes endpoint for appointments
router.put('/appointments/:appointmentId/notes', async (req, res) => {
  try {
    console.log('Admin appointment notes update called');
    console.log('User:', (req as AuthRequest).user);
    console.log('Appointment ID:', req.params.appointmentId);
    console.log('Admin notes:', req.body.adminNotes);
    
    const { appointmentId } = req.params;
    const { adminNotes } = req.body;

    if (!appointmentId) {
      return res.status(400).json({ error: 'Appointment ID is required' });
    }

    // Get current appointment to verify it exists
    const { data: currentAppointment, error: fetchError } = await supabase
      .from('sessions')
      .select('id, admin_notes')
      .eq('id', appointmentId)
      .single();

    if (fetchError || !currentAppointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    // Update admin notes
    const { data: updatedAppointment, error: updateError } = await supabase
      .from('sessions')
      .update({
        admin_notes: adminNotes || '',
        updated_at: new Date().toISOString()
      })
      .eq('id', appointmentId)
      .select(`
        *,
        clients:client_id(first_name, last_name, email),
        coaches:coach_id(first_name, last_name, email)
      `)
      .single();

    if (updateError) {
      console.error('Update admin notes error:', updateError);
      throw updateError;
    }

    // Log the admin action
    const auditReq = req as AuditRequest;
    const clientName = updatedAppointment.clients ? `${updatedAppointment.clients.first_name} ${updatedAppointment.clients.last_name}` : 'Unknown';
    const coachName = updatedAppointment.coaches ? `${updatedAppointment.coaches.first_name} ${updatedAppointment.coaches.last_name}` : 'Unknown';

    await auditLogger.logAction(auditReq, {
      action: 'APPOINTMENT_NOTES_UPDATE',
      resource_type: 'appointment',
      resource_id: appointmentId,
      details: `Updated admin notes for appointment between ${clientName} and ${coachName}`,
      metadata: {
        appointment_id: appointmentId,
        client_id: updatedAppointment.client_id,
        coach_id: updatedAppointment.coach_id,
        client_name: clientName,
        coach_name: coachName,
        old_notes: currentAppointment.admin_notes || '',
        new_notes: adminNotes || '',
        starts_at: updatedAppointment.starts_at
      }
    });

    console.log('Admin notes updated successfully');
    res.json({
      success: true,
      message: 'Admin notes updated successfully',
      adminNotes: updatedAppointment.admin_notes
    });
  } catch (error) {
    console.error('Update admin notes error:', error);
    res.status(500).json({ error: 'Failed to update admin notes' });
  }
});

// Analytics endpoints
router.get('/analytics', async (req, res) => {
  try {
    const { timeRange = '30d' } = req.query;

    // Fetch all necessary data from Supabase
    const [clientsRes, coachesRes, sessionsRes] = await Promise.all([
      supabase.from('clients').select('id, created_at'),
      supabase.from('coaches').select('id, created_at, status, hourly_rate_usd, rating, specialties, first_name, last_name'),
      supabase.from('sessions').select('id, created_at, starts_at, status, duration_minutes, coach_id, client_id')
    ]);

    const clients = clientsRes.data || [];
    const coaches = coachesRes.data || [];
    const sessions = sessionsRes.data || [];
    // Transform sessions to match appointments interface
    const appointments = sessions.map(session => ({
      ...session,
      scheduled_at: session.starts_at
    }));

    // Calculate time range
    const now = new Date();
    const daysAgo = parseInt(timeRange.toString().replace('d', ''));
    const startDate = new Date(now.getTime() - (daysAgo * 24 * 60 * 60 * 1000));

    // Calculate metrics for current period
    const currentPeriodClients = clients.filter(c => new Date(c.created_at) >= startDate);
    const currentPeriodCoaches = coaches.filter(c => new Date(c.created_at) >= startDate);
    const currentPeriodAppointments = appointments.filter(a => new Date(a.created_at) >= startDate);

    // Calculate metrics for previous period (for growth comparison)
    const prevStartDate = new Date(startDate.getTime() - (daysAgo * 24 * 60 * 60 * 1000));
    const prevPeriodClients = clients.filter(c => {
      const date = new Date(c.created_at);
      return date >= prevStartDate && date < startDate;
    });
    const prevPeriodCoaches = coaches.filter(c => {
      const date = new Date(c.created_at);
      return date >= prevStartDate && date < startDate;
    });
    const prevPeriodAppointments = appointments.filter(a => {
      const date = new Date(a.created_at);
      return date >= prevStartDate && date < startDate;
    });

    // Calculate growth percentages
    const userGrowth = prevPeriodClients.length > 0 
      ? ((currentPeriodClients.length - prevPeriodClients.length) / prevPeriodClients.length * 100).toFixed(1)
      : 0;
    const coachGrowth = prevPeriodCoaches.length > 0
      ? ((currentPeriodCoaches.length - prevPeriodCoaches.length) / prevPeriodCoaches.length * 100).toFixed(1)
      : 0;
    const sessionGrowth = prevPeriodAppointments.length > 0
      ? ((currentPeriodAppointments.length - prevPeriodAppointments.length) / prevPeriodAppointments.length * 100).toFixed(1)
      : 0;

    // Calculate revenue (estimated since sessions table doesn't have price)
    const completedSessions = appointments.filter(a => a.status === 'completed');
    const totalRevenue = completedSessions.length * 75; // Estimate $75 per session
    
    const currentCompletedSessions = currentPeriodAppointments.filter(a => a.status === 'completed');
    const currentRevenue = currentCompletedSessions.length * 75;
    
    const prevCompletedSessions = prevPeriodAppointments.filter(a => a.status === 'completed');
    const prevRevenue = prevCompletedSessions.length * 75;
    
    const revenueGrowth = prevRevenue > 0
      ? ((currentRevenue - prevRevenue) / prevRevenue * 100).toFixed(1)
      : 0;

    // Calculate coach metrics - include both 'approved' and 'active' coaches
    const activeCoaches = coaches.filter(c => c.status === 'approved' || c.status === 'active');
    const coachesWithRatings = activeCoaches.filter(c => c.rating && parseFloat(c.rating) > 0);

    // Debug logging for rating calculation
    console.log('Analytics - Coach rating calculation:', {
      totalCoaches: coaches.length,
      activeCoaches: activeCoaches.length,
      coachesWithRatings: coachesWithRatings.length,
      coachStatuses: coaches.map(c => ({ name: `${c.first_name} ${c.last_name}`, status: c.status, rating: c.rating })),
      ratings: coachesWithRatings.map(c => parseFloat(c.rating))
    });

    const averageRatingNum = coachesWithRatings.length > 0
      ? coachesWithRatings.reduce((sum, c) => sum + (parseFloat(c.rating) || 0), 0) / coachesWithRatings.length
      : 0;
    const averageRating = averageRatingNum.toFixed(1);
    
    // Calculate total coach hours
    const completedAppointments = appointments.filter(a => a.status === 'completed');
    const totalCoachHours = completedAppointments.reduce((sum, session) => sum + ((session.duration_minutes || 60) / 60), 0);
    
    // Calculate average session duration
    const averageSessionDuration = completedAppointments.length > 0
      ? Math.round(completedAppointments.reduce((sum, session) => sum + (session.duration_minutes || 60), 0) / completedAppointments.length)
      : 60;

    // Calculate specialty distribution
    const specialtyCount: Record<string, number> = {};
    coaches.forEach(coach => {
      if (Array.isArray(coach.specialties)) {
        coach.specialties.forEach(specialty => {
          specialtyCount[specialty] = (specialtyCount[specialty] || 0) + 1;
        });
      }
    });

    const topSpecialties = Object.entries(specialtyCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([name, count]) => ({
        name,
        sessions: count * 10, // Estimate sessions per specialty
        percentage: Math.round((count / coaches.length) * 100)
      }));

    // Get top coaches by appointment count
    const coachAppointmentCount: Record<string, number> = {};
    appointments.forEach(apt => {
      if (apt.coach_id) {
        coachAppointmentCount[apt.coach_id] = (coachAppointmentCount[apt.coach_id] || 0) + 1;
      }
    });

    const topCoachesList = Object.entries(coachAppointmentCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([coachId, count]) => {
        const coach = coaches.find(c => c.id === coachId);
        const coachSessions = appointments.filter(a => a.coach_id === coachId && a.status === 'completed');
        const revenue = coachSessions.length * 75; // Estimate $75 per session
        
        // Build proper coach name from first_name and last_name
        const coachName = coach ? 
          `${coach.first_name || ''} ${coach.last_name || ''}`.trim() || 'Unknown Coach' :
          'Unknown Coach';
        
        return {
          id: coachId,
          name: coachName,
          rating: coach?.rating || 4.5,
          sessions: count,
          revenue
        };
      });

    // Calculate session metrics
    const completedCount = appointments.filter(a => a.status === 'completed').length;
    const cancelledCount = appointments.filter(a => a.status === 'cancelled').length;
    const noShowCount = appointments.filter(a => a.status === 'no-show').length;
    const totalScheduled = appointments.filter(a => ['completed', 'cancelled', 'no-show', 'scheduled'].includes(a.status)).length;
    
    const completionRate = totalScheduled > 0 ? ((completedCount / totalScheduled) * 100).toFixed(1) : 0;
    const cancellationRate = totalScheduled > 0 ? ((cancelledCount / totalScheduled) * 100).toFixed(1) : 0;
    const noShowRate = totalScheduled > 0 ? ((noShowCount / totalScheduled) * 100).toFixed(1) : 0;

    // Calculate user metrics
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const newUsersThisMonth = clients.filter(c => new Date(c.created_at) >= currentMonthStart).length;
    
    // Active users (had appointments in last 30 days)
    const last30Days = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
    const recentAppointmentClientIds = new Set(
      appointments
        .filter(a => new Date(a.scheduled_at) >= last30Days)
        .map(a => a.client_id)
    );
    const activeUsers = recentAppointmentClientIds.size;
    
    // Calculate averages
    const averageSessionsPerUser = clients.length > 0 ? (appointments.length / clients.length).toFixed(1) : 0;
    const averageSessionValue = completedCount > 0 ? (totalRevenue / completedCount).toFixed(2) : 0;
    const revenuePerUser = clients.length > 0 ? (totalRevenue / clients.length).toFixed(2) : 0;

    // Coach utilization (percentage of coaches with appointments)
    const coachesWithAppointments = new Set(appointments.map(a => a.coach_id)).size;
    const coachUtilizationRate = activeCoaches.length > 0 
      ? ((coachesWithAppointments / activeCoaches.length) * 100).toFixed(1)
      : 0;

    const analyticsData = {
      overview: {
        totalUsers: clients.length + coaches.length,
        totalCoaches: coaches.length,
        totalSessions: completedAppointments.length, // Only count completed sessions
        totalRevenue,
        userGrowth,
        coachGrowth,
        sessionGrowth,
        revenueGrowth
      },
      userMetrics: {
        newUsersThisMonth,
        activeUsers,
        userRetentionRate: 78.5, // Would need more complex calculation with historical data
        averageSessionsPerUser
      },
      coachMetrics: {
        averageRating,
        totalCoachHours: Math.round(totalCoachHours),
        averageSessionDuration,
        coachUtilizationRate
      },
      financialMetrics: {
        monthlyRecurringRevenue: currentRevenue,
        averageSessionValue,
        revenuePerUser,
        conversionRate: 23.4 // Would need more complex calculation
      },
      sessionMetrics: {
        completionRate,
        noShowRate,
        cancellationRate,
        averageRating: averageRatingNum // Use coach average rating as proxy
      },
      topCoaches: topCoachesList.length > 0 ? topCoachesList : [
        { id: '1', name: 'No data available', rating: 0, sessions: 0, revenue: 0 }
      ],
      topSpecialties: topSpecialties.length > 0 ? topSpecialties : [
        { name: 'No data available', sessions: 0, percentage: 0 }
      ]
    };

    res.json(analyticsData);
  } catch (error) {
    console.error('Analytics fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// Settings endpoints
router.get('/settings', async (req, res) => {
  try {
    // TODO: Implement settings storage in database
    // For now, return mock settings
    const settings = {
      general: {
        siteName: 'ACT Coaching For Life',
        siteDescription: 'Professional ACT coaching platform connecting clients with certified coaches',
        supportEmail: 'support@actcoaching.com',
        maintenanceMode: false,
        registrationEnabled: true,
        coachApprovalRequired: true
      },
      notifications: {
        emailNotifications: true,
        smsNotifications: false,
        pushNotifications: true,
        adminAlerts: true,
        userWelcomeEmails: true,
        appointmentReminders: true
      },
      security: {
        sessionTimeout: 30,
        passwordMinLength: 8,
        requireTwoFactor: false,
        maxLoginAttempts: 5,
        ipWhitelist: []
      },
      payment: {
        stripePublicKey: 'pk_test_...',
        stripeWebhookSecret: 'whsec_...',
        defaultCurrency: 'USD',
        taxRate: 8.5,
        processingFee: 2.9
      },
      scheduling: {
        defaultSessionDuration: 60,
        maxAdvanceBooking: 30,
        cancellationWindow: 24,
        timeZone: 'America/New_York',
        businessHours: {
          start: '09:00',
          end: '17:00',
          days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
        }
      }
    };

    res.json(settings);
  } catch (error) {
    console.error('Settings fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

router.post('/settings', async (req, res) => {
  try {
    const settings = req.body;
    
    // TODO: Implement settings storage in database
    // For now, just return success
    res.json({ success: true, message: 'Settings saved successfully' });
  } catch (error) {
    console.error('Settings save error:', error);
    res.status(500).json({ error: 'Failed to save settings' });
  }
});

// Admin verification endpoint
router.get('/verify-admin', async (req: AuthRequest, res: Response) => {
  try {
    // If we reach here, the user is authenticated and has admin role
    // (due to the middleware)
    res.json({
      success: true,
      admin: req.user,
      message: 'Admin verified'
    });
  } catch (error) {
    console.error('Admin verification error:', error);
    res.status(500).json({ error: 'Admin verification failed' });
  }
});

// Create sample appointments for testing
router.post('/create-sample-data', async (req, res) => {
  try {
    console.log('Creating sample appointments/sessions...');
    
    // Get first client and coach
    const { data: clients } = await supabase.from('clients').select('id').limit(1);
    const { data: coaches } = await supabase.from('coaches').select('id').eq('status', 'approved').limit(1);
    
    if (!clients?.length || !coaches?.length) {
      return res.status(400).json({ error: 'Need at least one client and one approved coach' });
    }
    
    const clientId = clients[0].id;
    const coachId = coaches[0].id;
    const now = new Date();
    
    // Try to create in appointments table first
    const sampleAppointments = [
      {
        client_id: clientId,
        coach_id: coachId,
        status: 'completed',
        scheduled_at: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 week ago
        price: 85,
        created_at: new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        client_id: clientId,
        coach_id: coachId,
        status: 'scheduled',
        scheduled_at: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days from now
        price: 85,
        created_at: now.toISOString()
      },
      {
        client_id: clientId,
        coach_id: coachId,
        status: 'completed',
        scheduled_at: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
        price: 75,
        created_at: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];
    
    const { data: appointments, error: appointmentsError } = await supabase
      .from('appointments')
      .insert(sampleAppointments)
      .select();
    
    if (appointmentsError) {
      console.log('Appointments table error, trying sessions table:', appointmentsError.message);
      
      // Try sessions table instead
      const sampleSessions = sampleAppointments.map(apt => ({
        client_id: apt.client_id,
        coach_id: apt.coach_id,
        status: apt.status,
        starts_at: apt.scheduled_at,
        scheduled_at: apt.scheduled_at,
        duration_minutes: 60,
        created_at: apt.created_at
      }));
      
      const { data: sessions, error: sessionsError } = await supabase
        .from('sessions')
        .insert(sampleSessions)
        .select();
      
      if (sessionsError) {
        throw new Error(`Failed to create sample data: ${sessionsError.message}`);
      }
      
      return res.json({
        success: true,
        message: 'Created sample sessions',
        data: sessions
      });
    }
    
    res.json({
      success: true,
      message: 'Created sample appointments',
      data: appointments
    });
  } catch (error) {
    console.error('Sample data creation error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Database test endpoint
router.get('/test-db', async (req, res) => {
  try {
    console.log('Testing database connection...');
    
    // Test clients table
    const { data: clientsData, error: clientsError, count: clientsCount } = await supabase
      .from('clients')
      .select('*', { count: 'exact' })
      .limit(5);
    
    console.log('Clients test result:', { data: clientsData, error: clientsError, count: clientsCount });
    
    // Test coaches table
    const { data: coachesData, error: coachesError, count: coachesCount } = await supabase
      .from('coaches')
      .select('*', { count: 'exact' })
      .limit(5);
    
    console.log('Coaches test result:', { data: coachesData, error: coachesError, count: coachesCount });
    
    res.json({
      clients: {
        count: clientsCount,
        error: clientsError?.message || null,
        sample: clientsData || []
      },
      coaches: {
        count: coachesCount,
        error: coachesError?.message || null,
        sample: coachesData || []
      }
    });
  } catch (error) {
    console.error('Database test error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Test appointment reminders
router.post('/test-reminders/:sessionId', async (req: AuthRequest, res: Response) => {
  try {
    const { sessionId } = req.params;

    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID is required' });
    }

    console.log(`Testing reminders for session ${sessionId}`);

    // Trigger reminders for this session
    await appointmentReminderService.scheduleSessionReminders(sessionId);

    res.json({
      success: true,
      message: `Reminders triggered for session ${sessionId}`,
      details: 'Check your email and messages for the reminders'
    });
  } catch (error) {
    console.error('Test reminder error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to trigger reminders',
      details: error instanceof Error ? error.message : error
    });
  }
});

// Process due reminders manually (for testing)
router.post('/process-reminders', async (req: AuthRequest, res: Response) => {
  try {
    console.log('Manually processing due reminders...');

    await appointmentReminderService.processDueReminders();

    res.json({
      success: true,
      message: 'Due reminders processed successfully'
    });
  } catch (error) {
    console.error('Process reminders error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process reminders',
      details: error instanceof Error ? error.message : error
    });
  }
});

// Check and send reminders for upcoming sessions
router.post('/check-upcoming-sessions', async (req: AuthRequest, res: Response) => {
  try {
    console.log('Checking for upcoming sessions without reminders...');

    await appointmentReminderService.checkUpcomingSessions();

    res.json({
      success: true,
      message: 'Checked upcoming sessions and sent necessary reminders'
    });
  } catch (error) {
    console.error('Check upcoming sessions error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check upcoming sessions',
      details: error instanceof Error ? error.message : error
    });
  }
});

// Test SMTP email configuration
router.post('/test-email', async (req: AuthRequest, res: Response) => {
  try {
    const { testEmail } = req.body;
    const adminId = req.user?.id || req.user?.userId;
    
    if (!adminId) {
      return res.status(401).json({ error: 'Admin authentication required' });
    }
    
    if (!testEmail) {
      return res.status(400).json({ error: 'Test email address is required' });
    }
    
    console.log('Testing SMTP email to:', testEmail);
    
    // Send test credentials email
    const testCredentials = {
      email: testEmail,
      password: 'TestPassword123!',
      firstName: 'Test',
      lastName: 'User',
      role: 'client'
    };
    
    const result = await smtpEmailService.sendUserCredentials(testCredentials);
    
    if (result.success) {
      res.json({
        success: true,
        message: 'Test email sent successfully',
        details: result
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to send test email',
        error: result.error,
        details: result.details
      });
    }
  } catch (error) {
    console.error('Test email error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send test email',
      details: error instanceof Error ? error.message : error
    });
  }
});

// System health check
router.get('/health', async (req, res) => {
  try {
    // Check database connection
    const { data, error } = await supabase
      .from('clients')
      .select('count')
      .limit(1);

    if (error) {
      throw error;
    }

    res.json({
      status: 'healthy',
      database: 'connected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({
      status: 'unhealthy',
      database: 'disconnected',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Create or get conversation endpoint
router.post('/conversations', async (req: AuthRequest, res: Response) => {
  try {
    const { partnerId, partnerRole } = req.body;
    // Try both id and userId fields from JWT payload
    const adminId = req.user?.id || req.user?.userId;

    if (!adminId) {
      console.error('Admin ID not found in request. User object:', req.user);
      return res.status(401).json({ error: 'Admin authentication required' });
    }

    if (!partnerId || !partnerRole) {
      return res.status(400).json({ error: 'Partner ID and role are required' });
    }

    console.log('Admin conversation creation:', { adminId, partnerId, partnerRole });

    // Check if conversation already exists
    const { data: existingMessages } = await supabase
      .from('messages')
      .select('id')
      .or(`and(sender_id.eq.${adminId},recipient_id.eq.${partnerId}),and(sender_id.eq.${partnerId},recipient_id.eq.${adminId})`)
      .limit(1);

    if (existingMessages && existingMessages.length > 0) {
      // Conversation already exists
      return res.json({
        success: true,
        message: 'Conversation already exists',
        conversationExists: true
      });
    }

    // Get partner information to validate they exist
    let partnerInfo = null;
    if (partnerRole === 'client') {
      const { data: client } = await supabase
        .from('clients')
        .select('id, first_name, last_name, email')
        .eq('id', partnerId)
        .single();
      partnerInfo = client;
    } else if (partnerRole === 'coach') {
      const { data: coach } = await supabase
        .from('coaches')
        .select('id, first_name, last_name, email')
        .eq('id', partnerId)
        .single();
      partnerInfo = coach;
    }

    if (!partnerInfo) {
      return res.status(404).json({ error: 'Partner not found' });
    }

    // Just return success - conversation will be created when first message is sent
    res.json({
      success: true,
      message: 'Conversation ready to be created',
      conversationExists: false,
      partnerInfo: {
        id: partnerInfo.id,
        name: `${partnerInfo.first_name} ${partnerInfo.last_name}`,
        email: partnerInfo.email,
        role: partnerRole
      }
    });
  } catch (error) {
    console.error('Create conversation error:', error);
    res.status(500).json({ error: 'Failed to create conversation' });
  }
});

// Admin messaging endpoints
router.get('/conversations', async (req: AuthRequest, res: Response) => {
  try {
    // Try both id and userId fields from JWT payload
    const adminId = req.user?.id || req.user?.userId;
    
    if (!adminId) {
      console.error('Admin ID not found in request. User object:', req.user);
      return res.status(401).json({ error: 'Admin authentication required' });
    }
    
    console.log('Admin conversations request from user:', adminId);
    
    // Get all messages where admin is involved
    const { data: messages, error } = await supabase
      .from('messages')
      .select('id, sender_id, recipient_id, body, created_at, read_at')
      .or(`sender_id.eq.${adminId},recipient_id.eq.${adminId}`)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Messages fetch error:', error);
      return res.status(500).json({ error: 'Failed to fetch messages', details: error.message });
    }

    // Group messages by conversation partners
    const conversationMap = new Map();
    
    for (const message of messages || []) {
      let partnerId: string;
      let partnerName: string = 'Unknown User';
      let partnerRole: 'client' | 'coach' = 'client';

      // Determine conversation partner
      if (message.sender_id === adminId) {
        partnerId = message.recipient_id;
      } else {
        partnerId = message.sender_id;
      }

      let partnerPhoto: string | null = null;

      // Get partner info from clients table first
      const { data: clientData } = await supabase
        .from('clients')
        .select('first_name, last_name, email, profile_photo')
        .eq('id', partnerId)
        .single();
      
      if (clientData) {
        partnerName = `${clientData.first_name || ''} ${clientData.last_name || ''}`.trim() || 'Unknown Client';
        partnerRole = 'client';
        partnerPhoto = clientData.profile_photo;
      } else {
        // Try coaches table
        const { data: coachData } = await supabase
          .from('coaches')
          .select('first_name, last_name, email, profile_photo')
          .eq('id', partnerId)
          .single();
        
        if (coachData) {
          partnerName = `${coachData.first_name || ''} ${coachData.last_name || ''}`.trim() || 'Unknown Coach';
          partnerRole = 'coach';
          partnerPhoto = coachData.profile_photo;
        }
      }

      const conversationKey = partnerId;
      
      if (!conversationMap.has(conversationKey)) {
        conversationMap.set(conversationKey, {
          partnerId,
          partnerName,
          partnerRole,
          partnerPhoto,
          lastBody: message.body || '',
          lastAt: message.created_at,
          unreadCount: 0,
          totalMessages: 1
        });
      } else {
        const conversation = conversationMap.get(conversationKey);
        conversation.totalMessages++;
        
        // Update if this message is more recent
        if (new Date(message.created_at) > new Date(conversation.lastAt)) {
          conversation.lastBody = message.body || '';
          conversation.lastAt = message.created_at;
        }
      }

      // Count unread messages (messages to admin that haven't been read)
      if (message.recipient_id === adminId && !message.read_at) {
        const conversation = conversationMap.get(conversationKey);
        conversation.unreadCount++;
      }
    }

    const conversations = Array.from(conversationMap.values())
      .sort((a, b) => new Date(b.lastAt).getTime() - new Date(a.lastAt).getTime());

    res.json({ success: true, data: conversations });
  } catch (error) {
    console.error('Admin conversations error:', error);
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

router.get('/messages', async (req: AuthRequest, res: Response) => {
  try {
    const { conversation_with } = req.query;
    // Try both id and userId fields from JWT payload
    const adminId = req.user?.id || req.user?.userId;

    if (!adminId) {
      console.error('Admin ID not found in request. User object:', req.user);
      return res.status(401).json({ error: 'Admin authentication required' });
    }

    if (!conversation_with) {
      return res.status(400).json({ error: 'conversation_with parameter is required' });
    }

    console.log('Admin messages request:', { adminId, conversation_with });

    // Get messages between admin and the specified user
    const { data: messages, error } = await supabase
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${adminId},recipient_id.eq.${conversation_with}),and(sender_id.eq.${conversation_with},recipient_id.eq.${adminId})`)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Messages fetch error:', error);
      return res.status(500).json({ error: 'Failed to fetch messages', details: error.message });
    }

    res.json({ success: true, data: messages || [] });
  } catch (error) {
    console.error('Admin messages error:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

router.put('/messages/:messageId/read', async (req: AuthRequest, res: Response) => {
  try {
    const { messageId } = req.params;
    // Try both id and userId fields from JWT payload
    const adminId = req.user?.id || req.user?.userId;

    if (!adminId) {
      console.error('Admin ID not found in request. User object:', req.user);
      return res.status(401).json({ error: 'Admin authentication required' });
    }

    // Mark message as read
    const { data, error } = await supabase
      .from('messages')
      .update({ read_at: new Date().toISOString() })
      .eq('id', messageId)
      .eq('recipient_id', adminId)
      .select()
      .single();

    if (error) {
      console.error('Mark read error:', error);
      throw error;
    }

    res.json({ success: true, data });
  } catch (error) {
    console.error('Admin mark read error:', error);
    res.status(500).json({ error: 'Failed to mark message as read' });
  }
});

router.delete('/messages/:messageId/everyone', async (req: AuthRequest, res: Response) => {
  try {
    const { messageId } = req.params;

    // Admin can delete any message for everyone
    const { data, error } = await supabase
      .from('messages')
      .update({
        deleted_for_everyone: true,
        deleted_at: new Date().toISOString(),
        body: 'This message was deleted'
      })
      .eq('id', messageId)
      .select()
      .single();

    if (error) {
      console.error('Delete message error:', error);
      throw error;
    }

    // Emit socket event for real-time update
    const io = req.app.get('io');
    if (io) {
      io.emit('message:deleted_everyone', {
        messageId,
        deletedBy: req.user?.id
      });
    }

    res.json({ success: true, data });
  } catch (error) {
    console.error('Admin delete message error:', error);
    res.status(500).json({ error: 'Failed to delete message' });
  }
});

router.put('/messages/:messageId/hide', async (req: AuthRequest, res: Response) => {
  try {
    const { messageId } = req.params;
    // Try both id and userId fields from JWT payload
    const adminId = req.user?.id || req.user?.userId;

    if (!adminId) {
      console.error('Admin ID not found in request. User object:', req.user);
      return res.status(401).json({ error: 'Admin authentication required' });
    }

    console.log('Hide message request:', { messageId, adminId });

    // Get current message
    const { data: message, error: fetchError } = await supabase
      .from('messages')
      .select('id, hidden_for_users')
      .eq('id', messageId)
      .single();

    if (fetchError) {
      console.error('Fetch message error:', fetchError);
      return res.status(404).json({ error: 'Message not found', details: fetchError.message });
    }

    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    // Add admin to hidden_for_users array
    const hiddenUsers = Array.isArray(message.hidden_for_users) ? message.hidden_for_users : [];
    if (!hiddenUsers.includes(adminId)) {
      hiddenUsers.push(adminId);
    }

    console.log('Updating hidden_for_users:', { messageId, hiddenUsers });

    const { data, error } = await supabase
      .from('messages')
      .update({ hidden_for_users: hiddenUsers })
      .eq('id', messageId)
      .select()
      .single();

    if (error) {
      console.error('Hide message update error:', error);
      return res.status(500).json({ error: 'Failed to update message', details: error.message });
    }

    console.log('Message hidden successfully:', data);
    res.json({ success: true, data });
  } catch (error) {
    console.error('Admin hide message error:', error);
    res.status(500).json({ error: 'Failed to hide message', details: error.message });
  }
});

router.delete('/conversations/:partnerId', async (req: AuthRequest, res: Response) => {
  try {
    const { partnerId } = req.params;
    // Try both id and userId fields from JWT payload
    const adminId = req.user?.id || req.user?.userId;

    if (!adminId) {
      console.error('Admin ID not found in request. User object:', req.user);
      return res.status(401).json({ error: 'Admin authentication required' });
    }

    // Delete all messages between admin and partner
    const { error } = await supabase
      .from('messages')
      .delete()
      .or(`and(sender_id.eq.${adminId},recipient_id.eq.${partnerId}),and(sender_id.eq.${partnerId},recipient_id.eq.${adminId})`);

    if (error) {
      console.error('Delete conversation error:', error);
      throw error;
    }

    res.json({ success: true, message: 'Conversation deleted successfully' });
  } catch (error) {
    console.error('Admin delete conversation error:', error);
    res.status(500).json({ error: 'Failed to delete conversation' });
  }
});

router.post('/upload-attachment', uploadAttachment.single('attachment'), async (req: AuthRequest, res: Response) => {
  try {
    const adminId = req.user?.id || req.user?.userId;
    
    if (!adminId) {
      return res.status(401).json({ error: 'Admin authentication required' });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    // Upload file to Supabase Storage using admin ID
    const uploadResult = await uploadToSupabase(req.file, adminId);

    res.json({
      success: true,
      data: {
        url: uploadResult.url,
        name: req.file.originalname,
        size: req.file.size,
        type: req.file.mimetype,
        path: uploadResult.path
      }
    });
  } catch (error) {
    console.error('Admin upload error:', error);
    res.status(500).json({ 
      success: false, 
      message: error instanceof Error ? error.message : 'Failed to upload attachment' 
    });
  }
});

// Admin Profile endpoints
router.get('/profile', async (req: AuthRequest, res: Response) => {
  try {
    const adminId = req.user?.id || req.user?.userId;
    
    if (!adminId) {
      return res.status(401).json({ error: 'Admin authentication required' });
    }

    // First try to get from admins table, if not found try users table
    let { data: adminData, error: adminError } = await supabase
      .from('admins')
      .select('id, email, first_name, last_name, profile_photo')
      .eq('id', adminId)
      .single();

    if (adminError && adminError.code === 'PGRST116') {
      // Not found in admins table, try users table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, email, first_name, last_name, profile_photo')
        .eq('id', adminId)
        .eq('role', 'admin')
        .single();
      
      if (userError) {
        console.error('Admin profile fetch error:', userError);
        return res.status(404).json({ error: 'Admin profile not found' });
      }
      
      adminData = userData;
    } else if (adminError) {
      console.error('Admin profile fetch error:', adminError);
      return res.status(500).json({ error: 'Failed to fetch admin profile' });
    }

    res.json({ success: true, data: adminData });
  } catch (error) {
    console.error('Admin profile error:', error);
    res.status(500).json({ error: 'Failed to fetch admin profile' });
  }
});

router.put('/profile', async (req: AuthRequest, res: Response) => {
  try {
    const adminId = req.user?.id || req.user?.userId;
    
    if (!adminId) {
      return res.status(401).json({ error: 'Admin authentication required' });
    }

    const { first_name, last_name, profile_photo } = req.body;
    const updateData: any = {};
    
    if (first_name !== undefined) updateData.first_name = first_name;
    if (last_name !== undefined) updateData.last_name = last_name;
    if (profile_photo !== undefined) updateData.profile_photo = profile_photo;

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: 'No valid fields provided for update' });
    }

    // Try to update admins table first
    let { data, error } = await supabase
      .from('admins')
      .update(updateData)
      .eq('id', adminId)
      .select('id, email, first_name, last_name, profile_photo')
      .single();

    if (error && error.code === 'PGRST116') {
      // Not found in admins table, try users table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', adminId)
        .eq('role', 'admin')
        .select('id, email, first_name, last_name, profile_photo')
        .single();
      
      if (userError) {
        console.error('Admin profile update error:', userError);
        return res.status(404).json({ error: 'Admin profile not found' });
      }
      
      data = userData;
    } else if (error) {
      console.error('Admin profile update error:', error);
      return res.status(500).json({ error: 'Failed to update admin profile' });
    }

    res.json({ success: true, data, message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Admin profile update error:', error);
    res.status(500).json({ error: 'Failed to update admin profile' });
  }
});

// System logs endpoint - Admin only
router.get('/system-logs', authorize('admin'), async (req, res) => {
  try {
    const { page = 1, limit = 50, level, action, user_type } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    // Get system logs from multiple audit tables and console logs
    let allLogs: any[] = [];

    // Get admin audit logs
    const { data: adminLogs, error: adminLogsError } = await supabase
      .from('admin_audit_log')
      .select(`
        *,
        admin:admin_id(first_name, last_name, email)
      `)
      .order('created_at', { ascending: false })
      .limit(100);

    if (adminLogs && !adminLogsError) {
      const formattedAdminLogs = adminLogs.map(log => ({
        id: log.id,
        timestamp: log.created_at,
        level: 'INFO',
        action: log.action,
        user_type: 'admin',
        user_id: log.admin_id,
        user_name: log.admin ? `${log.admin.first_name} ${log.admin.last_name}` : 'Unknown',
        user_email: log.admin?.email || '',
        details: log.details || '',
        metadata: log.metadata || {},
        ip_address: log.ip_address || '',
        user_agent: log.user_agent || '',
        source: 'admin_audit'
      }));
      allLogs = [...allLogs, ...formattedAdminLogs];
    }

    // Get staff audit logs
    const { data: staffLogs, error: staffLogsError } = await supabase
      .from('staff_audit_log')
      .select(`
        *,
        staff:staff_id(first_name, last_name, email)
      `)
      .order('created_at', { ascending: false })
      .limit(100);

    if (staffLogs && !staffLogsError) {
      const formattedStaffLogs = staffLogs.map(log => ({
        id: log.id,
        timestamp: log.created_at,
        level: 'INFO',
        action: log.action,
        user_type: 'staff',
        user_id: log.staff_id,
        user_name: log.staff ? `${log.staff.first_name} ${log.staff.last_name}` : 'Unknown',
        user_email: log.staff?.email || '',
        details: log.details || '',
        metadata: log.metadata || {},
        ip_address: log.ip_address || '',
        user_agent: log.user_agent || '',
        source: 'staff_audit'
      }));
      allLogs = [...allLogs, ...formattedStaffLogs];
    }

    // Get client audit logs
    const { data: clientLogs, error: clientLogsError } = await supabase
      .from('client_audit_log')
      .select(`
        *,
        client:client_id(first_name, last_name, email)
      `)
      .order('created_at', { ascending: false })
      .limit(100);

    if (clientLogs && !clientLogsError) {
      const formattedClientLogs = clientLogs.map(log => ({
        id: log.id,
        timestamp: log.created_at,
        level: 'INFO',
        action: log.action,
        user_type: 'client',
        user_id: log.client_id,
        user_name: log.client ? `${log.client.first_name} ${log.client.last_name}` : 'Unknown',
        user_email: log.client?.email || '',
        details: log.details || '',
        metadata: log.metadata || {},
        ip_address: log.ip_address || '',
        user_agent: log.user_agent || '',
        source: 'client_audit'
      }));
      allLogs = [...allLogs, ...formattedClientLogs];
    }

    // Get coach audit logs
    const { data: coachLogs, error: coachLogsError } = await supabase
      .from('coach_audit_log')
      .select(`
        *,
        coach:coach_id(first_name, last_name, email)
      `)
      .order('created_at', { ascending: false })
      .limit(100);

    if (coachLogs && !coachLogsError) {
      const formattedCoachLogs = coachLogs.map(log => ({
        id: log.id,
        timestamp: log.created_at,
        level: 'INFO',
        action: log.action,
        user_type: 'coach',
        user_id: log.coach_id,
        user_name: log.coach ? `${log.coach.first_name} ${log.coach.last_name}` : 'Unknown',
        user_email: log.coach?.email || '',
        details: log.details || '',
        metadata: log.metadata || {},
        ip_address: log.ip_address || '',
        user_agent: log.user_agent || '',
        source: 'coach_audit'
      }));
      allLogs = [...allLogs, ...formattedCoachLogs];
    }

    // Get session audit logs
    const { data: sessionLogs, error: sessionLogsError } = await supabase
      .from('session_audit_log')
      .select(`
        *,
        session:session_id(id)
      `)
      .order('created_at', { ascending: false })
      .limit(100);

    if (sessionLogs && !sessionLogsError) {
      const formattedSessionLogs = sessionLogs.map(log => ({
        id: log.id,
        timestamp: log.created_at,
        level: 'INFO',
        action: log.action,
        user_type: log.user_type,
        user_id: log.user_id,
        user_name: log.metadata?.user_name || 'Unknown',
        user_email: log.metadata?.user_email || '',
        details: log.details || '',
        metadata: log.metadata || {},
        ip_address: log.ip_address || '',
        user_agent: log.user_agent || '',
        source: 'session_audit'
      }));
      allLogs = [...allLogs, ...formattedSessionLogs];
    }

    // Get coach application audit logs if the table exists
    try {
      const { data: coachApplicationLogs, error: coachAppLogsError } = await supabase
        .from('coach_application_audit_log')
        .select(`
          *,
          coach:coach_id(first_name, last_name, email),
          admin:admin_id(first_name, last_name, email)
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (coachApplicationLogs && !coachAppLogsError) {
        const formattedCoachAppLogs = coachApplicationLogs.map(log => ({
          id: log.id,
          timestamp: log.created_at,
          level: 'INFO',
          action: log.action,
          user_type: log.admin_id ? 'admin' : 'coach',
          user_id: log.admin_id || log.coach_id,
          user_name: log.admin ? `${log.admin.first_name} ${log.admin.last_name}` :
                     log.coach ? `${log.coach.first_name} ${log.coach.last_name}` : 'Unknown',
          user_email: log.admin?.email || log.coach?.email || '',
          details: log.details || '',
          metadata: log.metadata || {},
          ip_address: log.ip_address || '',
          user_agent: log.user_agent || '',
          source: 'coach_application_audit'
        }));
        allLogs = [...allLogs, ...formattedCoachAppLogs];
      }
    } catch (error) {
      console.log('Coach application audit table not found, skipping...');
    }

    // Sort all logs by timestamp descending
    allLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Apply filters
    if (level) {
      allLogs = allLogs.filter(log => log.level === level);
    }
    if (action) {
      allLogs = allLogs.filter(log => log.action?.toLowerCase().includes(String(action).toLowerCase()));
    }
    if (user_type) {
      allLogs = allLogs.filter(log => log.user_type === user_type);
    }

    // Get total count before pagination
    const total = allLogs.length;

    // Apply pagination
    const paginatedLogs = allLogs.slice(offset, offset + Number(limit));

    // Get summary statistics
    const stats = {
      total,
      levels: {
        INFO: allLogs.filter(log => log.level === 'INFO').length,
        WARN: allLogs.filter(log => log.level === 'WARN').length,
        ERROR: allLogs.filter(log => log.level === 'ERROR').length,
      },
      sources: {
        admin_audit: allLogs.filter(log => log.source === 'admin_audit').length,
        staff_audit: allLogs.filter(log => log.source === 'staff_audit').length,
        client_audit: allLogs.filter(log => log.source === 'client_audit').length,
        coach_audit: allLogs.filter(log => log.source === 'coach_audit').length,
        session_audit: allLogs.filter(log => log.source === 'session_audit').length,
        coach_application_audit: allLogs.filter(log => log.source === 'coach_application_audit').length,
      },
      user_types: {
        admin: allLogs.filter(log => log.user_type === 'admin').length,
        staff: allLogs.filter(log => log.user_type === 'staff').length,
        coach: allLogs.filter(log => log.user_type === 'coach').length,
        client: allLogs.filter(log => log.user_type === 'client').length,
      }
    };

    res.json({
      success: true,
      logs: paginatedLogs,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit))
      },
      stats,
      filters: { level, action, user_type }
    });

  } catch (error) {
    console.error('System logs fetch error:', error);
    res.status(500).json({
      error: 'Failed to fetch system logs',
      success: false
    });
  }
});

// Mount content management routes
router.use('/content', contentRoutes);

// Mount financial oversight routes
router.use('/financial', financialRoutes);

// Mount staff management routes
router.use('/staff', staffRoutes);

// Direct staff permissions routes (to avoid conflict with staff management routes)
router.get('/staff-permissions', authorize('admin', 'staff'), getStaffPermissions);
router.put('/staff-permissions', authorize('admin'), updateStaffPermissions);
console.log('Staff permissions routes registered');

// Payment refund endpoint - Admin only
router.post('/payments/:paymentId/refund', authorize('admin'), async (req, res) => {
  try {
    const { paymentId } = req.params;
    const { amount_cents, reason, description } = req.body;

    // Import SquarePaymentService
    const { SquarePaymentService } = await import('../services/squarePaymentService');
    const squarePaymentService = new SquarePaymentService();

    // Get admin user info from the authenticated request
    const adminUser = (req as any).user;

    // Create refund request
    const refundRequest = {
      payment_id: paymentId,
      amount_cents: amount_cents, // Optional - if not provided, refunds full amount
      reason: reason || 'admin_initiated',
      description: description || 'Admin initiated refund'
    };

    // Process the refund
    const refundResponse = await squarePaymentService.createRefund(adminUser.id, refundRequest);

    // Log the admin action
    const auditReq = req as AuditRequest;
    await auditLogger.logAction(auditReq, {
      action: 'PAYMENT_REFUND',
      resource_type: 'payment',
      resource_id: paymentId,
      details: `Processed refund of $${(amount_cents || 0) / 100} for payment ${paymentId}. Reason: ${reason}`,
      metadata: {
        refund_id: refundResponse.refund_id,
        square_refund_id: refundResponse.square_refund_id,
        amount_cents: refundResponse.amount_cents,
        reason: reason,
        description: description
      }
    });

    res.json({
      success: true,
      data: refundResponse,
      message: 'Refund processed successfully'
    });

  } catch (error) {
    console.error('Admin refund error:', error);

    // Log the failed action
    const auditReq = req as AuditRequest;
    await auditLogger.logAction(auditReq, {
      action: 'PAYMENT_REFUND_FAILED',
      resource_type: 'payment',
      resource_id: req.params.paymentId,
      details: `Failed to process refund: ${(error as Error).message}`,
      metadata: {
        error: (error as Error).message,
        request_body: req.body
      }
    });

    res.status(500).json({
      error: (error as Error).message || 'Failed to process refund',
      success: false
    });
  }
});

// Get payment details for refund - Admin only
router.get('/payments/:paymentId', authorize('admin'), async (req, res) => {
  try {
    const { paymentId } = req.params;

    // Get payment details
    const { data: payment, error } = await supabase
      .from('payments')
      .select(`
        *,
        client:client_id(first_name, last_name, email),
        coach:coach_id(first_name, last_name, email)
      `)
      .eq('id', paymentId)
      .single();

    if (error) {
      throw new Error(`Payment not found: ${error.message}`);
    }

    // Get existing refunds
    const { data: refunds, error: refundsError } = await supabase
      .from('refunds')
      .select('*')
      .eq('payment_id', paymentId)
      .order('created_at', { ascending: false });

    if (refundsError) {
      console.error('Error fetching refunds:', refundsError);
    }

    res.json({
      success: true,
      data: {
        payment,
        refunds: refunds || []
      }
    });

  } catch (error) {
    console.error('Payment fetch error:', error);
    res.status(500).json({
      error: (error as Error).message || 'Failed to fetch payment details',
      success: false
    });
  }
});

export default router;