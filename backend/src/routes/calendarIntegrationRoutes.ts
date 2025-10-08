import { Router, Request, Response } from 'express';
import { supabase } from '../lib/supabase';
import { authenticate } from '../middleware/auth';
import { JWTPayload } from '../types/auth';
import { googleCalendarService } from '../services/googleCalendarService';
import { outlookCalendarService } from '../services/outlookCalendarService';
import { calendarSyncService } from '../services/calendarSyncService';

interface AuthRequest extends Request {
  user?: JWTPayload;
}

const router = Router();

// OAuth callback route (no authentication required)
router.get('/callback', async (req: Request, res: Response) => {
  try {
    const { code, state, error: oauthError } = req.query;

    if (oauthError) {
      console.error('OAuth error:', oauthError);
      return res.redirect(`${process.env.FRONTEND_URL}/coaches/calendar?error=oauth_error`);
    }

    if (!code || !state) {
      return res.redirect(`${process.env.FRONTEND_URL}/coaches/calendar?error=missing_parameters`);
    }

    // Parse state to get coach ID and provider
    let stateData: { coachId: string; provider: string };
    try {
      stateData = JSON.parse(state as string);
    } catch (parseError) {
      console.error('Error parsing OAuth state:', parseError);
      return res.redirect(`${process.env.FRONTEND_URL}/coaches/calendar?error=invalid_state`);
    }

    const { coachId, provider } = stateData;

    // Exchange code for tokens
    let tokenData: {
      access_token: string;
      refresh_token?: string;
      expires_at?: Date;
      user_email?: string;
    };

    if (provider === 'google') {
      tokenData = await googleCalendarService.exchangeCodeForTokens(code as string);
    } else if (provider === 'outlook') {
      tokenData = await outlookCalendarService.exchangeCodeForTokens(code as string);
    } else {
      return res.redirect(`${process.env.FRONTEND_URL}/coaches/calendar?error=invalid_provider`);
    }

    // Get calendar info
    const calendarService = provider === 'google' ? googleCalendarService : outlookCalendarService;

    // First, save the connection temporarily to get calendar info
    const { data: tempConnection, error: tempError } = await supabase
      .from('coach_calendar_connections')
      .insert({
        coach_id: coachId,
        provider,
        provider_user_id: tokenData.user_email || 'unknown',
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        token_expires_at: tokenData.expires_at?.toISOString(),
        is_active: false // Temporarily inactive until we get calendar info
      })
      .select('id')
      .single();

    if (tempError) {
      console.error('Error saving temporary connection:', tempError);
      return res.redirect(`${process.env.FRONTEND_URL}/coaches/calendar?error=save_failed`);
    }

    // Get primary calendar info
    const calendar = await calendarService.getPrimaryCalendar(tempConnection.id, tokenData);

    if (!calendar) {
      // Clean up temp connection
      await supabase
        .from('coach_calendar_connections')
        .delete()
        .eq('id', tempConnection.id);

      return res.redirect(`${process.env.FRONTEND_URL}/coaches/calendar?error=calendar_access_failed`);
    }

    // Update connection with calendar info and activate it
    const { error: updateError } = await supabase
      .from('coach_calendar_connections')
      .update({
        calendar_id: calendar.id,
        calendar_name: calendar.name,
        is_active: true,
        last_sync_status: 'success'
      })
      .eq('id', tempConnection.id);

    if (updateError) {
      console.error('Error updating connection:', updateError);
      return res.redirect(`${process.env.FRONTEND_URL}/coaches/calendar?error=update_failed`);
    }

    // Queue initial full sync
    await calendarSyncService.queueSync(tempConnection.id, 'full_sync', undefined, 1);

    console.log(`Successfully connected ${provider} calendar for coach ${coachId}`);
    res.redirect(`${process.env.FRONTEND_URL}/coaches/calendar?success=connected&provider=${provider}`);

  } catch (error) {
    console.error('Error handling OAuth callback:', error);
    res.redirect(`${process.env.FRONTEND_URL}/coaches/calendar?error=callback_failed`);
  }
});

// All other routes require authentication
router.use(authenticate);

// =========================================================
// OAUTH AUTHORIZATION FLOWS
// =========================================================

/**
 * Initiate OAuth flow for Google Calendar
 * GET /calendar/connect/google/:coachId
 */
