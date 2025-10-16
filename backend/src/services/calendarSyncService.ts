import { supabase } from '../lib/supabase';
import { googleCalendarService } from './googleCalendarService';
import { outlookCalendarService } from './outlookCalendarService';
import { appointmentReminderService } from './appointmentReminderService';

interface SyncJob {
  sync_id: string;
  connection_id: string;
  session_id?: string;
  operation: string;
  coach_id: string;
  provider: string;
  access_token: string;
  refresh_token?: string;
  calendar_id: string;
}

interface SessionData {
  id: string;
  starts_at: string;
  ends_at?: string;
  duration_minutes?: number;
  status: string;
  session_notes?: string;
  meeting_url?: string;
  clients: {
    first_name: string;
    last_name: string;
    email: string;
  };
  coaches: {
    first_name: string;
    last_name: string;
    email: string;
  };
}

export class CalendarSyncService {

  /**
   * Process the next sync job from the queue
   */
  async processNextSyncJob(): Promise<boolean> {
    try {
      // Get the next sync job
      const { data: jobs, error } = await supabase
        .rpc('get_next_sync_job');

      if (error) {
        console.error('Error getting next sync job:', error);
        return false;
      }

      if (!jobs || jobs.length === 0) {
        return false; // No jobs to process
      }

      const job: SyncJob = jobs[0];

      // Mark job as processing
      await this.updateSyncJobStatus(job.sync_id, 'processing');

      try {
        await this.executeSyncJob(job);

        // Mark job as completed
        await this.updateSyncJobStatus(job.sync_id, 'completed');

        console.log(`Sync job ${job.sync_id} completed successfully`);
        return true;
      } catch (error) {
        console.error(`Error executing sync job ${job.sync_id}:`, error);

        // Increment attempts and mark as failed if max attempts reached
        await this.handleSyncJobError(job.sync_id, error);
        return false;
      }
    } catch (error) {
      console.error('Error processing sync job:', error);
      return false;
    }
  }

  /**
   * Execute a specific sync job
   */
  private async executeSyncJob(job: SyncJob): Promise<void> {
    const calendarService = job.provider === 'google' ? googleCalendarService : outlookCalendarService;

    switch (job.operation) {
      case 'create':
        await this.handleCreateEvent(job, calendarService);
        break;
      case 'update':
        await this.handleUpdateEvent(job, calendarService);
        break;
      case 'delete':
        await this.handleDeleteEvent(job, calendarService);
        break;
      case 'full_sync':
        await this.handleFullSync(job, calendarService);
        break;
      default:
        throw new Error(`Unknown operation: ${job.operation}`);
    }
  }

  /**
   * Handle creating a calendar event
   */
  private async handleCreateEvent(job: SyncJob, calendarService: any): Promise<void> {
    if (!job.session_id) {
      throw new Error('Session ID required for create operation');
    }

    // Check if event already exists for this session and connection
    const existingMapping = await this.getEventMapping(job.session_id, job.connection_id);
    if (existingMapping) {
      console.log(`Calendar event already exists for session ${job.session_id} and connection ${job.connection_id}, skipping create`);
      return;
    }

    // Get session data
    const session = await this.getSessionData(job.session_id);
    if (!session) {
      console.log(`Session ${job.session_id} not found, marking sync job as failed`);
      // Don't throw error, just mark job as failed and move on
      await this.updateSyncJobStatus(job.sync_id, 'failed');
      return;
    }

    // Skip if session is cancelled
    if (session.status === 'cancelled') {
      console.log('Skipping cancelled session');
      return;
    }

    // Get connection settings
    const connection = await this.getConnectionSettings(job.connection_id);
    if (!connection || !connection.auto_create_events) {
      console.log('Auto-create events disabled for connection');
      return;
    }

    // Convert session to calendar event
    const event = calendarService.convertSessionToEvent(
      session,
      {
        title: connection.event_title_template || 'ACT Coaching Session',
        description: connection.event_description_template || 'Coaching session scheduled via ACT Coaching For Life'
      },
      connection.include_client_details
    );

    // Create event in external calendar
    const externalEventId = await calendarService.createEvent(
      job.connection_id,
      job.calendar_id,
      event
    );

    if (!externalEventId) {
      throw new Error('Failed to create external calendar event');
    }

    // Store mapping
    await this.createEventMapping(
      job.session_id,
      job.connection_id,
      externalEventId,
      job.calendar_id,
      event
    );

    // Schedule appointment reminders for the session
    try {
      await appointmentReminderService.scheduleSessionReminders(job.session_id);
      console.log(`Scheduled reminders for session ${job.session_id}`);
    } catch (reminderError) {
      console.error(`Failed to schedule reminders for session ${job.session_id}:`, reminderError);
      // Don't fail the calendar sync if reminder scheduling fails
    }

    console.log(`Created calendar event ${externalEventId} for session ${job.session_id}`);
  }

