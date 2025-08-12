-- =========================================================
-- EXTENSIONS
-- =========================================================
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =========================================================
-- SHARED TRIGGER: updated_at
-- =========================================================
CREATE OR REPLACE FUNCTION public.trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =========================================================
-- USERS (standalone; not tied to auth.users)
-- =========================================================
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('client', 'coach', 'admin')),
  first_name VARCHAR(100),
  last_name  VARCHAR(100),
  is_active BOOLEAN DEFAULT true,
  email_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email  ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_role   ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_users_active ON public.users(is_active);

DROP TRIGGER IF EXISTS set_timestamp_users ON public.users;
CREATE TRIGGER set_timestamp_users
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();

ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- =========================================================
-- CLIENTS (no FK to auth.users)
-- =========================================================
-- If you intentionally decoupled from auth.users, keep it this way:
CREATE TABLE IF NOT EXISTS public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email                TEXT NOT NULL UNIQUE,
  first_name           TEXT NOT NULL,
  last_name            TEXT NOT NULL,
  phone                TEXT,
  dob                  DATE,
  location_state       TEXT,
  gender_identity      TEXT,
  ethnic_identity      TEXT,
  religious_background TEXT,
  preferred_language   TEXT,
  areas_of_concern     TEXT[] DEFAULT '{}'::TEXT[],
  availability         TEXT[] DEFAULT '{}'::TEXT[],
  preferred_coach_gender TEXT,
  bio                    TEXT,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_state_len CHECK (location_state IS NULL OR char_length(location_state) BETWEEN 2 AND 32)
);

CREATE INDEX IF NOT EXISTS idx_clients_last_first       ON public.clients (last_name, first_name);
CREATE INDEX IF NOT EXISTS idx_clients_areas_gin        ON public.clients USING GIN (areas_of_concern);
CREATE INDEX IF NOT EXISTS idx_clients_availability_gin ON public.clients USING GIN (availability);

DROP TRIGGER IF EXISTS set_timestamp_clients ON public.clients;
CREATE TRIGGER set_timestamp_clients
  BEFORE UPDATE ON public.clients
  FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();

ALTER TABLE public.clients DISABLE ROW LEVEL SECURITY;

-- =========================================================
-- COACHES (no FK to auth.users)
-- =========================================================
CREATE TABLE IF NOT EXISTS public.coaches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email              TEXT NOT NULL UNIQUE,
  first_name         TEXT NOT NULL,
  last_name          TEXT NOT NULL,
  phone              TEXT,
  is_available       BOOLEAN NOT NULL DEFAULT true,
  bio                TEXT,
  years_experience   INT CHECK (years_experience IS NULL OR years_experience BETWEEN 0 AND 80),
  hourly_rate_usd    NUMERIC(10,2) CHECK (hourly_rate_usd IS NULL OR hourly_rate_usd >= 0),
  qualifications     TEXT,
  specialties        TEXT[] NOT NULL DEFAULT '{}'::TEXT[],
  languages          TEXT[] NOT NULL DEFAULT '{}'::TEXT[],
  rating             NUMERIC(3,2) DEFAULT NULL,
  availability       TEXT[] DEFAULT '{}'::TEXT[],
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_coaches_last_first     ON public.coaches (last_name, first_name);
CREATE INDEX IF NOT EXISTS idx_coaches_specialties_gin ON public.coaches USING GIN (specialties);
CREATE INDEX IF NOT EXISTS idx_coaches_languages_gin   ON public.coaches USING GIN (languages);
CREATE INDEX IF NOT EXISTS idx_coaches_available       ON public.coaches (is_available);
CREATE INDEX IF NOT EXISTS idx_coaches_availability_gin ON public.coaches USING GIN (availability);

DROP TRIGGER IF EXISTS set_timestamp_coaches ON public.coaches;
CREATE TRIGGER set_timestamp_coaches
  BEFORE UPDATE ON public.coaches
  FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();

ALTER TABLE public.coaches DISABLE ROW LEVEL SECURITY;

