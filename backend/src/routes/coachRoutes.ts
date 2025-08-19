import { Router } from 'express';
import { getCoachById } from '../controllers/coachController';
import { supabase } from '../lib/supabase';
import { authenticate } from '../middleware/auth';
import { validationResult, body } from 'express-validator';
import { Request, Response } from 'express';
import { uploadAttachment, uploadToSupabase } from '../middleware/upload';
import path from 'path';

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
      phoneAvailable: demographics?.meta?.phone_available || false,
      availability_options: demographics?.availability_options || [],
      location: demographics?.location || null,
      therapy_modalities: demographics?.therapy_modalities || []
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
  body('therapy_modalities').optional().isArray(),
  body('qualifications').optional().isArray(),
  body('genderIdentity').optional().isString(),
  body('experience').optional().isInt({ min: 0 }),
  body('hourlyRate').optional().isFloat({ min: 0 }),
  body('isAvailable').optional().isBoolean(),
  body('videoAvailable').optional().isBoolean(),
  body('inPersonAvailable').optional().isBoolean(),
  body('phoneAvailable').optional().isBoolean(),
  body('availability_options').optional().isArray(),
  body('location').optional().isString().custom((value) => {
    if (!value) return true; // Allow empty/optional
    
    // Special value for no location
    if (value === 'none') {
      return null; // Convert to null for database
    }
    
    // Check if it's a valid location code (US states + international)
    const validLocationCodes = [
      // US States
      'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA', 'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ', 'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
      // International
      'CA-ON', 'CA-BC', 'CA-AB', 'CA-QC', 'UK-LON', 'UK-MAN', 'UK-BIR', 'AU-NSW', 'AU-VIC', 'AU-QLD', 'DE-BER', 'DE-MUN', 'FR-PAR', 'FR-LYO', 'ES-MAD', 'ES-BAR', 'IT-ROME', 'IT-MIL', 'NL-AMS', 'JP-TOK', 'JP-OSA', 'KR-SEO', 'SG-SIN', 'IN-MH', 'IN-DL', 'BR-SP', 'BR-RJ', 'MX-CMX', 'MX-JAL'
    ];
    
    // If it's a predefined code, validate it
    if (validLocationCodes.includes(value)) {
      return value;
    }
    
    // If it's custom text, allow it (but limit length)
    if (value.length > 100) {
      throw new Error('Custom location must be less than 100 characters');
    }
    
    return value;
  })
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
      therapy_modalities,
      qualifications,
      genderIdentity,
      experience,
      hourlyRate,
      isAvailable,
      videoAvailable,
      availability_options,
      location
    } = req.body;

    console.log('Request body received:', req.body);
    console.log('Extracted availability_options:', availability_options);
    console.log('Availability_options type:', typeof availability_options);
    console.log('Availability_options is array:', Array.isArray(availability_options));

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

    // Update or insert coach demographics if video availability, time availability, location, or gender is provided
    console.log('Checking demographics update:', { videoAvailable, availability_options, location, genderIdentity });
    if (videoAvailable !== undefined || availability_options !== undefined || location !== undefined || genderIdentity !== undefined) {
      const demographicsUpdates: any = {
        updated_at: new Date().toISOString()
      };

      // Get existing demographics
      const { data: existingDemo } = await supabase
        .from('coach_demographics')
        .select('meta')
        .eq('coach_id', coachId)
        .single();

      console.log('Existing demographics:', existingDemo);
      const existingMeta = existingDemo?.meta || {};
      
      const newMeta = {
        ...existingMeta,
        video_available: videoAvailable !== undefined ? videoAvailable : existingMeta.video_available
      };

      demographicsUpdates.meta = newMeta;

      // Add time availability if provided
      if (availability_options !== undefined) {
        console.log('Setting availability_options to:', availability_options);
        demographicsUpdates.availability_options = availability_options;
      }

      // Add location if provided
      if (location !== undefined) {
        console.log('Setting location to:', location);
        demographicsUpdates.location = location;
      }

      // Add gender identity if provided
      if (genderIdentity !== undefined) {
        console.log('Setting gender_identity to:', genderIdentity);
        demographicsUpdates.gender_identity = genderIdentity;
      }

      // Add therapy modalities if provided
      if (therapy_modalities !== undefined) {
        console.log('Setting therapy_modalities to:', therapy_modalities);
        demographicsUpdates.therapy_modalities = therapy_modalities;
      }

      console.log('Demographics updates to apply:', demographicsUpdates);

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
      } else {
        console.log('Demographics updated successfully');
      }
    } else {
      console.log('No demographics updates needed');
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
      videoAvailable: demographics?.meta?.video_available || false,
      availability_options: demographics?.availability_options || [],
      location: demographics?.location || null,
      therapy_modalities: demographics?.therapy_modalities || []
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
      query = query.eq('status', 'completed');
    } else if (filter === 'pending') {
      query = query.eq('status', 'scheduled');
    } else if (filter === 'all') {
      // No additional filtering - show all appointments
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

    // Ensure upcoming confirmed appointments have meeting IDs
    const currentTime = new Date().toISOString()
    const upcomingConfirmed = appointments.filter(apt => 
      ['scheduled', 'confirmed'].includes(apt.status) && 
      apt.starts_at >= currentTime && 
      !apt.meeting_id
    )

    // Create meeting IDs for appointments that need them
    for (const appointment of upcomingConfirmed) {
      try {
        const { createVideoSDKMeeting } = require('../services/videoSDKService')
        const meetingData = await createVideoSDKMeeting()
        
        // Update appointment with meeting ID
        await supabase
          .from('sessions')
          .update({ meeting_id: meetingData.meetingId })
          .eq('id', appointment.id)
        
        appointment.meeting_id = meetingData.meetingId
        console.log(`Created meeting ID ${meetingData.meetingId} for coach appointment ${appointment.id}`)
      } catch (error) {
        console.error(`Failed to create meeting ID for coach appointment ${appointment.id}:`, error)
      }
    }

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
      .select('*')
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
      .select('id, first_name, last_name, phone, dob, created_at, email, areas_of_concern')
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
        concerns: Array.isArray(client.areas_of_concern) ? client.areas_of_concern : [],
        nextSessionFocus: null as string | null
      });
    });

    // Process sessions to add session data to clients
    const nowIso = new Date().toISOString();
    sessions?.forEach((session: any) => {
      const clientData = clientsMap.get(session.client_id);
      if (!clientData) return;
      
      if (session.status === 'completed') {
        clientData.totalSessions++;
        if (!clientData.lastSession || new Date(session.starts_at) > new Date(clientData.lastSession)) {
          clientData.lastSession = session.starts_at;
        }
      }
      
      if ((session.status === 'scheduled' || session.status === 'confirmed') && session.starts_at >= nowIso) {
        if (!clientData.nextSession || new Date(session.starts_at) < new Date(clientData.nextSession)) {
          clientData.nextSession = session.starts_at;
          // Only set focus if present; do not overwrite to null
          if (typeof session.area_of_focus === 'string' && session.area_of_focus.trim()) {
            clientData.nextSessionFocus = session.area_of_focus.trim();
          }
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

    // Emit WebSocket event for status update
    const io = req.app.get('io');
    if (io) {
      const statusData = {
        sessionId: updatedAppointment.id,
        scheduledAt: updatedAppointment.starts_at,
        clientId: updatedAppointment.client_id,
        coachId: coachId,
        oldStatus: status, // Note: we don't have the old status here
        newStatus: status,
        type: 'status_updated'
      };

      // Notify client about status change
      io.to(`user:${updatedAppointment.client_id}`).emit('appointment:status_updated', {
        ...statusData,
        message: `Coach has ${status === 'confirmed' ? 'confirmed' : status === 'completed' ? 'completed' : status === 'cancelled' ? 'cancelled' : 'updated'} your appointment`
      });

      // Notify coach about successful update
      io.to(`user:${coachId}`).emit('appointment:status_updated', {
        ...statusData,
        message: `Appointment status updated to ${status}`
      });
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
  authenticate
], async (req: Request & { user?: any }, res: Response) => {
  try {
    // Accept both receiverId and recipient_id; and both body and content
    const receiverId = req.body.receiverId || req.body.recipient_id;
    const bodyText: string | undefined = (req.body.body ?? req.body.content)?.toString();
    const sessionId = req.body.sessionId;

    if (!receiverId || !bodyText || bodyText.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'receiverId/recipient_id and body/content are required' });
    }

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
        recipient_id: receiverId,
        session_id: sessionId || null,
        body: bodyText.trim()
      })
      .select(`
        id,
        body,
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
    const { page = 1, limit = 50, conversation_with } = req.query as any;
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

    const coachId = coachProfile.id;
    const partnerId = conversation_with as string | undefined;

    let query = supabase
      .from('messages')
      .select('id, sender_id, recipient_id, body, created_at, read_at, attachment_url, attachment_name, attachment_size, attachment_type, deleted_for_everyone, deleted_at, hidden_for_users')
      .order('created_at', { ascending: true });

    if (partnerId) {
      // Messages between coach and specific partner
      query = query.or(
        `and(sender_id.eq.${coachId},recipient_id.eq.${partnerId}),and(sender_id.eq.${partnerId},recipient_id.eq.${coachId})`
      );
    } else {
      // All messages involving coach
      query = query.or(`sender_id.eq.${coachId},recipient_id.eq.${coachId}`);
    }

    // Pagination via range
    const { data: messages, error: messagesError, count } = await query.range(offset, offset + Number(limit) - 1) as any;

    if (messagesError) {
      throw messagesError;
    }

    // Filter out messages hidden for this user
    const filteredMessages = messages?.filter((message: any) => {
      return !message.hidden_for_users?.includes(coachId);
    }) || [];

    res.json({
      success: true,
      data: filteredMessages,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: count ?? (filteredMessages?.length || 0)
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

    const coachId = coachProfile.id;
    // Fetch recent messages involving coach
    const { data: messages, error: messagesError } = await supabase
      .from('messages')
      .select('id, sender_id, recipient_id, body, created_at, read_at, attachment_url, attachment_name, attachment_size, attachment_type, deleted_for_everyone, deleted_at, hidden_for_users')
      .or(`sender_id.eq.${coachId},recipient_id.eq.${coachId}`)
      .order('created_at', { ascending: false });

    if (messagesError) {
      throw messagesError;
    }

    type Conv = { partnerId: string; lastMessage: any; unreadCount: number; totalMessages: number };
    const conversationsMap = new Map<string, Conv>();

    for (const message of messages || []) {
      // Skip messages hidden for this user
      if (message.hidden_for_users?.includes(coachId)) {
        continue;
      }

      const partnerId = message.sender_id === coachId ? message.recipient_id : message.sender_id;
      const key = partnerId;
      const existing = conversationsMap.get(key);
      const isUnread = message.recipient_id === coachId && !message.read_at;
      if (!existing) {
        conversationsMap.set(key, {
          partnerId,
          lastMessage: message,
          unreadCount: isUnread ? 1 : 0,
          totalMessages: 1
        });
      } else {
        existing.totalMessages += 1;
        if (isUnread) existing.unreadCount += 1;
      }
    }

    const partnerIds = Array.from(conversationsMap.keys());

    // Resolve partner names from clients and coaches
    let partners: Record<string, { name: string; email?: string }> = {};
    if (partnerIds.length > 0) {
      const { data: clients } = await supabase.from('clients').select('id, first_name, last_name, email').in('id', partnerIds);
      const { data: coaches } = await supabase.from('coaches').select('id, first_name, last_name, email').in('id', partnerIds);
      for (const c of clients || []) partners[c.id] = { name: `${c.first_name} ${c.last_name}`, email: c.email };
      for (const c of coaches || []) partners[c.id] = { name: `${c.first_name} ${c.last_name}`, email: c.email };
    }

    const conversations = Array.from(conversationsMap.values()).map(c => ({
      partnerId: c.partnerId,
      partnerName: partners[c.partnerId]?.name || 'Unknown',
      lastBody: c.lastMessage?.body || '',
      lastAt: c.lastMessage?.created_at,
      unreadCount: c.unreadCount,
      totalMessages: c.totalMessages
    }));

    res.json({ success: true, data: conversations });
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
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('id', messageId)
      .eq('recipient_id', coachProfile.id); // Only mark as read if current user is recipient

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

// Upload attachment endpoint for coaches
router.post('/coach/upload-attachment', authenticate, uploadAttachment.single('attachment'), async (req: Request & { user?: any }, res: Response) => {
  try {
    if (!req.user || req.user.role !== 'coach') {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. Coach role required.' 
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    // Get coach profile to get user ID
    const { data: coachProfile, error: coachError } = await supabase
      .from('coaches')
      .select('id')
      .eq('email', req.user.email)
      .single();

    if (coachError || !coachProfile) {
      return res.status(404).json({ success: false, message: 'Coach profile not found' });
    }

    // Upload file to Supabase Storage
    const uploadResult = await uploadToSupabase(req.file, coachProfile.id);

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
    console.error('Upload attachment error:', error);
    res.status(500).json({ 
      success: false, 
      message: error instanceof Error ? error.message : 'Failed to upload attachment' 
    });
  }
});

// Delete message for everyone (only sender can do this)
router.delete('/coach/messages/:messageId/everyone', authenticate, async (req: Request & { user?: any }, res: Response) => {
  try {
    if (!req.user || req.user.role !== 'coach') {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. Coach role required.' 
      });
    }

    const { messageId } = req.params;

    // Get coach profile
    const { data: coachProfile, error: coachError } = await supabase
      .from('coaches')
      .select('id')
      .eq('email', req.user.email)
      .single();

    if (coachError || !coachProfile) {
      return res.status(404).json({ success: false, message: 'Coach profile not found' });
    }

    // Check if user is the sender of the message
    const { data: message, error: messageError } = await supabase
      .from('messages')
      .select('sender_id, recipient_id')
      .eq('id', messageId)
      .single();

    if (messageError || !message) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }

    if (message.sender_id !== coachProfile.id) {
      return res.status(403).json({ success: false, message: 'Only the sender can delete a message for everyone' });
    }

    // Delete message for everyone
    const { error: deleteError } = await supabase
      .from('messages')
      .update({ 
        deleted_for_everyone: true, 
        deleted_at: new Date().toISOString(),
        body: 'This message was deleted'
      })
      .eq('id', messageId);

    if (deleteError) {
      throw deleteError;
    }

    // Emit WebSocket event
    const io = req.app.get('io');
    if (io) {
      io.to(`user:${message.recipient_id}`).emit('message:deleted_everyone', { 
        messageId,
        deletedBy: coachProfile.id 
      });
      io.to(`user:${coachProfile.id}`).emit('message:deleted_everyone', { 
        messageId,
        deletedBy: coachProfile.id 
      });
    }

    res.json({
      success: true,
      message: 'Message deleted for everyone'
    });
  } catch (error) {
    console.error('Delete message for everyone error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to delete message' 
    });
  }
});

// Hide message for current user only
router.put('/coach/messages/:messageId/hide', authenticate, async (req: Request & { user?: any }, res: Response) => {
  try {
    if (!req.user || req.user.role !== 'coach') {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. Coach role required.' 
      });
    }

    const { messageId } = req.params;

    // Get coach profile
    const { data: coachProfile, error: coachError } = await supabase
      .from('coaches')
      .select('id')
      .eq('email', req.user.email)
      .single();

    if (coachError || !coachProfile) {
      return res.status(404).json({ success: false, message: 'Coach profile not found' });
    }

    // Add user to hidden_for_users array using PostgreSQL array append
    const { error: hideError } = await supabase
      .rpc('add_user_to_hidden_array', {
        message_id: messageId,
        user_id: coachProfile.id
      });

    if (hideError) {
      throw hideError;
    }

    res.json({
      success: true,
      message: 'Message hidden for you'
    });
  } catch (error) {
    console.error('Hide message error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to hide message' 
    });
  }
});

// Delete conversation endpoint for coaches
router.delete('/coach/conversations/:partnerId', authenticate, async (req: Request & { user?: any }, res: Response) => {
  try {
    if (!req.user || req.user.role !== 'coach') {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. Coach role required.' 
      });
    }

    const { partnerId } = req.params;

    // Get coach profile by email first
    const { data: coachProfile, error: coachError } = await supabase
      .from('coaches')
      .select('id')
      .eq('email', req.user.email)
      .single();

    if (coachError || !coachProfile) {
      return res.status(404).json({ success: false, message: 'Coach profile not found' });
    }

    const coachId = coachProfile.id;

    // Delete all messages between coach and partner
    const { error: deleteError } = await supabase
      .from('messages')
      .delete()
      .or(`and(sender_id.eq.${coachId},recipient_id.eq.${partnerId}),and(sender_id.eq.${partnerId},recipient_id.eq.${coachId})`);

    if (deleteError) {
      throw deleteError;
    }

    // Emit WebSocket event to notify partner about conversation deletion
    const io = req.app.get('io');
    if (io) {
      io.to(`user:${partnerId}`).emit('conversation:deleted', { 
        deletedBy: coachId,
        partnerId: coachId 
      });
    }

    res.json({
      success: true,
      message: 'Conversation deleted successfully'
    });
  } catch (error) {
    console.error('Delete conversation error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to delete conversation' 
    });
  }
});

// Legacy route (handles plural 'coaches' calls) - duplicates /coach/appointments logic
router.get('/coaches/appointments', authenticate, async (req: Request & { user?: any }, res: Response) => {
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
      query = query.eq('status', 'completed');
    } else if (filter === 'pending') {
      query = query.eq('status', 'scheduled');
    } else if (filter === 'all') {
      // No additional filtering - show all appointments
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
    console.error('Get coach appointments error (plural route):', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to get appointments' 
    });
  }
});

// Get coach by ID (IMPORTANT: Keep this at the end - parameterized routes must come after specific ones)
router.get('/coach/:id', getCoachById);

export default router; 