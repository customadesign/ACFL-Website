import { Router } from 'express';
import { getCoachById } from '../controllers/coachController';
import { supabase } from '../lib/supabase';
import { authenticate } from '../middleware/auth';
import { validationResult, body } from 'express-validator';
import { Request, Response } from 'express';

const router = Router();

// Get coach profile (put specific routes before parameterized ones)
router.get('/coach/profile', authenticate, async (req: Request & { user?: any }, res: Response) => {
  try {
    if (!req.user || req.user.role !== 'coach') {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. Coach role required.' 
      });
    }

    // Get coach profile by email first
    const { data: coachProfile, error: profileError } = await supabase
      .from('coaches')
      .select('*')
      .eq('email', req.user.email)
      .single();

    if (profileError || !coachProfile) {
      return res.status(404).json({ 
        success: false, 
        message: 'Coach profile not found' 
      });
    }

    const coachId = coachProfile.id; // Use the actual coach ID from database

    // Get coach demographics including availability
    const { data: demographics } = await supabase
      .from('coach_demographics')
      .select('*')
      .eq('coach_id', coachId)
      .single();

    // Combine profile with demographics
    const combinedData = {
      ...coachProfile,
      demographics: demographics || {},
      // Extract availability fields for easier access (stored in meta jsonb field)
      videoAvailable: demographics?.meta?.video_available || false,
      inPersonAvailable: demographics?.meta?.in_person_available || false,
      phoneAvailable: demographics?.meta?.phone_available || false
    };

    res.json({
      success: true,
      data: combinedData
    });
  } catch (error) {
    console.error('Get coach profile error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to get profile' 
    });
  }
});

// Update coach profile
router.put('/coach/profile', [
  authenticate,
  body('firstName').optional().trim().isLength({ min: 2, max: 50 }),
  body('lastName').optional().trim().isLength({ min: 2, max: 50 }),
  body('phone').optional().custom((value) => {
    if (!value) return true; // Allow empty/optional
    
    // Remove all non-digit characters except +
    const cleaned = value.replace(/[^\d+]/g, '');
    
    // Must start with + and have at least 10 digits total
    if (!cleaned.startsWith('+')) {
      throw new Error('Phone number must start with country code (e.g., +1, +63)');
    }
    
    const digits = cleaned.replace('+', '');
    if (digits.length < 7 || digits.length > 15) {
      throw new Error('Phone number must be between 7-15 digits (including country code)');
    }
    
    return true;
  }),
  body('bio').optional().isLength({ max: 1000 }),
  body('specialties').optional().isArray({ min: 1 }),
  body('languages').optional().isArray({ min: 1 }),
  body('qualifications').optional().isArray(),
  body('experience').optional().isInt({ min: 0 }),
  body('hourlyRate').optional().isFloat({ min: 0 }),
  body('isAvailable').optional().isBoolean(),
  body('videoAvailable').optional().isBoolean(),
  body('inPersonAvailable').optional().isBoolean(),
  body('phoneAvailable').optional().isBoolean()
], async (req: Request & { user?: any }, res: Response) => {
  try {
    if (!req.user || req.user.role !== 'coach') {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. Coach role required.' 
      });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const {
      firstName,
      lastName,
      phone,
      bio,
      specialties,
      languages,
      qualifications,
      experience,
      hourlyRate,
      isAvailable,
      videoAvailable
    } = req.body;

    // Update coaches table
    const coachUpdates: any = { updated_at: new Date().toISOString() };
    if (firstName) coachUpdates.first_name = firstName;
    if (lastName) coachUpdates.last_name = lastName;
    if (phone !== undefined) coachUpdates.phone = phone;
    if (bio !== undefined) coachUpdates.bio = bio;
    if (specialties) coachUpdates.specialties = specialties;
    if (languages) coachUpdates.languages = languages;
    if (qualifications !== undefined) coachUpdates.qualifications = qualifications;
    if (experience !== undefined) coachUpdates.years_experience = experience;
    if (hourlyRate !== undefined) coachUpdates.hourly_rate_usd = hourlyRate;
    if (isAvailable !== undefined) coachUpdates.is_available = isAvailable;

    // Get coach profile by email first
    const { data: coachProfile, error: profileError } = await supabase
      .from('coaches')
      .select('id')
      .eq('email', req.user.email)
      .single();

    if (profileError || !coachProfile) {
      return res.status(404).json({
        success: false,
        message: 'Coach profile not found'
      });
    }

    const coachId = coachProfile.id; // Use the actual coach ID from database

    const { data: updatedCoach, error: coachError } = await supabase
      .from('coaches')
      .update(coachUpdates)
      .eq('id', coachId)
      .select()
      .single();

    if (coachError) {
      throw coachError;
    }

    // Update or insert coach demographics if video availability is provided
    if (videoAvailable !== undefined) {
      const demographicsUpdates: any = {
        updated_at: new Date().toISOString()
      };

      // Since the schema doesn't have these fields yet, we'll add them to the meta jsonb field
      const { data: existingDemo } = await supabase
        .from('coach_demographics')
        .select('meta')
        .eq('coach_id', coachId)
        .single();

      const existingMeta = existingDemo?.meta || {};
      
      const newMeta = {
        ...existingMeta,
        video_available: videoAvailable
      };

      demographicsUpdates.meta = newMeta;

      // Use upsert to create or update demographics
      const { error: demoError } = await supabase
        .from('coach_demographics')
        .upsert({
          coach_id: coachId,
          ...demographicsUpdates
        });

      if (demoError) {
        console.error('Demographics update error:', demoError);
        // Don't fail the whole request if demographics update fails
      }
    }

    // Get updated profile with demographics
    const { data: demographics } = await supabase
      .from('coach_demographics')
      .select('*')
      .eq('coach_id', coachId)
      .single();

    const combinedData = {
      ...updatedCoach,
      demographics: demographics || {},
      videoAvailable: demographics?.meta?.video_available || false
    };

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: combinedData
    });
  } catch (error) {
    console.error('Update coach profile error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update profile' 
    });
  }
});

