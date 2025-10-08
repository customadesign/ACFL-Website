import { supabase } from '../lib/supabase';
import EmailService from './emailService';

interface SessionReminderData {
  sessionId: string;
  clientId: string;
  coachId: string;
  clientName: string;
  coachName: string;
  clientEmail: string;
  coachEmail: string;
  sessionTime: string;
  meetingId?: string;
}

interface ReminderSettings {
  emailReminderHours: number[];
  messageReminderHours: number[];
  enableEmailReminders: boolean;
  enableMessageReminders: boolean;
}

export class AppointmentReminderService {
  private emailService = EmailService;
  private defaultSettings: ReminderSettings = {
    emailReminderHours: [24, 2], // 24 hours and 2 hours before
    messageReminderHours: [24, 1], // 24 hours and 1 hour before
    enableEmailReminders: true,
    enableMessageReminders: true
  };

  constructor() {
    // EmailService is already a singleton instance
  }

  /**
   * Schedule reminders for a new session
   */
  async scheduleSessionReminders(sessionId: string): Promise<void> {
    try {
      // Get session details with client and coach info
      const { data: session, error } = await supabase
        .from('sessions')
        .select(`
          id,
          client_id,
          coach_id,
          starts_at,
          status,
          meeting_id,
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
        .eq('id', sessionId)
        .single();

      if (error || !session) {
        console.error('Failed to get session details:', error);
        return;
      }

      // Only schedule reminders for scheduled or confirmed sessions
      if (!['scheduled', 'confirmed'].includes(session.status)) {
        console.log(`Skipping reminder scheduling for session ${sessionId} with status: ${session.status}`);
        return;
      }

      const client = session.clients as any;
      const coach = session.coaches as any;

      const reminderData: SessionReminderData = {
        sessionId: session.id,
        clientId: session.client_id,
        coachId: session.coach_id,
        clientName: `${client.first_name} ${client.last_name}`,
        coachName: `${coach.first_name} ${coach.last_name}`,
        clientEmail: client.email,
        coachEmail: coach.email,
        sessionTime: session.starts_at,
        meetingId: session.meeting_id
      };

      // Check if session is happening very soon (within next hour)
      const sessionTime = new Date(session.starts_at);
      const now = new Date();
      const hoursUntilSession = (sessionTime.getTime() - now.getTime()) / (1000 * 60 * 60);

      if (hoursUntilSession <= 1 && hoursUntilSession > 0) {
        // Send immediate reminder if session is within the next hour
        console.log(`Session ${sessionId} is starting soon (in ${Math.round(hoursUntilSession * 60)} minutes), sending immediate reminder`);

        // Send immediate email reminder
        if (this.defaultSettings.enableEmailReminders) {
          await this.sendImmediateEmailReminder(reminderData);
        }

        // Send immediate message reminder
        if (this.defaultSettings.enableMessageReminders) {
          await this.sendImmediateMessageReminder(reminderData);
        }
      } else {
        // Schedule regular reminders for future sessions
        if (this.defaultSettings.enableEmailReminders) {
          for (const hours of this.defaultSettings.emailReminderHours) {
            // Only schedule if the reminder time hasn't passed
            const reminderTime = new Date(sessionTime.getTime() - (hours * 60 * 60 * 1000));
            if (reminderTime > now) {
              await this.scheduleEmailReminder(reminderData, hours);
            }
          }
        }

        // Schedule message reminders
        if (this.defaultSettings.enableMessageReminders) {
          for (const hours of this.defaultSettings.messageReminderHours) {
            // Only schedule if the reminder time hasn't passed
            const reminderTime = new Date(sessionTime.getTime() - (hours * 60 * 60 * 1000));
            if (reminderTime > now) {
              await this.scheduleMessageReminder(reminderData, hours);
            }
          }
        }
      }

      console.log(`Scheduled reminders for session ${sessionId}`);
    } catch (error) {
      console.error('Error scheduling appointment reminders:', error);
    }
  }

  /**
   * Schedule an email reminder
   */
  private async scheduleEmailReminder(data: SessionReminderData, hoursBeforeSession: number): Promise<void> {
    const sessionTime = new Date(data.sessionTime);
    const reminderTime = new Date(sessionTime.getTime() - (hoursBeforeSession * 60 * 60 * 1000));

    // Store reminder in database for processing
    const { error } = await supabase
      .from('scheduled_reminders')
      .insert({
        session_id: data.sessionId,
        reminder_type: 'email',
        recipient_id: data.clientId,
        recipient_email: data.clientEmail,
        scheduled_for: reminderTime.toISOString(),
        hours_before: hoursBeforeSession,
        data: JSON.stringify(data)
      });

    if (error) {
      console.error('Error scheduling email reminder:', error);
    }
  }

  /**
   * Schedule a message reminder
   */
  private async scheduleMessageReminder(data: SessionReminderData, hoursBeforeSession: number): Promise<void> {
    const sessionTime = new Date(data.sessionTime);
    const reminderTime = new Date(sessionTime.getTime() - (hoursBeforeSession * 60 * 60 * 1000));

    // Store reminder in database for processing
    const { error } = await supabase
      .from('scheduled_reminders')
      .insert({
        session_id: data.sessionId,
        reminder_type: 'message',
        recipient_id: data.clientId,
        sender_id: data.coachId,
        scheduled_for: reminderTime.toISOString(),
        hours_before: hoursBeforeSession,
        data: JSON.stringify(data)
      });

    if (error) {
      console.error('Error scheduling message reminder:', error);
    }
  }

  /**
   * Check for sessions starting soon that haven't received reminders
   */
  async checkUpcomingSessions(): Promise<void> {
    try {
      const now = new Date();
      const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);

      // Find sessions starting within the next hour
      const { data: upcomingSessions, error } = await supabase
        .from('sessions')
        .select(`
          id,
          client_id,
          coach_id,
          starts_at,
          meeting_id,
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
        .gte('starts_at', now.toISOString())
        .lte('starts_at', oneHourFromNow.toISOString())
        .in('status', ['scheduled', 'confirmed']);

      if (error) {
        console.error('Error fetching upcoming sessions:', error);
        return;
      }

      for (const session of upcomingSessions || []) {
        // Check if reminders have already been sent for this session
        const { data: existingReminders } = await supabase
          .from('scheduled_reminders')
          .select('id')
          .eq('session_id', session.id)
          .eq('sent', true);

        // If no reminders have been sent, send immediate reminders
        if (!existingReminders || existingReminders.length === 0) {
          const client = session.clients as any;
          const coach = session.coaches as any;

          const reminderData: SessionReminderData = {
            sessionId: session.id,
            clientId: session.client_id,
            coachId: session.coach_id,
            clientName: `${client.first_name} ${client.last_name}`,
            coachName: `${coach.first_name} ${coach.last_name}`,
            clientEmail: client.email,
            coachEmail: coach.email,
            sessionTime: session.starts_at,
            meetingId: session.meeting_id
          };

          console.log(`Found session ${session.id} starting soon without reminders, sending immediate reminders`);

          // Send immediate reminders
          await this.sendImmediateEmailReminder(reminderData);
          await this.sendImmediateMessageReminder(reminderData);

          // Record that we sent these reminders
          await supabase
            .from('scheduled_reminders')
            .insert([
              {
                session_id: session.id,
                reminder_type: 'email',
                recipient_id: session.client_id,
                recipient_email: client.email,
                scheduled_for: now.toISOString(),
                hours_before: 0,
                sent: true,
                sent_at: now.toISOString(),
                data: JSON.stringify(reminderData)
              },
              {
                session_id: session.id,
                reminder_type: 'message',
                recipient_id: session.client_id,
                sender_id: session.coach_id,
                scheduled_for: now.toISOString(),
                hours_before: 0,
                sent: true,
                sent_at: now.toISOString(),
                data: JSON.stringify(reminderData)
              }
            ]);
        }
      }

      console.log(`Checked ${upcomingSessions?.length || 0} upcoming sessions`);
    } catch (error) {
      console.error('Error checking upcoming sessions:', error);
    }
  }

  /**
   * Process due reminders - to be called by a cron job
   */
  async processDueReminders(): Promise<void> {
    try {
      const now = new Date();

      // Get all due reminders that haven't been sent
      const { data: dueReminders, error } = await supabase
        .from('scheduled_reminders')
        .select('*')
        .lte('scheduled_for', now.toISOString())
        .eq('sent', false)
        .eq('cancelled', false);

      if (error) {
        console.error('Error fetching due reminders:', error);
        return;
      }

      for (const reminder of dueReminders || []) {
        try {
          if (reminder.reminder_type === 'email') {
            await this.sendEmailReminder(reminder);
          } else if (reminder.reminder_type === 'message') {
            await this.sendMessageReminder(reminder);
          }

          // Mark reminder as sent
          await supabase
            .from('scheduled_reminders')
            .update({ sent: true, sent_at: new Date().toISOString() })
            .eq('id', reminder.id);

        } catch (error) {
          console.error(`Error processing reminder ${reminder.id}:`, error);

          // Mark as failed
          await supabase
            .from('scheduled_reminders')
            .update({
              failed: true,
              failure_reason: error instanceof Error ? error.message : 'Unknown error'
            })
            .eq('id', reminder.id);
        }
      }

      console.log(`Processed ${dueReminders?.length || 0} due reminders`);
    } catch (error) {
      console.error('Error processing due reminders:', error);
    }
  }

  /**
   * Send email reminder
   */
  private async sendEmailReminder(reminder: any): Promise<void> {
    const data: SessionReminderData = JSON.parse(reminder.data);
    const sessionTime = new Date(data.sessionTime);

    const hoursText = reminder.hours_before === 1 ? 'in 1 hour' : `in ${reminder.hours_before} hours`;

    const appointmentDetails = {
      date: sessionTime.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      time: sessionTime.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        timeZoneName: 'short'
      }),
      duration: '60 minutes',
      type: 'Video Session'
    };

