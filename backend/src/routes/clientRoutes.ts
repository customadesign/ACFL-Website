import { Router } from 'express';
import { supabase } from '../lib/supabase';
import { authenticate } from '../middleware/auth';
import { validationResult, body } from 'express-validator';
import { Request, Response } from 'express';

const router = Router();

// Get client profile
router.get('/client/profile', authenticate, async (req: Request & { user?: any }, res: Response) => {
  try {
    if (!req.user || req.user.role !== 'client') {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. Client role required.' 
      });
    }

    // Get client profile (contains all user data now)
    const { data: clientProfile, error: profileError } = await supabase
      .from('clients')
      .select('*')
      .eq('id', req.user.userId)
      .single();

    if (profileError || !clientProfile) {
      return res.status(404).json({ 
        success: false, 
        message: 'Client profile not found' 
      });
    }

    // No need for separate assessment query - all data is in clients table now

    res.json({
      success: true,
      data: {
        id: req.user.userId,
        email: clientProfile.email,
        role: req.user.role,
        firstName: clientProfile.first_name,
        lastName: clientProfile.last_name,
        first_name: clientProfile.first_name,
        last_name: clientProfile.last_name,
        phone: clientProfile.phone,
        dob: clientProfile.dob,
        location: clientProfile.location_state,
        genderIdentity: clientProfile.gender_identity,
        ethnicIdentity: clientProfile.ethnic_identity,
        religiousBackground: clientProfile.religious_background,
        language: clientProfile.preferred_language,
        areaOfConcern: clientProfile.areas_of_concern || [],
        availability: clientProfile.availability || [],
        therapistGender: clientProfile.preferred_coach_gender,
        bio: clientProfile.bio,
        // Keep legacy format for compatibility
        preferences: {
          location: clientProfile.location_state,
          genderIdentity: clientProfile.gender_identity,
          ethnicIdentity: clientProfile.ethnic_identity,
          religiousBackground: clientProfile.religious_background,
          language: clientProfile.preferred_language,
          areaOfConcern: clientProfile.areas_of_concern || [],
          availability: clientProfile.availability || [],
          therapistGender: clientProfile.preferred_coach_gender,
        }
      }
    });
  } catch (error) {
    console.error('Get client profile error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to get profile' 
    });
  }
});

// Update client profile
router.put('/client/profile', [
  authenticate,
  body('firstName').optional().isString(),
  body('lastName').optional().isString(),
  body('phone').optional().isString(),
  body('dob').optional().isISO8601(),
  body('location').optional().isString(),
  body('genderIdentity').optional().isString(),
  body('ethnicIdentity').optional().isString(),
  body('religiousBackground').optional().isString(),
  body('language').optional().isString(),
  body('areaOfConcern').optional().isArray(),
  body('availability').optional().isArray(),
  body('therapistGender').optional().isString(),
  body('bio').optional().isString(),
], async (req: Request & { user?: any }, res: Response) => {
  try {
    if (!req.user || req.user.role !== 'client') {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. Client role required.' 
      });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    // Get client profile
    const { data: clientProfile, error: profileError } = await supabase
      .from('clients')
      .select('*')
      .eq('id', req.user.userId)  // Changed from user_id to id
      .single();

    if (profileError || !clientProfile) {
      return res.status(404).json({ 
        success: false, 
        message: 'Client profile not found' 
      });
    }

    // Update client profile - all fields in the main clients table now
    const updateData: any = {}
    
    // Basic info
    if (req.body.firstName !== undefined) updateData.first_name = req.body.firstName
    if (req.body.lastName !== undefined) updateData.last_name = req.body.lastName
    if (req.body.phone !== undefined) updateData.phone = req.body.phone
    if (req.body.dob !== undefined) updateData.dob = req.body.dob
    
    // Personal info
    if (req.body.location !== undefined) updateData.location_state = req.body.location
    if (req.body.genderIdentity !== undefined) updateData.gender_identity = req.body.genderIdentity
    if (req.body.ethnicIdentity !== undefined) updateData.ethnic_identity = req.body.ethnicIdentity
    if (req.body.religiousBackground !== undefined) updateData.religious_background = req.body.religiousBackground
    if (req.body.language !== undefined) updateData.preferred_language = req.body.language
    
    // Preferences
    if (req.body.areaOfConcern !== undefined) updateData.areas_of_concern = req.body.areaOfConcern
    if (req.body.availability !== undefined) updateData.availability = req.body.availability
    if (req.body.therapistGender !== undefined) updateData.preferred_coach_gender = req.body.therapistGender
    if (req.body.bio !== undefined) updateData.bio = req.body.bio

    // Only update if there are fields to update
    if (Object.keys(updateData).length > 0) {
      const { error: updateError } = await supabase
        .from('clients')
        .update(updateData)
        .eq('id', clientProfile.id)

      if (updateError) {
        throw updateError
      }
    }

    res.json({
      success: true,
      message: 'Profile updated successfully'
    });
  } catch (error) {
    console.error('Update client profile error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update profile' 
    });
  }
});

