# Calendar Integration Documentation

This document explains how to set up and use the Google Calendar and Outlook Calendar integration for the ACT Coaching For Life platform.

## Overview

The calendar integration allows coaches to automatically sync their coaching appointments with their external calendars (Google Calendar or Outlook/Microsoft Calendar). This eliminates the need for manual calendar management and ensures appointments are visible across all calendar platforms.

## Features

### For Coaches:
- **Connect multiple calendars**: Support for both Google Calendar and Outlook Calendar
- **Automatic sync**: Appointments are automatically created, updated, and removed from external calendars
- **Privacy controls**: Choose whether to include client details in calendar events
- **Customizable templates**: Configure event titles and descriptions
- **Real-time sync**: Changes are processed within minutes via background jobs
- **Manual sync**: Force immediate synchronization when needed
- **Connection management**: Test connections, view sync status, and manage settings

### Sync Capabilities:
- ✅ Create calendar events for new appointments
- ✅ Update calendar events when appointments are rescheduled
- ✅ Remove calendar events when appointments are cancelled
- ✅ Bulk sync existing appointments
- ✅ Handle timezone conversions automatically
- ✅ Retry failed sync operations with exponential backoff

## Setup Instructions

### 1. Database Migration

Run the calendar integration database migration:

```sql
-- Execute the migration file
psql -d your_database < backend/database/migrations/create_calendar_integration_tables.sql
```

### 2. Environment Variables

Add the following environment variables to your `.env` file:

```env
# Google Calendar Integration
GOOGLE_CLIENT_ID=your-google-oauth-client-id
GOOGLE_CLIENT_SECRET=your-google-oauth-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3001/api/calendar-integration/callback

# Microsoft/Outlook Calendar Integration
MICROSOFT_CLIENT_ID=your-microsoft-application-id
MICROSOFT_CLIENT_SECRET=your-microsoft-client-secret
MICROSOFT_REDIRECT_URI=http://localhost:3001/api/calendar-integration/callback
```

### 3. Google Calendar Setup

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google Calendar API
4. Create OAuth 2.0 credentials:
   - Application type: Web application
   - Authorized redirect URIs: `http://localhost:3001/api/calendar-integration/callback` (adjust for your domain)
5. Copy the Client ID and Client Secret to your `.env` file

**Required Google API Scopes:**
- `https://www.googleapis.com/auth/calendar`
- `https://www.googleapis.com/auth/userinfo.email`
- `https://www.googleapis.com/auth/userinfo.profile`

### 4. Microsoft/Outlook Calendar Setup