    await this.emailService.sendSessionReminder({
      clientEmail: data.clientEmail,
      coachEmail: data.coachEmail,
      clientName: data.clientName,
      coachName: data.coachName,
      appointmentDetails,
      timeUntilSession: hoursText
    });
  }

  /**
   * Send message reminder (coach as sender)
   */
  private async sendMessageReminder(reminder: any): Promise<void> {
    const data: SessionReminderData = JSON.parse(reminder.data);
    const sessionTime = new Date(data.sessionTime);

    const timeString = sessionTime.toLocaleString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZoneName: 'short'
    });

    const hoursText = reminder.hours_before === 1 ? '1 hour' : `${reminder.hours_before} hours`;

    const messageBody = `Hi ${data.clientName}! This is a friendly reminder that we have a coaching session scheduled in ${hoursText} on ${timeString}. Looking forward to our session together! If you need to reschedule, please let me know as soon as possible.`;

    // Auto-create conversation and send message
    await this.createConversationAndSendMessage({
      senderId: data.coachId,
      recipientId: data.clientId,
      sessionId: data.sessionId,
      messageBody,
      messageType: 'appointment_reminder'
    });
  }

  /**
   * Cancel all reminders for an appointment (when appointment is cancelled/rescheduled)
   */
  async cancelSessionReminders(sessionId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('scheduled_reminders')
        .update({ cancelled: true, cancelled_at: new Date().toISOString() })
        .eq('session_id', sessionId)
        .eq('sent', false);

      if (error) {
        console.error('Error cancelling reminders:', error);
      } else {
        console.log(`Cancelled reminders for session ${sessionId}`);
      }
    } catch (error) {
      console.error('Error cancelling session reminders:', error);
    }
  }

  /**
   * Send immediate email reminder (for sessions starting very soon)
   */
  private async sendImmediateEmailReminder(data: SessionReminderData): Promise<void> {
    const sessionTime = new Date(data.sessionTime);
    const now = new Date();
    const minutesUntilSession = Math.round((sessionTime.getTime() - now.getTime()) / (1000 * 60));

    const appointmentDetails = {
      date: sessionTime.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      time: sessionTime.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        timeZoneName: 'short'
      }),
      duration: '60 minutes',
      type: 'Video Session'
    };

    const timeUntilSession = minutesUntilSession <= 1 ? 'in 1 minute' : `in ${minutesUntilSession} minutes`;

    try {
      await this.emailService.sendSessionReminder({
        clientEmail: data.clientEmail,
        coachEmail: data.coachEmail,
        clientName: data.clientName,
        coachName: data.coachName,
        appointmentDetails,
        timeUntilSession
      });
      console.log(`Sent immediate email reminder for session ${data.sessionId}`);
    } catch (error) {
      console.error('Failed to send immediate email reminder:', error);
    }
  }

  /**
   * Send immediate message reminder (for sessions starting very soon)
   */
  private async sendImmediateMessageReminder(data: SessionReminderData): Promise<void> {
    const sessionTime = new Date(data.sessionTime);
    const now = new Date();
    const minutesUntilSession = Math.round((sessionTime.getTime() - now.getTime()) / (1000 * 60));

    const messageBody = `⏰ URGENT: Hi ${data.clientName}! Your coaching session starts in ${minutesUntilSession} minutes! Please join the session now. Looking forward to meeting with you! - ${data.coachName}`;

    try {
      // Auto-create conversation and send urgent message
      await this.createConversationAndSendMessage({
        senderId: data.coachId,
        recipientId: data.clientId,
        sessionId: data.sessionId,
        messageBody,
        messageType: 'urgent_session_reminder'
      });

      console.log(`Sent immediate message reminder for session ${data.sessionId}`);
    } catch (error) {
      console.error('Failed to send immediate message reminder:', error);
    }
  }

  /**
   * Create conversation and send message (auto-creates conversation if needed)
   */
  private async createConversationAndSendMessage(params: {
    senderId: string;
    recipientId: string;
    sessionId: string;
    messageBody: string;
    messageType: string;
  }): Promise<void> {
    const { senderId, recipientId, sessionId, messageBody, messageType } = params;

    try {
      // Check if conversation already exists between coach and client
      const { data: existingMessages } = await supabase
        .from('messages')
        .select('id')
        .or(
          `and(sender_id.eq.${senderId},recipient_id.eq.${recipientId}),and(sender_id.eq.${recipientId},recipient_id.eq.${senderId})`
        )
        .limit(1);

      // Insert the reminder message
      const { data: messageData, error: messageError } = await supabase
        .from('messages')
        .insert({
          sender_id: senderId,
          recipient_id: recipientId,
          session_id: sessionId,
          body: messageBody,
          created_at: new Date().toISOString(),
          is_system_message: true,
          system_message_type: messageType
        })
        .select()
        .single();

      if (messageError) {
        console.error('Error sending reminder message:', messageError);
        throw messageError;
      }

      // If this is the first message between them, log conversation creation
      if (!existingMessages || existingMessages.length === 0) {
        console.log(`Created new conversation between coach ${senderId} and client ${recipientId} via appointment reminder`);
      }

      // Emit real-time message if socket.io is available
      await this.emitRealTimeMessage(messageData, recipientId);

      console.log(`Reminder message sent for session ${sessionId}: ${messageType}`);
    } catch (error) {
      console.error('Error creating conversation and sending message:', error);
      throw error;
    }
  }

  /**
   * Emit real-time message via Socket.IO
   */
  private async emitRealTimeMessage(messageData: any, recipientId: string): Promise<void> {
    try {
      // Import socket.io instance if available
      const { io } = require('../index');
      if (io) {
        io.to(`user:${recipientId}`).emit('message:new', messageData);
        console.log(`Real-time message emitted to user ${recipientId}`);
      }
    } catch (error) {
      // Socket.io not available or error occurred, continue without real-time
      console.log('Socket.io not available for real-time messaging');
    }
  }

  /**
   * Update reminder settings (for future implementation)
   */
  async updateReminderSettings(settings: Partial<ReminderSettings>): Promise<void> {
    this.defaultSettings = { ...this.defaultSettings, ...settings };
    // In the future, store this in database or config
  }
}

export const appointmentReminderService = new AppointmentReminderService();