  /**
   * Handle updating a calendar event
   */
  private async handleUpdateEvent(job: SyncJob, calendarService: any): Promise<void> {
    if (!job.session_id) {
      throw new Error('Session ID required for update operation');
    }

    // Get session data
    const session = await this.getSessionData(job.session_id);
    if (!session) {
      console.log(`Session ${job.session_id} not found, marking sync job as failed`);
      await this.updateSyncJobStatus(job.sync_id, 'failed');
      return;
    }

    // Get existing mapping
    const mapping = await this.getEventMapping(job.session_id, job.connection_id);
    if (!mapping) {
      // No mapping exists, create instead
      await this.handleCreateEvent(job, calendarService);
      return;
    }

    // Get connection settings
    const connection = await this.getConnectionSettings(job.connection_id);
    if (!connection || !connection.auto_update_events) {
      console.log('Auto-update events disabled for connection');
      return;
    }

    // Convert session to calendar event
    const event = calendarService.convertSessionToEvent(
      session,
      {
        title: connection.event_title_template || 'ACT Coaching Session',
        description: connection.event_description_template || 'Coaching session scheduled via ACT Coaching For Life'
      },
      connection.include_client_details
    );

    if (session.status === 'cancelled') {
      // Delete the calendar event instead of updating
      await calendarService.deleteEvent(
        job.connection_id,
        mapping.external_calendar_id,
        mapping.external_event_id
      );

      // Update mapping status
      await this.updateEventMappingStatus(mapping.id, 'deleted');
    } else {
      // Update event in external calendar
      const success = await calendarService.updateEvent(
        job.connection_id,
        mapping.external_calendar_id,
        mapping.external_event_id,
        event
      );

      if (!success) {
        throw new Error('Failed to update external calendar event');
      }

      // Update mapping with new sync data
      await this.updateEventMapping(mapping.id, event);
    }

    console.log(`Updated calendar event ${mapping.external_event_id} for session ${job.session_id}`);
  }

  /**
   * Handle deleting a calendar event
   */
  private async handleDeleteEvent(job: SyncJob, calendarService: any): Promise<void> {
    if (!job.session_id) {
      throw new Error('Session ID required for delete operation');
    }

    // Get existing mapping
    const mapping = await this.getEventMapping(job.session_id, job.connection_id);
    if (!mapping) {
      console.log('No mapping found for session, nothing to delete');
      return;
    }

    // Delete event from external calendar
    await calendarService.deleteEvent(
      job.connection_id,
      mapping.external_calendar_id,
      mapping.external_event_id
    );

    // Update mapping status
    await this.updateEventMappingStatus(mapping.id, 'deleted');

    console.log(`Deleted calendar event ${mapping.external_event_id} for session ${job.session_id}`);
  }

