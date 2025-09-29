import { ConfidentialClientApplication, AuthenticationResult } from '@azure/msal-node';
import { supabase } from '../lib/supabase';
import fetch from 'node-fetch';
import { TimezoneUtils } from '../utils/timezone';

interface CalendarCredentials {
  access_token: string;
  refresh_token?: string;
  expires_at?: Date;
}

interface CalendarEvent {
  id?: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  location?: string;
  attendees?: string[];
}

interface OutlookEvent {
  id?: string;
  subject: string;
  body?: {
    contentType: string;
    content: string;
  };
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
  location?: {
    displayName: string;
  };
  attendees?: Array<{
    emailAddress: {
      address: string;
      name?: string;
    };
  }>;
}

export class OutlookCalendarService {
  private msalClient: ConfidentialClientApplication;
  private readonly graphBaseUrl = 'https://graph.microsoft.com/v1.0';

  constructor() {
    // Only initialize if Microsoft credentials are provided
    if (process.env.MICROSOFT_CLIENT_ID && process.env.MICROSOFT_CLIENT_SECRET) {
      this.msalClient = new ConfidentialClientApplication({
        auth: {
          clientId: process.env.MICROSOFT_CLIENT_ID!,
          clientSecret: process.env.MICROSOFT_CLIENT_SECRET!,
          authority: 'https://login.microsoftonline.com/common'
        }
      });
    }
  }

  /**
   * Check if Outlook integration is available
   */
  isAvailable(): boolean {
    return !!this.msalClient;
  }

  /**
   * Get OAuth authorization URL
   */
  async getAuthUrl(coachId: string): Promise<string> {
    if (!this.msalClient) {
      throw new Error('Microsoft Outlook integration not configured. Please add MICROSOFT_CLIENT_ID and MICROSOFT_CLIENT_SECRET to your environment variables.');
    }

    const scopes = [
      'https://graph.microsoft.com/Calendars.ReadWrite',
      'https://graph.microsoft.com/User.Read'
    ];

    const authCodeUrlParameters = {
      scopes: scopes,
      redirectUri: process.env.MICROSOFT_REDIRECT_URI!,
      state: JSON.stringify({ coachId, provider: 'outlook' }),
      prompt: 'consent'
    };

    return await this.msalClient.getAuthCodeUrl(authCodeUrlParameters as any);
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
    if (!this.msalClient) {
      throw new Error('Microsoft Outlook integration not configured.');
    }

    try {
      const tokenRequest = {
        code: code,
        scopes: [
          'https://graph.microsoft.com/Calendars.ReadWrite',
          'https://graph.microsoft.com/User.Read'
        ],
        redirectUri: process.env.MICROSOFT_REDIRECT_URI!
      };

      const response: AuthenticationResult = await this.msalClient.acquireTokenByCode(tokenRequest);

      if (!response.accessToken) {
        throw new Error('No access token received');
      }

      // Get user info
      const userInfo = await this.getUserInfo(response.accessToken);

      const expires_at = response.expiresOn || undefined;

      return {
        access_token: response.accessToken,
        refresh_token: undefined, // MSAL handles refresh automatically
        expires_at: expires_at,
        user_email: userInfo?.mail || userInfo?.userPrincipalName || undefined
      };
    } catch (error) {
      console.error('Error exchanging code for tokens:', error);
      throw new Error('Failed to exchange authorization code');
    }
  }

