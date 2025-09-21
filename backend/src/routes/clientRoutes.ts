import { Router } from 'express';
import { supabase } from '../lib/supabase';
import { coachService } from '../services/coachService';
import { coachSearchService } from '../services/coachSearchService';
import { authenticate } from '../middleware/auth';
import { validationResult, body } from 'express-validator';
import { Request, Response } from 'express';
import { uploadAttachment, uploadToSupabase } from '../middleware/upload';
import { createVideoSDKMeeting } from '../services/videoSDKService';
import { PaymentServiceV2 } from '../services/paymentServiceV2';
import path from 'path';

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
        availability: clientProfile.availability_options || [],
        therapistGender: clientProfile.preferred_coach_gender,
        bio: clientProfile.bio,
        profilePhoto: clientProfile.profile_photo || '',
        // Notification preferences
        notificationPreferences: clientProfile.notification_preferences || {},
        // Keep legacy format for compatibility
        preferences: {
          location: clientProfile.location_state,
          genderIdentity: clientProfile.gender_identity,
          ethnicIdentity: clientProfile.ethnic_identity,
          religiousBackground: clientProfile.religious_background,
          language: clientProfile.preferred_language,
          areaOfConcern: clientProfile.areas_of_concern || [],
          availability: clientProfile.availability_options || [],
          therapistGender: clientProfile.preferred_coach_gender,
        },
        created_at: clientProfile.created_at
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
  body('availability_options').optional().isArray(),
  body('therapistGender').optional().isString(),
  body('bio').optional().isString(),
  body('profilePhoto').optional().isString(),
  // Notification preferences
  body('emailNotifications').optional().isBoolean(),
  body('smsNotifications').optional().isBoolean(),
  body('pushNotifications').optional().isBoolean(),
  body('soundNotifications').optional().isBoolean(),
  body('messageNotifications').optional().isBoolean(),
  body('appointmentNotifications').optional().isBoolean(),
  body('appointmentReminders').optional().isBoolean(),
  body('marketingEmails').optional().isBoolean(),
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
          if (req.body.availability_options !== undefined) updateData.availability_options = req.body.availability_options
    if (req.body.therapistGender !== undefined) updateData.preferred_coach_gender = req.body.therapistGender
    if (req.body.bio !== undefined) updateData.bio = req.body.bio
    if (req.body.profilePhoto !== undefined) updateData.profile_photo = req.body.profilePhoto

    // Notification preferences - store as JSON object
    const notificationPrefs: any = {}
    let hasNotificationPrefs = false

    if (req.body.emailNotifications !== undefined) {
      notificationPrefs.emailNotifications = req.body.emailNotifications
      hasNotificationPrefs = true
    }
    if (req.body.smsNotifications !== undefined) {
      notificationPrefs.smsNotifications = req.body.smsNotifications
      hasNotificationPrefs = true
    }
    if (req.body.pushNotifications !== undefined) {
      notificationPrefs.pushNotifications = req.body.pushNotifications
      hasNotificationPrefs = true
    }
    if (req.body.soundNotifications !== undefined) {
      notificationPrefs.soundNotifications = req.body.soundNotifications
      hasNotificationPrefs = true
    }
    if (req.body.messageNotifications !== undefined) {
      notificationPrefs.messageNotifications = req.body.messageNotifications
      hasNotificationPrefs = true
    }
    if (req.body.appointmentNotifications !== undefined) {
      notificationPrefs.appointmentNotifications = req.body.appointmentNotifications
      hasNotificationPrefs = true
    }
    if (req.body.appointmentReminders !== undefined) {
      notificationPrefs.appointmentReminders = req.body.appointmentReminders
      hasNotificationPrefs = true
    }
    if (req.body.marketingEmails !== undefined) {
      notificationPrefs.marketingEmails = req.body.marketingEmails
      hasNotificationPrefs = true
    }

    // If notification preferences are being updated, merge with existing preferences
    if (hasNotificationPrefs) {
      const existingPrefs = clientProfile.notification_preferences || {}
      updateData.notification_preferences = { ...existingPrefs, ...notificationPrefs }
    }

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