// Get coach dashboard stats
router.get('/coach/dashboard', authenticate, async (req: Request & { user?: any }, res: Response) => {
  try {
    if (!req.user || req.user.role !== 'coach') {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. Coach role required.' 
      });
    }

    // Get coach profile by email first
    const { data: coachProfile, error: coachProfileError } = await supabase
      .from('coaches')
      .select('id, rating')
      .eq('email', req.user.email)
      .single();

    if (coachProfileError || !coachProfile) {
      console.error('Could not get coach profile for rating:', coachProfileError);
      return res.status(404).json({
        success: false,
        message: 'Coach profile not found'
      });
    }

    const coachId = coachProfile.id; // Use the actual coach ID from database

    // Get today's appointments
    const today = new Date().toISOString().split('T')[0];
    const { data: todayAppointments, error: appointmentsError } = await supabase
      .from('sessions')
      .select('*')
      .eq('coach_id', coachId)
              .gte('starts_at', `${today}T00:00:00`)
        .lt('starts_at', `${today}T23:59:59`)
      .in('status', ['scheduled', 'confirmed']);

    // Get total active clients
    const { data: activeClients, error: clientsError } = await supabase
      .from('sessions')
      .select('client_id')
      .eq('coach_id', coachId)
      .eq('status', 'completed')
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()); // Last 30 days

    const uniqueClientIds = [...new Set(activeClients?.map(s => s.client_id) || [])];

    // Get this week's sessions
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    weekStart.setHours(0, 0, 0, 0);
    
    const { data: weekSessions, error: weekError } = await supabase
      .from('sessions')
      .select('*')
      .eq('coach_id', coachId)
              .gte('starts_at', weekStart.toISOString())
      .in('status', ['scheduled', 'confirmed', 'completed']);

    // Calculate dynamic rating from reviews
    const { data: reviews, error: reviewsError } = await supabase
      .from('reviews')
      .select('rating')
      .eq('coach_id', coachId);

    let averageRating = 0;
    if (!reviewsError && reviews && reviews.length > 0) {
      const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
      averageRating = Math.round((totalRating / reviews.length) * 10) / 10; // Round to 1 decimal place
    }

    const coachData = { rating: averageRating };

    // Get recent clients with their last sessions
    const { data: recentSessions, error: recentError } = await supabase
      .from('sessions')
      .select(`
        *,
        clients (
          id,
          first_name,
          last_name,
          email
        )
      `)
      .eq('coach_id', coachId)
      .eq('status', 'completed')
      .order('starts_at', { ascending: false })
      .limit(5);

    res.json({
      success: true,
      data: {
        stats: {
          todayAppointments: todayAppointments?.length || 0,
          activeClients: uniqueClientIds.length,
          weekSessions: weekSessions?.length || 0,
          rating: coachData?.rating || 0
        },
        todayAppointments: todayAppointments || [],
        recentClients: recentSessions || []
      }
    });
  } catch (error) {
    console.error('Get coach dashboard error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to get dashboard data' 
    });
  }
});

