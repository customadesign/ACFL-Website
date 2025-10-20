import { supabase } from '../lib/supabase';
import { BookingRequest, BookingEvent } from '../types/booking';
import { getSocketIO } from '../lib/socket';
import emailService from './emailService';

export class BookingNotificationService {
  /**
   * Emit real-time notification via Socket.IO
   */
  private emitNotification(userId: string, notification: any): void {
    const io = getSocketIO();
    if (io) {
      const room = `user:${userId}`;
      io.to(room).emit('notification', notification);
      console.log(`Real-time notification emitted to user ${userId} in room ${room}`);
    }
  }
  /**
   * Send notification when a new booking request is created
   */
  async notifyCoachOfNewBookingRequest(bookingRequest: BookingRequest): Promise<void> {
    try {
      // Get coach details
      const { data: coach, error: coachError } = await supabase
        .from('coaches')
        .select('id, first_name, last_name, email, notification_preferences')
        .eq('id', bookingRequest.coach_id)
        .single();

      if (coachError || !coach) {
        console.error('Coach not found for booking notification:', coachError);
        return;
      }

      // Get client details
      const { data: client, error: clientError } = await supabase
        .from('clients')
        .select('id, first_name, last_name, email')
        .eq('id', bookingRequest.client_id)
        .single();

      if (clientError || !client) {
        console.error('Client not found for booking notification:', clientError);
        return;
      }

      // Create notification record
      const notificationData = {
        user_id: coach.id,
        user_type: 'coach',
        type: 'new_booking_request',
        title: 'New Booking Request',
        message: `${client.first_name} ${client.last_name} has requested a ${bookingRequest.session_type} session`,
        data: {
          booking_request_id: bookingRequest.id,
          client_id: bookingRequest.client_id,
          client_name: `${client.first_name} ${client.last_name}`,
          session_type: bookingRequest.session_type,
          duration_minutes: bookingRequest.duration_minutes,
          preferred_date: bookingRequest.preferred_date,
          preferred_time: bookingRequest.preferred_time,
          action_url: `/coach/bookings/${bookingRequest.id}`
        },
        created_at: new Date().toISOString(),
        read_at: null
      };

      await supabase.from('notifications').insert([notificationData]);

      // Send real-time notification via Socket.IO
      this.emitNotification(coach.id, {
        type: 'appointment',
        title: notificationData.title,
        content: notificationData.message,
        appointmentId: bookingRequest.id,
        data: notificationData.data
      });

      // TODO: Send email notification if coach has email notifications enabled
      // TODO: Send push notification if coach has push notifications enabled

      console.log(`Notification sent to coach ${coach.id} for booking request ${bookingRequest.id}`);
    } catch (error) {
      console.error('Error sending coach booking notification:', error);
    }
  }

  /**
   * Send notification when coach accepts a booking request
   */
  async notifyClientOfBookingAcceptance(
    bookingRequestId: string,
    finalPriceCents: number,
    paymentDeadline: Date,
    coachNotes?: string
  ): Promise<void> {
    try {
      // Get booking request details
      const { data: bookingRequest, error: bookingError } = await supabase
        .from('booking_requests')
        .select(`
          *,
          coaches:coach_id (
            id, first_name, last_name, email
          )
        `)
        .eq('id', bookingRequestId)
        .single();

      if (bookingError || !bookingRequest) {
        console.error('Booking request not found for acceptance notification:', bookingError);
        return;
      }

      // Get client details
      const { data: client, error: clientError } = await supabase
        .from('clients')
        .select('id, first_name, last_name, email, notification_preferences')
        .eq('id', bookingRequest.client_id)
        .single();

      if (clientError || !client) {
        console.error('Client not found for acceptance notification:', clientError);
        return;
      }

      const coach = bookingRequest.coaches;
      const priceFormatted = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
      }).format(finalPriceCents / 100);

      // Create notification record
      const notificationData = {
        user_id: client.id,
        user_type: 'client',
        type: 'booking_accepted',
        title: 'Booking Request Accepted',
        message: `${coach.first_name} ${coach.last_name} accepted your session request. Final price: ${priceFormatted}`,
        data: {
          booking_request_id: bookingRequestId,
          coach_id: bookingRequest.coach_id,
          coach_name: `${coach.first_name} ${coach.last_name}`,
          final_price_cents: finalPriceCents,
          final_price_formatted: priceFormatted,
          payment_deadline: paymentDeadline.toISOString(),
          coach_notes: coachNotes,
          action_url: `/clients/bookings/${bookingRequestId}/pay`,
          action_text: 'Complete Payment'
        },
        created_at: new Date().toISOString(),
        read_at: null
      };

      await supabase.from('notifications').insert([notificationData]);