  /**
   * Handle full synchronization
   */
  private async handleFullSync(job: SyncJob, calendarService: any): Promise<void> {
    console.log(`Starting full sync for connection ${job.connection_id}`);

    // Get all active sessions for this coach in the future
    const { data: rawSessions, error } = await supabase
      .from('sessions')
      .select(`
        id,
        starts_at,
        ends_at,
        status,
        notes,
        client_id,
        coach_id,
        clients!sessions_client_id_fkey(first_name, last_name, email),
        coaches!sessions_coach_id_fkey(first_name, last_name, email)
      `)
      .eq('coach_id', job.coach_id)
      .gte('starts_at', new Date().toISOString())
      .in('status', ['scheduled', 'confirmed']);

    if (error) {
      throw new Error(`Failed to get sessions for full sync: ${error.message}`);
    }

    // Transform the raw sessions to match our interface
    const sessions = (rawSessions || []).map(rawSession => ({
      ...rawSession,
      clients: Array.isArray(rawSession.clients) ? rawSession.clients[0] : rawSession.clients,
      coaches: Array.isArray(rawSession.coaches) ? rawSession.coaches[0] : rawSession.coaches
    }));

    const connection = await this.getConnectionSettings(job.connection_id);
    if (!connection) {
      throw new Error('Connection settings not found');
    }

    for (const session of sessions) {
      try {
        // Check if mapping already exists
        const mapping = await this.getEventMapping(session.id, job.connection_id);

        if (mapping) {
          // Update existing event
          const event = calendarService.convertSessionToEvent(
            session,
            {
              title: connection.event_title_template || 'ACT Coaching Session',
              description: connection.event_description_template || 'Coaching session scheduled via ACT Coaching For Life'
            },
            connection.include_client_details
          );

          await calendarService.updateEvent(
            job.connection_id,
            mapping.external_calendar_id,
            mapping.external_event_id,
            event
          );

          await this.updateEventMapping(mapping.id, event);
        } else if (connection.auto_create_events) {
          // Create new event
          const event = calendarService.convertSessionToEvent(
            session,
            {
              title: connection.event_title_template || 'ACT Coaching Session',
              description: connection.event_description_template || 'Coaching session scheduled via ACT Coaching For Life'
            },
            connection.include_client_details
          );

          const externalEventId = await calendarService.createEvent(
            job.connection_id,
            job.calendar_id,
            event
          );

          if (externalEventId) {
            await this.createEventMapping(
              session.id,
              job.connection_id,
              externalEventId,
              job.calendar_id,
              event
            );

            // Schedule appointment reminders for newly created sessions
            try {
              await appointmentReminderService.scheduleSessionReminders(session.id);
            } catch (reminderError) {
              console.error(`Failed to schedule reminders for session ${session.id} during full sync:`, reminderError);
            }
          }
        }
      } catch (sessionError) {
        console.error(`Error syncing session ${session.id}:`, sessionError);
        // Continue with other sessions
      }
    }

    console.log(`Full sync completed for connection ${job.connection_id}`);
  }

  /**
   * Queue a sync operation
   */
  async queueSync(
    connectionId: string,
    operation: 'create' | 'update' | 'delete' | 'full_sync',
    sessionId?: string,
    priority: number = 5
  ): Promise<string | null> {
    try {
      // Check if there's already a pending sync job for this session and connection
      if (sessionId && operation !== 'full_sync') {
        const { data: existingJobs, error: checkError } = await supabase
          .from('calendar_sync_queue')
          .select('id, status')
          .eq('connection_id', connectionId)
          .eq('session_id', sessionId)
          .eq('operation', operation)
          .in('status', ['pending', 'processing']);

        if (!checkError && existingJobs && existingJobs.length > 0) {
          console.log(`Sync job already exists for session ${sessionId}, connection ${connectionId}, operation ${operation} - skipping duplicate`);
          return existingJobs[0].id;
        }

        // For create operations, also check if event mapping already exists
        if (operation === 'create') {
          const existingMapping = await this.getEventMapping(sessionId, connectionId);
          if (existingMapping) {
            console.log(`Calendar event already exists for session ${sessionId} and connection ${connectionId}, skipping create queue`);
            return null;
          }
        }
      }

      const { data: syncId, error } = await supabase
        .rpc('queue_calendar_sync', {
          p_connection_id: connectionId,
          p_session_id: sessionId || null,
          p_operation: operation,
          p_priority: priority
        });

      if (error) {
        console.error('Error queuing sync:', error);
        return null;
      }

      console.log(`Queued ${operation} sync job: ${syncId}`);
      return syncId;
    } catch (error) {
      console.error('Error queuing sync job:', error);
      return null;
    }
  }