// Get coach appointments
router.get('/coach/appointments', authenticate, async (req: Request & { user?: any }, res: Response) => {
  try {
    if (!req.user || req.user.role !== 'coach') {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. Coach role required.' 
      });
    }

    const { filter = 'upcoming' } = req.query;

    // Get coach profile by email first
    const { data: coachProfile, error: coachProfileError } = await supabase
      .from('coaches')
      .select('id')
      .eq('email', req.user.email)
      .single();

    if (coachProfileError || !coachProfile) {
      return res.status(404).json({
        success: false,
        message: 'Coach profile not found'
      });
    }

    const coachId = coachProfile.id; // Use the actual coach ID from database

    // Get sessions for this coach first
    let query = supabase
      .from('sessions')
      .select('*')
      .eq('coach_id', coachId)
      .order('starts_at', { ascending: true });

    // Apply filters
    const now = new Date().toISOString();
    if (filter === 'upcoming') {
      query = query.gte('starts_at', now).in('status', ['scheduled', 'confirmed']);
    } else if (filter === 'past') {
      query = query.or(`starts_at.lt.${now},status.eq.completed`);
    } else if (filter === 'pending') {
      query = query.eq('status', 'scheduled');
    }

    const { data: sessions, error: sessionsError } = await query;

    if (sessionsError) {
      throw sessionsError;
    }

    // If no sessions, return empty array
    if (!sessions || sessions.length === 0) {
      return res.json({
        success: true,
        data: []
      });
    }

    // Get unique client IDs from sessions
    const clientIds = [...new Set(sessions.map(s => s.client_id))];
    
    // Get client details separately
    const { data: clients, error: clientsError } = await supabase
      .from('clients')
      .select('id, first_name, last_name, phone, email')
      .in('id', clientIds);

    if (clientsError) {
      throw clientsError;
    }

    // Create a map of clients for quick lookup
    const clientsMap = new Map();
    clients?.forEach(client => {
      clientsMap.set(client.id, client);
    });

    // Combine sessions with client data
    const appointments = sessions.map(session => ({
      ...session,
      clients: clientsMap.get(session.client_id) || null
    }));

    res.json({
      success: true,
      data: appointments
    });
  } catch (error) {
    console.error('Get coach appointments error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to get appointments' 
    });
  }
});