-- =========================================================
-- COACH_DEMOGRAPHICS
-- =========================================================
CREATE TABLE IF NOT EXISTS public.coach_demographics (
  coach_id UUID PRIMARY KEY REFERENCES public.coaches(id) ON DELETE CASCADE,
  gender_identity TEXT,
  ethnic_identity TEXT,
  religious_background TEXT,
  languages TEXT[] DEFAULT '{}'::TEXT[],
  accepts_insurance BOOLEAN,
  accepts_sliding_scale BOOLEAN,
  timezone TEXT,
  meta JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS set_timestamp_coach_demographics ON public.coach_demographics;
CREATE TRIGGER set_timestamp_coach_demographics
  BEFORE UPDATE ON public.coach_demographics
  FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();

ALTER TABLE public.coach_demographics DISABLE ROW LEVEL SECURITY;

-- Normalize meta for video-only behavior
UPDATE public.coach_demographics 
SET meta = jsonb_set(COALESCE(meta, '{}'::jsonb), '{video_available}', 'true'::jsonb)
WHERE meta IS NULL OR NOT (meta ? 'video_available');

UPDATE public.coach_demographics 
SET meta = meta - 'in_person_available' - 'phone_available'
WHERE meta ? 'in_person_available' OR meta ? 'phone_available';

-- =========================================================
-- SESSIONS — ONLINE ONLY (Zoom)
-- =========================================================
CREATE TABLE IF NOT EXISTS public.sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL,
  coach_id  UUID NOT NULL,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at   TIMESTAMPTZ NOT NULL,
  scheduled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), -- FIX: Add missing column
  status TEXT NOT NULL DEFAULT 'scheduled', -- scheduled|cancelled|completed|no_show
  notes TEXT,
  zoom_link TEXT NOT NULL,
  session_type TEXT DEFAULT 'video', -- enforced below to be 'video'
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_session_time CHECK (ends_at > starts_at)
);

-- Ensure updated_at trigger
DROP TRIGGER IF EXISTS set_timestamp_sessions ON public.sessions;
CREATE TRIGGER set_timestamp_sessions
  BEFORE UPDATE ON public.sessions
  FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();

CREATE INDEX IF NOT EXISTS idx_sessions_by_parties ON public.sessions (client_id, coach_id, starts_at);

-- Enforce video-only session_type
UPDATE public.sessions SET session_type = 'video' WHERE session_type IS DISTINCT FROM 'video';

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'sessions_session_type_check'
      AND conrelid = 'public.sessions'::regclass
  ) THEN
    ALTER TABLE public.sessions DROP CONSTRAINT sessions_session_type_check;
  END IF;
END$$;

ALTER TABLE public.sessions
  ADD CONSTRAINT sessions_session_type_check CHECK (session_type = 'video');

COMMENT ON TABLE public.sessions IS 'Sessions table - only video sessions supported';
COMMENT ON COLUMN public.sessions.session_type IS 'Session type - only video sessions allowed';

-- >>> FIX #2: Ensure FKs exist so PostgREST sees relationships <<<
-- client_id -> clients.id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'sessions_client_id_fkey'
      AND conrelid = 'public.sessions'::regclass
  ) THEN
    ALTER TABLE public.sessions
      ADD CONSTRAINT sessions_client_id_fkey
      FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE;
  END IF;
END$$;

-- coach_id -> coaches.id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'sessions_coach_id_fkey'
      AND conrelid = 'public.sessions'::regclass
  ) THEN
    ALTER TABLE public.sessions
      ADD CONSTRAINT sessions_coach_id_fkey
      FOREIGN KEY (coach_id) REFERENCES public.coaches(id) ON DELETE CASCADE;
  END IF;
END$$;

ALTER TABLE public.sessions DISABLE ROW LEVEL SECURITY;

-- =========================================================
-- SAVED_COACHES
-- =========================================================
CREATE TABLE IF NOT EXISTS public.saved_coaches (
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  coach_id  UUID NOT NULL REFERENCES public.coaches(id) ON DELETE CASCADE,
  saved_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), -- FIX: Add missing column
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (client_id, coach_id)
);
ALTER TABLE public.saved_coaches DISABLE ROW LEVEL SECURITY;

-- =========================================================
-- SEARCH_HISTORY  (adds search_criteria to match app)
-- =========================================================
CREATE TABLE IF NOT EXISTS public.search_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE, -- FIX: Add missing column and FK
  user_id UUID NOT NULL,               -- no FK to auth.users by design
  query TEXT NOT NULL,
  filters JSONB DEFAULT '{}'::jsonb,   -- legacy/previous name
  search_criteria JSONB DEFAULT '{}'::jsonb, -- >>> FIX #1: field your app expects
  results_count INT NOT NULL DEFAULT 0, -- FIX: Add missing column
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Keep filters <-> search_criteria in sync
CREATE OR REPLACE FUNCTION public.search_history_sync_fields()
RETURNS TRIGGER AS $$
BEGIN
  -- If one is NULL/empty, copy from the other
  IF NEW.filters IS NULL OR NEW.filters = '{}'::jsonb THEN
    NEW.filters := COALESCE(NEW.search_criteria, '{}'::jsonb);
  END IF;
  IF NEW.search_criteria IS NULL OR NEW.search_criteria = '{}'::jsonb THEN
    NEW.search_criteria := COALESCE(NEW.filters, '{}'::jsonb);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_search_history_sync ON public.search_history;
