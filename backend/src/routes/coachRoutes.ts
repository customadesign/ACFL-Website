import { Router } from 'express';
import { getCoachById } from '../controllers/coachController';
import { supabase } from '../lib/supabase';
import { coachService } from '../services/coachService';
import { authenticate, requireActiveUser, allowDeactivatedUser } from '../middleware/auth';
import { validationResult, body } from 'express-validator';
import { Request, Response } from 'express';
import { uploadAttachment, uploadToSupabase } from '../middleware/upload';
import { createVideoSDKMeeting } from '../services/videoSDKService';
import { dataExportService } from '../services/dataExportService';
import { calendarSyncService } from '../services/calendarSyncService';
import path from 'path';
import fs from 'fs';

const router = Router();

// Get coach profile (put specific routes before parameterized ones)
router.get('/coach/profile', authenticate, requireActiveUser, async (req: Request & { user?: any }, res: Response) => {
  try {
    if (!req.user || req.user.role !== 'coach') {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. Coach role required.' 
      });
    }

    // Get coach profile by email first (case-insensitive)
    const { data: coachProfile, error: profileError } = await supabase
      .from('coaches')
      .select('*')
      .ilike('email', req.user.email)
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
  requireActiveUser,
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
  body('profilePhoto').optional().isString(),
  body('experience').optional().isInt({ min: 0 }),
  body('hourlyRate').optional().isFloat({ min: 0 }),
  body('isAvailable').optional().isBoolean(),
  body('videoAvailable').optional().isBoolean(),
  body('inPersonAvailable').optional().isBoolean(),
  body('phoneAvailable').optional().isBoolean(),
  body('availability_options').optional().isArray(),
  body('educationalBackground').optional({ nullable: true }),
  body('coachingExperienceYears').optional({ nullable: true }),
  body('professionalCertifications').optional({ nullable: true }),
  body('coachingExpertise').optional({ nullable: true }),
  body('ageGroupsComfortable').optional({ nullable: true }),
  body('actTrainingLevel').optional({ nullable: true }),
  body('email').optional(),
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
      profilePhoto,
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
      location,
      educationalBackground,
      coachingExperienceYears,
      professionalCertifications,
      coachingExpertise,
      ageGroupsComfortable,
      actTrainingLevel
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
    if (profilePhoto !== undefined) coachUpdates.profile_photo = profilePhoto;
    if (specialties) coachUpdates.specialties = specialties;
    if (languages) coachUpdates.languages = languages;
    if (qualifications !== undefined) coachUpdates.qualifications = qualifications;
    if (experience !== undefined) coachUpdates.years_experience = experience;
    // hourlyRate is now handled separately through coach_rates table
    if (isAvailable !== undefined) coachUpdates.is_available = isAvailable;

    // Get coach profile by email first
    const { data: coachProfile, error: profileError } = await supabase
      .from('coaches')
      .select('id')
      .ilike('email', req.user.email)
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

    // Handle hourly rate update through coach_rates table
    if (hourlyRate !== undefined) {
      try {
        await coachService.setDefaultRate(coachId, hourlyRate);
      } catch (rateError) {
        console.error('Failed to update coach rate:', rateError);
        // Continue with the rest of the update even if rate update fails
      }
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

    // Update coach_applications table if application-specific fields are provided
    if (educationalBackground !== undefined || coachingExperienceYears !== undefined ||
        professionalCertifications !== undefined || coachingExpertise !== undefined ||
        ageGroupsComfortable !== undefined || actTrainingLevel !== undefined) {

      const applicationUpdates: any = {
        updated_at: new Date().toISOString()
      };

      if (educationalBackground !== undefined) applicationUpdates.educational_background = educationalBackground;
      if (coachingExperienceYears !== undefined) applicationUpdates.coaching_experience_years = coachingExperienceYears;
      if (professionalCertifications !== undefined) applicationUpdates.professional_certifications = professionalCertifications;
      if (coachingExpertise !== undefined) applicationUpdates.coaching_expertise = coachingExpertise;
      if (ageGroupsComfortable !== undefined) applicationUpdates.age_groups_comfortable = ageGroupsComfortable;
      if (actTrainingLevel !== undefined) applicationUpdates.act_training_level = actTrainingLevel;

      // Update coach_applications table using email as the key
      // Note: coach_applications uses email field, not coach_id or user_id
      const { error: appError } = await supabase
        .from('coach_applications')
        .update(applicationUpdates)
        .eq('email', req.user.email);

      if (appError) {
        // Database error updating application
        console.error('Failed to update coach application:', appError);
        // Don't fail the whole request if application update fails
      } else {
        console.log('Coach application updated successfully');
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
router.get('/coach/dashboard', authenticate, requireActiveUser, async (req: Request & { user?: any }, res: Response) => {
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
      .ilike('email', req.user.email)
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
router.get('/coach/appointments', authenticate, requireActiveUser, async (req: Request & { user?: any }, res: Response) => {
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
      .ilike('email', req.user.email)
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
router.get('/coach/clients', authenticate, requireActiveUser, async (req: Request & { user?: any }, res: Response) => {
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
      .ilike('email', req.user.email)
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
  requireActiveUser,
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
      .ilike('email', req.user.email)
      .single();

    if (coachProfileError || !coachProfile) {
      return res.status(404).json({
        success: false,
        message: 'Coach profile not found'
      });
    }

    const coachId = coachProfile.id; // Use the actual coach ID from database

    // Get appointment with client and coach details before updating
    const { data: currentAppointment, error: fetchError } = await supabase
      .from('sessions')
      .select(`
        *,
        clients (
          id,
          first_name,
          last_name,
          email
        ),
        coaches (
          id,
          first_name,
          last_name,
          email
        )
      `)
      .eq('id', id)
      .eq('coach_id', coachId)
      .single();

    if (fetchError || !currentAppointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

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

    // Handle payment processing based on status change
    if (currentAppointment.payment_id) {
      const paymentService = require('../services/paymentServiceV2').PaymentServiceV2;
      const paymentHandler = new paymentService();

      try {
        if (status === 'confirmed' && currentAppointment.status === 'scheduled') {
          // Do NOT capture payment when confirmed - wait until completed
          console.log(`Appointment ${id} confirmed, payment will be captured after completion`);
        } else if (status === 'completed' && currentAppointment.status !== 'completed') {
          // Capture the payment when appointment is marked as completed
          await paymentHandler.capturePayment(currentAppointment.payment_id);
          console.log(`Payment captured for completed appointment ${id}`);
        } else if (status === 'cancelled' && currentAppointment.status !== 'cancelled') {
          // Release the payment hold when coach cancels
          await paymentHandler.cancelAuthorization(currentAppointment.payment_id, 'Coach cancelled the appointment');
          console.log(`Payment authorization cancelled for appointment ${id}`);
        }
      } catch (paymentError) {
        console.error(`Payment processing error for appointment ${id}:`, paymentError);
        // Log the error but don't fail the appointment update
        // You might want to handle this differently based on your business logic
      }
    }

    // Emit WebSocket event for status update
    const io = req.app.get('io');
    if (io) {
      const clientName = `${currentAppointment.clients.first_name} ${currentAppointment.clients.last_name}`;
      const coachName = `${currentAppointment.coaches.first_name} ${currentAppointment.coaches.last_name}`;
      
      const notificationData = {
        id: updatedAppointment.id,
        starts_at: updatedAppointment.starts_at,
        client_id: updatedAppointment.client_id,
        coach_id: coachId,
        client_name: clientName,
        coach_name: coachName,
        cancelled_by: 'coach', // Since this endpoint is only accessible by coaches
        reason: req.body.reason || ''
      };

      // Send specific notification based on status
      if (status === 'cancelled' && currentAppointment.status !== 'cancelled') {
        // Notify client about cancellation
        io.to(`user:${updatedAppointment.client_id}`).emit('appointment:cancelled', notificationData);
        
        // Notify admin about cancellation
        io.to('admin:notifications').emit('admin:appointment_cancelled', {
          ...notificationData,
          status: 'cancelled',
          updated_at: new Date().toISOString()
        });
        
        // Don't send notification to coach since they initiated it

        // Trigger calendar sync for cancelled appointment
        try {
          await calendarSyncService.queueSessionSync(req.user.userId, updatedAppointment.id, 'delete');
          console.log(`Calendar sync triggered for cancelled appointment ${id}`);
        } catch (syncError) {
          console.error(`Calendar sync failed for cancelled appointment ${id}:`, syncError);
          // Don't fail the appointment cancellation if calendar sync fails
        }
      } else if (status === 'confirmed') {
        // Send appointment confirmation notification to client
        io.to(`user:${updatedAppointment.client_id}`).emit('appointment:confirmed', {
          ...notificationData,
          message: `Coach has confirmed your appointment`
        });

        // Notify admin about confirmation
        io.to('admin:notifications').emit('admin:appointment_confirmed', {
          ...notificationData,
          status: 'confirmed',
          updated_at: new Date().toISOString()
        });

        // Trigger calendar sync for confirmed appointment
        try {
          await calendarSyncService.queueSessionSync(req.user.userId, updatedAppointment.id, 'create');
          console.log(`Calendar sync triggered for confirmed appointment ${id}`);
        } catch (syncError) {
          console.error(`Calendar sync failed for appointment ${id}:`, syncError);
          // Don't fail the appointment confirmation if calendar sync fails
        }
      } else if (status === 'completed') {
        // Notify admin about completion
        io.to('admin:notifications').emit('admin:appointment_completed', {
          ...notificationData,
          status: 'completed',
          updated_at: new Date().toISOString()
        });

        // Trigger calendar sync for completed appointment
        try {
          await calendarSyncService.queueSessionSync(req.user.userId, updatedAppointment.id, 'update');
          console.log(`Calendar sync triggered for completed appointment ${id}`);
        } catch (syncError) {
          console.error(`Calendar sync failed for completed appointment ${id}:`, syncError);
          // Don't fail the appointment completion if calendar sync fails
        }
      }
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

// Test admin notification endpoint
router.post('/test-admin-notification', authenticate, async (req: Request & { user?: any }, res: Response) => {
  try {
    const io = req.app.get('io');
    if (io) {
      const adminRoom = io.sockets.adapter.rooms.get('admin:notifications');
      console.log(`Test: Emitting to admin room (${adminRoom ? adminRoom.size : 0} clients)`);
      
      io.to('admin:notifications').emit('admin:appointment_rescheduled', {
        id: 'test-123',
        client_name: 'Test Client',
        coach_name: 'Test Coach',
        rescheduled_by: 'coach',
        reason: 'Testing notification',
        updated_at: new Date().toISOString()
      });
    }
    
    res.json({ success: true, message: 'Test notification sent' });
  } catch (error) {
    console.error('Test notification error:', error);
    res.status(500).json({ success: false, message: 'Failed to send test notification' });
  }
});

// Reschedule appointment
router.put('/coach/appointments/:id/reschedule', [
  authenticate,
  requireActiveUser,
  authenticate,
  body('new_starts_at').isISO8601(),
  body('reason').optional().isString()
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
    const { new_starts_at, reason } = req.body;

    // Get coach profile by email first
    const { data: coachProfile, error: coachProfileError } = await supabase
      .from('coaches')
      .select('id')
      .ilike('email', req.user.email)
      .single();

    if (coachProfileError || !coachProfile) {
      return res.status(404).json({
        success: false,
        message: 'Coach profile not found'
      });
    }

    const coachId = coachProfile.id;

    // Get appointment with client and coach details before updating
    const { data: currentAppointment, error: fetchError } = await supabase
      .from('sessions')
      .select(`
        *,
        clients (
          id,
          first_name,
          last_name,
          email
        ),
        coaches (
          id,
          first_name,
          last_name,
          email
        )
      `)
      .eq('id', id)
      .eq('coach_id', coachId)
      .single();

    if (fetchError || !currentAppointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    // Update appointment with new time
    const { data: updatedAppointment, error: updateError } = await supabase
      .from('sessions')
      .update({ 
        starts_at: new_starts_at,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('coach_id', coachId)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    // Emit WebSocket event for reschedule
    const io = req.app.get('io');
    if (io) {
      const clientName = `${currentAppointment.clients.first_name} ${currentAppointment.clients.last_name}`;
      const coachName = `${currentAppointment.coaches.first_name} ${currentAppointment.coaches.last_name}`;
      
      const notificationData = {
        id: updatedAppointment.id,
        old_starts_at: currentAppointment.starts_at,
        new_starts_at: updatedAppointment.starts_at,
        client_id: updatedAppointment.client_id,
        coach_id: coachId,
        client_name: clientName,
        coach_name: coachName,
        rescheduled_by: 'coach',
        reason: reason || ''
      };

      // Notify client about reschedule
      io.to(`user:${updatedAppointment.client_id}`).emit('appointment:rescheduled', notificationData);
      
      // Notify admin about reschedule
      const adminRoom = io.sockets.adapter.rooms.get('admin:notifications');
      console.log(`Emitting admin:appointment_rescheduled to admin room (${adminRoom ? adminRoom.size : 0} clients)`);
      io.to('admin:notifications').emit('admin:appointment_rescheduled', {
        ...notificationData,
        updated_at: new Date().toISOString()
      });
    }

    res.json({
      success: true,
      message: 'Appointment rescheduled successfully',
      data: updatedAppointment
    });
  } catch (error) {
    console.error('Reschedule appointment error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to reschedule appointment' 
    });
  }
});

// Notify about appointment ready to join (called when meeting room is ready)
router.post('/coach/appointments/:id/ready', authenticate, requireActiveUser, async (req: Request & { user?: any }, res: Response) => {
  try {
    if (!req.user || req.user.role !== 'coach') {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. Coach role required.' 
      });
    }

    const { id } = req.params;
    const { meeting_link } = req.body;

    // Get coach profile by email first
    const { data: coachProfile, error: coachProfileError } = await supabase
      .from('coaches')
      .select('id')
      .ilike('email', req.user.email)
      .single();

    if (coachProfileError || !coachProfile) {
      return res.status(404).json({
        success: false,
        message: 'Coach profile not found'
      });
    }

    const coachId = coachProfile.id;

    // Get appointment with client and coach details
    const { data: appointment, error: fetchError } = await supabase
      .from('sessions')
      .select(`
        *,
        clients (
          id,
          first_name,
          last_name,
          email
        ),
        coaches (
          id,
          first_name,
          last_name,
          email
        )
      `)
      .eq('id', id)
      .eq('coach_id', coachId)
      .single();

    if (fetchError || !appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    // Update appointment with meeting link if provided
    if (meeting_link) {
      await supabase
        .from('sessions')
        .update({ meeting_link })
        .eq('id', id)
        .eq('coach_id', coachId);
    }

    // Emit WebSocket event for appointment ready
    const io = req.app.get('io');
    if (io) {
      const clientName = `${appointment.clients.first_name} ${appointment.clients.last_name}`;
      const coachName = `${appointment.coaches.first_name} ${appointment.coaches.last_name}`;
      
      const notificationData = {
        id: appointment.id,
        starts_at: appointment.starts_at,
        client_id: appointment.client_id,
        coach_id: coachId,
        client_name: clientName,
        coach_name: coachName,
        meeting_link: meeting_link || appointment.meeting_link
      };

      // Notify both client and coach that session is ready
      io.to(`user:${appointment.client_id}`).emit('appointment:ready', notificationData);
      io.to(`user:${coachId}`).emit('appointment:ready', notificationData);
    }

    res.json({
      success: true,
      message: 'Appointment ready notification sent'
    });
  } catch (error) {
    console.error('Appointment ready notification error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to send ready notification' 
    });
  }
});

// Get coach profile stats
router.get('/coach/profile/stats', authenticate, requireActiveUser, async (req: Request & { user?: any }, res: Response) => {
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
      .ilike('email', req.user.email)
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

// Get coach application data for profile
router.get('/coach/application-data', authenticate, async (req: Request & { user?: any }, res: Response) => {
  try {
    if (!req.user || req.user.role !== 'coach') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Coach role required.'
      });
    }

    // Get coach application data by email
    const { data: applicationData, error: applicationError } = await supabase
      .from('coach_applications')
      .select('*')
      .ilike('email', req.user.email)
      .eq('status', 'approved')
      .single();

    if (applicationError) {
      if (applicationError.code === 'PGRST116') {
        return res.json({
          success: true,
          data: null,
          message: 'No application data found'
        });
      }
      throw applicationError;
    }

    res.json({
      success: true,
      data: applicationData
    });
  } catch (error) {
    console.error('Get coach application data error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get application data'
    });
  }
});


// Removed - moving to end of file

// Send message from coach
router.post('/coach/send-message', [
  authenticate,
  requireActiveUser,
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
      .ilike('email', req.user.email)
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

    // Emit WebSocket event for real-time notification
    const io = req.app.get('io');
    if (io) {
      const messageWithSenderName = {
        ...newMessage,
        sender_id: coachProfile.id,
        recipient_id: receiverId,
        sender_name: `${coachProfile.first_name} ${coachProfile.last_name}`
      };
      
      // Send to recipient
      io.to(`user:${receiverId}`).emit('message:new', messageWithSenderName);
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
router.get('/coach/messages', authenticate, requireActiveUser, async (req: Request & { user?: any }, res: Response) => {
  try {
    const { page = 1, limit = 50, conversation_with } = req.query as any;
    const offset = (Number(page) - 1) * Number(limit);

    // Get coach profile by email first
    const { data: coachProfile, error: coachError } = await supabase
      .from('coaches')
      .select('id')
      .ilike('email', req.user.email)
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
router.get('/coach/conversations', authenticate, requireActiveUser, async (req: Request & { user?: any }, res: Response) => {
  try {
    // Get coach profile by email first
    const { data: coachProfile, error: coachError } = await supabase
      .from('coaches')
      .select('id')
      .ilike('email', req.user.email)
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
      .ilike('email', req.user.email)
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
      .ilike('email', req.user.email)
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
      .ilike('email', req.user.email)
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
      .ilike('email', req.user.email)
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
      .ilike('email', req.user.email)
      .single();

    if (coachError || !coachProfile) {
      return res.status(404).json({ success: false, message: 'Coach profile not found' });
    }

    const coachId = coachProfile.id;

    // Soft delete: Hide conversation for this coach only
    // Add the coach's ID to the hidden_for_users array for all messages in the conversation
    const { error: updateError } = await supabase
      .rpc('append_hidden_user', {
        user_id: coachId,
        partner_id: partnerId
      });

    if (updateError) {
      // Fallback to manual update if RPC doesn't exist
      const { data: messages } = await supabase
        .from('messages')
        .select('id, hidden_for_users')
        .or(`and(sender_id.eq.${coachId},recipient_id.eq.${partnerId}),and(sender_id.eq.${partnerId},recipient_id.eq.${coachId})`)
        .not('hidden_for_users', 'cs', `{${coachId}}`);

      if (messages) {
        for (const message of messages) {
          const updatedHidden = [...(message.hidden_for_users || []), coachId];
          await supabase
            .from('messages')
            .update({ hidden_for_users: updatedHidden })
            .eq('id', message.id);
        }
      }
    }

    // No WebSocket event needed - conversation is only hidden for the deleting user
    console.log(`Conversation hidden for coach ${coachId} with partner ${partnerId}`);
    
    // Optional: Clean up completely deleted conversations (where both users have hidden it)
    // This could be done in a background job instead
    setTimeout(async () => {
      try {
        const { error: cleanupError } = await supabase
          .from('messages')
          .delete()
          .or(`and(sender_id.eq.${coachId},recipient_id.eq.${partnerId}),and(sender_id.eq.${partnerId},recipient_id.eq.${coachId})`)
          .contains('hidden_for_users', [coachId, partnerId]); // Both users have hidden it
        
        if (cleanupError) {
          console.error('Cleanup error (non-critical):', cleanupError);
        }
      } catch (error) {
        console.error('Background cleanup failed:', error);
      }
    }, 1000); // 1 second delay for background cleanup

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
      .ilike('email', req.user.email)
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

// Get session notes for a specific appointment
router.get('/coach/session-notes/:appointmentId', authenticate, async (req: Request & { user?: any }, res: Response) => {
  try {
    if (!req.user || req.user.role !== 'coach') {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. Coach role required.' 
      });
    }

    const { appointmentId } = req.params;

    // Get coach profile by email first
    const { data: coachProfile, error: coachProfileError } = await supabase
      .from('coaches')
      .select('id')
      .ilike('email', req.user.email)
      .single();

    if (coachProfileError || !coachProfile) {
      return res.status(404).json({
        success: false,
        message: 'Coach profile not found'
      });
    }

    // Get the appointment with session notes
    const { data: appointment, error: appointmentError } = await supabase
      .from('sessions')
      .select('id, coach_id, session_notes')
      .eq('id', appointmentId)
      .single();

    if (appointmentError || !appointment || appointment.coach_id !== coachProfile.id) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found or access denied'
      });
    }

    // Return session notes from the session_notes column
    const notes = appointment.session_notes || {};
    
    res.json({
      success: true,
      data: notes.notes ? [notes] : [] // Return as array for compatibility
    });
  } catch (error) {
    console.error('Get session notes error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to get session notes' 
    });
  }
});

// Add or update session notes
router.post('/coach/session-notes', [
  authenticate,
  body('appointment_id').isUUID(),
  body('notes').optional().isString(),
  body('goals_met').optional().isArray(),
  body('next_steps').optional().isString()
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

    const { appointment_id, notes, goals_met, next_steps } = req.body;

    // Get coach profile by email first
    const { data: coachProfile, error: coachProfileError } = await supabase
      .from('coaches')
      .select('id')
      .ilike('email', req.user.email)
      .single();

    if (coachProfileError || !coachProfile) {
      return res.status(404).json({
        success: false,
        message: 'Coach profile not found'
      });
    }

    // Verify the appointment belongs to this coach
    const { data: appointment, error: appointmentError } = await supabase
      .from('sessions')
      .select('id, coach_id, session_notes')
      .eq('id', appointment_id)
      .single();

    if (appointmentError || !appointment || appointment.coach_id !== coachProfile.id) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found or access denied'
      });
    }

    // Prepare session notes data
    const sessionNotesData = {
      notes: notes || '',
      goals_met: goals_met || [],
      next_steps: next_steps || '',
      updated_at: new Date().toISOString(),
      created_at: appointment.session_notes?.created_at || new Date().toISOString()
    };

    // Update the session with the new notes
    const { data: updatedSession, error: updateError } = await supabase
      .from('sessions')
      .update({ session_notes: sessionNotesData })
      .eq('id', appointment_id)
      .select('id, session_notes')
      .single();

    if (updateError) {
      throw updateError;
    }

    res.json({
      success: true,
      message: 'Session notes saved successfully',
      data: updatedSession.session_notes
    });
  } catch (error) {
    console.error('Save session notes error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to save session notes' 
    });
  }
});

// Test route for debugging
router.get('/coach/test-client-route', authenticate, async (req: Request & { user?: any }, res: Response) => {
  console.log('🔍 TEST ROUTE HIT');
  
  // Check if we can find the coach
  try {
    const { data: coaches, error } = await supabase
      .from('coaches')
      .select('id, email, first_name, last_name')
      .ilike('email', req.user?.email || '');
    
    console.log('🔍 Coach search result:', { coaches, error, searchEmail: req.user?.email });
    
    res.json({ 
      success: true, 
      message: 'Test route working',
      userEmail: req.user?.email,
      coachData: coaches,
      error: error?.message 
    });
  } catch (err) {
    console.error('Test route error:', err);
    res.json({ success: false, error: err });
  }
});

// Debug route to check available data
router.get('/coach/debug-data/:clientId', authenticate, async (req: Request & { user?: any }, res: Response) => {
  try {
    const { clientId } = req.params;
    console.log('🔍 DEBUG DATA ROUTE - clientId:', clientId, 'user:', req.user?.email);

    // Get coach profile
    const { data: coachProfile, error: coachError } = await supabase
      .from('coaches')
      .select('id, email, first_name, last_name')
      .ilike('email', req.user?.email || '')
      .single();

    // Get client profile 
    const { data: clientProfile, error: clientError } = await supabase
      .from('clients')
      .select('id, first_name, last_name, email')
      .eq('id', clientId)
      .single();

    // Get sessions between them
    const { data: sessions, error: sessionsError } = await supabase
      .from('sessions')
      .select('id, client_id, coach_id, status')
      .eq('client_id', clientId)
      .eq('coach_id', coachProfile?.id || '');

    // Get all sessions for this client
    const { data: allClientSessions, error: allSessionsError } = await supabase
      .from('sessions')
      .select('id, client_id, coach_id, status')
      .eq('client_id', clientId);

    res.json({
      success: true,
      debug: {
        requestedClientId: clientId,
        userEmail: req.user?.email,
        coachProfile,
        coachError: coachError?.message,
        clientProfile,
        clientError: clientError?.message,
        sessions,
        sessionsError: sessionsError?.message,
        allClientSessions,
        allSessionsError: allSessionsError?.message
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get client profile for coach (using /client-profile/ to avoid conflicts)
router.get('/coach/client-profile/:clientId', authenticate, async (req: Request & { user?: any }, res: Response) => {
  console.log('🔍 CLIENT PROFILE ROUTE HIT - clientId:', req.params.clientId);
  console.log('🔍 User:', req.user?.email, 'Role:', req.user?.role);
  
  try {
    console.log('🔍 INSIDE TRY BLOCK');
    if (!req.user || req.user.role !== 'coach') {
      console.log('❌ AUTH CHECK FAILED');
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. Coach role required.' 
      });
    }

    console.log('✅ AUTH CHECK PASSED');
    const { clientId } = req.params;
    console.log('🔍 About to query coach profile for:', req.user.email);

    // Get coach profile by email first
    const { data: coachProfile, error: coachProfileError } = await supabase
      .from('coaches')
      .select('id')
      .ilike('email', req.user.email)
      .single();

    console.log('🔍 Coach profile lookup:', { coachProfile, coachProfileError });

    if (coachProfileError || !coachProfile) {
      console.log('❌ Coach profile not found');
      return res.status(404).json({
        success: false,
        message: 'Coach profile not found'
      });
    }

    // Check if client exists first
    const { data: clientExists, error: clientExistsError } = await supabase
      .from('clients')
      .select('id')
      .eq('id', clientId)
      .single();

    console.log('🔍 Client exists check:', { clientExists, clientExistsError, clientId });

    if (clientExistsError || !clientExists) {
      console.log('❌ Client not found in database');
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }

    // Verify that the coach has sessions with this client (to ensure they're connected)
    const { data: connectionCheck, error: connectionError } = await supabase
      .from('sessions')
      .select('id')
      .eq('client_id', clientId)
      .eq('coach_id', coachProfile.id)
      .limit(1);

    console.log('🔍 Connection check:', { connectionCheck, connectionError, clientId, coachId: coachProfile.id });

    if (!connectionCheck || connectionCheck.length === 0) {
      console.log('❌ No connection found between coach and client');
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to view this client\'s profile. You must have scheduled sessions with this client to view their profile.'
      });
    }

    // Get client profile data
    const { data: clientProfile, error: clientError } = await supabase
      .from('clients')
      .select('*')
      .eq('id', clientId)
      .single();

    console.log('🔍 Client profile lookup:', { clientProfile, clientError });

    if (clientError || !clientProfile) {
      console.log('❌ Client profile not found');
      return res.status(404).json({
        success: false,
        message: 'Client profile not found'
      });
    }

    // Get all sessions between this coach and client
    const { data: sessions, error: sessionsError } = await supabase
      .from('sessions')
      .select('*')
      .eq('client_id', clientId)
      .eq('coach_id', coachProfile.id)
      .order('starts_at', { ascending: false });

    if (sessionsError) {
      throw sessionsError;
    }

    // Map database fields to frontend expected fields
    const mappedClientProfile = {
      ...clientProfile,
      // Map database field names to frontend expected names
      location: clientProfile.location_state,
      language: clientProfile.preferred_language,
      area_of_concern: clientProfile.areas_of_concern || [],
      therapist_gender: clientProfile.preferred_coach_gender
    };

    res.json({
      success: true,
      data: {
        client: mappedClientProfile,
        sessions: sessions || []
      }
    });
  } catch (error) {
    console.error('Get client profile error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to get client profile' 
    });
  }
});

// Get client session history with notes
router.get('/coach/clients/:clientId/sessions', authenticate, async (req: Request & { user?: any }, res: Response) => {
  try {
    if (!req.user || req.user.role !== 'coach') {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. Coach role required.' 
      });
    }

    const { clientId } = req.params;

    // Get coach profile by email first
    const { data: coachProfile, error: coachProfileError } = await supabase
      .from('coaches')
      .select('id')
      .ilike('email', req.user.email)
      .single();

    if (coachProfileError || !coachProfile) {
      return res.status(404).json({
        success: false,
        message: 'Coach profile not found'
      });
    }

    // Get all sessions for this client with this coach, including session_notes
    const { data: sessions, error: sessionsError } = await supabase
      .from('sessions')
      .select('*')
      .eq('client_id', clientId)
      .eq('coach_id', coachProfile.id)
      .order('starts_at', { ascending: false });

    if (sessionsError) {
      throw sessionsError;
    }

    // Transform the data to match the expected format
    const sessionsWithNotes = sessions?.map(session => ({
      ...session,
      session_notes: session.session_notes ? [session.session_notes] : []
    })) || [];

    res.json({
      success: true,
      data: sessionsWithNotes
    });
  } catch (error) {
    console.error('Get client session history error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to get session history' 
    });
  }
});

// Get coach revenue data
router.get('/coach/revenue', authenticate, async (req: Request & { user?: any }, res: Response) => {
  try {
    if (!req.user || req.user.role !== 'coach') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Coach role required.'
      });
    }

    const { period = 'month' } = req.query;

    // Get coach profile by email first
    const { data: coachProfile, error: coachProfileError } = await supabase
      .from('coaches')
      .select('id')
      .ilike('email', req.user.email)
      .single();

    if (coachProfileError || !coachProfile) {
      return res.status(404).json({
        success: false,
        message: 'Coach profile not found'
      });
    }

    const coachId = coachProfile.id;

    // Calculate date range based on period
    const now = new Date();
    let startDate: Date;
    let previousStartDate: Date;
    let previousEndDate: Date;

    switch (period) {
      case 'week':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
        previousStartDate = new Date(startDate.getTime() - 7 * 24 * 60 * 60 * 1000);
        previousEndDate = new Date(startDate.getTime() - 1);
        break;
      case 'quarter':
        const currentQuarter = Math.floor(now.getMonth() / 3);
        startDate = new Date(now.getFullYear(), currentQuarter * 3, 1);
        previousStartDate = new Date(now.getFullYear(), (currentQuarter - 1) * 3, 1);
        previousEndDate = new Date(startDate.getTime() - 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        previousStartDate = new Date(now.getFullYear() - 1, 0, 1);
        previousEndDate = new Date(startDate.getTime() - 1);
        break;
      default: // month
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        previousStartDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        previousEndDate = new Date(startDate.getTime() - 1);
    }

    // Get sessions for current period
    const { data: currentSessions, error: currentSessionsError } = await supabase
      .from('sessions')
      .select('*')
      .eq('coach_id', coachId)
      .eq('status', 'completed')
      .gte('starts_at', startDate.toISOString())
      .lte('starts_at', now.toISOString());

    // Get sessions for previous period (for trend calculation)
    const { data: previousSessions, error: previousSessionsError } = await supabase
      .from('sessions')
      .select('*')
      .eq('coach_id', coachId)
      .eq('status', 'completed')
      .gte('starts_at', previousStartDate.toISOString())
      .lte('starts_at', previousEndDate.toISOString());

    // Get coach hourly rate
    const { data: coachRates, error: ratesError } = await supabase
      .from('coach_rates')
      .select('rate')
      .eq('coach_id', coachId)
      .eq('is_default', true)
      .single();

    const hourlyRate = coachRates?.rate || 100; // Default rate if not set

    // Get actual payment data for current period
    const { data: currentPayments, error: paymentsError } = await supabase
      .from('payments')
      .select('amount_cents, status, created_at')
      .eq('coach_id', coachId)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', now.toISOString());

    // Get actual payment data for previous period
    const { data: previousPayments } = await supabase
      .from('payments')
      .select('amount_cents, status, created_at')
      .eq('coach_id', coachId)
      .gte('created_at', previousStartDate.toISOString())
      .lte('created_at', previousEndDate.toISOString());

    // Calculate current period revenue from actual payments
    const currentSessionsCount = currentSessions?.length || 0;
    const currentRevenue = (currentPayments || [])
      .filter(payment => payment.status === 'succeeded')
      .reduce((total, payment) => total + (payment.amount_cents / 100), 0);

    // Calculate previous period revenue
    const previousRevenue = (previousPayments || [])
      .filter(payment => payment.status === 'succeeded')
      .reduce((total, payment) => total + (payment.amount_cents / 100), 0);
    const currentHours = currentSessionsCount * 1; // Assuming 1 hour per session

    // Calculate previous period stats for trends
    const previousSessionsCount = previousSessions?.length || 0;

    // Calculate trends
    const revenueChange = previousRevenue > 0
      ? Math.round(((currentRevenue - previousRevenue) / previousRevenue) * 100)
      : currentRevenue > 0 ? 100 : 0;

    const sessionsChange = previousSessionsCount > 0
      ? Math.round(((currentSessionsCount - previousSessionsCount) / previousSessionsCount) * 100)
      : currentSessionsCount > 0 ? 100 : 0;

    // Get unique clients for current period
    const uniqueClientIds = [...new Set(currentSessions?.map(s => s.client_id) || [])];
    const activeClients = uniqueClientIds.length;

    // Get previous period clients for trend
    const previousUniqueClientIds = [...new Set(previousSessions?.map(s => s.client_id) || [])];
    const previousActiveClients = previousUniqueClientIds.length;

    const clientsChange = previousActiveClients > 0
      ? Math.round(((activeClients - previousActiveClients) / previousActiveClients) * 100)
      : activeClients > 0 ? 100 : 0;

    // Get all-time stats for ratings
    const { data: reviews, error: reviewsError } = await supabase
      .from('reviews')
      .select('rating')
      .eq('coach_id', coachId);

    let averageRating = 0;
    let totalReviews = 0;
    if (!reviewsError && reviews && reviews.length > 0) {
      const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
      averageRating = Math.round((totalRating / reviews.length) * 10) / 10;
      totalReviews = reviews.length;
    }

    // Get all sessions for completion rate
    const { data: allSessions, error: allSessionsError } = await supabase
      .from('sessions')
      .select('status')
      .eq('coach_id', coachId)
      .gte('starts_at', startDate.toISOString());

    const totalScheduled = allSessions?.length || 0;
    const completedSessions = allSessions?.filter(s => s.status === 'completed').length || 0;
    const completionRate = totalScheduled > 0 ? Math.round((completedSessions / totalScheduled) * 100) : 0;

    // Calculate retention rate (clients who had more than one session)
    const clientSessionCounts = new Map();
    currentSessions?.forEach(session => {
      const count = clientSessionCounts.get(session.client_id) || 0;
      clientSessionCounts.set(session.client_id, count + 1);
    });

    const clientsWithMultipleSessions = Array.from(clientSessionCounts.values()).filter(count => count > 1).length;
    const retentionRate = uniqueClientIds.length > 0 ? Math.round((clientsWithMultipleSessions / uniqueClientIds.length) * 100) : 0;

    // Mock on-time performance (would need actual meeting start/end times)
    const onTimeRate = 95; // Placeholder

    // Recent activity (last 10 payment transactions)
    const { data: recentPayments, error: activityError } = await supabase
      .from('payments')
      .select(`
        amount_cents,
        created_at,
        status,
        client_id,
        clients(first_name, last_name)
      `)
      .eq('coach_id', coachId)
      .eq('status', 'succeeded')
      .order('created_at', { ascending: false })
      .limit(10);

    const formattedActivity = recentPayments?.map((payment: any) => {
      return {
        clientName: payment.clients ? `${payment.clients.first_name} ${payment.clients.last_name}` : 'Client',
        date: payment.created_at,
        amount: (payment.amount_cents / 100).toFixed(2),
        duration: 60 // This could be pulled from session data if needed
      };
    }) || [];

    // Goals (these could be configurable per coach)
    const revenueGoal = 5000; // Monthly goal, could be stored in coach preferences
    const avgSessionRevenue = hourlyRate;

    res.json({
      success: true,
      data: {
        stats: {
          totalRevenue: currentRevenue.toFixed(2),
          sessionsCompleted: currentSessionsCount,
          averageRating: averageRating.toFixed(1),
          activeClients,
          completionRate,
          retentionRate,
          onTimeRate,
          totalReviews,
          revenueGoal,
          avgSessionRevenue: avgSessionRevenue.toFixed(2),
          totalHours: currentHours
        },
        trends: {
          revenueChange,
          sessionsChange,
          clientsChange
        },
        recentActivity: formattedActivity
      }
    });
  } catch (error) {
    console.error('Get coach revenue error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get revenue data'
    });
  }
});

// Export coach data
router.post('/coach/export-data', [
  authenticate,
  allowDeactivatedUser,
  authenticate,
  body('format').isIn(['csv', 'pdf']).withMessage('Format must be csv or pdf')
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

    const { format } = req.body;

    // Get coach profile by email first (case-insensitive)
    const { data: coachProfile, error: coachError } = await supabase
      .from('coaches')
      .select('id')
      .ilike('email', req.user.email)
      .single();

    if (coachError || !coachProfile) {
      return res.status(404).json({
        success: false,
        message: 'Coach profile not found'
      });
    }

    console.log(`Generating ${format} export for coach ${coachProfile.id}`);

    const filePath = await dataExportService.exportUserData({
      format,
      userId: coachProfile.id,
      userType: 'coach',
      includePersonalData: true,
      includeActivityData: true,
      includeMessagesData: true,
      includeSessionsData: true
    });

    // Set appropriate headers for file download
    const fileName = path.basename(filePath);
    const mimeType = format === 'csv' ? 'text/csv' : 'application/pdf';

    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Type', mimeType);

    // Stream the file to the response
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);

    // Clean up the file after sending (with delay)
    fileStream.on('end', () => {
      setTimeout(() => {
        fs.unlink(filePath, (err) => {
          if (err) console.error('Failed to delete export file:', err);
          else console.log('Export file cleaned up:', fileName);
        });
      }, 5000); // 5 second delay to ensure download completes
    });

  } catch (error) {
    console.error('Export coach data error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export data',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Request account deletion
router.post('/coach/request-deletion', [
  authenticate,
  allowDeactivatedUser,
  authenticate,
  body('reason').optional().isString().isLength({ max: 500 })
], async (req: Request & { user?: any }, res: Response) => {
  try {
    if (!req.user || req.user.role !== 'coach') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Coach role required.'
      });
    }

    const { reason } = req.body;

    // Get coach profile by email first (case-insensitive)
    const { data: coachProfile, error: coachError } = await supabase
      .from('coaches')
      .select('id, first_name, last_name')
      .ilike('email', req.user.email)
      .single();

    if (coachError || !coachProfile) {
      return res.status(404).json({
        success: false,
        message: 'Coach profile not found'
      });
    }

    // Check if deletion is already scheduled
    const existingDeletion = await dataExportService.getAccountDeletionStatus(coachProfile.id, 'coach');

    if (existingDeletion) {
      return res.status(400).json({
        success: false,
        message: 'Account deletion is already scheduled',
        data: {
          scheduledDeletionAt: existingDeletion.scheduled_deletion_at,
          deactivatedAt: existingDeletion.deactivated_at
        }
      });
    }

    // Schedule account deletion
    await dataExportService.scheduleAccountDeletion(coachProfile.id, 'coach');

    console.log(`Account deletion scheduled for coach ${coachProfile.id} (${coachProfile.first_name} ${coachProfile.last_name})`);

    res.json({
      success: true,
      message: 'Account deletion has been scheduled. Your account will be deactivated immediately and permanently deleted in 30 days. You can cancel this request within 30 days by contacting support.',
      data: {
        deactivatedAt: new Date().toISOString(),
        scheduledDeletionAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      }
    });

  } catch (error) {
    console.error('Request account deletion error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to request account deletion',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Cancel account deletion
router.post('/coach/cancel-deletion', authenticate, allowDeactivatedUser, async (req: Request & { user?: any }, res: Response) => {
  try {
    if (!req.user || req.user.role !== 'coach') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Coach role required.'
      });
    }

    // Get coach profile by email first (case-insensitive)
    const { data: coachProfile, error: coachError } = await supabase
      .from('coaches')
      .select('id, first_name, last_name')
      .ilike('email', req.user.email)
      .single();

    if (coachError || !coachProfile) {
      return res.status(404).json({
        success: false,
        message: 'Coach profile not found'
      });
    }

    // Check if deletion is scheduled
    const existingDeletion = await dataExportService.getAccountDeletionStatus(coachProfile.id, 'coach');

    if (!existingDeletion) {
      return res.status(400).json({
        success: false,
        message: 'No scheduled account deletion found'
      });
    }

    // Cancel account deletion
    await dataExportService.cancelAccountDeletion(coachProfile.id, 'coach');

    console.log(`Account deletion cancelled for coach ${coachProfile.id} (${coachProfile.first_name} ${coachProfile.last_name})`);

    res.json({
      success: true,
      message: 'Account deletion has been cancelled. Your account has been reactivated.'
    });

  } catch (error) {
    console.error('Cancel account deletion error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel account deletion',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get account deletion status
router.get('/coach/deletion-status', authenticate, allowDeactivatedUser, async (req: Request & { user?: any }, res: Response) => {
  try {
    if (!req.user || req.user.role !== 'coach') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Coach role required.'
      });
    }

    // Get coach profile by email first (case-insensitive)
    const { data: coachProfile, error: coachError } = await supabase
      .from('coaches')
      .select('id, is_active, deactivated_at')
      .ilike('email', req.user.email)
      .single();

    if (coachError || !coachProfile) {
      return res.status(404).json({
        success: false,
        message: 'Coach profile not found'
      });
    }

    // Check if deletion is scheduled
    const existingDeletion = await dataExportService.getAccountDeletionStatus(coachProfile.id, 'coach');

    res.json({
      success: true,
      data: {
        isActive: coachProfile.is_active,
        deactivatedAt: coachProfile.deactivated_at,
        hasPendingDeletion: !!existingDeletion,
        deletion: existingDeletion
      }
    });

  } catch (error) {
    console.error('Get deletion status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get deletion status',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get coach by ID (plural version for frontend compatibility)
router.get('/coaches/:id', getCoachById);

// Get coach by ID (IMPORTANT: Keep this at the end - parameterized routes must come after specific ones)
router.get('/coach/:id', getCoachById);

export default router; 