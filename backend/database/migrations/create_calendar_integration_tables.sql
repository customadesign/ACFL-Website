-- =========================================================
-- CALENDAR INTEGRATION TABLES
-- For Google Calendar and Outlook integration
-- =========================================================

-- Coach calendar connections - stores OAuth tokens and calendar configurations
CREATE TABLE IF NOT EXISTS public.coach_calendar_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID NOT NULL REFERENCES public.coaches(id) ON DELETE CASCADE,

  -- Calendar provider details
  provider VARCHAR(50) NOT NULL CHECK (provider IN ('google', 'outlook')),
  provider_user_id VARCHAR(255), -- Google: email, Outlook: user object ID
  calendar_id VARCHAR(255), -- Primary calendar ID from provider
  calendar_name VARCHAR(255), -- Display name of calendar

  -- OAuth tokens (encrypted)
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  scope TEXT, -- OAuth scopes granted

  -- Connection settings
  is_active BOOLEAN DEFAULT true,
  is_sync_enabled BOOLEAN DEFAULT true,
  sync_direction VARCHAR(50) DEFAULT 'both' CHECK (sync_direction IN ('to_external', 'from_external', 'both')),

  -- Sync preferences
  auto_create_events BOOLEAN DEFAULT true,
  auto_update_events BOOLEAN DEFAULT true,
  include_client_details BOOLEAN DEFAULT false, -- Whether to include client names in external calendar
  event_title_template VARCHAR(255) DEFAULT 'ACT Coaching Session',
  event_description_template TEXT DEFAULT 'Coaching session scheduled via ACT Coaching For Life',

  -- Last sync information
  last_sync_at TIMESTAMPTZ,
  last_sync_status VARCHAR(50) DEFAULT 'pending' CHECK (last_sync_status IN ('pending', 'success', 'error')),
  last_sync_error TEXT,
  next_sync_at TIMESTAMPTZ,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

  -- Ensure only one active connection per provider per coach
  CONSTRAINT unique_active_coach_provider UNIQUE (coach_id, provider, is_active)
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_calendar_connections_coach ON public.coach_calendar_connections(coach_id);
CREATE INDEX IF NOT EXISTS idx_calendar_connections_provider ON public.coach_calendar_connections(provider);
CREATE INDEX IF NOT EXISTS idx_calendar_connections_active ON public.coach_calendar_connections(is_active);
CREATE INDEX IF NOT EXISTS idx_calendar_connections_sync ON public.coach_calendar_connections(next_sync_at) WHERE is_sync_enabled = true;

-- Update trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_coach_calendar_connections_updated_at ON public.coach_calendar_connections;
CREATE TRIGGER update_coach_calendar_connections_updated_at
    BEFORE UPDATE ON public.coach_calendar_connections
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =========================================================
-- CALENDAR EVENT MAPPINGS
-- Maps our internal sessions to external calendar events
-- =========================================================