router.get('/connect/google/:coachId', async (req: AuthRequest, res: Response) => {
  try {
    const { coachId } = req.params;

    // Verify user can connect calendars for this coach
    if (req.user?.role === 'coach' && req.user.userId !== coachId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get authorization URL
    const authUrl = googleCalendarService.getAuthUrl(coachId);

    res.json({
      success: true,
      authUrl,
      provider: 'google'
    });
  } catch (error) {
    console.error('Error initiating Google OAuth:', error);
    res.status(500).json({ error: 'Failed to initiate Google Calendar connection' });
  }
});

/**
 * Initiate OAuth flow for Outlook Calendar
 * GET /calendar/connect/outlook/:coachId
 */
router.get('/connect/outlook/:coachId', async (req: AuthRequest, res: Response) => {
  try {
    const { coachId } = req.params;

    // Verify user can connect calendars for this coach
    if (req.user?.role === 'coach' && req.user.userId !== coachId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Check if Outlook integration is available
    if (!outlookCalendarService.isAvailable()) {
      return res.status(503).json({
        error: 'Outlook Calendar integration is not configured. Please contact your administrator.'
      });
    }

    // Get authorization URL
    const authUrl = await outlookCalendarService.getAuthUrl(coachId);

    res.json({
      success: true,
      authUrl,
      provider: 'outlook'
    });
  } catch (error) {
    console.error('Error initiating Outlook OAuth:', error);
    res.status(500).json({ error: 'Failed to initiate Outlook Calendar connection' });
  }
});


// =========================================================
// CONNECTION MANAGEMENT
// =========================================================

/**
 * Get calendar connections for a coach
 * GET /calendar/connections/:coachId
 */
router.get('/connections/:coachId', async (req: AuthRequest, res: Response) => {
  try {
    const { coachId } = req.params;

    // Verify user can access this coach's data
    if (req.user?.role === 'coach' && req.user.userId !== coachId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { data: connections, error } = await supabase
      .rpc('get_coach_calendar_connections', { p_coach_id: coachId });

    if (error) throw error;

    res.json({
      success: true,
      connections: connections || []
    });
  } catch (error) {
    console.error('Error fetching calendar connections:', error);
    res.status(500).json({ error: 'Failed to fetch calendar connections' });
  }
});

/**
 * Update connection settings
 * PUT /calendar/connections/:connectionId
 */
router.put('/connections/:connectionId', async (req: AuthRequest, res: Response) => {
  try {
    const { connectionId } = req.params;
    const {
      is_sync_enabled,
      sync_direction,
      auto_create_events,
      auto_update_events,
      include_client_details,
      event_title_template,
      event_description_template
    } = req.body;

    // Get connection to verify ownership
    const { data: connection, error: fetchError } = await supabase
      .from('coach_calendar_connections')
      .select('coach_id')
      .eq('id', connectionId)
      .single();

    if (fetchError || !connection) {
      return res.status(404).json({ error: 'Connection not found' });
    }

    // Verify user can modify this connection
    if (req.user?.role === 'coach' && req.user.userId !== connection.coach_id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Update connection settings
    const updateData: any = {};
    if (is_sync_enabled !== undefined) updateData.is_sync_enabled = is_sync_enabled;
    if (sync_direction) updateData.sync_direction = sync_direction;
    if (auto_create_events !== undefined) updateData.auto_create_events = auto_create_events;
    if (auto_update_events !== undefined) updateData.auto_update_events = auto_update_events;
    if (include_client_details !== undefined) updateData.include_client_details = include_client_details;
    if (event_title_template) updateData.event_title_template = event_title_template;
    if (event_description_template) updateData.event_description_template = event_description_template;

    const { data: updatedConnection, error } = await supabase
      .from('coach_calendar_connections')
      .update(updateData)
      .eq('id', connectionId)
      .select('*')
      .single();

    if (error) throw error;

    res.json({
      success: true,
      message: 'Connection settings updated',
      connection: updatedConnection
    });
  } catch (error) {
    console.error('Error updating connection settings:', error);
    res.status(500).json({ error: 'Failed to update connection settings' });
  }
});

/**
 * Test calendar connection
 * POST /calendar/connections/:connectionId/test
 */
router.post('/connections/:connectionId/test', async (req: AuthRequest, res: Response) => {
  try {
    const { connectionId } = req.params;

    // Get connection details
    const { data: connection, error: fetchError } = await supabase
      .from('coach_calendar_connections')
      .select('*')
      .eq('id', connectionId)
      .single();

    if (fetchError || !connection) {
      return res.status(404).json({ error: 'Connection not found' });
    }

    // Verify user can test this connection
    if (req.user?.role === 'coach' && req.user.userId !== connection.coach_id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Test the connection
    const calendarService = connection.provider === 'google' ? googleCalendarService : outlookCalendarService;
    const testResult = await calendarService.testConnection(connectionId);

    if (testResult.success) {
      // Update connection status
      await supabase
        .from('coach_calendar_connections')
        .update({
          last_sync_status: 'success',
          last_sync_at: new Date().toISOString()
        })
        .eq('id', connectionId);
    }

    res.json({
      success: testResult.success,
      message: testResult.success ? 'Connection test successful' : 'Connection test failed',
      error: testResult.error,
      calendarName: testResult.calendarName
    });
  } catch (error) {
    console.error('Error testing calendar connection:', error);
    res.status(500).json({ error: 'Failed to test connection' });
  }
});

/**
 * Disconnect calendar
 * DELETE /calendar/connections/:connectionId
 */
router.delete('/connections/:connectionId', async (req: AuthRequest, res: Response) => {
  try {
    const { connectionId } = req.params;

    // Get connection details
    const { data: connection, error: fetchError } = await supabase
      .from('coach_calendar_connections')
      .select('coach_id')
      .eq('id', connectionId)
      .single();

    if (fetchError || !connection) {
      return res.status(404).json({ error: 'Connection not found' });
    }

    // Verify user can disconnect this connection
    if (req.user?.role === 'coach' && req.user.userId !== connection.coach_id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Mark connection as inactive instead of deleting (to preserve sync history)
    const { error } = await supabase
      .from('coach_calendar_connections')
      .update({
        is_active: false,
        is_sync_enabled: false,
        access_token: '', // Clear tokens for security
        refresh_token: null
      })
      .eq('id', connectionId);

    if (error) throw error;

    res.json({
      success: true,
      message: 'Calendar disconnected successfully'
    });
  } catch (error) {
    console.error('Error disconnecting calendar:', error);
    res.status(500).json({ error: 'Failed to disconnect calendar' });
  }
});

// =========================================================
// SYNC MANAGEMENT
// =========================================================

/**
 * Trigger manual sync for a connection
 * POST /calendar/connections/:connectionId/sync
 */
router.post('/connections/:connectionId/sync', async (req: AuthRequest, res: Response) => {
  try {
    const { connectionId } = req.params;
    const { operation = 'full_sync', sessionId } = req.body;

    // Get connection details
    const { data: connection, error: fetchError } = await supabase
      .from('coach_calendar_connections')
      .select('coach_id')
      .eq('id', connectionId)
      .single();

    if (fetchError || !connection) {
      return res.status(404).json({ error: 'Connection not found' });
    }

    // Verify user can sync this connection
    if (req.user?.role === 'coach' && req.user.userId !== connection.coach_id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Queue sync operation
    const syncId = await calendarSyncService.queueSync(
      connectionId,
      operation,
      sessionId,
      1 // High priority for manual sync
    );

    if (!syncId) {
      return res.status(500).json({ error: 'Failed to queue sync operation' });
    }

    res.json({
      success: true,
      message: 'Sync operation queued',
      syncId
    });
  } catch (error) {
    console.error('Error triggering manual sync:', error);
    res.status(500).json({ error: 'Failed to trigger sync' });
  }
});

/**
 * Get sync status and history for a connection
 * GET /calendar/connections/:connectionId/sync-status
 */
router.get('/connections/:connectionId/sync-status', async (req: AuthRequest, res: Response) => {
  try {
    const { connectionId } = req.params;

    // Get connection details
    const { data: connection, error: fetchError } = await supabase
      .from('coach_calendar_connections')
      .select('coach_id, last_sync_at, last_sync_status, last_sync_error')
      .eq('id', connectionId)
      .single();

    if (fetchError || !connection) {
      return res.status(404).json({ error: 'Connection not found' });
    }

    // Verify user can view this connection's sync status
    if (req.user?.role === 'coach' && req.user.userId !== connection.coach_id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get recent sync jobs
    const { data: recentJobs, error: jobsError } = await supabase
      .from('calendar_sync_queue')
      .select('id, operation, status, created_at, started_at, completed_at, error_message')
      .eq('connection_id', connectionId)
      .order('created_at', { ascending: false })
      .limit(10);

    if (jobsError) {
      console.error('Error fetching sync jobs:', jobsError);
    }

    res.json({
      success: true,
      syncStatus: {
        lastSync: connection.last_sync_at,
        lastStatus: connection.last_sync_status,
        lastError: connection.last_sync_error
      },
      recentJobs: recentJobs || []
    });
  } catch (error) {
    console.error('Error fetching sync status:', error);
    res.status(500).json({ error: 'Failed to fetch sync status' });
  }
});

export default router;