// Get client appointments
router.get('/client/appointments', authenticate, async (req: Request & { user?: any }, res: Response) => {
  try {
    if (!req.user || req.user.role !== 'client') {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. Client role required.' 
      });
    }

    const { filter = 'upcoming' } = req.query;

    // Get client profile first
    const { data: clientProfile, error: profileError } = await supabase
      .from('clients')
      .select('id')
      .eq('id', req.user.userId)
      .single();

    if (profileError || !clientProfile) {
      return res.status(404).json({ 
        success: false, 
        message: 'Client profile not found' 
      });
    }

    let query = supabase
      .from('sessions')
      .select(`
        *,
        coaches (
          id,
          first_name,
          last_name,
          specialties,
          users (email)
        )
      `)
      .eq('client_id', clientProfile.id)
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

    const { data: appointments, error: appointmentsError } = await query;

    if (appointmentsError) {
      throw appointmentsError;
    }

    res.json({
      success: true,
      data: appointments || []
    });
  } catch (error) {
    console.error('Get client appointments error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to get appointments' 
    });
  }
});

// Get saved coaches
router.get('/client/saved-coaches', authenticate, async (req: Request & { user?: any }, res: Response) => {
  try {
    if (!req.user || req.user.role !== 'client') {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. Client role required.' 
      });
    }

    // Get client profile first
    const { data: clientProfile, error: profileError } = await supabase
      .from('clients')
      .select('id')
      .eq('id', req.user.userId)
      .single();

    if (profileError || !clientProfile) {
      return res.status(404).json({ 
        success: false, 
        message: 'Client profile not found' 
      });
    }

    // Get saved coaches
    const { data: savedCoaches, error: savedError } = await supabase
      .from('saved_coaches')
      .select(`
        *,
        coaches (
          id,
          first_name,
          last_name,
          bio,
          specialties,
          languages,
          hourly_rate,
          experience,
          rating,
          is_available,
          created_at,
          users (email)
        )
      `)
      .eq('client_id', clientProfile.id);

    if (savedError) {
      throw savedError;
    }

    // Format the response
    const formattedCoaches = savedCoaches?.map((saved: any) => {
      const coach = saved.coaches;
      return {
        id: coach.id,
        name: `${coach.first_name} ${coach.last_name}`,
        specialties: coach.specialties || [],
        languages: coach.languages || [],
        bio: coach.bio || '',
        sessionRate: coach.hourly_rate ? `$${coach.hourly_rate}/session` : 'Rate not specified',
        experience: coach.experience ? `${coach.experience} years` : 'Experience not specified',
        rating: 0, // Will be calculated dynamically from reviews
        savedDate: coach.created_at, // Use coach's creation date as fallback
        virtualAvailable: coach.is_available,
        email: coach.users?.email
      };
    }) || [];

    res.json({
      success: true,
      data: formattedCoaches
    });
  } catch (error) {
    console.error('Get saved coaches error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to get saved coaches' 
    });
  }
});

// Save a coach
router.post('/client/saved-coaches', [
  authenticate,
  body('coachId').notEmpty().withMessage('Coach ID is required')
], async (req: Request & { user?: any }, res: Response) => {
  try {
    if (!req.user || req.user.role !== 'client') {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. Client role required.' 
      });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const { coachId } = req.body;

    // Get client profile first
    const { data: clientProfile, error: profileError } = await supabase
      .from('clients')
      .select('id')
      .eq('id', req.user.userId)
      .single();

    if (profileError || !clientProfile) {
      return res.status(404).json({ 
        success: false, 
        message: 'Client profile not found' 
      });
    }

    // Check if already saved
    const { data: existing } = await supabase
      .from('saved_coaches')
      .select('id')
      .eq('client_id', clientProfile.id)
      .eq('coach_id', coachId)
      .single();

    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Coach already saved'
      });
    }

    // Save the coach
    const { data: savedCoach, error: saveError } = await supabase
      .from('saved_coaches')
      .insert({
        client_id: clientProfile.id,
        coach_id: coachId
      })
      .select()
      .single();

    if (saveError) {
      throw saveError;
    }

    res.json({
      success: true,
      message: 'Coach saved successfully',
      data: savedCoach
    });
  } catch (error) {
    console.error('Save coach error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to save coach' 
    });
  }
});