CREATE TABLE IF NOT EXISTS public.calendar_event_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  connection_id UUID NOT NULL REFERENCES public.coach_calendar_connections(id) ON DELETE CASCADE,

  -- External calendar event details
  external_event_id VARCHAR(255) NOT NULL, -- Event ID from Google/Outlook
  external_calendar_id VARCHAR(255) NOT NULL, -- Calendar ID where event exists

  -- Sync metadata
  last_synced_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  sync_status VARCHAR(50) DEFAULT 'synced' CHECK (sync_status IN ('synced', 'pending', 'error', 'deleted')),
  sync_error TEXT,

  -- Event details at time of last sync (for change detection)
  synced_title VARCHAR(255),
  synced_description TEXT,
  synced_start_time TIMESTAMPTZ,
  synced_end_time TIMESTAMPTZ,
  synced_location VARCHAR(500),

  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

  -- Ensure unique mapping per session per connection
  CONSTRAINT unique_session_connection UNIQUE (session_id, connection_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_event_mappings_session ON public.calendar_event_mappings(session_id);
CREATE INDEX IF NOT EXISTS idx_event_mappings_connection ON public.calendar_event_mappings(connection_id);
CREATE INDEX IF NOT EXISTS idx_event_mappings_external ON public.calendar_event_mappings(external_event_id, external_calendar_id);
CREATE INDEX IF NOT EXISTS idx_event_mappings_sync_status ON public.calendar_event_mappings(sync_status);

-- Update trigger
DROP TRIGGER IF EXISTS update_calendar_event_mappings_updated_at ON public.calendar_event_mappings;
CREATE TRIGGER update_calendar_event_mappings_updated_at
    BEFORE UPDATE ON public.calendar_event_mappings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =========================================================
-- SYNC QUEUE
-- Queue for calendar sync operations
-- =========================================================

CREATE TABLE IF NOT EXISTS public.calendar_sync_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id UUID NOT NULL REFERENCES public.coach_calendar_connections(id) ON DELETE CASCADE,
  session_id UUID REFERENCES public.sessions(id) ON DELETE CASCADE, -- NULL for full sync

  -- Operation details
  operation VARCHAR(50) NOT NULL CHECK (operation IN ('create', 'update', 'delete', 'full_sync')),
  priority INT DEFAULT 5 CHECK (priority BETWEEN 1 AND 10), -- 1 = highest priority

  -- Processing status
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  attempts INT DEFAULT 0,
  max_attempts INT DEFAULT 3,

  -- Error handling
  error_message TEXT,
  error_details JSONB,

  -- Scheduling
  scheduled_for TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_sync_queue_status ON public.calendar_sync_queue(status);
CREATE INDEX IF NOT EXISTS idx_sync_queue_scheduled ON public.calendar_sync_queue(scheduled_for) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_sync_queue_connection ON public.calendar_sync_queue(connection_id);
CREATE INDEX IF NOT EXISTS idx_sync_queue_priority ON public.calendar_sync_queue(priority, scheduled_for);

-- Update trigger
DROP TRIGGER IF EXISTS update_calendar_sync_queue_updated_at ON public.calendar_sync_queue;
CREATE TRIGGER update_calendar_sync_queue_updated_at
    BEFORE UPDATE ON public.calendar_sync_queue
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =========================================================
-- HELPER FUNCTIONS
-- =========================================================

-- Function to get active calendar connections for a coach
CREATE OR REPLACE FUNCTION get_coach_calendar_connections(p_coach_id UUID)
RETURNS TABLE (
  connection_id UUID,
  provider VARCHAR,
  calendar_name VARCHAR,
  is_sync_enabled BOOLEAN,
  last_sync_at TIMESTAMPTZ,
  last_sync_status VARCHAR
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    c.provider,
    c.calendar_name,
    c.is_sync_enabled,
    c.last_sync_at,
    c.last_sync_status
  FROM coach_calendar_connections c
  WHERE c.coach_id = p_coach_id
    AND c.is_active = true
  ORDER BY c.provider, c.created_at;
END;
$$ LANGUAGE plpgsql;

-- Function to queue a sync operation
CREATE OR REPLACE FUNCTION queue_calendar_sync(
  p_connection_id UUID,
  p_session_id UUID DEFAULT NULL,
  p_operation VARCHAR DEFAULT 'update',
  p_priority INT DEFAULT 5
)
RETURNS UUID AS $$
DECLARE
  sync_id UUID;
BEGIN
  INSERT INTO calendar_sync_queue (
    connection_id,
    session_id,
    operation,
    priority
  ) VALUES (
    p_connection_id,
    p_session_id,
    p_operation,
    p_priority
  )
  RETURNING id INTO sync_id;

  RETURN sync_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get next sync job
CREATE OR REPLACE FUNCTION get_next_sync_job()
RETURNS TABLE (
  sync_id UUID,
  connection_id UUID,
  session_id UUID,
  operation VARCHAR,
  coach_id UUID,
  provider VARCHAR,
  access_token TEXT,
  refresh_token TEXT,
  calendar_id VARCHAR
) AS $$
BEGIN
  RETURN QUERY
  WITH next_job AS (
    SELECT q.id, q.connection_id, q.session_id, q.operation
    FROM calendar_sync_queue q
    JOIN coach_calendar_connections c ON q.connection_id = c.id
    WHERE q.status = 'pending'
      AND q.scheduled_for <= CURRENT_TIMESTAMP
      AND q.attempts < q.max_attempts
      AND c.is_active = true
    ORDER BY q.priority ASC, q.scheduled_for ASC
    LIMIT 1
    FOR UPDATE SKIP LOCKED
  )
  SELECT
    nj.id,
    nj.connection_id,
    nj.session_id,
    nj.operation,
    c.coach_id,
    c.provider,
    c.access_token,
    c.refresh_token,
    c.calendar_id
  FROM next_job nj
  JOIN coach_calendar_connections c ON nj.connection_id = c.id;
END;
$$ LANGUAGE plpgsql;

-- Disable RLS for these tables (they're accessed by backend service)
ALTER TABLE public.coach_calendar_connections DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_event_mappings DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_sync_queue DISABLE ROW LEVEL SECURITY;

-- Add initial comment
COMMENT ON TABLE public.coach_calendar_connections IS 'Stores OAuth tokens and settings for coach calendar integrations (Google Calendar, Outlook)';
COMMENT ON TABLE public.calendar_event_mappings IS 'Maps internal sessions to external calendar events for sync tracking';
COMMENT ON TABLE public.calendar_sync_queue IS 'Queue for processing calendar sync operations asynchronously';