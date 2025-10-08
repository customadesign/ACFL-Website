import { google, calendar_v3 } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { supabase } from '../lib/supabase';
import { TimezoneUtils } from '../utils/timezone';

interface CalendarEvent {
  id?: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  location?: string;
  attendees?: string[];
}

interface CalendarCredentials {
  access_token: string;
  refresh_token?: string;
  expires_at?: Date;
}

export class GoogleCalendarService {
  private oauth2Client: OAuth2Client;
  private calendar: calendar_v3.Calendar;

  constructor() {
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET || !process.env.GOOGLE_REDIRECT_URI) {
      console.error('Google Calendar integration not configured. Missing required environment variables:', {
        clientId: !!process.env.GOOGLE_CLIENT_ID,
        clientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
        redirectUri: !!process.env.GOOGLE_REDIRECT_URI
      });
    }

    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    this.calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });
  }

  /**
   * Get OAuth authorization URL
   */
  getAuthUrl(coachId: string): string {
    const scopes = [
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile'
    ];

    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      state: JSON.stringify({ coachId, provider: 'google' }),
      prompt: 'consent' // Force consent to get refresh token
    });
  }

  /**
   * Exchange authorization code for tokens
   */
  async exchangeCodeForTokens(code: string): Promise<{
    access_token: string;
    refresh_token?: string;
    expires_at?: Date;
    user_email?: string;
  }> {
    try {
      const { tokens } = await this.oauth2Client.getToken(code);

      if (!tokens.access_token) {
        throw new Error('No access token received');
      }

      // Set credentials to get user info
      this.oauth2Client.setCredentials(tokens);

      // Get user info to identify the calendar
      const oauth2 = google.oauth2({ version: 'v2', auth: this.oauth2Client });
      const userInfo = await oauth2.userinfo.get();

      const expires_at = tokens.expiry_date ? new Date(tokens.expiry_date) : undefined;

      return {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token || undefined,
        expires_at,
        user_email: userInfo.data.email || undefined
      };
    } catch (error) {
      console.error('Error exchanging code for tokens:', error);
      throw new Error('Failed to exchange authorization code');
    }
  }

  /**
   * Set up OAuth client with stored credentials
   */
  private async setupAuth(connectionId: string): Promise<boolean> {
    try {
      // Check if Google Calendar integration is properly configured
      if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
        console.error('Google Calendar integration not configured. Missing client ID or secret.');
        return false;
      }
      const { data: connection, error } = await supabase
        .from('coach_calendar_connections')
        .select('access_token, refresh_token, token_expires_at')
        .eq('id', connectionId)
        .eq('provider', 'google')
        .eq('is_active', true)
        .single();

      if (error || !connection) {
        console.error('Calendar connection not found:', error);
        return false;
      }

      const credentials: any = {
        access_token: connection.access_token
      };

      if (connection.refresh_token) {
        credentials.refresh_token = connection.refresh_token;
      }

      if (connection.token_expires_at) {
        credentials.expiry_date = new Date(connection.token_expires_at).getTime();
      }

      this.oauth2Client.setCredentials(credentials);

      // Check if token needs refresh
      if (connection.token_expires_at && new Date() >= new Date(connection.token_expires_at)) {
        await this.refreshAccessToken(connectionId);
      }

      return true;
    } catch (error) {
      console.error('Error setting up auth:', error);
      return false;
    }
  }

  /**
   * Refresh access token
   */
  private async refreshAccessToken(connectionId: string): Promise<void> {
    try {
      const { credentials } = await this.oauth2Client.refreshAccessToken();

      if (!credentials.access_token) {
        throw new Error('Failed to refresh access token');
      }

      const updateData: any = {
        access_token: credentials.access_token,
        updated_at: new Date().toISOString()
      };

      if (credentials.expiry_date) {
        updateData.token_expires_at = new Date(credentials.expiry_date).toISOString();
      }

      await supabase
        .from('coach_calendar_connections')
        .update(updateData)
        .eq('id', connectionId);

      console.log('Access token refreshed successfully');
    } catch (error) {
      console.error('Error refreshing access token:', error);

      // Mark connection as inactive if refresh fails
      await supabase
        .from('coach_calendar_connections')
        .update({
          is_active: false,
          last_sync_status: 'error',
          last_sync_error: 'Token refresh failed. Please reconnect your calendar.'
        })
        .eq('id', connectionId);

      throw error;
    }
  }

  /**
   * Get user's primary calendar
   */
  async getPrimaryCalendar(connectionId: string, credentials?: CalendarCredentials): Promise<{
    id: string;
    name: string;
    timeZone?: string;
  } | null> {
    try {
      // If credentials are provided (OAuth callback), use them directly
      if (credentials) {
        this.oauth2Client.setCredentials({
          access_token: credentials.access_token,
          refresh_token: credentials.refresh_token,
          expiry_date: credentials.expires_at?.getTime()
        });
      } else {
        // Otherwise use stored credentials
        const authSuccess = await this.setupAuth(connectionId);
        if (!authSuccess) return null;
      }

      const response = await this.calendar.calendars.get({
        calendarId: 'primary'
      });

      return {
        id: response.data.id || 'primary',
        name: response.data.summary || 'Primary Calendar',
        timeZone: response.data.timeZone
      };
    } catch (error) {
      console.error('Error getting primary calendar:', error);
      return null;
    }
  }

  /**
   * Create a calendar event
   */
  async createEvent(
    connectionId: string,
    calendarId: string,
    event: CalendarEvent
  ): Promise<string | null> {
    try {
      const authSuccess = await this.setupAuth(connectionId);
      if (!authSuccess) return null;

      // Get calendar timezone
      const calendar = await this.getPrimaryCalendar(connectionId);
      const calendarTimeZone = TimezoneUtils.normalizeTimezone(calendar?.timeZone);

      // Convert session times to calendar timezone
      const sessionData = {
        starts_at: event.startTime,
        ends_at: event.endTime
      };

      const timeData = TimezoneUtils.convertSessionToTimezone(sessionData, {
        targetTimeZone: calendarTimeZone
      });

      const eventData: calendar_v3.Schema$Event = {
        summary: event.title,
        description: event.description,
        start: {
          dateTime: timeData.startTime,
          timeZone: timeData.targetTimeZone
        },
        end: {
          dateTime: timeData.endTime,
          timeZone: timeData.targetTimeZone
        },
        location: event.location
      };

      if (event.attendees && event.attendees.length > 0) {
        eventData.attendees = event.attendees.map(email => ({ email }));
      }

      const response = await this.calendar.events.insert({
        calendarId: calendarId,
        requestBody: eventData
      });

      return response.data.id || null;
    } catch (error) {
      console.error('Error creating calendar event:', error);
      throw error;
    }
  }

  /**
   * Update a calendar event
   */
  async updateEvent(
    connectionId: string,
    calendarId: string,
    eventId: string,
    event: CalendarEvent
  ): Promise<boolean> {
    try {
      const authSuccess = await this.setupAuth(connectionId);
      if (!authSuccess) return false;

      // Get calendar timezone
      const calendar = await this.getPrimaryCalendar(connectionId);
      const calendarTimeZone = TimezoneUtils.normalizeTimezone(calendar?.timeZone);

      // Convert session times to calendar timezone
      const sessionData = {
        starts_at: event.startTime,
        ends_at: event.endTime
      };

      const timeData = TimezoneUtils.convertSessionToTimezone(sessionData, {
        targetTimeZone: calendarTimeZone
      });

      const eventData: calendar_v3.Schema$Event = {
        summary: event.title,
        description: event.description,
        start: {
          dateTime: timeData.startTime,
          timeZone: timeData.targetTimeZone
        },
        end: {
          dateTime: timeData.endTime,
          timeZone: timeData.targetTimeZone
        },
        location: event.location
      };

      if (event.attendees && event.attendees.length > 0) {
        eventData.attendees = event.attendees.map(email => ({ email }));
      }

      await this.calendar.events.update({
        calendarId: calendarId,
        eventId: eventId,
        requestBody: eventData
      });

      return true;
    } catch (error) {
      console.error('Error updating calendar event:', error);
      throw error;
    }
  }

  /**
   * Delete a calendar event
   */
  async deleteEvent(
    connectionId: string,
    calendarId: string,
    eventId: string
  ): Promise<boolean> {
    try {
      const authSuccess = await this.setupAuth(connectionId);
      if (!authSuccess) return false;

      await this.calendar.events.delete({
        calendarId: calendarId,
        eventId: eventId
      });

      return true;
    } catch (error) {
      console.error('Error deleting calendar event:', error);
      // If event not found (404), consider it successfully deleted
      if (error && typeof error === 'object' && 'code' in error && error.code === 404) {
        return true;
      }
      throw error;
    }
  }

  /**
   * Get calendar events in a date range
   */
  async getEvents(
    connectionId: string,
    calendarId: string,
    startTime: string,
    endTime: string
  ): Promise<CalendarEvent[]> {
    try {
      const authSuccess = await this.setupAuth(connectionId);
      if (!authSuccess) return [];

      const response = await this.calendar.events.list({
        calendarId: calendarId,
        timeMin: startTime,
        timeMax: endTime,
        singleEvents: true,
        orderBy: 'startTime'
      });

      return (response.data.items || []).map(event => ({
        id: event.id || '',
        title: event.summary || 'Untitled Event',
        description: event.description || '',
        startTime: event.start?.dateTime || event.start?.date || '',
        endTime: event.end?.dateTime || event.end?.date || '',
        location: event.location || '',
        attendees: event.attendees?.map(a => a.email || '').filter(email => email) || []
      }));
    } catch (error) {
      console.error('Error getting calendar events:', error);
      return [];
    }
  }

  /**
   * Test connection by getting calendar info
   */
  async testConnection(connectionId: string): Promise<{
    success: boolean;
    error?: string;
    calendarName?: string;
  }> {
    try {
      const calendar = await this.getPrimaryCalendar(connectionId);

      if (!calendar) {
        return {
          success: false,
          error: 'Unable to access calendar'
        };
      }

      return {
        success: true,
        calendarName: calendar.name
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Connection test failed'
      };
    }
  }

  /**
   * Convert session to calendar event format
   */
  convertSessionToEvent(
    session: any,
    template: { title: string; description: string },
    includeClientDetails: boolean = false
  ): CalendarEvent {
    const clientName = includeClientDetails
      ? `${session.clients?.first_name || ''} ${session.clients?.last_name || ''}`.trim()
      : 'Client';

    const coachName = `${session.coaches?.first_name || ''} ${session.coaches?.last_name || ''}`.trim();

    let title = template.title;
    if (includeClientDetails && clientName !== 'Client') {
      title = `${title} - ${clientName}`;
    }

    let description = template.description;
    if (session.session_notes) {
      description += `\n\nSession Notes: ${session.session_notes}`;
    }

    // Convert session_date and duration_minutes to start/end times
    const sessionStart = new Date(session.session_date);
    const sessionEnd = new Date(sessionStart.getTime() + (session.duration_minutes * 60 * 1000));

    return {
      title,
      description,
      startTime: sessionStart.toISOString(),
      endTime: sessionEnd.toISOString(),
      location: session.meeting_url || 'Virtual Session',
      attendees: includeClientDetails && session.clients?.email ? [session.clients.email] : []
    };
  }
}

export const googleCalendarService = new GoogleCalendarService();