CREATE TRIGGER trg_search_history_sync
  BEFORE INSERT OR UPDATE ON public.search_history
  FOR EACH ROW EXECUTE FUNCTION public.search_history_sync_fields();

-- Backfill existing rows once
UPDATE public.search_history
SET search_criteria = COALESCE(NULLIF(search_criteria, '{}'::jsonb), filters, '{}'::jsonb),
    filters         = COALESCE(NULLIF(filters, '{}'::jsonb), search_criteria, '{}'::jsonb)
WHERE TRUE;

CREATE INDEX IF NOT EXISTS idx_search_history_user_time ON public.search_history (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_search_history_client_time ON public.search_history (client_id, created_at DESC);

ALTER TABLE public.search_history DISABLE ROW LEVEL SECURITY;

-- =========================================================
-- MESSAGES
-- =========================================================
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID,
  sender_id UUID NOT NULL,    -- no FK to auth.users (by design)
  recipient_id UUID NOT NULL, -- no FK to auth.users
  session_id UUID REFERENCES public.sessions(id) ON DELETE SET NULL,
  content TEXT NOT NULL, -- FIX: Add missing column
  body TEXT NOT NULL,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_parties ON public.messages (sender_id, recipient_id, created_at);
ALTER TABLE public.messages DISABLE ROW LEVEL SECURITY;

-- =========================================================
-- REVIEWS
-- =========================================================
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  client_id  UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  coach_id   UUID NOT NULL REFERENCES public.coaches(id) ON DELETE CASCADE,
  rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reviews_coach ON public.reviews (coach_id, created_at DESC);
ALTER TABLE public.reviews DISABLE ROW LEVEL SECURITY;

-- =========================================================
-- CLIENT_ASSESSMENTS
-- =========================================================
CREATE TABLE IF NOT EXISTS public.client_assessments (
  client_id UUID PRIMARY KEY REFERENCES public.clients(id) ON DELETE CASCADE,
  goals TEXT,
  concerns TEXT[] DEFAULT '{}'::TEXT[],
  budget_min NUMERIC(10,2) CHECK (budget_min IS NULL OR budget_min >= 0),
  budget_max NUMERIC(10,2) CHECK (budget_max IS NULL OR budget_max >= 0),
  preferred_session_length_minutes INT CHECK (
    preferred_session_length_minutes IS NULL OR preferred_session_length_minutes BETWEEN 15 AND 180
  ),
  preferences JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS set_timestamp_client_assessments ON public.client_assessments;
CREATE TRIGGER set_timestamp_client_assessments
  BEFORE UPDATE ON public.client_assessments
  FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();

ALTER TABLE public.client_assessments DISABLE ROW LEVEL SECURITY;

-- =========================================================
-- ADMIN_ACTIONS
-- =========================================================
CREATE TABLE IF NOT EXISTS public.admin_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL, -- no FK to auth.users
  action TEXT NOT NULL,
  target_table TEXT,
  target_id UUID,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.admin_actions DISABLE ROW LEVEL SECURITY;

-- =========================================================
-- SYSTEM_SETTINGS
-- =========================================================
CREATE TABLE IF NOT EXISTS public.system_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.system_settings DISABLE ROW LEVEL SECURITY;

-- =========================================================
-- GLOBAL: ensure RLS disabled (idempotent)
-- =========================================================
ALTER TABLE public.clients             DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.coaches             DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions            DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages            DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews             DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_coaches       DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.search_history      DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.coach_demographics  DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_assessments  DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_actions       DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings     DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.users               DISABLE ROW LEVEL SECURITY;

-- ================================================
-- PATCH: columns your app expects + coach availability
-- ================================================

-- 1) saved_coaches.saved_at (already added above)
-- 2) search_history.results_count (already added above)
-- 3) coaches.rating (already added above)
-- 4) Coach availability with your exact options

-- Create enum type if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public' AND t.typname = 'coach_availability_option'
  ) THEN
    CREATE TYPE public.coach_availability_option AS ENUM (
      'Weekday Mornings',
      'Weekday Afternoons',
      'Weekday Evenings',
      'Weekends',
      'Flexible (Anytime)'
    );
  END IF;
END$$;

-- Add availability column to coaches as an ARRAY of the enum (already added above)
-- Fast lookup index for availability filters (already added above)

-- 5) Keep RLS disabled (no-ops if already disabled)
ALTER TABLE public.saved_coaches      DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.search_history     DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.coaches            DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews            DISABLE ROW LEVEL SECURITY;

-- 6) Ask PostgREST to reload its schema cache so 'rating' is visible right away
DO $$
BEGIN
  PERFORM pg_notify('pgrst', 'reload schema');
EXCEPTION WHEN undefined_object THEN
  -- If the pgrst channel isn't present, ignore quietly.
  NULL;
END$$;