  /**
   * Get user info from Microsoft Graph
   */
  private async getUserInfo(accessToken: string): Promise<any> {
    try {
      const response = await fetch(`${this.graphBaseUrl}/me`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting user info:', error);
      return null;
    }
  }

  /**
   * Get valid access token (refresh if needed)
   */
  private async getValidAccessToken(connectionId: string): Promise<string | null> {
    try {
      const { data: connection, error } = await supabase
        .from('coach_calendar_connections')
        .select('access_token, refresh_token, token_expires_at')
        .eq('id', connectionId)
        .eq('provider', 'outlook')
        .eq('is_active', true)
        .single();

      if (error || !connection) {
        console.error('Calendar connection not found:', error);
        return null;
      }

      // Check if token is still valid
      if (connection.token_expires_at && new Date() < new Date(connection.token_expires_at)) {
        return connection.access_token;
      }

      // Try to refresh token
      if (connection.refresh_token) {
        try {
          const refreshedToken = await this.refreshAccessToken(connectionId, connection.refresh_token);
          return refreshedToken;
        } catch (refreshError) {
          console.error('Failed to refresh token:', refreshError);
          return null;
        }
      }

      return null;
    } catch (error) {
      console.error('Error getting valid access token:', error);
      return null;
    }
  }

  /**
   * Refresh access token
   */
  private async refreshAccessToken(connectionId: string, refreshToken: string): Promise<string> {
    try {
      const refreshRequest = {
        refreshToken: refreshToken,
        scopes: [
          'https://graph.microsoft.com/Calendars.ReadWrite',
          'https://graph.microsoft.com/User.Read'
        ]
      };

      const response: AuthenticationResult = await this.msalClient.acquireTokenByRefreshToken(refreshRequest);

      if (!response.accessToken) {
        throw new Error('Failed to refresh access token');
      }

      const updateData: any = {
        access_token: response.accessToken,
        updated_at: new Date().toISOString()
      };

      // MSAL handles refresh tokens automatically, no need to store them

      if (response.expiresOn) {
        updateData.token_expires_at = response.expiresOn.toISOString();
      }

      await supabase
        .from('coach_calendar_connections')
        .update(updateData)
        .eq('id', connectionId);

      console.log('Access token refreshed successfully');
      return response.accessToken;
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
      let accessToken: string;

      // If credentials are provided (OAuth callback), use them directly
      if (credentials) {
        accessToken = credentials.access_token;
      } else {
        // Otherwise get stored credentials
        const token = await this.getValidAccessToken(connectionId);
        if (!token) return null;
        accessToken = token;
      }

      const response = await fetch(`${this.graphBaseUrl}/me/calendar`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const calendar = await response.json() as any;

      return {
        id: calendar.id || 'primary',
        name: calendar.name || 'Calendar',
        timeZone: calendar.defaultOnlineeMeetingProvider || this.getUserTimezoneFromGraph(accessToken) || 'UTC'
      };
    } catch (error) {
      console.error('Error getting primary calendar:', error);
      return null;
    }
  }

  /**
   * Get user's timezone from Microsoft Graph
   */
  private async getUserTimezoneFromGraph(accessToken: string): Promise<string | null> {
    try {
      const response = await fetch(`${this.graphBaseUrl}/me/mailboxSettings/timeZone`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        return null;
      }

      const data = await response.json() as any;
      return data.value || null;
    } catch (error) {
      console.error('Error getting user timezone:', error);
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
      const accessToken = await this.getValidAccessToken(connectionId);
      if (!accessToken) return null;

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

      const outlookEvent: OutlookEvent = {
        subject: event.title,
        start: {
          dateTime: timeData.startTime,
          timeZone: timeData.targetTimeZone
        },
        end: {
          dateTime: timeData.endTime,
          timeZone: timeData.targetTimeZone
        }
      };

      if (event.description) {
        outlookEvent.body = {
          contentType: 'text',
          content: event.description
        };
      }

      if (event.location) {
        outlookEvent.location = {
          displayName: event.location
        };
      }

      if (event.attendees && event.attendees.length > 0) {
        outlookEvent.attendees = event.attendees.map(email => ({
          emailAddress: {
            address: email
          }
        }));
      }

      const response = await fetch(`${this.graphBaseUrl}/me/events`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(outlookEvent)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
      }

      const createdEvent = await response.json() as any;
      return createdEvent.id || null;
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
      const accessToken = await this.getValidAccessToken(connectionId);
      if (!accessToken) return false;

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

      const outlookEvent: OutlookEvent = {
        subject: event.title,
        start: {
          dateTime: timeData.startTime,
          timeZone: timeData.targetTimeZone
        },
        end: {
          dateTime: timeData.endTime,
          timeZone: timeData.targetTimeZone
        }
      };

      if (event.description) {
        outlookEvent.body = {
          contentType: 'text',
          content: event.description
        };
      }

      if (event.location) {
        outlookEvent.location = {
          displayName: event.location
        };
      }

      if (event.attendees && event.attendees.length > 0) {
        outlookEvent.attendees = event.attendees.map(email => ({
          emailAddress: {
            address: email
          }
        }));
      }

      const response = await fetch(`${this.graphBaseUrl}/me/events/${eventId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(outlookEvent)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
      }

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
      const accessToken = await this.getValidAccessToken(connectionId);
      if (!accessToken) return false;

      const response = await fetch(`${this.graphBaseUrl}/me/events/${eventId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      // 204 No Content = successful deletion
      // 404 Not Found = event already deleted, consider success
      return response.status === 204 || response.status === 404;
    } catch (error) {
      console.error('Error deleting calendar event:', error);
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
      const accessToken = await this.getValidAccessToken(connectionId);
      if (!accessToken) return [];

      const url = `${this.graphBaseUrl}/me/events?$filter=start/dateTime ge '${startTime}' and end/dateTime le '${endTime}'&$orderby=start/dateTime`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json() as any;

      return (data.value || []).map((event: any) => ({
        id: event.id || '',
        title: event.subject || 'Untitled Event',
        description: event.body?.content || '',
        startTime: event.start?.dateTime || '',
        endTime: event.end?.dateTime || '',
        location: event.location?.displayName || '',
        attendees: event.attendees?.map((a: any) => a.emailAddress?.address || '').filter((email: string) => email) || []
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

export const outlookCalendarService = new OutlookCalendarService();