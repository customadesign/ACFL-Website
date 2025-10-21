import { Router, Request, Response } from 'express';
import { supabase } from '../lib/supabase';
import { authenticate } from '../middleware/auth';
import { JWTPayload } from '../types/auth';
import { calendarSyncService } from '../services/calendarSyncService';
import emailService from '../services/emailService';
import { appointmentReminderService } from '../services/appointmentReminderService';

interface AuthRequest extends Request {
  user?: JWTPayload;
}

const router = Router();

// All routes require authentication
router.use(authenticate);

// =========================================================
// COACH AVAILABILITY MANAGEMENT
// =========================================================

// Get coach's availability slots
router.get('/coach/:coachId/availability', async (req, res) => {
  try {
    const { coachId } = req.params;
    const authReq = req as AuthRequest;
    
    // Verify user can access this coach's data
    if (authReq.user?.role === 'coach' && authReq.user.userId !== coachId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { data: slots, error } = await supabase
      .from('coach_availability_slots')
      .select('*')
      .eq('coach_id', coachId)
      .eq('is_active', true)
      .order('day_of_week', { ascending: true })
      .order('start_time', { ascending: true });

    if (error) throw error;

    // Ensure available_durations is always an array (for backward compatibility)
    const parsedSlots = slots?.map(slot => {
      let availableDurations = [60]; // Default fallback
      
      try {
        if (slot.available_durations) {
          if (Array.isArray(slot.available_durations)) {
            availableDurations = slot.available_durations;
          } else if (typeof slot.available_durations === 'string') {
            // Handle legacy string data
            availableDurations = JSON.parse(slot.available_durations);
          } else {
            // Handle other potential formats
            availableDurations = [60];
          }
        }
      } catch (jsonError) {
        console.warn('Error parsing available_durations for slot', slot.id, jsonError);
        availableDurations = [60]; // Fallback to default
      }
      
      return {
        ...slot,
        available_durations: availableDurations
      };
    });

    res.json({
      success: true,
      availability: parsedSlots
    });
  } catch (error) {
    console.error('Error fetching availability:', error);
    res.status(500).json({ error: 'Failed to fetch availability' });
  }
});

// Create availability slot
router.post('/coach/:coachId/availability', async (req, res) => {
  try {
    const { coachId } = req.params;
    const authReq = req as AuthRequest;
    
    // Verify user can modify this coach's data
    if (authReq.user?.role === 'coach' && authReq.user.userId !== coachId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const {
      dayOfWeek,
      startTime,
      endTime,
      slotDurationMinutes = 60,
      bufferMinutes = 5,
      startDate,
      endDate,
      title,
      description,
      timezone = 'UTC',
      // New flexible session fields
      availableDurations = [60],
      isFlexibleDuration = false,
      minSessionMinutes = 30,
      maxSessionMinutes = 120
    } = req.body;

    // Validate required fields
    if (dayOfWeek === undefined || !startTime || !endTime) {
      return res.status(400).json({ 
        error: 'dayOfWeek, startTime, and endTime are required' 
      });
    }

    // Validate day of week
    if (dayOfWeek < 0 || dayOfWeek > 6) {
      return res.status(400).json({ 
        error: 'dayOfWeek must be between 0 (Sunday) and 6 (Saturday)' 
      });
    }

    const { data: newSlot, error } = await supabase
      .from('coach_availability_slots')
      .insert({
        coach_id: coachId,
        day_of_week: dayOfWeek,
        start_time: startTime,
        end_time: endTime,
        slot_duration_minutes: slotDurationMinutes,
        buffer_minutes: bufferMinutes,
        start_date: startDate,
        end_date: endDate,
        title,
        description,
        timezone,
        is_active: true,
        // New flexible session fields
        available_durations: availableDurations, // Store as JSONB directly
        is_flexible_duration: isFlexibleDuration,
        min_session_minutes: minSessionMinutes,
        max_session_minutes: maxSessionMinutes
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      success: true,
      message: 'Availability slot created',
      slot: newSlot
    });
  } catch (error) {
    console.error('Error creating availability slot:', error);
    res.status(500).json({ error: 'Failed to create availability slot' });
  }
});

// Update availability slot
router.put('/coach/:coachId/availability/:slotId', async (req, res) => {
  try {
    const { coachId, slotId } = req.params;
    const authReq = req as AuthRequest;
    
    // Verify user can modify this coach's data
    if (authReq.user?.role === 'coach' && authReq.user.userId !== coachId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const {
      dayOfWeek,
      startTime,
      endTime,
      slotDurationMinutes,
      bufferMinutes,
      startDate,
      endDate,
      title,
      description,
      timezone,
      isActive,
      // New flexible session fields
      availableDurations,
      isFlexibleDuration,
      minSessionMinutes,
      maxSessionMinutes
    } = req.body;

    const updateData: any = {};
    if (dayOfWeek !== undefined) updateData.day_of_week = dayOfWeek;
    if (startTime) updateData.start_time = startTime;
    if (endTime) updateData.end_time = endTime;
    if (slotDurationMinutes) updateData.slot_duration_minutes = slotDurationMinutes;
    if (bufferMinutes !== undefined) updateData.buffer_minutes = bufferMinutes;
    if (startDate !== undefined) updateData.start_date = startDate;
    if (endDate !== undefined) updateData.end_date = endDate;
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (timezone) updateData.timezone = timezone;
    if (isActive !== undefined) updateData.is_active = isActive;
    // New flexible session fields
    if (availableDurations !== undefined) updateData.available_durations = availableDurations; // Store as JSONB directly
    if (isFlexibleDuration !== undefined) updateData.is_flexible_duration = isFlexibleDuration;
    if (minSessionMinutes !== undefined) updateData.min_session_minutes = minSessionMinutes;
    if (maxSessionMinutes !== undefined) updateData.max_session_minutes = maxSessionMinutes;

    const { data: updatedSlot, error } = await supabase
      .from('coach_availability_slots')
      .update(updateData)
      .eq('id', slotId)
      .eq('coach_id', coachId)
      .select()
      .single();

    if (error) throw error;

    if (!updatedSlot) {
      return res.status(404).json({ error: 'Availability slot not found' });
    }

    res.json({
      success: true,
      message: 'Availability slot updated',
      slot: updatedSlot
    });
  } catch (error) {
    console.error('Error updating availability slot:', error);
    res.status(500).json({ error: 'Failed to update availability slot' });
  }
});

// Delete availability slot
router.delete('/coach/:coachId/availability/:slotId', async (req, res) => {
  try {
    const { coachId, slotId } = req.params;
    const authReq = req as AuthRequest;
    
    // Verify user can modify this coach's data
    if (authReq.user?.role === 'coach' && authReq.user.userId !== coachId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { error } = await supabase
      .from('coach_availability_slots')
      .delete()
      .eq('id', slotId)
      .eq('coach_id', coachId);

    if (error) throw error;

    res.json({
      success: true,
      message: 'Availability slot deleted'
    });
  } catch (error) {
    console.error('Error deleting availability slot:', error);
    res.status(500).json({ error: 'Failed to delete availability slot' });
  }
});

// =========================================================
// BLOCKED TIME MANAGEMENT
// =========================================================

// Get coach's blocked time slots
router.get('/coach/:coachId/blocked', async (req, res) => {
  try {
    const { coachId } = req.params;
    const authReq = req as AuthRequest;
    
    // Verify user can access this coach's data
    if (authReq.user?.role === 'coach' && authReq.user.userId !== coachId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { data: blockedSlots, error } = await supabase
      .from('coach_blocked_slots')
      .select('*')
      .eq('coach_id', coachId)
      .order('blocked_date', { ascending: true });

    if (error) throw error;

    res.json({
      success: true,
      blocked: blockedSlots
    });
  } catch (error) {
    console.error('Error fetching blocked slots:', error);
    res.status(500).json({ error: 'Failed to fetch blocked slots' });
  }
});

// Create blocked time slot
router.post('/coach/:coachId/blocked', async (req, res) => {
  try {
    const { coachId } = req.params;
    const authReq = req as AuthRequest;
    
    // Verify user can modify this coach's data
    if (authReq.user?.role === 'coach' && authReq.user.userId !== coachId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const {
      blockedDate,
      startTime,
      endTime,
      reason,
      isRecurring = false
    } = req.body;

    // Validate required fields
    if (!blockedDate) {
      return res.status(400).json({ error: 'blockedDate is required' });
    }

    const { data: newBlocked, error } = await supabase
      .from('coach_blocked_slots')
      .insert({
        coach_id: coachId,
        blocked_date: blockedDate,
        start_time: startTime,
        end_time: endTime,
        reason,
        is_recurring: isRecurring
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      success: true,
      message: 'Time slot blocked',
      blocked: newBlocked
    });
  } catch (error) {
    console.error('Error creating blocked slot:', error);
    res.status(500).json({ error: 'Failed to create blocked slot' });
  }
});

// Delete blocked time slot
router.delete('/coach/:coachId/blocked/:blockedId', async (req, res) => {
  try {
    const { coachId, blockedId } = req.params;
    const authReq = req as AuthRequest;
    
    // Verify user can modify this coach's data
    if (authReq.user?.role === 'coach' && authReq.user.userId !== coachId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { error } = await supabase
      .from('coach_blocked_slots')
      .delete()
      .eq('id', blockedId)
      .eq('coach_id', coachId);

    if (error) throw error;

    res.json({
      success: true,
      message: 'Blocked slot removed'
    });
  } catch (error) {
    console.error('Error deleting blocked slot:', error);
    res.status(500).json({ error: 'Failed to delete blocked slot' });
  }
});

// =========================================================
// AVAILABLE SLOTS QUERY
// =========================================================

// Get available slots for a coach on a specific date
router.get('/coach/:coachId/available-slots/:date', async (req, res) => {
  try {
    const { coachId, date } = req.params;
    const { timezone = 'UTC' } = req.query;

    // Call the database function to get available slots
    const { data: availableSlots, error } = await supabase
      .rpc('get_coach_available_slots', {
        p_coach_id: coachId,
        p_date: date,
        p_timezone: timezone
      });

    if (error) throw error;

    res.json({
      success: true,
      date,
      timezone,
      slots: availableSlots || []
    });
  } catch (error) {
    console.error('Error fetching available slots:', error);
    res.status(500).json({ error: 'Failed to fetch available slots' });
  }
});

// Get available slots for multiple dates (for calendar view)
router.post('/coach/:coachId/available-slots-range', async (req, res) => {
  try {
    const { coachId } = req.params;
    const { startDate, endDate, timezone = 'UTC' } = req.body;

    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'startDate and endDate are required' });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const availabilityMap: Record<string, any[]> = {};

    // Get slots for each date in the range
    const currentDate = new Date(start);
    while (currentDate <= end) {
      const dateStr = currentDate.toISOString().split('T')[0];
      
      try {
        const { data: slots } = await supabase
          .rpc('get_coach_available_slots', {
            p_coach_id: coachId,
            p_date: dateStr,
            p_timezone: timezone
          });
        
        availabilityMap[dateStr] = slots || [];
      } catch (slotError) {
        console.error(`Error fetching slots for ${dateStr}:`, slotError);
        availabilityMap[dateStr] = [];
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    res.json({
      success: true,
      startDate,
      endDate,
      timezone,
      availability: availabilityMap
    });
  } catch (error) {
    console.error('Error fetching available slots range:', error);
    res.status(500).json({ error: 'Failed to fetch available slots' });
  }
});

// =========================================================
// APPOINTMENT BOOKING
// =========================================================

// Book an appointment
router.post('/book-appointment', async (req, res) => {
  try {
    const {
      coachId,
      clientId,
      startTime,
      endTime,
      timezone = 'UTC',
      notes
    } = req.body;

    const authReq = req as AuthRequest;
    // Verify user can book appointments
    if (authReq.user?.role === 'client' && authReq.user.userId !== clientId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Validate required fields
    if (!coachId || !clientId || !startTime || !endTime) {
      return res.status(400).json({ 
        error: 'coachId, clientId, startTime, and endTime are required' 
      });
    }

    // Check if slot is still available
    const { data: isAvailable } = await supabase
      .rpc('is_slot_available', {
        p_coach_id: coachId,
        p_start_time: startTime,
        p_end_time: endTime,
        p_timezone: timezone
      });

    if (!isAvailable) {
      return res.status(409).json({ 
        error: 'This time slot is no longer available' 
      });
    }

    // Don't generate meeting ID at booking time - VideoSDK will create it when meeting starts
    // This allows proper VideoSDK room creation with the correct format (e.g., aqqw-dhxp-0io7)
    
    // Create the appointment
    const { data: newAppointment, error } = await supabase
      .from('sessions')
      .insert({
        client_id: clientId,
        coach_id: coachId,
        starts_at: startTime,
        ends_at: endTime,
        status: 'scheduled',
        notes: notes || null,
        meeting_id: null, // Will be set when VideoSDK room is created
        session_type: 'video',
        timezone: timezone,
        booking_confirmed_at: new Date().toISOString(),
        meeting_url: null // Will be set when VideoSDK room is created
      })
      .select(`
        *,
        clients:client_id(first_name, last_name, email),
        coaches:coach_id(first_name, last_name, email)
      `)
      .single();

    if (error) throw error;

    // Emit admin notification for new appointment
    const io = req.app.get('io');
    if (io) {
      io.to('admin:notifications').emit('admin:new_appointment', {
        id: newAppointment.id,
        client_name: `${newAppointment.clients.first_name} ${newAppointment.clients.last_name}`,
        coach_name: `${newAppointment.coaches.first_name} ${newAppointment.coaches.last_name}`,
        starts_at: newAppointment.starts_at,
        ends_at: newAppointment.ends_at,
        created_at: new Date().toISOString()
      });
    }

    // Queue calendar sync for all connected calendars
    await calendarSyncService.queueSessionSync(coachId, newAppointment.id, 'create');

    // Schedule appointment reminders
    try {
      await appointmentReminderService.scheduleSessionReminders(newAppointment.id);
      console.log(`✅ Scheduled reminders for session ${newAppointment.id}`);
    } catch (reminderError) {
      console.error('Failed to schedule reminders:', reminderError);
      // Don't fail the booking if reminder scheduling fails
    }

    // Send booking confirmation emails
    try {
      const client = newAppointment.clients;
      const coach = newAppointment.coaches;

      if (client.email && coach.email) {
        const scheduledDateTime = new Date(newAppointment.starts_at);
        const appointmentDate = scheduledDateTime.toLocaleDateString('en-US', {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
          year: 'numeric'
        });
        const appointmentTime = scheduledDateTime.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        });

        // Calculate duration in minutes
        const duration = Math.round((new Date(newAppointment.ends_at).getTime() - new Date(newAppointment.starts_at).getTime()) / 60000);

        await emailService.sendAppointmentConfirmation({
          clientEmail: client.email,
          coachEmail: coach.email,
          clientName: `${client.first_name} ${client.last_name}`,
          coachName: `${coach.first_name} ${coach.last_name}`,
          appointmentDetails: {
            date: appointmentDate,
            time: appointmentTime,
            duration: `${duration} minutes`,
            type: duration <= 15 ? 'Free Consultation' : 'Coaching Session'
          }
        });

        console.log(`✅ Confirmation emails sent to ${client.email} and ${coach.email}`);
      } else {
        console.warn('⚠️ Missing email address(es) - cannot send confirmation emails');
      }
    } catch (emailError) {
      console.error('❌ Failed to send confirmation emails:', emailError);
      // Don't fail the booking if email sending fails
    }

    res.status(201).json({
      success: true,
      message: 'Appointment booked successfully',
      appointment: newAppointment
    });
  } catch (error) {
    console.error('Error booking appointment:', error);
    res.status(500).json({ error: 'Failed to book appointment' });
  }
});

// Cancel appointment
router.put('/appointment/:appointmentId/cancel', async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const { cancellationReason } = req.body;
    const authReq = req as AuthRequest;

    // Get appointment details first
    const { data: appointment, error: fetchError } = await supabase
      .from('sessions')
      .select('*')
      .eq('id', appointmentId)
      .single();

    if (fetchError) throw fetchError;
    
    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    // Verify user can cancel this appointment
    const canCancel = 
      (authReq.user?.role === 'client' && authReq.user.userId === appointment.client_id) ||
      (authReq.user?.role === 'coach' && authReq.user.userId === appointment.coach_id) ||
      authReq.user?.role === 'admin';

    if (!canCancel) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Update appointment status
    const { data: updatedAppointment, error } = await supabase
      .from('sessions')
      .update({
        status: 'cancelled',
        cancellation_reason: cancellationReason || null
      })
      .eq('id', appointmentId)
      .select()
      .single();

    if (error) throw error;

    // Queue calendar sync to update/remove cancelled appointment
    await calendarSyncService.queueSessionSync(appointment.coach_id, appointmentId, 'update');

    // TODO: Send cancellation notifications

    res.json({
      success: true,
      message: 'Appointment cancelled',
      appointment: updatedAppointment
    });
  } catch (error) {
    console.error('Error cancelling appointment:', error);
    res.status(500).json({ error: 'Failed to cancel appointment' });
  }
});

// Reschedule appointment
router.put('/appointment/:appointmentId/reschedule', async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const { newStartTime, newEndTime } = req.body;
    const authReq = req as AuthRequest;

    // Get appointment details first
    const { data: appointment, error: fetchError } = await supabase
      .from('sessions')
      .select('*')
      .eq('id', appointmentId)
      .single();

    if (fetchError) throw fetchError;
    
    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    // Verify user can reschedule this appointment
    const canReschedule =
      (authReq.user?.role === 'client' && authReq.user.userId === appointment.client_id) ||
      (authReq.user?.role === 'coach' && authReq.user.userId === appointment.coach_id) ||
      authReq.user?.role === 'admin';

    if (!canReschedule) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Coaches can reschedule to any time (including immediate/now)
    // Only check availability for client-initiated reschedules
    if (authReq.user?.role === 'client') {
      const { data: isAvailable } = await supabase
        .rpc('is_slot_available', {
          p_coach_id: appointment.coach_id,
          p_start_time: newStartTime,
          p_end_time: newEndTime,
          p_timezone: appointment.timezone || 'UTC'
        });

      if (!isAvailable) {
        return res.status(409).json({
          error: 'The new time slot is no longer available'
        });
      }
    }

    // Update appointment
    const { data: updatedAppointment, error } = await supabase
      .from('sessions')
      .update({
        starts_at: newStartTime,
        ends_at: newEndTime,
        updated_at: new Date().toISOString()
      })
      .eq('id', appointmentId)
      .select(`
        *,
        clients:client_id(first_name, last_name, email),
        coaches:coach_id(first_name, last_name, email)
      `)
      .single();

    if (error) throw error;

    // Send reschedule notifications
    const io = req.app.get('io');
    if (io) {
      const clientName = `${updatedAppointment.clients.first_name} ${updatedAppointment.clients.last_name}`;
      const coachName = `${updatedAppointment.coaches.first_name} ${updatedAppointment.coaches.last_name}`;
      
      const notificationData = {
        id: updatedAppointment.id,
        old_starts_at: appointment.starts_at,
        new_starts_at: updatedAppointment.starts_at,
        client_id: updatedAppointment.client_id,
        coach_id: updatedAppointment.coach_id,
        client_name: clientName,
        coach_name: coachName,
        rescheduled_by: authReq.user?.role || 'unknown',
        reason: req.body.reason || ''
      };

      // Notify other party about reschedule
      if (authReq.user?.role === 'client') {
        io.to(`user:${updatedAppointment.coach_id}`).emit('appointment:rescheduled', notificationData);
      } else if (authReq.user?.role === 'coach') {
        io.to(`user:${updatedAppointment.client_id}`).emit('appointment:rescheduled', notificationData);
      }

      // Notify admin about reschedule
      const adminRoom = io.sockets.adapter.rooms.get('admin:notifications');
      console.log(`Calendar reschedule: Emitting admin:appointment_rescheduled to admin room (${adminRoom ? adminRoom.size : 0} clients)`);
      io.to('admin:notifications').emit('admin:appointment_rescheduled', {
        ...notificationData,
        updated_at: new Date().toISOString()
      });
    }

    // Queue calendar sync to update rescheduled appointment
    await calendarSyncService.queueSessionSync(appointment.coach_id, appointmentId, 'update');

    res.json({
      success: true,
      message: 'Appointment rescheduled successfully',
      appointment: updatedAppointment
    });
  } catch (error) {
    console.error('Error rescheduling appointment:', error);
    res.status(500).json({ error: 'Failed to reschedule appointment' });
  }
});

export default router;