// Remove saved coach
router.delete('/client/saved-coaches/:coachId', authenticate, async (req: Request & { user?: any }, res: Response) => {
  try {
    if (!req.user || req.user.role !== 'client') {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. Client role required.' 
      });
    }

    const { coachId } = req.params;

    // Get client profile first
    const { data: clientProfile, error: profileError } = await supabase
      .from('clients')
      .select('id')
      .eq('id', req.user.userId)
      .single();

    if (profileError || !clientProfile) {
      return res.status(404).json({ 
        success: false, 
        message: 'Client profile not found' 
      });
    }

    // Remove the saved coach
    const { error: removeError } = await supabase
      .from('saved_coaches')
      .delete()
      .eq('client_id', clientProfile.id)
      .eq('coach_id', coachId);

    if (removeError) {
      throw removeError;
    }

    res.json({
      success: true,
      message: 'Coach removed from saved list'
    });
  } catch (error) {
    console.error('Remove saved coach error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to remove saved coach' 
    });
  }
});

// Get all available coaches (for initial load)
router.get('/client/coaches', [
  authenticate
], async (req: Request & { user?: any }, res: Response) => {
  try {
    if (!req.user || req.user.role !== 'client') {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. Client role required.' 
      });
    }

    // Get all available coaches (main query)
    const { data: coaches, error: coachesError } = await supabase
      .from('coaches')
      .select(`
        id,
        first_name,
        last_name,
        bio,
        specialties,
        languages,
        hourly_rate_usd,
        years_experience,
        rating,
        is_available,
        created_at,
        email
      `)
      .eq('is_available', true);

    if (coachesError) {
      console.error('Coaches query error:', coachesError);
      throw coachesError;
    }

    // Get coach demographics separately (if needed)
    let demographics = [];
    if (coaches && coaches.length > 0) {
      const coachIds = coaches.map(c => c.id);
      const { data: demoData } = await supabase
        .from('coach_demographics')
        .select(`
          coach_id,
          gender_identity,
          ethnic_identity,
          religious_background,
          languages,
          accepts_insurance,
          accepts_sliding_scale,
          timezone,
          meta
        `)
        .in('coach_id', coachIds);
      demographics = demoData || [];
    }

    // Create demographics lookup
    const demographicsMap = new Map();
    demographics.forEach(demo => {
      demographicsMap.set(demo.coach_id, demo);
    });

    // Format response
    const formattedCoaches = coaches?.map((coach: any) => {
      const coachDemo = demographicsMap.get(coach.id);
      return {
        id: coach.id,
        name: `${coach.first_name} ${coach.last_name}`,
        specialties: coach.specialties || [],
        languages: coach.languages || [],
        bio: coach.bio || '',
        sessionRate: coach.hourly_rate_usd ? `$${coach.hourly_rate_usd}/session` : 'Rate not specified',
        experience: coach.years_experience ? `${coach.years_experience} years` : 'Experience not specified',
        rating: 0, // Will be calculated dynamically from reviews
        matchScore: 50, // Default score for all coaches
        virtualAvailable: coachDemo?.meta?.video_available || false,
        inPersonAvailable: coachDemo?.meta?.in_person_available || false,
        email: coach.email
      };
    }) || [];

    res.json({
      success: true,
      data: formattedCoaches
    });
  } catch (error) {
    console.error('Get coaches error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to get coaches' 
    });
  }
});

