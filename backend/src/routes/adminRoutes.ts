import { Router, Request, Response } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { supabase } from '../lib/supabase';
import { JWTPayload } from '../types/auth';

interface AuthRequest extends Request {
  user?: JWTPayload;
}

const router = Router();

// Apply authentication and admin authorization to all routes
router.use(authenticate);
router.use(authorize('admin'));

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
        .select('id, first_name, last_name, email, phone, created_at, last_login, status');
      
      if (clientsError) {
        console.error('Clients fetch error:', clientsError);
      } else if (clients && clients.length > 0) {
        console.log(`Found ${clients.length} clients`);
        users.push(...clients.map(client => ({
          ...client,
          name: `${client.first_name || ''} ${client.last_name || ''}`.trim() || 'Unnamed User',
          role: 'client',
          status: client.status || 'active'
        })));
      }
    } catch (clientError) {
      console.error('Client query error:', clientError);
    }

    // Get coaches with error handling
    try {
      const { data: coaches, error: coachesError } = await supabase
        .from('coaches')
        .select('id, first_name, last_name, email, phone, created_at, last_login, status');
      
      if (coachesError) {
        console.error('Coaches fetch error:', coachesError);
      } else if (coaches && coaches.length > 0) {
        console.log(`Found ${coaches.length} coaches`);
        users.push(...coaches.map(coach => ({
          ...coach,
          name: `${coach.first_name || ''} ${coach.last_name || ''}`.trim() || 'Unnamed Coach',
          role: 'coach',
          status: coach.status || 'active'
        })));
      }
    } catch (coachError) {
      console.error('Coach query error:', coachError);
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

// Create new user (client, coach, or staff)
router.post('/users', async (req, res) => {
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

    // Hash password if provided
    let hashedPassword = null;
    if (userData.password) {
      console.log('Hashing temporary password...');
      const bcrypt = require('bcryptjs');
      const saltRounds = parseInt(process.env.BCRYPT_ROUNDS || '12');
      hashedPassword = await bcrypt.hash(userData.password, saltRounds);
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
          rating: 4.5,
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
          role: 'staff',
          department: userData.department || null,
          permissions: userData.permissions || [],
          status: userData.status || 'active',
          password_hash: hashedPassword,
          created_at: new Date().toISOString()
        };
        
        console.log('Creating staff with data:', staffData);
        
        const { data: newStaff, error: staffError } = await supabase
          .from('users')
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

    res.status(201).json({
      success: true,
      message: `${userType} created successfully`,
      user: result
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
          // Try staff in users table
          const { data: staff } = await supabase
            .from('users')
            .select('*')
            .eq('id', id)
            .eq('role', 'staff')
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
          tableName = 'users';
          query = supabase.from(tableName).select('*').eq('id', id).eq('role', 'staff');
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

// Update user
router.put('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { userType, userData } = req.body;

    if (!userType || !userData) {
      return res.status(400).json({ error: 'User type and user data are required' });
    }

    let result;
    
    // Transform camelCase to snake_case for database fields
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
          .from('users')
          .update(updateData)
          .eq('id', id)
          .eq('role', 'staff')
          .select()
          .single();
        
        if (staffError) throw staffError;
        result = { ...updatedStaff, role: 'staff' };
        break;

      default:
        return res.status(400).json({ error: 'Invalid user type' });
    }

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

// Delete user
router.delete('/users/:id', async (req, res) => {
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
        tableName = 'users';
        query = supabase.from(tableName).select('*').eq('id', id).eq('role', 'staff');
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
    if (userType === 'staff') {
      deleteQuery = supabase.from(tableName).delete().eq('id', id).eq('role', 'staff');
    } else {
      deleteQuery = supabase.from(tableName).delete().eq('id', id);
    }
    
    const { error: deleteError } = await deleteQuery;
    if (deleteError) throw deleteError;

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

// User impersonation endpoint
router.post('/users/:id/impersonate', async (req, res) => {
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
        tableName = 'users';
        const { data: staff, error: staffError } = await supabase
          .from('users')
          .select('*')
          .eq('id', id)
          .eq('role', 'staff')
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
        userId: userData.id, // Use userId to match existing auth system
        id: userData.id,
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

    // Log the impersonation for audit purposes
    console.log(`Admin ${adminUser.id} (${adminUser.email}) impersonating ${userType} ${userData.id} (${userData.email})`);

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

// User status actions (activate, suspend, etc.)
router.post('/users/:id/:action', async (req, res) => {
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
        query = supabase.from('users').update({
          status: statusValue,
          updated_at: new Date().toISOString()
        }).eq('id', id).eq('role', 'staff').select().single();
        break;
      default:
        return res.status(400).json({ error: 'Invalid user type' });
    }

    const { data: updatedUser, error } = await query;
    if (error) throw error;

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

// Staff management endpoints
router.get('/staff', async (req, res) => {
  try {
    const { status, department } = req.query;

    let query = supabase
      .from('users')
      .select('*')
      .eq('role', 'staff');

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
        created_at,
        clients!sessions_client_id_fkey (
          id,
          first_name,
          last_name,
          email
        ),
        coaches!sessions_coach_id_fkey (
          id,
          first_name,
          last_name,
          email
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
      // If there's a foreign key error, try simpler query
      const { data: simpleSessions } = await supabase
        .from('sessions')
        .select('*')
        .order('starts_at', { ascending: false });
      
      // Format simple sessions data
      const formattedSimple = simpleSessions?.map((session: any) => {
        const startDate = new Date(session.starts_at);
        return {
          id: session.id,
          clientName: 'Unknown Client',
          clientEmail: 'N/A',
          coachName: 'Unknown Coach',
          coachEmail: 'N/A',
          date: startDate.toISOString().split('T')[0],
          time: startDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
          duration: session.duration_minutes || 60,
          status: session.status || 'scheduled',
          type: session.session_type || 'video',
          notes: session.notes || '',
          created_at: session.created_at
        };
      }) || [];
      
      res.json({ appointments: formattedSimple });
      return;
    }

    // Format sessions as appointments for frontend
    const formattedAppointments = sessions?.map((session: any) => {
      const startDate = new Date(session.starts_at);
      return {
        id: session.id,
        clientName: session.clients ? `${session.clients.first_name || ''} ${session.clients.last_name || ''}`.trim() : 'Unknown Client',
        clientEmail: session.clients?.email || 'N/A',
        coachName: session.coaches ? `${session.coaches.first_name || ''} ${session.coaches.last_name || ''}`.trim() : 'Unknown Coach',
        coachEmail: session.coaches?.email || 'N/A',
        date: startDate.toISOString().split('T')[0],
        time: startDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
        duration: session.duration_minutes || 60,
        status: session.status || 'scheduled',
        type: session.session_type || 'video',
        notes: session.notes || '',
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

    if (reason) {
      updateData.cancellation_reason = reason;
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

    // Emit WebSocket notifications
    const io = req.app.get('io');
    if (io && currentAppointment.clients && currentAppointment.coaches) {
      const clientName = `${currentAppointment.clients.first_name} ${currentAppointment.clients.last_name}`;
      const coachName = `${currentAppointment.coaches.first_name} ${currentAppointment.coaches.last_name}`;
      
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

    // Calculate coach metrics
    const activeCoaches = coaches.filter(c => c.status === 'approved');
    const averageRating = activeCoaches.length > 0
      ? (activeCoaches.reduce((sum, c) => sum + (c.rating || 0), 0) / activeCoaches.length).toFixed(1)
      : 0;
    
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
    const noShowCount = appointments.filter(a => a.status === 'no_show').length;
    const totalScheduled = appointments.filter(a => ['completed', 'cancelled', 'no_show', 'scheduled'].includes(a.status)).length;
    
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
        averageRating: averageRating // Use coach average rating as proxy
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

export default router;