// Get coach clients
router.get('/coach/clients', authenticate, async (req: Request & { user?: any }, res: Response) => {
  try {
    if (!req.user || req.user.role !== 'coach') {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. Coach role required.' 
      });
    }

    // Get coach profile by email first
    const { data: coachProfile, error: coachProfileError } = await supabase
      .from('coaches')
      .select('id')
      .eq('email', req.user.email)
      .single();

    if (coachProfileError || !coachProfile) {
      return res.status(404).json({
        success: false,
        message: 'Coach profile not found'
      });
    }

    const coachId = coachProfile.id; // Use the actual coach ID from database

    // Get sessions for this coach first
    const { data: sessions, error: sessionsError } = await supabase
      .from('sessions')
      .select('client_id, starts_at, status')
      .eq('coach_id', coachId)
      .order('starts_at', { ascending: false });

    if (sessionsError) {
      throw sessionsError;
    }

    // Handle empty sessions case
    if (!sessions || sessions.length === 0) {
      return res.json({
        success: true,
        data: []
      });
    }

    // Get unique client IDs
    const uniqueClientIds = [...new Set(sessions.map(s => s.client_id))];
    
    // Get client details separately
    const { data: clients, error: clientsError } = await supabase
      .from('clients')
      .select('id, first_name, last_name, phone, dob, preferences, created_at, email')
      .in('id', uniqueClientIds);

    if (clientsError) {
      throw clientsError;
    }

    // Process clients data
    const clientsMap = new Map();
    
    // Initialize clients
    clients?.forEach((client: any) => {
      clientsMap.set(client.id, {
        id: client.id,
        user_id: client.id, // In new schema, client ID is same as auth user ID
        name: `${client.first_name} ${client.last_name}`,
        email: client.email || '',
        phone: client.phone || '',
        totalSessions: 0,
        lastSession: null,
        nextSession: null,
        status: 'inactive' as 'active' | 'inactive',
        startDate: client.created_at,
        concerns: client.preferences?.specialties || []
      });
    });

    // Process sessions to add session data to clients
    sessions?.forEach((session: any) => {
      const clientData = clientsMap.get(session.client_id);
      if (!clientData) return;
      
      if (session.status === 'completed') {
        clientData.totalSessions++;
        if (!clientData.lastSession || new Date(session.starts_at) > new Date(clientData.lastSession)) {
          clientData.lastSession = session.starts_at;
        }
      }
      
      if (session.status === 'scheduled' || session.status === 'confirmed') {
        if (!clientData.nextSession || new Date(session.starts_at) < new Date(clientData.nextSession)) {
          clientData.nextSession = session.starts_at;
        }
        clientData.status = 'active';
      }
    });

    const clientsArray = Array.from(clientsMap.values());

    res.json({
      success: true,
      data: clientsArray
    });
  } catch (error) {
    console.error('Get coach clients error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to get clients' 
    });
  }
});

// Update appointment status
router.put('/coach/appointments/:id', [
  authenticate,
  body('status').isIn(['scheduled', 'confirmed', 'cancelled', 'completed'])
], async (req: Request & { user?: any }, res: Response) => {
  try {
    if (!req.user || req.user.role !== 'coach') {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. Coach role required.' 
      });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const { id } = req.params;
    const { status } = req.body;

    // Get coach profile by email first
    const { data: coachProfile, error: coachProfileError } = await supabase
      .from('coaches')
      .select('id')
      .eq('email', req.user.email)
      .single();

    if (coachProfileError || !coachProfile) {
      return res.status(404).json({
        success: false,
        message: 'Coach profile not found'
      });
    }

    const coachId = coachProfile.id; // Use the actual coach ID from database

    // Update appointment status
    const { data: updatedAppointment, error: updateError } = await supabase
      .from('sessions')
      .update({ 
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('coach_id', coachId)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    res.json({
      success: true,
      message: 'Appointment status updated successfully',
      data: updatedAppointment
    });
  } catch (error) {
    console.error('Update appointment status error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update appointment status' 
    });
  }
});