// Submit a review for a completed session
router.post('/client/reviews', [
  authenticate,
  body('sessionId').isUUID().withMessage('sessionId is required'),
  body('coachId').isUUID().withMessage('coachId is required'),
  body('rating').isInt({ min: 1, max: 5 }).withMessage('rating must be 1-5'),
  body('comment').optional().isString(),
], async (req: Request & { user?: any }, res: Response) => {
  try {
    if (!req.user || req.user.role !== 'client') {
      return res.status(403).json({ success: false, message: 'Access denied. Client role required.' });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { sessionId, coachId, rating, comment } = req.body;

    // Verify session belongs to this client, matches coach, and is completed
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .select('id, client_id, coach_id, status')
      .eq('id', sessionId)
      .single();

    if (sessionError || !session) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }

    if (session.client_id !== req.user.userId) {
      return res.status(403).json({ success: false, message: 'You can only review your own sessions' });
    }

    if (session.coach_id !== coachId) {
      return res.status(400).json({ success: false, message: 'Coach does not match session' });
    }

    if (session.status !== 'completed') {
      return res.status(400).json({ success: false, message: 'Only completed sessions can be reviewed' });
    }

    // Prevent duplicate review for the same session by same client
    const { data: existing } = await supabase
      .from('reviews')
      .select('id')
      .eq('session_id', sessionId)
      .eq('client_id', req.user.userId)
      .maybeSingle();

    if (existing) {
      // Update existing review instead of failing
      const { data: updatedReview, error: updateReviewError } = await supabase
        .from('reviews')
        .update({ rating, comment: comment || null })
        .eq('id', (existing as any).id)
        .select('*')
        .single();

      if (updateReviewError) {
        throw updateReviewError;
      }

      // Recompute coach average rating
      const { data: agg2, error: avgError2 } = await supabase
        .from('reviews')
        .select('rating')
        .eq('coach_id', coachId);
      if (!avgError2 && agg2) {
        const ratings2 = (agg2 as any[]).map(r => Number(r.rating) || 0).filter(n => n > 0);
        const avg2 = ratings2.length > 0 ? Number((ratings2.reduce((a, b) => a + b, 0) / ratings2.length).toFixed(2)) : rating;
        await supabase
          .from('coaches')
          .update({ rating: avg2 })
          .eq('id', coachId);
      }

      return res.json({ success: true, data: updatedReview });
    }

    // Insert review
    const { data: review, error: reviewError } = await supabase
      .from('reviews')
      .insert({
        session_id: sessionId,
        client_id: req.user.userId,
        coach_id: coachId,
        rating,
        comment: comment || null,
      })
      .select('*')
      .single();

    if (reviewError) {
      throw reviewError;
    }

    // Update coach aggregate rating (average) on coaches table
    const { data: agg, error: avgError } = await supabase
      .from('reviews')
      .select('rating')
      .eq('coach_id', coachId);

    if (!avgError && agg) {
      const ratings = (agg as any[]).map(r => Number(r.rating) || 0).filter(n => n > 0);
      const avg = ratings.length > 0 ? Number((ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(2)) : rating;
      await supabase
        .from('coaches')
        .update({ rating: avg })
        .eq('id', coachId);
    }

    res.json({ success: true, data: review });
  } catch (error: any) {
    console.error('Create review error:', error);
    res.status(500).json({ success: false, message: 'Failed to submit review' });
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
          email
        )
      `)
      .eq('client_id', clientProfile.id)
      .order('starts_at', { ascending: true });

    // Apply filters
    const now = new Date().toISOString();
    if (filter === 'upcoming') {
      query = query.gte('starts_at', now).in('status', ['scheduled', 'confirmed']);
    } else if (filter === 'past') {
      // Only show completed sessions
      query = query.eq('status', 'completed');
    } else if (filter === 'pending') {
      query = query.eq('status', 'scheduled');
    } else if (filter === 'all') {
      // No additional filtering - show all appointments
    }

    const { data: appointments, error: appointmentsError } = await query;

    if (appointmentsError) {
      throw appointmentsError;
    }

    // Ensure upcoming confirmed appointments have meeting IDs
    if (appointments) {
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
          console.log(`Created meeting ID ${meetingData.meetingId} for appointment ${appointment.id}`)
        } catch (error) {
          console.error(`Failed to create meeting ID for appointment ${appointment.id}:`, error)
        }
      }
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

// Check client-coach history for rating permission
router.get('/client/:clientId/coaches/:coachId/history', authenticate, async (req: Request & { user?: any }, res: Response) => {
  try {
    const { clientId, coachId } = req.params;

    // Verify the authenticated user matches the clientId
    if (!req.user || req.user.userId !== clientId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only check your own history.'
      });
    }

    // Check the sessions table for completed sessions
    const { data: sessions, error: sessionsError } = await supabase
      .from('sessions')
      .select('id, status')
      .eq('client_id', clientId)
      .eq('coach_id', coachId)
      .eq('status', 'completed');

    if (sessionsError && sessionsError.code !== 'PGRST116') {
      throw sessionsError;
    }

    const hasHistory = sessions && sessions.length > 0;

    // Check if the client has already rated this coach
    const { data: existingReview, error: reviewError } = await supabase
      .from('reviews')
      .select('id, rating, comment')
      .eq('client_id', clientId)
      .eq('coach_id', coachId)
      .single();

    if (reviewError && reviewError.code !== 'PGRST116') {
      throw reviewError;
    }

    res.json({
      success: true,
      hasHistory,
      hasRated: !!existingReview,
      completedSessions: sessions?.length || 0,
      review: existingReview || null
    });
  } catch (error) {
    console.error('Check client-coach history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check history'
    });
  }
});

// Get coach rating statistics
router.get('/client/coaches/:coachId/ratings', authenticate, async (req: Request & { user?: any }, res: Response) => {
  try {
    const { coachId } = req.params;

    // Get coach rating from coaches table
    const { data: coach, error: coachError } = await supabase
      .from('coaches')
      .select('rating')
      .eq('id', coachId)
      .single();

    if (coachError) {
      throw coachError;
    }

    // Get total reviews count
    const { data: reviews, error: reviewsError } = await supabase
      .from('reviews')
      .select('rating')
      .eq('coach_id', coachId);

    if (reviewsError) {
      throw reviewsError;
    }

    const totalReviews = reviews ? reviews.length : 0;
    const averageRating = coach?.rating || 0;

    res.json({
      success: true,
      averageRating,
      totalReviews
    });
  } catch (error) {
    console.error('Get coach ratings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get ratings'
    });
  }
});

// Submit/Update rating for a coach
router.post('/client/coaches/:coachId/ratings', [
  authenticate,
  body('clientId').isUUID().withMessage('clientId is required'),
  body('sessionId').optional().isUUID().withMessage('sessionId must be a valid UUID'),
  body('rating').isInt({ min: 1, max: 5 }).withMessage('rating must be 1-5'),
  body('comment').optional().isString(),
], async (req: Request & { user?: any }, res: Response) => {
  try {
    if (!req.user || req.user.role !== 'client') {
      return res.status(403).json({ success: false, message: 'Access denied. Client role required.' });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { coachId } = req.params;
    const { clientId, sessionId, rating, comment } = req.body;

    // Verify the authenticated user matches the clientId
    if (req.user.userId !== clientId) {
      return res.status(403).json({ success: false, message: 'Access denied. You can only submit your own ratings.' });
    }

    // Check if client has completed sessions with this coach
    const { data: sessions, error: sessionsError } = await supabase
      .from('sessions')
      .select('id, status')
      .eq('client_id', clientId)
      .eq('coach_id', coachId)
      .eq('status', 'completed');

    if (sessionsError) {
      throw sessionsError;
    }

    if (!sessions || sessions.length === 0) {
      return res.status(400).json({ success: false, message: 'You can only rate coaches after completing a session with them.' });
    }

    // If no session ID provided, use the most recent completed session
    let validSessionId = sessionId;
    if (!validSessionId) {
      // Use the first (most recent) completed session
      validSessionId = sessions[0].id;
    } else {
      // Validate the provided session ID
      const validSession = sessions.find(s => s.id === sessionId);
      if (!validSession) {
        return res.status(400).json({ success: false, message: 'Invalid session ID or session not completed.' });
      }
    }

    // Check if rating already exists
    const { data: existingReview, error: existingError } = await supabase
      .from('reviews')
      .select('id')
      .eq('client_id', clientId)
      .eq('coach_id', coachId)
      .single();

    if (existingError && existingError.code !== 'PGRST116') {
      throw existingError;
    }

    let review;
    if (existingReview) {
      // Update existing review
      const { data: updatedReview, error: updateError } = await supabase
        .from('reviews')
        .update({ rating, comment: comment || null })
        .eq('id', existingReview.id)
        .select('*')
        .single();

      if (updateError) {
        throw updateError;
      }
      review = updatedReview;
    } else {
      // Create new review
      const { data: newReview, error: insertError } = await supabase
        .from('reviews')
        .insert({
          client_id: clientId,
          coach_id: coachId,
          session_id: validSessionId,
          rating,
          comment: comment || null,
        })
        .select('*')
        .single();

      if (insertError) {
        throw insertError;
      }
      review = newReview;
    }

    // Update coach aggregate rating
    const { data: allReviews, error: avgError } = await supabase
      .from('reviews')
      .select('rating')
      .eq('coach_id', coachId);

    if (!avgError && allReviews) {
      const ratings = allReviews.map(r => Number(r.rating) || 0).filter(n => n > 0);
      const avg = ratings.length > 0 ? Number((ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(2)) : rating;
      await supabase
        .from('coaches')
        .update({ rating: avg })
        .eq('id', coachId);
    }

    res.json({ success: true, data: review });
  } catch (error: any) {
    console.error('Submit rating error:', error);
    res.status(500).json({ success: false, message: 'Failed to submit rating' });
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
          email,
          bio,
          specialties,
          languages,
          hourly_rate,
          experience,
          rating,
          is_available,
          profile_photo,
          created_at
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
        profilePhoto: coach.profile_photo || '',
        email: coach.email || null
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

    console.log('📋 Loading all available coaches...');
    
    // Use the enhanced search service
    const coaches = await coachSearchService.getAllCoaches();

    // Set a default match score for all coaches when not searching
    const formattedCoaches = coaches.map(coach => ({
      ...coach,
      matchScore: 50 // Default score when browsing all coaches
    }));

    console.log(`✅ Returned ${formattedCoaches.length} coaches`);

    res.json({
      success: true,
      data: formattedCoaches
    });
  } catch (error) {
    console.error('❌ Get coaches error:', error);
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
    console.log('🔍 Search coaches request received:', { 
      user: req.user?.email, 
      preferences: req.body.preferences 
    });

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

    // Use the enhanced search service
    const searchResults = await coachSearchService.searchCoaches(preferences);

    console.log(`✅ Search completed: ${searchResults.length} matches found`);

    // Store search history for analytics (optional)
    try {
      const { data: clientProfile } = await supabase
        .from('clients')
        .select('id')
        .eq('id', req.user.userId)
        .single();

      if (clientProfile) {
        await supabase
          .from('search_history')
          .insert({
            client_id: clientProfile.id,
            query: JSON.stringify(preferences),
            search_criteria: preferences,
            results_count: searchResults.length
          });
      }
    } catch (historyError) {
      // Don't fail the search if we can't store history
      console.log('⚠️ Could not store search history:', historyError);
    }

    res.json({
      success: true,
      data: searchResults
    });
  } catch (error) {
    console.error('❌ Search coaches error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to search coaches',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Book appointment with coach
router.post('/client/book-appointment', [
  authenticate,
  body('coachId').notEmpty().withMessage('Coach ID is required'),
  body('scheduledAt').isISO8601().withMessage('Valid scheduled date/time is required'),
  body('sessionType').isIn(['consultation', 'session']).withMessage('Session type must be consultation or session'),
  body('notes').optional().isLength({ max: 500 }).withMessage('Notes must be less than 500 characters'),
  body('areaOfFocus').optional().isString(),
  body('paymentId').optional().isString().withMessage('Payment ID must be a string'),
  body('isInstantBooking').optional().isBoolean().withMessage('Is instant booking must be a boolean')
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

    const { coachId, scheduledAt, sessionType, notes, areaOfFocus, paymentId, isInstantBooking } = req.body;

    // Get client profile
    const { data: clientProfile, error: clientError } = await supabase
      .from('clients')
      .select('id, first_name, last_name')
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

    // Create VideoSDK meeting for the session
    let meetingId = null;
    
    try {
      const videoSDKMeeting = await createVideoSDKMeeting();
      meetingId = videoSDKMeeting.meetingId;
      console.log('Created VideoSDK meeting:', meetingId);
    } catch (error) {
      console.error('Failed to create VideoSDK meeting:', error);
      throw new Error('Unable to create video meeting room. Please try again.');
    }
    
    // Create the session with all fields matching the database schema
    const sessionData: any = {
      client_id: clientProfile.id,
      coach_id: coachId,
      starts_at: startTime,
      ends_at: endTime,
      status: 'scheduled',
      notes: notes || '',
      area_of_focus: areaOfFocus || null,
      meeting_id: meetingId, // VideoSDK meeting ID (required)
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    console.log('Inserting session with data (without payment_id):', sessionData);

    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .insert(sessionData)
      .select()
      .single();

    console.log('Session insert result:', { session, sessionError });

    if (sessionError) {
      throw sessionError;
    }

    // Handle payment if paymentId is provided
    if (paymentId) {
      try {
        const paymentService = new PaymentServiceV2();

        // Update payment record with session_id
        const { error: paymentUpdateError } = await supabase
          .from('payments')
          .update({ session_id: session.id })
          .eq('id', paymentId);

        if (paymentUpdateError) {
          console.error('Failed to update payment with session_id:', paymentUpdateError);
        }

        // For instant bookings, capture the payment immediately
        // For scheduled bookings, payment will be captured after session completion
        if (isInstantBooking) {
          try {
            await paymentService.capturePayment(paymentId);
            console.log('Payment captured for instant booking:', paymentId);
          } catch (captureError) {
            console.error('Failed to capture payment for instant booking:', captureError);
            // Don't fail the booking if payment capture fails
          }
        }
      } catch (error) {
        console.error('Payment handling error:', error);
        // Don't fail the booking if payment handling fails
      }
    }

    // Emit WebSocket event for new appointment
    const io = req.app.get('io');
    if (io) {
      const appointmentData = {
        sessionId: session.id,
        scheduledAt: session.starts_at,
        coachName: `${coach.first_name} ${coach.last_name}`,
        clientName: `${clientProfile.first_name} ${clientProfile.last_name}`,
        format: 'virtual',
        meetingId: session.meeting_id,
        duration: duration,
        status: 'scheduled',
        sessionType: sessionType,
        areaOfFocus: areaOfFocus,
        notes: notes
      };

      // Notify coach about new appointment
      io.to(`user:${coachId}`).emit('appointment:new', {
        ...appointmentData,
        clientId: clientProfile.id,
        type: 'new_booking'
      });

      // Notify client about successful booking
      io.to(`user:${clientProfile.id}`).emit('appointment:booked', {
        ...appointmentData,
        coachId: coachId,
        type: 'booking_confirmed'
      });
    }

    res.json({
      success: true,
      message: 'Session scheduled successfully',
      data: {
        sessionId: session.id,
        scheduledAt: session.starts_at,
        coachName: `${coach.first_name} ${coach.last_name}`,
        format: 'virtual', // All sessions are virtual/online
        meetingId: session.meeting_id,
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
      .select('id, first_name, last_name')
      .eq('id', req.user.userId)
      .single();

    if (clientError || !clientProfile) {
      return res.status(404).json({ success: false, message: 'Client profile not found' });
    }

    // Verify this is the client's appointment and get related names
    const { data: appointment, error: appointmentError } = await supabase
      .from('sessions')
      .select(`
        *,
        coaches (
          id,
          first_name,
          last_name,
          email
        )
      `)
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

    // Emit WebSocket event for rescheduled appointment
    const io = req.app.get('io');
    if (io) {
      const clientName = `${clientProfile.first_name} ${clientProfile.last_name}`;
      const coachName = `${appointment.coaches.first_name} ${appointment.coaches.last_name}`;
      
      const notificationData = {
        id: updatedAppointment.id,
        old_starts_at: appointment.starts_at,
        new_starts_at: updatedAppointment.starts_at,
        client_id: clientProfile.id,
        coach_id: appointment.coach_id,
        client_name: clientName,
        coach_name: coachName,
        rescheduled_by: 'client',
        reason: ''
      };

      // Notify coach about rescheduled appointment
      io.to(`user:${appointment.coach_id}`).emit('appointment:rescheduled', notificationData);

      // Notify admin about reschedule
      io.to('admin:notifications').emit('admin:appointment_rescheduled', {
        ...notificationData,
        updated_at: new Date().toISOString()
      });

      // Don't send notification to client since they initiated it
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
      .select('id, first_name, last_name')
      .eq('id', req.user.userId)
      .single();

    if (clientError || !clientProfile) {
      return res.status(404).json({ success: false, message: 'Client profile not found' });
    }

    // Verify this is the client's appointment and get related names
    const { data: appointment, error: appointmentError } = await supabase
      .from('sessions')
      .select(`
        *,
        coaches (
          id,
          first_name,
          last_name,
          email
        )
      `)
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

    // Handle payment cancellation if payment exists
    if (appointment.payment_id) {
      const paymentService = require('../services/paymentServiceV2').PaymentServiceV2;
      const paymentHandler = new paymentService();

      try {
        // Release the payment hold when client cancels
        await paymentHandler.cancelAuthorization(appointment.payment_id, reason || 'Client cancelled the appointment');
        console.log(`Payment authorization cancelled for appointment ${id}`);
      } catch (paymentError) {
        console.error(`Payment cancellation error for appointment ${id}:`, paymentError);
        // Log the error but don't fail the appointment cancellation
      }
    }

    // Emit WebSocket event for cancelled appointment
    const io = req.app.get('io');
    if (io) {
      const clientName = `${clientProfile.first_name} ${clientProfile.last_name}`;
      const coachName = `${appointment.coaches.first_name} ${appointment.coaches.last_name}`;
      
      const notificationData = {
        id: updatedAppointment.id,
        starts_at: appointment.starts_at,
        client_id: clientProfile.id,
        coach_id: appointment.coach_id,
        client_name: clientName,
        coach_name: coachName,
        cancelled_by: 'client',
        reason: reason || ''
      };

      // Notify coach about cancelled appointment
      io.to(`user:${appointment.coach_id}`).emit('appointment:cancelled', notificationData);

      // Notify admin about cancellation
      io.to('admin:notifications').emit('admin:appointment_cancelled', {
        ...notificationData,
        updated_at: new Date().toISOString()
      });

      // Don't send notification to client since they initiated it
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
    const { coachId, message, appointmentId } = req.body;

    // Get client profile by email first
    const { data: clientProfile, error: clientError } = await supabase
      .from('clients')
      .select('id, first_name, last_name')
      .ilike('email', req.user.email)
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
        recipient_id: coach.id,
        session_id: appointmentId || null,
        body: message
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
        subject: null,
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
    const { page = 1, limit = 50, conversation_with } = req.query as any;
    const offset = (Number(page) - 1) * Number(limit);

    // Get client profile by email first
    const { data: clientProfile, error: clientError } = await supabase
      .from('clients')
      .select('id')
      .ilike('email', req.user.email)
      .single();

    if (clientError || !clientProfile) {
      return res.status(404).json({ success: false, message: 'Client profile not found' });
    }

    const clientId = clientProfile.id;
    const partnerId = conversation_with as string | undefined;

    let query = supabase
      .from('messages')
      .select('id, sender_id, recipient_id, body, created_at, read_at, attachment_url, attachment_name, attachment_size, attachment_type, deleted_for_everyone, deleted_at, hidden_for_users')
      .order('created_at', { ascending: true });

    if (partnerId) {
      query = query.or(
        `and(sender_id.eq.${clientId},recipient_id.eq.${partnerId}),and(sender_id.eq.${partnerId},recipient_id.eq.${clientId})`
      );
    } else {
      query = query.or(`sender_id.eq.${clientId},recipient_id.eq.${clientId}`);
    }

    const { data: messages, error: messagesError, count } = await query.range(offset, offset + Number(limit) - 1) as any;
    if (messagesError) throw messagesError;

    // Filter out messages hidden for this user
    const filteredMessages = messages?.filter((message: any) => {
      return !message.hidden_for_users?.includes(clientId);
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

// Get client conversations (unique participants)
router.get('/client/conversations', authenticate, async (req: Request & { user?: any }, res: Response) => {
  try {
    // Get client profile by email first
    const { data: clientProfile, error: clientError } = await supabase
      .from('clients')
      .select('id')
      .ilike('email', req.user.email)
      .single();

    if (clientError || !clientProfile) {
      return res.status(404).json({ success: false, message: 'Client profile not found' });
    }

    const clientId = clientProfile.id;
    const { data: messages, error: messagesError } = await supabase
      .from('messages')
      .select('id, sender_id, recipient_id, body, created_at, read_at, attachment_url, attachment_name, attachment_size, attachment_type, deleted_for_everyone, deleted_at, hidden_for_users')
      .or(`sender_id.eq.${clientId},recipient_id.eq.${clientId}`)
      .order('created_at', { ascending: false });

    if (messagesError) throw messagesError;

    type Conv = { partnerId: string; lastMessage: any; unreadCount: number; totalMessages: number };
    const conversationsMap = new Map<string, Conv>();

    for (const message of messages || []) {
      // Skip messages hidden for this user
      if (message.hidden_for_users?.includes(clientId)) {
        continue;
      }

      const partnerId = message.sender_id === clientId ? message.recipient_id : message.sender_id;
      const key = partnerId;
      const existing = conversationsMap.get(key);
      const isUnread = message.recipient_id === clientId && !message.read_at;
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

// Mark messages as read
router.put('/client/messages/:messageId/read', authenticate, async (req: Request & { user?: any }, res: Response) => {
  try {
    const { messageId } = req.params;

    // Get client profile by email first
    const { data: clientProfile, error: clientError } = await supabase
      .from('clients')
      .select('id')
      .ilike('email', req.user.email)
      .single();

    if (clientError || !clientProfile) {
      return res.status(404).json({ success: false, message: 'Client profile not found' });
    }

    const { error } = await supabase
      .from('messages')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('id', messageId)
      .eq('recipient_id', clientProfile.id); // Only mark as read if current user is recipient

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
  body('body').notEmpty().withMessage('Message body is required')
], async (req: Request & { user?: any }, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { receiverId, body: bodyText, sessionId } = req.body;

    // Get client profile by email first
    const { data: clientProfile, error: clientError } = await supabase
      .from('clients')
      .select('id, first_name, last_name')
      .ilike('email', req.user.email)
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
        recipient_id: receiverId,
        session_id: sessionId || null,
        body: bodyText
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
        sender_id: clientProfile.id,
        recipient_id: receiverId,
        sender_name: `${clientProfile.first_name} ${clientProfile.last_name}`
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
      .ilike('email', req.user.email)
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
        starts_at,
        ends_at,
        status,
        session_type,
        duration,
        coach_id
      `)
      .eq('client_id', clientId)
      .order('starts_at', { ascending: false })
      .limit(5);

    if (sessionsError) {
      console.error('Sessions query error:', sessionsError);
    }

    // Get recent messages - we'll need to handle the relationship logic in the processing
    const { data: recentMessages, error: messagesError } = await supabase
      .from('messages')
      .select(`
        id,
        body,
        created_at,
        sender_id,
        recipient_id
      `)
      .or(`sender_id.eq.${clientId},recipient_id.eq.${clientId}`)
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
          subtitle: `${session.session_type || 'Coaching'} session - ${session.status}`,
          date: session.starts_at,
          time: new Date(session.starts_at).toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
          }),
          timestamp: new Date(session.starts_at).getTime(),
          data: session
        });
      }
    }

    // Add messages
    if (recentMessages) {
      for (const message of recentMessages) {
        let partnerName = 'Unknown User';
        const partnerId = message.sender_id === clientId ? message.recipient_id : message.sender_id;
        
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
          subtitle: (message.body || '').substring(0, 50) + ((message.body || '').length > 50 ? '...' : ''),
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

// Upload attachment endpoint
router.post('/client/upload-attachment', authenticate, uploadAttachment.single('attachment'), async (req: Request & { user?: any }, res: Response) => {
  try {
    if (!req.user || req.user.role !== 'client') {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. Client role required.' 
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    // Get client profile to get user ID
    const { data: clientProfile, error: clientError } = await supabase
      .from('clients')
      .select('id')
      .ilike('email', req.user.email)
      .single();

    if (clientError || !clientProfile) {
      return res.status(404).json({ success: false, message: 'Client profile not found' });
    }

    // Upload file to Supabase Storage
    const uploadResult = await uploadToSupabase(req.file, clientProfile.id);

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
router.delete('/client/messages/:messageId/everyone', authenticate, async (req: Request & { user?: any }, res: Response) => {
  try {
    if (!req.user || req.user.role !== 'client') {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. Client role required.' 
      });
    }

    const { messageId } = req.params;

    // Get client profile
    const { data: clientProfile, error: clientError } = await supabase
      .from('clients')
      .select('id')
      .ilike('email', req.user.email)
      .single();

    if (clientError || !clientProfile) {
      return res.status(404).json({ success: false, message: 'Client profile not found' });
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

    if (message.sender_id !== clientProfile.id) {
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
        deletedBy: clientProfile.id 
      });
      io.to(`user:${clientProfile.id}`).emit('message:deleted_everyone', { 
        messageId,
        deletedBy: clientProfile.id 
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
router.put('/client/messages/:messageId/hide', authenticate, async (req: Request & { user?: any }, res: Response) => {
  try {
    if (!req.user || req.user.role !== 'client') {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. Client role required.' 
      });
    }

    const { messageId } = req.params;

    // Get client profile
    const { data: clientProfile, error: clientError } = await supabase
      .from('clients')
      .select('id')
      .ilike('email', req.user.email)
      .single();

    if (clientError || !clientProfile) {
      return res.status(404).json({ success: false, message: 'Client profile not found' });
    }

    // Add user to hidden_for_users array using PostgreSQL array append
    const { error: hideError } = await supabase
      .rpc('add_user_to_hidden_array', {
        message_id: messageId,
        user_id: clientProfile.id
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

// Delete conversation endpoint
router.delete('/client/conversations/:partnerId', authenticate, async (req: Request & { user?: any }, res: Response) => {
  try {
    if (!req.user || req.user.role !== 'client') {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. Client role required.' 
      });
    }

    const { partnerId } = req.params;

    // Get client profile by email first
    const { data: clientProfile, error: clientError } = await supabase
      .from('clients')
      .select('id')
      .ilike('email', req.user.email)
      .single();

    if (clientError || !clientProfile) {
      return res.status(404).json({ success: false, message: 'Client profile not found' });
    }

    const clientId = clientProfile.id;

    // Soft delete: Hide conversation for this client only
    // Add the client's ID to the hidden_for_users array for all messages in the conversation
    const { error: updateError } = await supabase
      .rpc('append_hidden_user', {
        user_id: clientId,
        partner_id: partnerId
      });

    if (updateError) {
      // Fallback to manual update if RPC doesn't exist
      const { data: messages } = await supabase
        .from('messages')
        .select('id, hidden_for_users')
        .or(`and(sender_id.eq.${clientId},recipient_id.eq.${partnerId}),and(sender_id.eq.${partnerId},recipient_id.eq.${clientId})`)
        .not('hidden_for_users', 'cs', `{${clientId}}`);

      if (messages) {
        for (const message of messages) {
          const updatedHidden = [...(message.hidden_for_users || []), clientId];
          await supabase
            .from('messages')
            .update({ hidden_for_users: updatedHidden })
            .eq('id', message.id);
        }
      }
    }

    // No WebSocket event needed - conversation is only hidden for the deleting user
    console.log(`Conversation hidden for client ${clientId} with partner ${partnerId}`);
    
    // Optional: Clean up completely deleted conversations (where both users have hidden it)
    // This could be done in a background job instead
    setTimeout(async () => {
      try {
        const { error: cleanupError } = await supabase
          .from('messages')
          .delete()
          .or(`and(sender_id.eq.${clientId},recipient_id.eq.${partnerId}),and(sender_id.eq.${partnerId},recipient_id.eq.${clientId})`)
          .contains('hidden_for_users', [clientId, partnerId]); // Both users have hidden it
        
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

export default router;