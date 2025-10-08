import { Router, Request, Response } from 'express'
import { authenticate } from '../middleware/auth'
import { JWTPayload } from '../types/auth'

interface AuthRequest extends Request {
  user?: JWTPayload;
}
import { 
  createVideoSDKMeeting, 
  generateParticipantToken,
  validateVideoSDKMeeting,
  endVideoSDKMeeting
} from '../services/videoSDKService'
import { supabase } from '../lib/supabase'

const router = Router()

/**
 * Generate VideoSDK token for a participant
 */
router.post('/generate-token', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { appointmentId, role } = req.body
    const userId = req.user?.userId

    if (!appointmentId || !role) {
      return res.status(400).json({
        success: false,
        message: 'Appointment ID and role are required'
      })
    }

    // Verify user has access to this appointment
    const { data: appointment, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('id', appointmentId)
      .or(`client_id.eq.${userId},coach_id.eq.${userId}`)
      .single()

    if (error || !appointment) {
      return res.status(403).json({
        success: false,
        message: 'Access denied or appointment not found'
      })
    }

    // Generate token with appropriate permissions
    const isHost = role === 'coach' || appointment.coach_id === userId
    const token = generateParticipantToken(
      ['allow_join'],
      isHost ? 'host' : 'participant'
    )

    res.json({
      success: true,
      token
    })
  } catch (error: any) {
    console.error('Error generating VideoSDK token:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to generate meeting token'
    })
  }
})

/**
 * Create or get meeting room for an appointment
 */
router.post('/create-or-get', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { appointmentId, isHost } = req.body
    const userId = req.user?.userId

    console.log('Meeting join request:', { appointmentId, isHost, userId, userRole: req.user?.role })

    if (!appointmentId || !userId) {
      return res.status(400).json({
        success: false,
        message: 'Appointment ID and user ID are required'
      })
    }

    // Check if user is already in an active meeting
    const existingMeeting = activeMeetings.get(userId)
    if (existingMeeting) {
      // Clean up stale entries (older than 4 hours)
      const fourHoursAgo = Date.now() - (4 * 60 * 60 * 1000)
      if (existingMeeting.timestamp < fourHoursAgo) {
        console.log(`Cleaning up stale meeting entry for user ${userId}`)
        activeMeetings.delete(userId)
      } else if (existingMeeting.appointmentId !== appointmentId) {
        // User is trying to join a different meeting while already in one
        console.log(`User ${userId} already in meeting ${existingMeeting.meetingId} (appointment ${existingMeeting.appointmentId}), denying join to appointment ${appointmentId}`)
        return res.status(409).json({
          success: false,
          message: 'You are already in another meeting. Please leave your current meeting before joining a new one.',
          conflictType: 'ALREADY_IN_MEETING',
          currentMeetingId: existingMeeting.meetingId,
          currentAppointmentId: existingMeeting.appointmentId
        })
      }
    }

    // Debug: Log the query parameters
    console.log('DEBUG: Meeting access check parameters:', {
      appointmentId,
      userId,
      userRole: req.user?.role,
      isHost,
      query: `client_id.eq.${userId},coach_id.eq.${userId}`
    })

    // Verify user has access to this appointment
    const { data: appointment, error: appointmentError } = await supabase
      .from('sessions')
      .select('*')
      .eq('id', appointmentId)
      .or(`client_id.eq.${userId},coach_id.eq.${userId}`)
      .single()

    console.log('DEBUG: Appointment query result:', { 
      appointment: appointment ? { 
        id: appointment.id, 
        client_id: appointment.client_id, 
        coach_id: appointment.coach_id, 
        meeting_id: appointment.meeting_id,
        status: appointment.status,
        starts_at: appointment.starts_at,
        ends_at: appointment.ends_at
      } : null, 
      appointmentError,
      errorDetails: appointmentError?.details,
      errorHint: appointmentError?.hint,
      errorMessage: appointmentError?.message
    })

    // If appointment not found, let's try a broader query to see if the appointment exists at all
    if (appointmentError || !appointment) {
      console.log('DEBUG: Appointment not found with user access, checking if appointment exists at all...')
      const { data: anyAppointment, error: anyError } = await supabase
        .from('sessions')
        .select('*')
        .eq('id', appointmentId)
        .single()

      console.log('DEBUG: Any appointment with this ID:', {
        exists: !!anyAppointment,
        appointment: anyAppointment ? {
          id: anyAppointment.id,
          client_id: anyAppointment.client_id,
          coach_id: anyAppointment.coach_id,
          status: anyAppointment.status
        } : null,
        error: anyError?.message
      })
    }

    if (appointmentError || !appointment) {
      console.error('Access denied - appointment not found or no access:', { appointmentError, userId, appointmentId })
      return res.status(403).json({
        success: false,
        message: 'Access denied or appointment not found'
      })
    }

    let meetingId = appointment.meeting_id

    // Create new VideoSDK meeting if none exists
    if (!meetingId) {
      try {
        const meetingData = await createVideoSDKMeeting()
        meetingId = meetingData.meetingId

        // Update appointment with meeting ID
        const { error: updateError } = await supabase
          .from('sessions')
          .update({ meeting_id: meetingId })
          .eq('id', appointmentId)

        if (updateError) {
          console.error('Error updating appointment with meeting ID:', updateError)
        }
      } catch (createError) {
        console.error('Error creating VideoSDK meeting:', createError)
        return res.status(500).json({
          success: false,
          message: 'Failed to create meeting room'
        })
      }
    }

    // Generate token for this participant
    const userIsHost = isHost || appointment.coach_id === userId
    const token = generateParticipantToken(
      ['allow_join'],
      userIsHost ? 'host' : 'participant'
    )

    // Track this user as being in this meeting
    activeMeetings.set(userId, {
      meetingId,
      appointmentId,
      timestamp: Date.now()
    })

    console.log(`User ${userId} joined meeting ${meetingId} for appointment ${appointmentId}`)

    res.json({
      success: true,
      meetingId,
      token
    })
  } catch (error: any) {
    console.error('Error creating/getting meeting:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to create or get meeting'
    })
  }
})