// Get coach profile stats
router.get('/coach/profile/stats', authenticate, async (req: Request & { user?: any }, res: Response) => {
  try {
    if (!req.user || req.user.role !== 'coach') {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. Coach role required.' 
      });
    }

    // Get coach profile by email first
    const { data: coachProfile, error: profileError } = await supabase
      .from('coaches')
      .select('id')
      .eq('email', req.user.email)
      .single();

    if (profileError || !coachProfile) {
      return res.status(404).json({
        success: false,
        message: 'Coach profile not found'
      });
    }

    const coachId = coachProfile.id; // Use the actual coach ID from database

    // Calculate dynamic rating from reviews
    const { data: reviews, error: reviewsError } = await supabase
      .from('reviews')
      .select('rating')
      .eq('coach_id', coachId);

    let averageRating = 0;
    let totalReviews = 0;

    if (!reviewsError && reviews && reviews.length > 0) {
      const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
      averageRating = Math.round((totalRating / reviews.length) * 10) / 10; // Round to 1 decimal place
      totalReviews = reviews.length;
    }

    // Get all sessions for this coach
    const { data: allSessions, error: sessionsError } = await supabase
      .from('sessions')
      .select('*')
      .eq('coach_id', coachId);

    if (sessionsError) {
      throw sessionsError;
    }

    // Get unique clients
    const uniqueClientIds = [...new Set(allSessions?.map(s => s.client_id) || [])];
    
    // Calculate stats
    const totalSessions = allSessions?.filter(s => s.status === 'completed').length || 0;
    const totalClients = uniqueClientIds.length;
    const completedSessions = allSessions?.filter(s => s.status === 'completed').length || 0;
    const totalScheduled = allSessions?.length || 0;
    const completionRate = totalScheduled > 0 ? Math.round((completedSessions / totalScheduled) * 100) : 0;
    // averageRating is already calculated from reviews above

    res.json({
      success: true,
      data: {
        totalClients,
        totalSessions,
        averageRating,
        completionRate
      }
    });
  } catch (error) {
    console.error('Get coach profile stats error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to get profile stats' 
    });
  }
});


// Removed - moving to end of file

// Send message from coach
router.post('/coach/send-message', [
  authenticate,
  body('receiverId').notEmpty().withMessage('Receiver ID is required'),
  body('subject').notEmpty().withMessage('Subject is required'),
  body('content').notEmpty().withMessage('Message content is required'),
  body('messageType').optional().isIn(['general', 'booking', 'cancellation', 'emergency']).withMessage('Invalid message type'),
  body('priority').optional().isIn(['low', 'normal', 'high', 'urgent']).withMessage('Invalid priority')
], async (req: Request & { user?: any }, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { receiverId, subject, content, messageType = 'general', priority = 'normal', sessionId } = req.body;

    // Get coach profile by email first
    const { data: coachProfile, error: coachError } = await supabase
      .from('coaches')
      .select('id, first_name, last_name')
      .eq('email', req.user.email)
      .single();

    if (coachError || !coachProfile) {
      return res.status(404).json({ success: false, message: 'Coach profile not found' });
    }

    // Verify receiver exists (could be client or coach)
    let receiver: any = null;
    
    const { data: clientReceiver, error: clientReceiverError } = await supabase
      .from('clients')
      .select('id, first_name, last_name, email')
      .eq('id', receiverId)
      .single();

    if (!clientReceiverError && clientReceiver) {
      receiver = clientReceiver;
    } else {
      // Try to find in coaches table
      const { data: coachReceiver, error: coachReceiverError } = await supabase
        .from('coaches')
        .select('id, first_name, last_name, email')
        .eq('id', receiverId)
        .single();

      if (coachReceiverError || !coachReceiver) {
        return res.status(404).json({ success: false, message: 'Receiver not found' });
      }
      
      receiver = coachReceiver;
    }

    // Store message in database
    const { data: newMessage, error: messageError } = await supabase
      .from('messages')
      .insert({
        sender_id: coachProfile.id,
        receiver_id: receiverId,
        session_id: sessionId || null,
        subject: subject,
        content: content,
        message_type: messageType,
        priority: priority
      })
      .select(`
        id,
        subject,
        content,
        message_type,
        priority,
        created_at
      `)
      .single();

    if (messageError) {
      console.error('Database error:', messageError);
      return res.status(500).json({ success: false, message: 'Failed to send message' });
    }

    res.json({
      success: true,
      message: 'Message sent successfully',
      data: newMessage
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ success: false, message: 'Failed to send message' });
  }
});