1. Go to the [Azure Portal](https://portal.azure.com/)
2. Navigate to "Azure Active Directory" > "App registrations"
3. Click "New registration"
4. Configure the application:
   - Name: ACT Coaching Calendar Integration
   - Supported account types: Accounts in any organizational directory and personal Microsoft accounts
   - Redirect URI: `http://localhost:3001/api/calendar-integration/callback` (Web)
5. After creation, go to "Certificates & secrets" and create a new client secret
6. Copy the Application (client) ID and client secret to your `.env` file

**Required Microsoft Graph API Permissions:**
- `Calendars.ReadWrite` (Delegated)
- `User.Read` (Delegated)

### 5. Install Dependencies

```bash
cd backend
npm install googleapis @azure/msal-node
```

### 6. Start the Application

The calendar sync service will automatically start when you run the backend application. Sync jobs are processed every 2 minutes via cron jobs.

## Usage Guide

### For Coaches

#### Connecting a Calendar

1. Navigate to the Coach Dashboard
2. Go to the "Calendar Integration" section
3. Click "Connect Google Calendar" or "Connect Outlook Calendar"
4. Authorize the application to access your calendar
5. You'll be redirected back to the platform with a success confirmation

#### Managing Settings

Each connected calendar has configurable settings:

**General Settings:**
- **Enable Sync**: Turn automatic synchronization on/off
- **Auto-create Events**: Automatically create events for new appointments
- **Auto-update Events**: Automatically update events when appointments change

**Privacy Settings:**
- **Include Client Details**: Show client names and email addresses in calendar events
  - ⚠️ **Privacy Note**: Consider your organization's privacy policies before enabling

**Event Templates:**
- **Event Title Template**: Default title for calendar events (e.g., "ACT Coaching Session")
- **Event Description Template**: Default description for calendar events

#### Manual Sync

- Use the "Sync Now" button to force immediate synchronization
- Use the "Test" button to verify the connection is working
- View the last sync time and status for each connected calendar

#### Disconnecting a Calendar

1. In the Calendar Integration section, find the calendar you want to disconnect
2. Click the "Disconnect" button
3. Confirm the disconnection
4. The calendar connection will be removed, but existing events will remain in your external calendar

### Sync Behavior

#### Event Creation
- New appointments automatically create calendar events
- Event timing matches the appointment start/end times
- Time zones are handled automatically

#### Event Updates
- Rescheduled appointments update the corresponding calendar event
- Changed appointment details update the event description

#### Event Deletion
- Cancelled appointments remove the calendar event
- The sync respects the "auto-update" setting

#### Privacy Modes

**With Client Details (include_client_details = true):**
- Event Title: "ACT Coaching Session - John Doe"
- Attendees: Client email address included
- Description: Includes session notes if available

**Without Client Details (include_client_details = false):**
- Event Title: "ACT Coaching Session"
- Attendees: No attendees added
- Description: Generic coaching session description

## Technical Architecture

### Database Tables

1. **coach_calendar_connections**: Stores OAuth tokens and connection settings
2. **calendar_event_mappings**: Maps internal sessions to external calendar events
3. **calendar_sync_queue**: Queue for processing sync operations asynchronously

### Services

1. **GoogleCalendarService**: Handles Google Calendar API interactions
2. **OutlookCalendarService**: Handles Microsoft Graph API interactions
3. **CalendarSyncService**: Manages sync operations and queue processing
4. **CronService**: Processes sync queue every 2 minutes

### API Endpoints

- `GET /api/calendar-integration/connect/{provider}/{coachId}` - Initiate OAuth flow
- `GET /api/calendar-integration/callback` - Handle OAuth callback
- `GET /api/calendar-integration/connections/{coachId}` - Get coach's connections
- `PUT /api/calendar-integration/connections/{connectionId}` - Update connection settings
- `DELETE /api/calendar-integration/connections/{connectionId}` - Disconnect calendar
- `POST /api/calendar-integration/connections/{connectionId}/sync` - Manual sync
- `POST /api/calendar-integration/connections/{connectionId}/test` - Test connection

### Security Considerations

1. **Token Storage**: OAuth tokens are stored encrypted in the database
2. **Token Refresh**: Expired tokens are automatically refreshed
3. **Scope Limitation**: Only necessary calendar permissions are requested
4. **Privacy Controls**: Client details are only included when explicitly enabled
5. **Error Handling**: Failed operations are retried with exponential backoff

### Error Handling

- **Connection Issues**: Automatic retry with exponential backoff
- **Token Expiry**: Automatic token refresh
- **API Limits**: Respects rate limits and retries appropriately
- **Privacy Violations**: Prevents unauthorized access to coach data

## Troubleshooting

### Common Issues

1. **OAuth Errors**
   - Verify client IDs and secrets are correct
   - Check redirect URIs match exactly
   - Ensure APIs are enabled in console

2. **Sync Not Working**
   - Check if sync is enabled in connection settings
   - Verify cron jobs are running
   - Check sync queue for failed jobs

3. **Permission Denied**
   - Re-authorize the application
   - Check API permissions in cloud console
   - Verify token hasn't been revoked

4. **Events Not Appearing**
   - Check if auto-create is enabled
   - Verify appointment is in confirmed status
   - Check sync queue for errors

### Monitoring

- View sync status in the Calendar Integration UI
- Check application logs for sync job processing
- Monitor the `calendar_sync_queue` table for failed jobs

### Support

For technical support with calendar integration:

1. Check the sync status in the coach dashboard
2. Test the connection using the "Test" button
3. Try manual sync using "Sync Now"
4. Check application logs for detailed error messages
5. Contact system administrator if issues persist

## Development

### Adding New Calendar Providers

To add support for additional calendar providers:

1. Create a new service class implementing the calendar interface
2. Add OAuth configuration for the provider
3. Update the connection routes and UI
4. Add database enum values for the provider
5. Test the complete OAuth and sync flow

### API Rate Limits

- **Google Calendar API**: 1,000,000 requests per day
- **Microsoft Graph API**: Varies by license type
- **Sync Frequency**: Every 2 minutes (configurable)

### Scaling Considerations

- Consider database connection pooling for high-volume installs
- Monitor API usage and implement additional rate limiting if needed
- Consider implementing webhook subscriptions for real-time updates
- Scale sync worker processes for high appointment volumes