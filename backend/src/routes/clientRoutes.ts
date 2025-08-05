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

    // Get user data
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', req.user.userId)
      .single();

    if (userError || !user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    // Get client profile
    const { data: clientProfile, error: profileError } = await supabase
      .from('clients')
      .select('*')
      .eq('user_id', req.user.userId)
      .single();

    if (profileError || !clientProfile) {
      return res.status(404).json({ 
        success: false, 
        message: 'Client profile not found' 
      });
    }

    // Get latest assessment if exists
    const { data: assessment } = await supabase
      .from('client_assessments')
      .select('*')
      .eq('client_id', clientProfile.id)
      .eq('is_current', true)
      .single();

    res.json({
      success: true,
      data: {
        ...user,
        ...clientProfile,
        preferences: assessment || {}
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
      .eq('user_id', req.user.userId)
      .single();

    if (profileError || !clientProfile) {
      return res.status(404).json({ 
        success: false, 
        message: 'Client profile not found' 
      });
    }

    // Update client profile
    const updateData: any = {}
    if (req.body.firstName) updateData.first_name = req.body.firstName
    if (req.body.lastName) updateData.last_name = req.body.lastName
    if (req.body.phone) updateData.phone = req.body.phone
    if (req.body.bio) updateData.bio = req.body.bio

    const { error: updateError } = await supabase
      .from('clients')
      .update(updateData)
      .eq('id', clientProfile.id)

    if (updateError) {
      throw updateError
    }

    // Update or create assessment with preferences
    const assessmentData = {
      client_id: clientProfile.id,
      location: req.body.location,
      gender_identity: req.body.genderIdentity,
      ethnic_identity: req.body.ethnicIdentity,
      religious_background: req.body.religiousBackground,
      language: req.body.language,
      area_of_concern: req.body.areaOfConcern,
      availability: req.body.availability,
      preferred_therapist_gender: req.body.therapistGender,
      is_current: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    // First, set all existing assessments to not current
    await supabase
      .from('client_assessments')
      .update({ is_current: false })
      .eq('client_id', clientProfile.id)

    // Insert new assessment
    const { error: assessmentError } = await supabase
      .from('client_assessments')
      .insert(assessmentData)

    if (assessmentError) {
      throw assessmentError
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
      .eq('user_id', req.user.userId)
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
      .order('scheduled_at', { ascending: true });

    // Apply filters
    const now = new Date().toISOString();
    if (filter === 'upcoming') {
      query = query.gte('scheduled_at', now).in('status', ['scheduled', 'confirmed']);
    } else if (filter === 'past') {
      query = query.or(`scheduled_at.lt.${now},status.eq.completed`);
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
      .eq('user_id', req.user.userId)
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
        rating: coach.rating || 0,
        savedDate: coach.created_at, // Use coach's creation date as fallback
        virtualAvailable: coach.is_available,
        inPersonAvailable: coach.is_available,
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
      .eq('user_id', req.user.userId)
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
      .eq('user_id', req.user.userId)
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

    // Get all available coaches
    const { data: coaches, error: coachesError } = await supabase
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
          in_person_available,
          phone_available,
          insurance_accepted,
          min_age,
          max_age
        )
      `)
      .eq('is_available', true);

    if (coachesError) {
      throw coachesError;
    }

    // Format response
    const formattedCoaches = coaches?.map((coach: any) => ({
      id: coach.id,
      name: `${coach.first_name} ${coach.last_name}`,
      specialties: coach.specialties || [],
      languages: coach.languages || [],
      bio: coach.bio || '',
      sessionRate: coach.hourly_rate ? `$${coach.hourly_rate}/session` : 'Rate not specified',
      experience: coach.experience ? `${coach.experience} years` : 'Experience not specified',
      rating: coach.rating || 0,
      matchScore: 50, // Default score for all coaches
      virtualAvailable: coach.coach_demographics?.video_available || false,
      inPersonAvailable: coach.coach_demographics?.in_person_available || false,
      email: coach.users?.email
    })) || [];

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
          in_person_available,
          phone_available,
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
        rating: coach.rating || 0,
        matchScore: Math.min(Math.round(matchScore), 100),
        virtualAvailable: coach.is_available,
        inPersonAvailable: coach.is_available,
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
      .eq('user_id', req.user.userId)
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

    const { data: conflicts, error: conflictError } = await supabase
      .from('sessions')
      .select('id')
      .eq('coach_id', coachId)
      .eq('scheduled_at', startTime);

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

    // Create the session with all fields matching the database schema
    const sessionData: any = {
      client_id: clientProfile.id,
      coach_id: coachId,
      scheduled_at: startTime,
      status: 'scheduled',
      session_type: sessionType || 'consultation',
      notes: notes || '',
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
      message: `${sessionType === 'consultation' ? 'Consultation' : 'Session'} scheduled successfully`,
      data: {
        sessionId: session.id,
        scheduledAt: session.scheduled_at,
        coachName: `${coach.first_name} ${coach.last_name}`,
        sessionType: session.session_type,
        format: 'virtual', // All sessions are virtual
        duration: sessionType === 'consultation' ? 15 : 60
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
      .eq('user_id', req.user.userId)
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
        scheduled_at: newScheduledAt,
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
      .eq('user_id', req.user.userId)
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

    // Get client profile
    const { data: clientProfile, error: clientError } = await supabase
      .from('clients')
      .select('id, first_name, last_name')
      .eq('user_id', req.user.userId)
      .single();

    if (clientError || !clientProfile) {
      return res.status(404).json({ success: false, message: 'Client profile not found' });
    }

    // Verify coach exists
    const { data: coach, error: coachError } = await supabase
      .from('coaches')
      .select('id, first_name, last_name, users(email)')
      .eq('id', coachId)
      .single();

    if (coachError || !coach) {
      return res.status(404).json({ success: false, message: 'Coach not found' });
    }

    // Get coach user_id
    const { data: coachUser, error: coachUserError } = await supabase
      .from('coaches')
      .select('user_id')
      .eq('id', coachId)
      .single();

    if (coachUserError || !coachUser) {
      return res.status(404).json({ success: false, message: 'Coach user not found' });
    }

    // Store message in database
    const { data: newMessage, error: messageError } = await supabase
      .from('messages')
      .insert({
        sender_id: req.user.userId,
        receiver_id: coachUser.user_id,
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

    let query = supabase
      .from('messages')
      .select(`
        id,
        sender_id,
        receiver_id,
        session_id,
        subject,
        content,
        is_read,
        message_type,
        priority,
        created_at,
        sender:sender_id(first_name, last_name, email, role),
        receiver:receiver_id(first_name, last_name, email, role)
      `)
      .or(`sender_id.eq.${req.user.userId},receiver_id.eq.${req.user.userId}`)
      .order('created_at', { ascending: false })
      .range(offset, offset + Number(limit) - 1);

    if (conversation_with) {
      query = query.or(`and(sender_id.eq.${req.user.userId},receiver_id.eq.${conversation_with}),and(sender_id.eq.${conversation_with},receiver_id.eq.${req.user.userId})`);
    }

    const { data: messages, error } = await query;

    if (error) {
      throw error;
    }

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
    const { data: messages, error } = await supabase
      .from('messages')
      .select(`
        sender_id,
        receiver_id,
        subject,
        content,
        is_read,
        created_at,
        sender:sender_id(first_name, last_name, email, role),
        receiver:receiver_id(first_name, last_name, email, role)
      `)
      .or(`sender_id.eq.${req.user.userId},receiver_id.eq.${req.user.userId}`)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    // Group by conversation partners
    const conversationsMap = new Map();
    
    messages?.forEach(message => {
      const partnerId = message.sender_id === req.user.userId ? message.receiver_id : message.sender_id;
      const partner = message.sender_id === req.user.userId ? message.receiver : message.sender;
      
      if (!conversationsMap.has(partnerId)) {
        conversationsMap.set(partnerId, {
          partnerId,
          partner,
          lastMessage: message,
          unreadCount: 0,
          totalMessages: 0
        });
      }
      
      const conversation = conversationsMap.get(partnerId);
      conversation.totalMessages++;
      
      // Count unread messages (received by current user and not read)
      if (message.receiver_id === req.user.userId && !message.is_read) {
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

    const { error } = await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('id', messageId)
      .eq('receiver_id', req.user.userId); // Only mark as read if current user is receiver

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

    // Verify receiver exists
    const { data: receiver, error: receiverError } = await supabase
      .from('users')
      .select('id, first_name, last_name, email, role')
      .eq('id', receiverId)
      .single();

    if (receiverError || !receiver) {
      return res.status(404).json({ success: false, message: 'Receiver not found' });
    }

    // Store message in database
    const { data: newMessage, error: messageError } = await supabase
      .from('messages')
      .insert({
        sender_id: req.user.userId,
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
        created_at,
        sender:sender_id(first_name, last_name, email),
        receiver:receiver_id(first_name, last_name, email)
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

export default router;