// Get coach messages
router.get('/coach/messages', authenticate, async (req: Request & { user?: any }, res: Response) => {
  try {
    const { page = 1, limit = 20, conversation_with } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    // Get coach profile by email first
    const { data: coachProfile, error: coachError } = await supabase
      .from('coaches')
      .select('id')
      .eq('email', req.user.email)
      .single();

    if (coachError || !coachProfile) {
      return res.status(404).json({ success: false, message: 'Coach profile not found' });
    }

    // For now, return empty messages array
    const messages: any[] = [];

    // Apply pagination manually
    const paginatedMessages = messages?.slice(offset, offset + Number(limit)) || [];

    res.json({
      success: true,
      data: paginatedMessages,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: messages?.length || 0
      }
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch messages' });
  }
});

// Get coach conversations
router.get('/coach/conversations', authenticate, async (req: Request & { user?: any }, res: Response) => {
  try {
    // Get coach profile by email first
    const { data: coachProfile, error: coachError } = await supabase
      .from('coaches')
      .select('id')
      .eq('email', req.user.email)
      .single();

    if (coachError || !coachProfile) {
      return res.status(404).json({ success: false, message: 'Coach profile not found' });
    }

    // For now, return empty messages array
    const messages: any[] = [];

    // Group by conversation partners
    const conversationsMap = new Map();
    
    messages?.forEach(message => {
      const partnerId = message.sender_id === coachProfile.id ? message.receiver_id : message.sender_id;
      
      if (!conversationsMap.has(partnerId)) {
        conversationsMap.set(partnerId, {
          partnerId,
          lastMessage: message,
          unreadCount: 0,
          totalMessages: 0
        });
      }
      
      const conversation = conversationsMap.get(partnerId);
      conversation.totalMessages++;
      
      // Count unread messages (received by current user and not read)
      if (message.receiver_id === coachProfile.id && !message.is_read) {
        conversation.unreadCount++;
      }
    });

    const conversations = Array.from(conversationsMap.values());

    res.json({
      success: true,
      data: conversations
    });
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch conversations' });
  }
});

// Test messages table
router.get('/coach/test-messages', authenticate, async (req: Request & { user?: any }, res: Response) => {
  try {
    // Simple test to check if messages table exists
    const { data, error } = await supabase
      .from('messages')
      .select('count')
      .limit(1);

    if (error) {
      return res.status(500).json({ 
        success: false, 
        message: 'Messages table error', 
        error: error.message 
      });
    }

    res.json({
      success: true,
      message: 'Messages table exists and is accessible',
      data: data
    });
  } catch (error) {
    console.error('Test messages error:', error);
    res.status(500).json({ success: false, message: 'Failed to test messages table' });
  }
});

// Mark coach messages as read
router.put('/coach/messages/:messageId/read', authenticate, async (req: Request & { user?: any }, res: Response) => {
  try {
    const { messageId } = req.params;

    // Get coach profile by email first
    const { data: coachProfile, error: coachError } = await supabase
      .from('coaches')
      .select('id')
      .eq('email', req.user.email)
      .single();

    if (coachError || !coachProfile) {
      return res.status(404).json({ success: false, message: 'Coach profile not found' });
    }

    const { error } = await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('id', messageId)
      .eq('receiver_id', coachProfile.id); // Only mark as read if current user is receiver

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      message: 'Message marked as read'
    });
  } catch (error) {
    console.error('Mark message read error:', error);
    res.status(500).json({ success: false, message: 'Failed to mark message as read' });
  }
});

// Get coach by ID (IMPORTANT: Keep this at the end - parameterized routes must come after specific ones)
router.get('/coach/:id', getCoachById);

export default router; 