      // TODO: Send email notification with payment link
      // TODO: Send push notification
      // TODO: Send real-time notification via WebSocket/Socket.IO

      console.log(`Acceptance notification sent to client ${client.id} for booking ${bookingRequestId}`);
    } catch (error) {
      console.error('Error sending booking acceptance notification:', error);
    }
  }

  /**
   * Send notification when coach rejects a booking request
   */
  async notifyClientOfBookingRejection(
    bookingRequestId: string,
    reason?: string
  ): Promise<void> {
    try {
      // Get booking request details
      const { data: bookingRequest, error: bookingError } = await supabase
        .from('booking_requests')
        .select(`
          *,
          coaches:coach_id (
            id, first_name, last_name, email
          )
        `)
        .eq('id', bookingRequestId)
        .single();

      if (bookingError || !bookingRequest) {
        console.error('Booking request not found for rejection notification:', bookingError);
        return;
      }

      // Get client details
      const { data: client, error: clientError } = await supabase
        .from('clients')
        .select('id, first_name, last_name, email, notification_preferences')
        .eq('id', bookingRequest.client_id)
        .single();

      if (clientError || !client) {
        console.error('Client not found for rejection notification:', clientError);
        return;
      }

      const coach = bookingRequest.coaches;

      // Create notification record
      const notificationData = {
        user_id: client.id,
        user_type: 'client',
        type: 'booking_rejected',
        title: 'Booking Request Declined',
        message: `${coach.first_name} ${coach.last_name} declined your session request`,
        data: {
          booking_request_id: bookingRequestId,
          coach_id: bookingRequest.coach_id,
          coach_name: `${coach.first_name} ${coach.last_name}`,
          reason: reason,
          action_url: `/clients/coaches/${bookingRequest.coach_id}`,
          action_text: 'Find Another Time'
        },
        created_at: new Date().toISOString(),
        read_at: null
      };

      await supabase.from('notifications').insert([notificationData]);

      // TODO: Send email notification
      // TODO: Send push notification
      // TODO: Send real-time notification via WebSocket/Socket.IO

      console.log(`Rejection notification sent to client ${client.id} for booking ${bookingRequestId}`);
    } catch (error) {
      console.error('Error sending booking rejection notification:', error);
    }
  }

  /**
   * Send notification when payment is completed and session is confirmed
   */
  async notifyBothPartiesOfBookingConfirmation(
    sessionId: string,
    paymentId: string
  ): Promise<void> {
    try {
      // Get session details
      const { data: session, error: sessionError } = await supabase
        .from('sessions')
        .select(`
          *,
          coaches:coach_id (
            id, first_name, last_name, email
          ),
          clients:client_id (
            id, first_name, last_name, email
          ),
          payments:payment_id (
            id, amount_cents
          )
        `)
        .eq('id', sessionId)
        .single();

      if (sessionError || !session) {
        console.error('Session not found for confirmation notification:', sessionError);
        return;
      }

      const coach = session.coaches;
      const client = session.clients;
      const payment = session.payments;

      const priceFormatted = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
      }).format(payment.amount_cents / 100);

      const scheduledDate = new Date(session.scheduled_at).toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });

      // Notification for client
      const clientNotificationData = {
        user_id: client.id,
        user_type: 'client',
        type: 'session_confirmed',
        title: 'Session Confirmed',
        message: `Your session with ${coach.first_name} ${coach.last_name} is confirmed for ${scheduledDate}`,
        data: {
          session_id: sessionId,
          payment_id: paymentId,
          coach_id: session.coach_id,
          coach_name: `${coach.first_name} ${coach.last_name}`,
          scheduled_at: session.scheduled_at,
          scheduled_date_formatted: scheduledDate,
          amount_paid: priceFormatted,
          meeting_link: session.meeting_link,
          action_url: `/clients/sessions/${sessionId}`,
          action_text: 'View Session Details'
        },
        created_at: new Date().toISOString(),
        read_at: null
      };

      // Notification for coach
      const coachNotificationData = {
        user_id: coach.id,
        user_type: 'coach',
        type: 'session_confirmed',
        title: 'Session Confirmed',
        message: `Session with ${client.first_name} ${client.last_name} is confirmed for ${scheduledDate}`,
        data: {
          session_id: sessionId,
          payment_id: paymentId,
          client_id: session.client_id,
          client_name: `${client.first_name} ${client.last_name}`,
          scheduled_at: session.scheduled_at,
          scheduled_date_formatted: scheduledDate,
          amount_paid: priceFormatted,
          meeting_link: session.meeting_link,
          action_url: `/coach/sessions/${sessionId}`,
          action_text: 'View Session Details'
        },
        created_at: new Date().toISOString(),
        read_at: null
      };

      await supabase.from('notifications').insert([
        clientNotificationData,
        coachNotificationData
      ]);

      // Send confirmation emails to both parties
      try {
        const scheduledDateTime = new Date(session.scheduled_at);
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

        await emailService.sendAppointmentConfirmation({
          clientEmail: client.email,
          coachEmail: coach.email,
          clientName: `${client.first_name} ${client.last_name}`,
          coachName: `${coach.first_name} ${coach.last_name}`,
          appointmentDetails: {
            date: appointmentDate,
            time: appointmentTime,
            duration: `${session.duration_minutes} minutes`,
            type: session.session_type || 'Video Session'
          }
        });

        console.log(`Confirmation emails sent to both ${client.email} and ${coach.email}`);
      } catch (emailError) {
        console.error('Failed to send confirmation emails:', emailError);
        // Don't fail the notification if email sending fails
      }

      // TODO: Send calendar invites
      // TODO: Send push notifications
      // TODO: Send real-time notifications via WebSocket/Socket.IO

      console.log(`Confirmation notifications sent for session ${sessionId}`);
    } catch (error) {
      console.error('Error sending session confirmation notifications:', error);
    }
  }

  /**
   * Send reminder notifications for upcoming payments
   */
  async sendPaymentReminderNotifications(): Promise<void> {
    try {
      // Find booking requests that are payment_required and approaching deadline
      const oneHourFromNow = new Date(Date.now() + 60 * 60 * 1000);
      const now = new Date();

      const { data: expiringBookings, error } = await supabase
        .from('booking_requests')
        .select(`
          *,
          coaches:coach_id (
            first_name, last_name
          ),
          clients:client_id (
            id, first_name, last_name, email
          )
        `)
        .eq('status', 'payment_required')
        .gte('payment_deadline', now.toISOString())
        .lte('payment_deadline', oneHourFromNow.toISOString());

      if (error) {
        console.error('Error fetching expiring bookings:', error);
        return;
      }

      for (const booking of expiringBookings || []) {
        const priceFormatted = new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
        }).format(booking.coach_adjusted_price_cents / 100);

        const minutesLeft = Math.floor(
          (new Date(booking.payment_deadline).getTime() - now.getTime()) / (1000 * 60)
        );

        const reminderData = {
          user_id: booking.client_id,
          user_type: 'client',
          type: 'payment_reminder',
          title: 'Payment Required Soon',
          message: `Your session with ${booking.coaches.first_name} ${booking.coaches.last_name} expires in ${minutesLeft} minutes. Complete payment now to secure your session.`,
          data: {
            booking_request_id: booking.id,
            coach_name: `${booking.coaches.first_name} ${booking.coaches.last_name}`,
            final_price_formatted: priceFormatted,
            minutes_left: minutesLeft,
            action_url: `/clients/bookings/${booking.id}/pay`,
            action_text: 'Pay Now'
          },
          created_at: new Date().toISOString(),
          read_at: null
        };

        await supabase.from('notifications').insert([reminderData]);
      }

      console.log(`Sent ${expiringBookings?.length || 0} payment reminder notifications`);
    } catch (error) {
      console.error('Error sending payment reminder notifications:', error);
    }
  }

  /**
   * Clean up expired booking requests
   */
  async cleanupExpiredBookingRequests(): Promise<void> {
    try {
      const now = new Date();

      // Find expired booking requests
      const { data: expiredBookings, error } = await supabase
        .from('booking_requests')
        .select('id, client_id, coach_id')
        .eq('status', 'payment_required')
        .lt('payment_deadline', now.toISOString());

      if (error) {
        console.error('Error fetching expired bookings:', error);
        return;
      }

      if (!expiredBookings || expiredBookings.length === 0) {
        return;
      }

      // Update status to expired
      const expiredIds = expiredBookings.map(b => b.id);
      await supabase
        .from('booking_requests')
        .update({ status: 'expired' })
        .in('id', expiredIds);

      // Send expiration notifications
      for (const booking of expiredBookings) {
        const expirationData = {
          user_id: booking.client_id,
          user_type: 'client',
          type: 'booking_expired',
          title: 'Booking Request Expired',
          message: 'Your booking request has expired due to non-payment. You can submit a new request.',
          data: {
            booking_request_id: booking.id,
            action_url: `/clients/coaches/${booking.coach_id}`,
            action_text: 'Book Again'
          },
          created_at: new Date().toISOString(),
          read_at: null
        };

        await supabase.from('notifications').insert([expirationData]);
      }

      console.log(`Cleaned up ${expiredBookings.length} expired booking requests`);
    } catch (error) {
      console.error('Error cleaning up expired booking requests:', error);
    }
  }
}