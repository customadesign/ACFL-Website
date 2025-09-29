-- =========================================================
-- APPOINTMENT REMINDER SYSTEM MIGRATION
-- =========================================================

-- Add system message fields to messages table
DO $do$
BEGIN
  -- Add is_system_message column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='messages' AND column_name='is_system_message'
  ) THEN
    ALTER TABLE public.messages ADD COLUMN is_system_message BOOLEAN DEFAULT FALSE;
  END IF;

  -- Add system_message_type column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='messages' AND column_name='system_message_type'
  ) THEN
    ALTER TABLE public.messages ADD COLUMN system_message_type TEXT;
  END IF;
END
$do$;

-- Create scheduled_reminders table
CREATE TABLE IF NOT EXISTS public.scheduled_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  reminder_type TEXT NOT NULL CHECK (reminder_type IN ('email', 'message')),
  recipient_id UUID NOT NULL,
  sender_id UUID,
  recipient_email TEXT,
  scheduled_for TIMESTAMPTZ NOT NULL,
  hours_before INTEGER NOT NULL DEFAULT 0,
  sent BOOLEAN DEFAULT FALSE,
  sent_at TIMESTAMPTZ,
  cancelled BOOLEAN DEFAULT FALSE,
  cancelled_at TIMESTAMPTZ,
  failed BOOLEAN DEFAULT FALSE,
  failure_reason TEXT,
  data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_scheduled_reminders_session ON public.scheduled_reminders(session_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_reminders_recipient ON public.scheduled_reminders(recipient_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_reminders_scheduled_for ON public.scheduled_reminders(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_scheduled_reminders_pending ON public.scheduled_reminders(sent, cancelled, scheduled_for) WHERE sent = FALSE AND cancelled = FALSE;
CREATE INDEX IF NOT EXISTS idx_messages_system ON public.messages(is_system_message, system_message_type) WHERE is_system_message = TRUE;

-- Add updated_at trigger for scheduled_reminders
DROP TRIGGER IF EXISTS set_timestamp_scheduled_reminders ON public.scheduled_reminders;
CREATE TRIGGER set_timestamp_scheduled_reminders
  BEFORE UPDATE ON public.scheduled_reminders
  FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();

-- Add foreign key constraints with proper references
DO $do$
BEGIN
  -- Add foreign key for recipient_id to users table if it exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='users') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints
      WHERE constraint_name = 'scheduled_reminders_recipient_id_fkey'
    ) THEN
      ALTER TABLE public.scheduled_reminders
      ADD CONSTRAINT scheduled_reminders_recipient_id_fkey
      FOREIGN KEY (recipient_id) REFERENCES public.users(id) ON DELETE CASCADE;
    END IF;
  END IF;

  -- Add foreign key for sender_id to users table if it exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='users') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints
      WHERE constraint_name = 'scheduled_reminders_sender_id_fkey'
    ) THEN
      ALTER TABLE public.scheduled_reminders
      ADD CONSTRAINT scheduled_reminders_sender_id_fkey
      FOREIGN KEY (sender_id) REFERENCES public.users(id) ON DELETE SET NULL;
    END IF;
  END IF;
END
$do$;

-- Disable RLS for reminder tables (adjust based on your security requirements)
ALTER TABLE public.scheduled_reminders DISABLE ROW LEVEL SECURITY;

-- Add comments for documentation
COMMENT ON TABLE public.scheduled_reminders IS 'Stores scheduled appointment reminders for sessions';
COMMENT ON COLUMN public.scheduled_reminders.reminder_type IS 'Type of reminder: email or message';
COMMENT ON COLUMN public.scheduled_reminders.hours_before IS 'How many hours before the session this reminder is scheduled';
COMMENT ON COLUMN public.scheduled_reminders.data IS 'JSON data containing session and user information for the reminder';
COMMENT ON COLUMN public.messages.is_system_message IS 'Indicates if this message was sent by the system (e.g., reminders)';
COMMENT ON COLUMN public.messages.system_message_type IS 'Type of system message (e.g., appointment_reminder, urgent_session_reminder)';