// Search coaches
router.post('/client/search-coaches', [
  authenticate,
  body('preferences').isObject().withMessage('Preferences object is required')
], async (req: Request & { user?: any }, res: Response) => {
  try {
    if (!req.user || req.user.role !== 'client') {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. Client role required.' 
      });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const { preferences } = req.body;

    // Build query based on preferences
    let query = supabase
      .from('coaches')
      .select(`
        id,
        first_name,
        last_name,
        bio,
        specialties,
        languages,
        hourly_rate,
        experience,
        rating,
        is_available,
        created_at,
        users (email),
        coach_demographics (
          gender,
          ethnicity,
          religion,
          location_states,
          available_times,
          video_available,
          insurance_accepted,
          min_age,
          max_age
        )
      `)
      .eq('is_available', true);

    // Apply filters based on preferences
    
    // Filter by specialties (areas of concern)
    if (preferences.areaOfConcern && preferences.areaOfConcern.length > 0) {
      query = query.overlaps('specialties', preferences.areaOfConcern);
    }

    // Filter by languages
    if (preferences.language && preferences.language !== 'any') {
      const languageFilter = preferences.language === 'Other' && preferences.languageOther 
        ? preferences.languageOther 
        : preferences.language;
      query = query.contains('languages', [languageFilter]);
    }

    // Filter by location if specified
    if (preferences.location) {
      query = query.contains('coach_demographics.location_states', [preferences.location]);
    }

    // Filter by coach gender preference
    if (preferences.therapistGender && preferences.therapistGender !== 'any') {
      const genderFilter = preferences.therapistGender === 'other' && preferences.therapistGenderOther
        ? preferences.therapistGenderOther
        : preferences.therapistGender;
      query = query.eq('coach_demographics.gender', genderFilter);
    }

    // Filter by coach ethnicity preference  
    if (preferences.therapistEthnicity && preferences.therapistEthnicity !== 'any') {
      const ethnicityFilter = preferences.therapistEthnicity === 'other' && preferences.therapistEthnicityOther
        ? preferences.therapistEthnicityOther
        : preferences.therapistEthnicity;
      query = query.eq('coach_demographics.ethnicity', ethnicityFilter);
    }

    // Filter by coach religion preference
    if (preferences.therapistReligion && preferences.therapistReligion !== 'any') {
      const religionFilter = preferences.therapistReligion === 'other' && preferences.therapistReligionOther
        ? preferences.therapistReligionOther
        : preferences.therapistReligion;
      query = query.eq('coach_demographics.religion', religionFilter);
    }

    const { data: coaches, error: coachesError } = await query;

    if (coachesError) {
      throw coachesError;
    }

    // Calculate match scores and format response
    const formattedCoaches = coaches?.map((coach: any) => {
      let matchScore = 50; // Base score

      // Calculate match score based on preferences
      // Areas of concern matching (30 points)
      if (preferences.areaOfConcern && preferences.areaOfConcern.length > 0) {
        const matchingSpecialties = coach.specialties?.filter((s: string) => 
          preferences.areaOfConcern.includes(s)
        ).length || 0;
        matchScore += (matchingSpecialties / preferences.areaOfConcern.length) * 30;
      }

      // Language matching (15 points)
      if (preferences.language && preferences.language !== 'any') {
        const languageFilter = preferences.language === 'Other' && preferences.languageOther 
          ? preferences.languageOther 
          : preferences.language;
        if (coach.languages?.includes(languageFilter)) {
          matchScore += 15;
        }
      }

      // Location matching (10 points)
      if (preferences.location && coach.coach_demographics?.location_states?.includes(preferences.location)) {
        matchScore += 10;
      }

      // Demographics matching (15 points total)
      let demographicsMatches = 0;
      if (preferences.therapistGender && preferences.therapistGender !== 'any') {
        const genderFilter = preferences.therapistGender === 'other' && preferences.therapistGenderOther
          ? preferences.therapistGenderOther
          : preferences.therapistGender;
        if (coach.coach_demographics?.gender === genderFilter) {
          demographicsMatches += 5;
        }
      }

      if (preferences.therapistEthnicity && preferences.therapistEthnicity !== 'any') {
        const ethnicityFilter = preferences.therapistEthnicity === 'other' && preferences.therapistEthnicityOther
          ? preferences.therapistEthnicityOther
          : preferences.therapistEthnicity;
        if (coach.coach_demographics?.ethnicity === ethnicityFilter) {
          demographicsMatches += 5;
        }
      }

      if (preferences.therapistReligion && preferences.therapistReligion !== 'any') {
        const religionFilter = preferences.therapistReligion === 'other' && preferences.therapistReligionOther
          ? preferences.therapistReligionOther
          : preferences.therapistReligion;
        if (coach.coach_demographics?.religion === religionFilter) {
          demographicsMatches += 5;
        }
      }

      matchScore += demographicsMatches;

      return {
        id: coach.id,
        name: `${coach.first_name} ${coach.last_name}`,
        specialties: coach.specialties || [],
        languages: coach.languages || [],
        bio: coach.bio || '',
        sessionRate: coach.hourly_rate ? `$${coach.hourly_rate}/session` : 'Rate not specified',
        experience: coach.experience ? `${coach.experience} years` : 'Experience not specified',
        rating: 0, // Will be calculated dynamically from reviews
        matchScore: Math.min(Math.round(matchScore), 100),
        virtualAvailable: coach.is_available,
        email: coach.users?.email
      };
    }) || [];

    // Sort by match score
    formattedCoaches.sort((a, b) => b.matchScore - a.matchScore);

    res.json({
      success: true,
      data: formattedCoaches
    });
  } catch (error) {
    console.error('Search coaches error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to search coaches' 
    });
  }
});