/**
 * Validate meeting before joining
 */
router.get('/validate/:meetingId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { meetingId } = req.params
    const isValid = await validateVideoSDKMeeting(meetingId)

    res.json({
      success: true,
      isValid
    })
  } catch (error: any) {
    console.error('Error validating meeting:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to validate meeting'
    })
  }
})

/**
 * End meeting (host only)
 */
router.post('/end/:meetingId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { meetingId } = req.params
    const userId = req.user?.userId

    // Verify user is the host of this meeting
    const { data: appointment, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('meeting_id', meetingId)
      .eq('coach_id', userId)
      .single()

    if (error || !appointment) {
      return res.status(403).json({
        success: false,
        message: 'Only the host can end the meeting'
      })
    }

    await endVideoSDKMeeting(meetingId)

    res.json({
      success: true,
      message: 'Meeting ended successfully'
    })
  } catch (error: any) {
    console.error('Error ending meeting:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to end meeting'
    })
  }
})

// In-memory store to track participant status and prevent duplicates
const participantStatusCache = new Map<string, { userId: string; status: string; timestamp: number }>()

// In-memory store to track active meetings per user
const activeMeetings = new Map<string, { meetingId: string; appointmentId: string; timestamp: number }>()

/**
 * Update participant status
 */
router.post('/participant-status', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { meetingId, status } = req.body
    const userId = req.user?.userId

    if (!meetingId || !status || !userId) {
      return res.status(400).json({
        success: false,
        message: 'Meeting ID, status, and user ID are required'
      })
    }

    const cacheKey = `${userId}-${meetingId}`
    const now = Date.now()
    const existingStatus = participantStatusCache.get(cacheKey)

    // Check if this is a duplicate status update within the last 5 seconds
    if (existingStatus && 
        existingStatus.status === status && 
        (now - existingStatus.timestamp) < 5000) {
      console.log(`Duplicate status update ignored: User ${userId} ${status} meeting ${meetingId}`)
      return res.json({
        success: true,
        message: 'Status already updated (duplicate ignored)'
      })
    }

    // Update cache with new status
    participantStatusCache.set(cacheKey, {
      userId,
      status,
      timestamp: now
    })

    // Handle leaving/ending meeting - remove from active meetings tracking
    if (status === 'left') {
      const activeMeeting = activeMeetings.get(userId)
      if (activeMeeting && activeMeeting.meetingId === meetingId) {
        activeMeetings.delete(userId)
        console.log(`User ${userId} left meeting ${meetingId} - removed from active meetings tracking`)
      }
    }

    // Log participant status for monitoring (only if not duplicate)
    console.log(`User ${userId} ${status} meeting ${meetingId}`)

    // Clean up old cache entries (older than 1 hour)
    for (const [key, value] of participantStatusCache.entries()) {
      if (now - value.timestamp > 3600000) { // 1 hour
        participantStatusCache.delete(key)
      }
    }

    // Clean up old active meeting entries (older than 4 hours)
    for (const [key, value] of activeMeetings.entries()) {
      if (now - value.timestamp > 4 * 3600000) { // 4 hours
        activeMeetings.delete(key)
      }
    }

    // You can store this in a database table for analytics
    // For now, just return success
    res.json({
      success: true,
      message: 'Status updated'
    })
  } catch (error: any) {
    console.error('Error updating participant status:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to update status'
    })
  }
})

/**
 * Leave meeting - clean up active meeting tracking
 */
router.post('/leave', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { meetingId } = req.body
    const userId = req.user?.userId

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      })
    }

    // Remove user from active meetings tracking
    const activeMeeting = activeMeetings.get(userId)
    if (activeMeeting) {
      activeMeetings.delete(userId)
      console.log(`User ${userId} manually left meeting ${activeMeeting.meetingId} - removed from tracking`)
    }

    // Update participant status
    if (meetingId) {
      const cacheKey = `${userId}-${meetingId}`
      participantStatusCache.set(cacheKey, {
        userId,
        status: 'left',
        timestamp: Date.now()
      })
      console.log(`User ${userId} left meeting ${meetingId}`)
    }

    res.json({
      success: true,
      message: 'Successfully left meeting'
    })
  } catch (error: any) {
    console.error('Error leaving meeting:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to leave meeting'
    })
  }
})

export default router