  /**
   * Queue sync for all active connections when session changes
   */
  async queueSessionSync(
    coachId: string,
    sessionId: string,
    operation: 'create' | 'update' | 'delete'
  ): Promise<void> {
    try {
      const { data: connections, error } = await supabase
        .from('coach_calendar_connections')
        .select('id')
        .eq('coach_id', coachId)
        .eq('is_active', true)
        .eq('is_sync_enabled', true);

      if (error) {
        console.error('Error getting connections for sync:', error);
        return;
      }

      for (const connection of connections || []) {
        await this.queueSync(connection.id, operation, sessionId);
      }
    } catch (error) {
      console.error('Error queuing session sync:', error);
    }
  }

  /**
   * Clean up duplicate calendar events for a session
   */
  async cleanupDuplicateEvents(sessionId: string): Promise<void> {
    try {
      console.log(`Cleaning up duplicate events for session ${sessionId}`);

      // Get all mappings for this session grouped by connection
      const { data: mappings, error } = await supabase
        .from('calendar_event_mappings')
        .select('*, coach_calendar_connections(coach_id, provider)')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true }); // Keep the oldest one

      if (error || !mappings) {
        console.error('Error fetching event mappings:', error);
        return;
      }

      // Group mappings by connection_id
      const mappingsByConnection = mappings.reduce((acc: any, mapping: any) => {
        if (!acc[mapping.connection_id]) {
          acc[mapping.connection_id] = [];
        }
        acc[mapping.connection_id].push(mapping);
        return acc;
      }, {});