// Book appointment with coach
router.post('/client/book-appointment', [
  authenticate,
  body('coachId').notEmpty().withMessage('Coach ID is required'),
  body('scheduledAt').isISO8601().withMessage('Valid scheduled date/time is required'),
  body('sessionType').isIn(['consultation', 'session']).withMessage('Session type must be consultation or session'),
  body('notes').optional().isLength({ max: 500 }).withMessage('Notes must be less than 500 characters')
], async (req: Request & { user?: any }, res: Response) => {
  try {
    if (!req.user || req.user.role !== 'client') {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. Client role required.' 
      });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const { coachId, scheduledAt, sessionType, notes } = req.body;

    // Get client profile
    const { data: clientProfile, error: clientError } = await supabase
      .from('clients')
      .select('id')
      .eq('id', req.user.userId)
      .single();

    if (clientError || !clientProfile) {
      return res.status(404).json({ 
        success: false, 
        message: 'Client profile not found' 
      });
    }

    // Verify coach exists
    const { data: coach, error: coachError } = await supabase
      .from('coaches')
      .select('id, first_name, last_name, is_available')
      .eq('id', coachId)
      .single();

    if (coachError || !coach) {
      return res.status(404).json({ 
        success: false, 
        message: 'Coach not found' 
      });
    }

    if (!coach.is_available) {
      return res.status(400).json({
        success: false,
        message: 'Coach is not currently available for bookings'
      });
    }

    // Check for scheduling conflicts (simplified)  
    const scheduledDate = new Date(scheduledAt);
    const startTime = scheduledDate.toISOString();
    
    // Calculate session duration and end time (default 60 minutes)
    const duration = 60; // minutes
    const endTime = new Date(scheduledDate.getTime() + (duration * 60 * 1000)).toISOString();

    const { data: conflicts, error: conflictError } = await supabase
      .from('sessions')
      .select('id')
      .eq('coach_id', coachId)
              .eq('starts_at', startTime);

    if (conflictError) {
      console.log('Conflict check error:', conflictError);
      // Continue anyway - conflict check is not critical
    }

    if (conflicts && conflicts.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Time slot not available. Please choose a different time.'
      });
    }

    // Generate Zoom link for the session (placeholder - integrate with Zoom API later)
    const zoomLink = `https://zoom.us/j/${Math.random().toString().substr(2, 10)}`;
    
    // Create the session with all fields matching the database schema
    const sessionData: any = {
      client_id: clientProfile.id,
      coach_id: coachId,
      starts_at: startTime,
      ends_at: endTime,
      status: 'scheduled',
      notes: notes || '',
      zoom_link: zoomLink, // Required field for online-only sessions
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    console.log('Inserting session with data:', sessionData);

    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .insert(sessionData)
      .select()
      .single();

    console.log('Session insert result:', { session, sessionError });

    if (sessionError) {
      throw sessionError;
    }

    res.json({
      success: true,
      message: 'Session scheduled successfully',
      data: {
        sessionId: session.id,
        scheduledAt: session.starts_at,
        coachName: `${coach.first_name} ${coach.last_name}`,
        format: 'virtual', // All sessions are virtual/online
        zoomLink: session.zoom_link,
        duration: duration
      }
    });
  } catch (error) {
    console.error('Book appointment error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to book appointment',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Reschedule appointment
router.put('/client/appointments/:id/reschedule', [
  authenticate,
  body('newScheduledAt').isISO8601().withMessage('Valid new scheduled date/time is required')
], async (req: Request & { user?: any }, res: Response) => {
  try {
    const { id } = req.params;
    const { newScheduledAt } = req.body;

    // Get client profile
    const { data: clientProfile, error: clientError } = await supabase
      .from('clients')
      .select('id')
      .eq('id', req.user.userId)
      .single();

    if (clientError || !clientProfile) {
      return res.status(404).json({ success: false, message: 'Client profile not found' });
    }

    // Verify this is the client's appointment
    const { data: appointment, error: appointmentError } = await supabase
      .from('sessions')
      .select('*')
      .eq('id', id)
      .eq('client_id', clientProfile.id)
      .single();

    if (appointmentError || !appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    if (appointment.status === 'completed' || appointment.status === 'cancelled') {
      return res.status(400).json({ success: false, message: 'Cannot reschedule completed or cancelled appointments' });
    }

    // Update the appointment
    const { data: updatedAppointment, error: updateError } = await supabase
      .from('sessions')
      .update({
        starts_at: newScheduledAt,
        ends_at: new Date(new Date(newScheduledAt).getTime() + (60 * 60 * 1000)).toISOString(),
        status: 'scheduled', // Reset to scheduled if it was confirmed
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    res.json({
      success: true,
      message: 'Appointment rescheduled successfully',
      data: updatedAppointment
    });
  } catch (error) {
    console.error('Reschedule appointment error:', error);
    res.status(500).json({ success: false, message: 'Failed to reschedule appointment' });
  }
});

// Cancel appointment
router.put('/client/appointments/:id/cancel', [
  authenticate,
  body('reason').optional().isLength({ max: 500 }).withMessage('Cancellation reason must be less than 500 characters')
], async (req: Request & { user?: any }, res: Response) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    // Get client profile
    const { data: clientProfile, error: clientError } = await supabase
      .from('clients')
      .select('id')
      .eq('id', req.user.userId)
      .single();

    if (clientError || !clientProfile) {
      return res.status(404).json({ success: false, message: 'Client profile not found' });
    }

    // Verify this is the client's appointment
    const { data: appointment, error: appointmentError } = await supabase
      .from('sessions')
      .select('*')
      .eq('id', id)
      .eq('client_id', clientProfile.id)
      .single();

    if (appointmentError || !appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    if (appointment.status === 'completed' || appointment.status === 'cancelled') {
      return res.status(400).json({ success: false, message: 'Appointment is already completed or cancelled' });
    }

    // Update the appointment
    const updateData: any = {
      status: 'cancelled',
      updated_at: new Date().toISOString()
    };

    if (reason) {
      updateData.notes = `${appointment.notes ? appointment.notes + ' | ' : ''}Cancelled: ${reason}`;
    }

    const { data: updatedAppointment, error: updateError } = await supabase
      .from('sessions')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    res.json({
      success: true,
      message: 'Appointment cancelled successfully',
      data: updatedAppointment
    });
  } catch (error) {
    console.error('Cancel appointment error:', error);
    res.status(500).json({ success: false, message: 'Failed to cancel appointment' });
  }
});

// Send message to coach
router.post('/client/message-coach', [
  authenticate,
  body('coachId').notEmpty().withMessage('Coach ID is required'),
  body('subject').notEmpty().withMessage('Subject is required'),
  body('message').notEmpty().withMessage('Message is required'),
  body('appointmentId').optional()
], async (req: Request & { user?: any }, res: Response) => {
  try {
    const { coachId, subject, message, appointmentId } = req.body;

    // Get client profile by email first
    const { data: clientProfile, error: clientError } = await supabase
      .from('clients')
      .select('id, first_name, last_name')
      .eq('email', req.user.email)
      .single();

    if (clientError || !clientProfile) {
      return res.status(404).json({ success: false, message: 'Client profile not found' });
    }

    // Verify coach exists
    const { data: coach, error: coachError } = await supabase
      .from('coaches')
      .select('id, first_name, last_name, email')
      .eq('id', coachId)
      .single();

    if (coachError || !coach) {
      return res.status(404).json({ success: false, message: 'Coach not found' });
    }

    // Store message in database
    const { data: newMessage, error: messageError } = await supabase
      .from('messages')
      .insert({
        sender_id: clientProfile.id,
        receiver_id: coach.id,
        session_id: appointmentId || null,
        subject: subject,
        content: message,
        message_type: appointmentId ? 'booking' : 'general'
      })
      .select()
      .single();

    if (messageError) {
      console.error('Database error:', messageError);
      return res.status(500).json({ success: false, message: 'Failed to store message' });
    }
    
    res.json({
      success: true,
      message: 'Message sent successfully to coach',
      data: {
        messageId: newMessage.id,
        to: `${coach.first_name} ${coach.last_name}`,
        from: `${clientProfile.first_name} ${clientProfile.last_name}`,
        subject,
        sentAt: newMessage.created_at
      }
    });
  } catch (error) {
    console.error('Message coach error:', error);
    res.status(500).json({ success: false, message: 'Failed to send message' });
  }
});

// Get client messages/conversations
router.get('/client/messages', authenticate, async (req: Request & { user?: any }, res: Response) => {
  try {
    const { page = 1, limit = 20, conversation_with } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    // Get client profile by email first
    const { data: clientProfile, error: clientError } = await supabase
      .from('clients')
      .select('id')
      .eq('email', req.user.email)
      .single();

    if (clientError || !clientProfile) {
      return res.status(404).json({ success: false, message: 'Client profile not found' });
    }

    // For now, return empty messages array
    const messages: any[] = [];

    res.json({
      success: true,
      data: messages,
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

// Get client conversations (unique participants)
router.get('/client/conversations', authenticate, async (req: Request & { user?: any }, res: Response) => {
  try {
    // Get client profile by email first
    const { data: clientProfile, error: clientError } = await supabase
      .from('clients')
      .select('id')
      .eq('email', req.user.email)
      .single();

    if (clientError || !clientProfile) {
      return res.status(404).json({ success: false, message: 'Client profile not found' });
    }

    // For now, return empty messages array
    const messages: any[] = [];

    // Group by conversation partners
    const conversationsMap = new Map();
    
    messages?.forEach(message => {
      const partnerId = message.sender_id === clientProfile.id ? message.receiver_id : message.sender_id;
      
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
      if (message.receiver_id === clientProfile.id && !message.is_read) {
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

// Mark messages as read
router.put('/client/messages/:messageId/read', authenticate, async (req: Request & { user?: any }, res: Response) => {
  try {
    const { messageId } = req.params;

    // Get client profile by email first
    const { data: clientProfile, error: clientError } = await supabase
      .from('clients')
      .select('id')
      .eq('email', req.user.email)
      .single();

    if (clientError || !clientProfile) {
      return res.status(404).json({ success: false, message: 'Client profile not found' });
    }

    const { error } = await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('id', messageId)
      .eq('receiver_id', clientProfile.id); // Only mark as read if current user is receiver

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

// Send message (general - not just to coaches)
router.post('/client/send-message', [
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

    // Get client profile by email first
    const { data: clientProfile, error: clientError } = await supabase
      .from('clients')
      .select('id, first_name, last_name')
      .eq('email', req.user.email)
      .single();

    if (clientError || !clientProfile) {
      return res.status(404).json({ success: false, message: 'Client profile not found' });
    }

    // Verify receiver exists (could be coach or client)
    let receiver: any = null;
    
    const { data: coachReceiver, error: coachReceiverError } = await supabase
      .from('coaches')
      .select('id, first_name, last_name, email')
      .eq('id', receiverId)
      .single();

    if (!coachReceiverError && coachReceiver) {
      receiver = coachReceiver;
    } else {
      // Try to find in clients table
      const { data: clientReceiver, error: clientReceiverError } = await supabase
        .from('clients')
        .select('id, first_name, last_name, email')
        .eq('id', receiverId)
        .single();

      if (clientReceiverError || !clientReceiver) {
        return res.status(404).json({ success: false, message: 'Receiver not found' });
      }
      
      receiver = clientReceiver;
    }

    // Store message in database
    const { data: newMessage, error: messageError } = await supabase
      .from('messages')
      .insert({
        sender_id: clientProfile.id,
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

// Get client activity for dashboard
router.get('/client/activity', authenticate, async (req: Request & { user?: any }, res: Response) => {
  try {
    if (!req.user || req.user.role !== 'client') {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. Client role required.' 
      });
    }

    // Get client profile by email first
    const { data: clientProfile, error: clientError } = await supabase
      .from('clients')
      .select('id, first_name, last_name')
      .eq('email', req.user.email)
      .single();

    if (clientError || !clientProfile) {
      return res.status(404).json({ success: false, message: 'Client profile not found' });
    }

    const clientId = clientProfile.id;

    // Get recent sessions/appointments
    const { data: recentSessions, error: sessionsError } = await supabase
      .from('sessions')
      .select(`
        id,
        scheduled_at,
        status,
        session_type,
        duration,
        coach_id
      `)
      .eq('client_id', clientId)
      .order('scheduled_at', { ascending: false })
      .limit(5);

    if (sessionsError) {
      console.error('Sessions query error:', sessionsError);
    }

    // Get recent messages - we'll need to handle the relationship logic in the processing
    const { data: recentMessages, error: messagesError } = await supabase
      .from('messages')
      .select(`
        id,
        content,
        created_at,
        sender_id,
        receiver_id
      `)
      .or(`sender_id.eq.${clientId},receiver_id.eq.${clientId}`)
      .order('created_at', { ascending: false })
      .limit(5);

    if (messagesError) {
      console.error('Messages query error:', messagesError);
    }

    // Get recent saved coaches
    const { data: recentSavedCoaches, error: savedError } = await supabase
      .from('saved_coaches')
      .select(`
        saved_at,
        coach_id
      `)
      .eq('client_id', clientId)
      .order('saved_at', { ascending: false })
      .limit(5);

    if (savedError) {
      console.error('Saved coaches query error:', savedError);
    }

    // Get recent search activity
    const { data: recentSearches, error: searchError } = await supabase
      .from('search_history')
      .select(`
        id,
        search_criteria,
        results_count,
        created_at
      `)
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })
      .limit(5);

    if (searchError) {
      console.error('Search history query error:', searchError);
    }

    // Combine and format all activities
    const activities = [];

    // Add sessions
    if (recentSessions) {
      for (const session of recentSessions) {
        let coachName = 'Unknown Coach';
        
        if (session.coach_id) {
          // Look up coach name from coaches table
          const { data: coach } = await supabase
            .from('coaches')
            .select('first_name, last_name')
            .eq('id', session.coach_id)
            .single();
          
          if (coach) {
            coachName = `${coach.first_name} ${coach.last_name}`;
          }
        }
        
        activities.push({
          id: session.id,
          type: 'appointment',
          title: `Session with ${coachName}`,
          subtitle: `${session.session_type} session - ${session.status}`,
          date: session.scheduled_at,
          time: new Date(session.scheduled_at).toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
          }),
          timestamp: new Date(session.scheduled_at).getTime(),
          data: session
        });
      }
    }

    // Add messages
    if (recentMessages) {
      for (const message of recentMessages) {
        let partnerName = 'Unknown User';
        const partnerId = message.sender_id === clientId ? message.receiver_id : message.sender_id;
        
        // Try to find the partner in coaches table first
        const { data: coachPartner } = await supabase
          .from('coaches')
          .select('first_name, last_name')
          .eq('id', partnerId)
          .single();
        
        if (coachPartner) {
          partnerName = `${coachPartner.first_name} ${coachPartner.last_name}`;
        } else {
          // Try to find in clients table
          const { data: clientPartner } = await supabase
            .from('clients')
            .select('first_name, last_name')
            .eq('id', partnerId)
            .single();
          
          if (clientPartner) {
            partnerName = `${clientPartner.first_name} ${clientPartner.last_name}`;
          }
        }

        const isSender = message.sender_id === clientId;
        activities.push({
          id: message.id,
          type: 'message',
          title: `${isSender ? 'Message to' : 'Message from'} ${partnerName}`,
          subtitle: message.content.substring(0, 50) + (message.content.length > 50 ? '...' : ''),
          date: message.created_at,
          time: new Date(message.created_at).toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
          }),
          timestamp: new Date(message.created_at).getTime(),
          data: message
        });
      }
    }

    // Add saved coaches
    if (recentSavedCoaches) {
      for (const saved of recentSavedCoaches) {
        let coachName = 'Unknown Coach';
        let coachId = 'unknown';
        
        if (saved.coach_id) {
          // Look up coach name from coaches table
          const { data: coach } = await supabase
            .from('coaches')
            .select('id, first_name, last_name')
            .eq('id', saved.coach_id)
            .single();
          
          if (coach) {
            coachName = `${coach.first_name} ${coach.last_name}`;
            coachId = coach.id;
          }
        }
        
        activities.push({
          id: coachId,
          type: 'saved',
          title: `Saved ${coachName}`,
          subtitle: 'Added to your favorites',
          date: saved.saved_at,
          time: new Date(saved.saved_at).toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
          }),
          timestamp: new Date(saved.saved_at).getTime(),
          data: saved
        });
      }
    }

    // Add search activity
    if (recentSearches) {
      recentSearches.forEach(search => {
        activities.push({
          id: search.id,
          type: 'search',
          title: 'Coach Search',
          subtitle: `Found ${search.results_count} coaches`,
          date: search.created_at,
          time: new Date(search.created_at).toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
          }),
          timestamp: new Date(search.created_at).getTime(),
          data: search
        });
      });
    }

    // Sort all activities by timestamp (most recent first) and limit to 10
    const sortedActivities = activities
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 10);

    res.json({
      success: true,
      data: sortedActivities
    });
  } catch (error) {
    console.error('Get client activity error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to get client activity' 
    });
  }
});

export default router;