-- =========================================
-- Create Sessions Table for Appointments
-- =========================================

-- Sessions/Appointments table
CREATE TABLE IF NOT EXISTS public.sessions (
  id uuid primary key default gen_random_uuid(),
  
  -- References
  coach_id uuid not null references public.coaches(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  
  -- Session details
  scheduled_at timestamptz not null,
  duration integer not null default 60, -- in minutes
  session_type text default 'coaching',
  notes text,
  
  -- Status tracking
  status text not null default 'scheduled' check (status in ('scheduled', 'confirmed', 'cancelled', 'completed', 'no_show')),
  
  -- Meeting details
  meeting_link text,
  meeting_id text,
  location text, -- for in-person sessions
  
  -- Timestamps
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Keep updated_at fresh
CREATE OR REPLACE FUNCTION public.sessions_set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $
BEGIN
  new.updated_at = now();
  RETURN new;
END; $;

DROP TRIGGER IF EXISTS trg_sessions_set_updated_at ON public.sessions;
CREATE TRIGGER trg_sessions_set_updated_at
BEFORE UPDATE ON public.sessions
FOR EACH ROW EXECUTE FUNCTION public.sessions_set_updated_at();

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_sessions_coach_id ON public.sessions (coach_id);
CREATE INDEX IF NOT EXISTS idx_sessions_client_id ON public.sessions (client_id);
CREATE INDEX IF NOT EXISTS idx_sessions_scheduled_at ON public.sessions (scheduled_at);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON public.sessions (status);
CREATE INDEX IF NOT EXISTS idx_sessions_coach_scheduled ON public.sessions (coach_id, scheduled_at);

-- =========================================
-- RLS
-- =========================================
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

-- Coaches can manage their own sessions
DROP POLICY IF EXISTS "coaches can manage own sessions" ON public.sessions;
CREATE POLICY "coaches can manage own sessions"
ON public.sessions
FOR ALL
TO authenticated
USING (coach_id = auth.uid())
WITH CHECK (coach_id = auth.uid());

-- Clients can view and manage their own sessions
DROP POLICY IF EXISTS "clients can manage own sessions" ON public.sessions;
CREATE POLICY "clients can manage own sessions"
ON public.sessions
FOR ALL
TO authenticated
USING (client_id = auth.uid())
WITH CHECK (client_id = auth.uid());

-- Service role (backend) full access
DROP POLICY IF EXISTS "service role full access sessions" ON public.sessions;
CREATE POLICY "service role full access sessions"
ON public.sessions
AS PERMISSIVE
FOR ALL
TO authenticated
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');