      // For each connection, keep only the first mapping and delete duplicates
      for (const connectionId in mappingsByConnection) {
        const connectionMappings = mappingsByConnection[connectionId];

        if (connectionMappings.length > 1) {
          console.log(`Found ${connectionMappings.length} duplicate mappings for connection ${connectionId}`);

          // Keep the first (oldest) mapping, delete the rest
          const [keepMapping, ...duplicateMappings] = connectionMappings;

          for (const duplicateMapping of duplicateMappings) {
            try {
              // Delete the calendar event from external calendar
              const connection = duplicateMapping.coach_calendar_connections;
              const calendarService = connection.provider === 'google' ? googleCalendarService : outlookCalendarService;

              await calendarService.deleteEvent(
                connectionId,
                duplicateMapping.external_calendar_id,
                duplicateMapping.external_event_id
              );

              // Delete the mapping record
              await supabase
                .from('calendar_event_mappings')
                .delete()
                .eq('id', duplicateMapping.id);

              console.log(`Deleted duplicate event ${duplicateMapping.external_event_id} for session ${sessionId}`);
            } catch (deleteError) {
              console.error(`Failed to delete duplicate event ${duplicateMapping.external_event_id}:`, deleteError);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error cleaning up duplicate events:', error);
    }
  }

  /**
   * Clean up all duplicate calendar events for a coach
   */
  async cleanupAllDuplicateEvents(coachId: string): Promise<void> {
    try {
      console.log(`Cleaning up all duplicate events for coach ${coachId}`);

      // Get all mappings for this coach's connections
      const { data: mappings, error } = await supabase
        .from('calendar_event_mappings')
        .select(`
          *,
          coach_calendar_connections!inner(coach_id, provider)
        `)
        .eq('coach_calendar_connections.coach_id', coachId)
        .order('session_id, connection_id, created_at', { ascending: true });

      if (error || !mappings) {
        console.error('Error fetching event mappings:', error);
        return;
      }

      // Group mappings by session_id and connection_id
      const mappingsBySessionAndConnection = mappings.reduce((acc: any, mapping: any) => {
        const key = `${mapping.session_id}-${mapping.connection_id}`;
        if (!acc[key]) {
          acc[key] = [];
        }
        acc[key].push(mapping);
        return acc;
      }, {});

      let totalDuplicatesFound = 0;
      let totalDuplicatesDeleted = 0;

      // For each session-connection pair, keep only the first mapping and delete duplicates
      for (const key in mappingsBySessionAndConnection) {
        const groupMappings = mappingsBySessionAndConnection[key];

        if (groupMappings.length > 1) {
          totalDuplicatesFound += groupMappings.length - 1;
          console.log(`Found ${groupMappings.length - 1} duplicate mappings for ${key}`);

          // Keep the first (oldest) mapping, delete the rest
          const [keepMapping, ...duplicateMappings] = groupMappings;

          for (const duplicateMapping of duplicateMappings) {
            try {
              // Delete the calendar event from external calendar
              const connection = duplicateMapping.coach_calendar_connections;
              const calendarService = connection.provider === 'google' ? googleCalendarService : outlookCalendarService;

              await calendarService.deleteEvent(
                duplicateMapping.connection_id,
                duplicateMapping.external_calendar_id,
                duplicateMapping.external_event_id
              );

              // Delete the mapping record
              await supabase
                .from('calendar_event_mappings')
                .delete()
                .eq('id', duplicateMapping.id);

              totalDuplicatesDeleted++;
              console.log(`Deleted duplicate event ${duplicateMapping.external_event_id} for ${key}`);
            } catch (deleteError) {
              console.error(`Failed to delete duplicate event ${duplicateMapping.external_event_id}:`, deleteError);
            }
          }
        }
      }

      console.log(`Cleanup complete for coach ${coachId}: ${totalDuplicatesDeleted}/${totalDuplicatesFound} duplicates removed`);
    } catch (error) {
      console.error('Error cleaning up all duplicate events:', error);
    }
  }

  /**
   * Clean up failed sync jobs for non-existent sessions
   */
  async cleanupFailedSyncJobs(): Promise<void> {
    try {
      console.log('Cleaning up failed sync jobs for non-existent sessions...');

      // Get all pending/processing sync jobs with session_id
      const { data: syncJobs, error } = await supabase
        .from('calendar_sync_queue')
        .select('id, session_id, operation, attempts, error_message')
        .not('session_id', 'is', null)
        .in('status', ['pending', 'processing', 'failed'])
        .gte('attempts', 2); // Only jobs that have failed at least twice

      if (error || !syncJobs) {
        console.error('Error fetching sync jobs:', error);
        return;
      }

      let jobsRemoved = 0;

      for (const job of syncJobs) {
        // Check if session still exists
        const { data: session } = await supabase
          .from('sessions')
          .select('id')
          .eq('id', job.session_id)
          .single();

        if (!session) {
          // Session doesn't exist, remove the sync job
          await supabase
            .from('calendar_sync_queue')
            .update({
              status: 'failed',
              error_message: 'Session no longer exists',
              completed_at: new Date().toISOString()
            })
            .eq('id', job.id);

          jobsRemoved++;
          console.log(`Marked sync job ${job.id} as failed - session ${job.session_id} no longer exists`);
        }
      }

      console.log(`Cleaned up ${jobsRemoved} failed sync jobs for non-existent sessions`);
    } catch (error) {
      console.error('Error cleaning up failed sync jobs:', error);
    }
  }

  /**
   * Helper methods
   */

  private async getSessionData(sessionId: string): Promise<SessionData | null> {
    const { data, error } = await supabase
      .from('sessions')
      .select(`
        id,
        starts_at,
        ends_at,
        status,
        notes,
        client_id,
        coach_id,
        clients!sessions_client_id_fkey(first_name, last_name, email),
        coaches!sessions_coach_id_fkey(first_name, last_name, email)
      `)
      .eq('id', sessionId)
      .single();

    if (error || !data) {
      return null;
    }

    // Calculate duration in minutes from starts_at and ends_at
    const durationMinutes = data.ends_at
      ? Math.round((new Date(data.ends_at).getTime() - new Date(data.starts_at).getTime()) / 60000)
      : 60; // Default to 60 minutes if ends_at is not set

    // Transform the data to match our interface
    const sessionData: SessionData = {
      id: data.id,
      starts_at: data.starts_at,
      ends_at: data.ends_at,
      duration_minutes: durationMinutes,
      status: data.status,
      session_notes: data.notes,
      meeting_url: `${process.env.FRONTEND_URL}/meeting/${sessionId}`, // Generate meeting URL
      clients: Array.isArray(data.clients) ? data.clients[0] : data.clients,
      coaches: Array.isArray(data.coaches) ? data.coaches[0] : data.coaches
    };

    return sessionData;
  }

  private async getConnectionSettings(connectionId: string): Promise<any> {
    const { data, error } = await supabase
      .from('coach_calendar_connections')
      .select('*')
      .eq('id', connectionId)
      .single();

    return error ? null : data;
  }

  private async getEventMapping(sessionId: string, connectionId: string): Promise<any> {
    const { data, error } = await supabase
      .from('calendar_event_mappings')
      .select('*')
      .eq('session_id', sessionId)
      .eq('connection_id', connectionId)
      .single();

    return error ? null : data;
  }

  private async createEventMapping(
    sessionId: string,
    connectionId: string,
    externalEventId: string,
    externalCalendarId: string,
    event: any
  ): Promise<void> {
    // Check if mapping already exists to prevent duplicates
    const { data: existingMapping, error: checkError } = await supabase
      .from('calendar_event_mappings')
      .select('id')
      .eq('session_id', sessionId)
      .eq('connection_id', connectionId)
      .single();

    if (existingMapping) {
      console.log(`Mapping already exists for session ${sessionId} and connection ${connectionId}, updating instead of creating`);
      // Update existing mapping instead of creating duplicate
      await supabase
        .from('calendar_event_mappings')
        .update({
          external_event_id: externalEventId,
          external_calendar_id: externalCalendarId,
          synced_title: event.title,
          synced_description: event.description,
          synced_start_time: event.startTime,
          synced_end_time: event.endTime,
          synced_location: event.location,
          sync_status: 'synced',
          last_sync_at: new Date().toISOString()
        })
        .eq('id', existingMapping.id);
      return;
    }

    // Create new mapping if none exists
    await supabase
      .from('calendar_event_mappings')
      .insert({
        session_id: sessionId,
        connection_id: connectionId,
        external_event_id: externalEventId,
        external_calendar_id: externalCalendarId,
        synced_title: event.title,
        synced_description: event.description,
        synced_start_time: event.startTime,
        synced_end_time: event.endTime,
        synced_location: event.location,
        sync_status: 'synced',
        last_sync_at: new Date().toISOString()
      });
  }

  private async updateEventMapping(mappingId: string, event: any): Promise<void> {
    await supabase
      .from('calendar_event_mappings')
      .update({
        synced_title: event.title,
        synced_description: event.description,
        synced_start_time: event.startTime,
        synced_end_time: event.endTime,
        synced_location: event.location,
        last_synced_at: new Date().toISOString(),
        sync_status: 'synced'
      })
      .eq('id', mappingId);
  }

  private async updateEventMappingStatus(mappingId: string, status: string): Promise<void> {
    await supabase
      .from('calendar_event_mappings')
      .update({
        sync_status: status,
        last_synced_at: new Date().toISOString()
      })
      .eq('id', mappingId);
  }

  private async updateSyncJobStatus(syncId: string, status: string): Promise<void> {
    const updateData: any = {
      status,
      updated_at: new Date().toISOString()
    };

    if (status === 'processing') {
      updateData.started_at = new Date().toISOString();
    } else if (status === 'completed' || status === 'failed') {
      updateData.completed_at = new Date().toISOString();
    }

    await supabase
      .from('calendar_sync_queue')
      .update(updateData)
      .eq('id', syncId);
  }

  private async handleSyncJobError(syncId: string, error: any): Promise<void> {
    // Get current attempts
    const { data: job } = await supabase
      .from('calendar_sync_queue')
      .select('attempts, max_attempts')
      .eq('id', syncId)
      .single();

    const attempts = (job?.attempts || 0) + 1;
    const maxAttempts = job?.max_attempts || 3;

    const updateData: any = {
      attempts,
      error_message: error instanceof Error ? error.message : 'Unknown error',
      updated_at: new Date().toISOString()
    };

    if (attempts >= maxAttempts) {
      updateData.status = 'failed';
      updateData.completed_at = new Date().toISOString();
    } else {
      updateData.status = 'pending';
      // Exponential backoff: retry after 2^attempts minutes
      const retryMinutes = Math.pow(2, attempts);
      updateData.scheduled_for = new Date(Date.now() + retryMinutes * 60 * 1000).toISOString();
    }

    await supabase
      .from('calendar_sync_queue')
      .update(updateData)
      .eq('id', syncId);
  }
}

export const calendarSyncService = new CalendarSyncService();