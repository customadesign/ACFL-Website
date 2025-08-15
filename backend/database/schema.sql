-- =========================================================
-- EXTENSIONS
-- =========================================================
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =========================================================
-- CUSTOM TYPES
-- =========================================================
-- Coach availability options
-- These options allow coaches to specify when they're available for sessions
CREATE TYPE public.coach_availability_option AS ENUM (
  'weekday_mornings',    -- Monday-Friday mornings
  'weekday_afternoons',  -- Monday-Friday afternoons
  'weekday_evenings',    -- Monday-Friday evenings
  'weekends',            -- Saturday and Sunday
  'flexible_anytime'     -- Available at any time
);

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
  rating             NUMERIC(3,2),
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  availability public.coach_availability_option[] NOT NULL DEFAULT '{}'::public.coach_availability_option[]
);

CREATE INDEX IF NOT EXISTS idx_coaches_last_first       ON public.coaches (last_name, first_name);
CREATE INDEX IF NOT EXISTS idx_coaches_specialties_gin  ON public.coaches USING GIN (specialties);
CREATE INDEX IF NOT EXISTS idx_coaches_languages_gin    ON public.coaches USING GIN (languages);
CREATE INDEX IF NOT EXISTS idx_coaches_available        ON public.coaches (is_available);

DROP TRIGGER IF EXISTS set_timestamp_coaches ON public.coaches;
CREATE TRIGGER set_timestamp_coaches
  BEFORE UPDATE ON public.coaches
  FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();

ALTER TABLE public.coaches DISABLE ROW LEVEL SECURITY;

-- Back-compat: expose coaches.hourly_rate (legacy) as generated alias of hourly_rate_usd
DO $do$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='coaches' AND column_name='hourly_rate'
  ) THEN
    ALTER TABLE public.coaches
      ADD COLUMN hourly_rate NUMERIC(10,2) GENERATED ALWAYS AS (hourly_rate_usd) STORED;
  END IF;
END
$do$;

-- Back-compat: expose coaches.experience (legacy) as generated alias of years_experience
DO $do$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='coaches' AND column_name='experience'
  ) THEN
    ALTER TABLE public.coaches
      ADD COLUMN experience INT GENERATED ALWAYS AS (years_experience) STORED;
  END IF;
END
$do$;

CREATE INDEX IF NOT EXISTS idx_coaches_hourly_rate ON public.coaches (hourly_rate);
CREATE INDEX IF NOT EXISTS idx_coaches_experience ON public.coaches (years_experience);

-- =========================================================
-- COACH_DEMOGRAPHICS
-- =========================================================
CREATE TABLE IF NOT EXISTS public.coach_demographics (
  coach_id UUID PRIMARY KEY REFERENCES public.coaches(id) ON DELETE CASCADE,
  gender_identity TEXT,
  ethnic_identity TEXT,
  religious_background TEXT,
  languages TEXT[] DEFAULT '{}'::TEXT[],
  availability public.coach_availability_option[] NOT NULL DEFAULT '{}'::public.coach_availability_option[],
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

-- Back-compat: expose coach_demographics.gender (legacy) as generated alias of gender_identity
DO $do$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='coach_demographics' AND column_name='gender'
  ) THEN
    ALTER TABLE public.coach_demographics
      ADD COLUMN gender TEXT GENERATED ALWAYS AS (gender_identity) STORED;
  END IF;
END
$do$;

-- Back-compat: expose coach_demographics.ethnicity (legacy) as generated alias of ethnic_identity
DO $do$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='coach_demographics' AND column_name='ethnicity'
  ) THEN
    ALTER TABLE public.coach_demographics
      ADD COLUMN ethnicity TEXT GENERATED ALWAYS AS (ethnic_identity) STORED;
  END IF;
END
$do$;

-- Normalize meta for video-only behavior
UPDATE public.coach_demographics 
SET meta = jsonb_set(COALESCE(meta, '{}'::jsonb), '{video_available}', 'true'::jsonb)
WHERE meta IS NULL OR NOT (meta ? 'video_available');

UPDATE public.coach_demographics 
SET meta = meta - 'in_person_available' - 'phone_available'
WHERE meta ? 'in_person_available' OR meta ? 'phone_available';

CREATE INDEX IF NOT EXISTS idx_coach_demographics_availability_gin
ON public.coach_demographics USING GIN (availability);

-- =========================================================
-- SESSIONS — ONLINE ONLY (Zoom)
-- =========================================================
CREATE TABLE IF NOT EXISTS public.sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  coach_id  UUID NOT NULL REFERENCES public.coaches(id) ON DELETE CASCADE,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at   TIMESTAMPTZ NOT NULL,
  scheduled_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'scheduled',
  notes TEXT,
  zoom_link TEXT NOT NULL,
  session_type TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_session_time CHECK (ends_at > starts_at)
);

CREATE INDEX IF NOT EXISTS idx_sessions_by_parties ON public.sessions (client_id, coach_id, starts_at);
CREATE INDEX IF NOT EXISTS idx_sessions_scheduled_at ON public.sessions (scheduled_at);

UPDATE public.sessions SET session_type = 'video' WHERE session_type IS DISTINCT FROM 'video';

DO $do$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'sessions_session_type_check'
      AND conrelid = 'public.sessions'::regclass
  ) THEN
    ALTER TABLE public.sessions DROP CONSTRAINT sessions_session_type_check;
  END IF;
END
$do$;

ALTER TABLE public.sessions
  ADD CONSTRAINT sessions_session_type_check CHECK (session_type = 'video');

CREATE OR REPLACE FUNCTION public.trg_sessions_sync_scheduled_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.scheduled_at IS NULL OR NEW.scheduled_at <> NEW.starts_at THEN
    NEW.scheduled_at := NEW.starts_at;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sessions_sync_scheduled_at ON public.sessions;
CREATE TRIGGER trg_sessions_sync_scheduled_at
  BEFORE INSERT OR UPDATE ON public.sessions
  FOR EACH ROW EXECUTE FUNCTION public.trg_sessions_sync_scheduled_at();

DROP TRIGGER IF EXISTS set_timestamp_sessions ON public.sessions;
CREATE TRIGGER set_timestamp_sessions
  BEFORE UPDATE ON public.sessions
  FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();

ALTER TABLE public.sessions DISABLE ROW LEVEL SECURITY;

DO $do$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='sessions' AND column_name='duration'
  ) THEN
    ALTER TABLE public.sessions
      ADD COLUMN duration INTERVAL GENERATED ALWAYS AS (ends_at - starts_at) STORED;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='sessions' AND column_name='duration_minutes'
  ) THEN
    ALTER TABLE public.sessions
      ADD COLUMN duration_minutes INT GENERATED ALWAYS AS (
        GREATEST(0, (EXTRACT(EPOCH FROM (ends_at - starts_at)) / 60)::int)
      ) STORED;
  END IF;
END
$do$;

-- =========================================================
-- SAVED_COACHES
-- =========================================================
CREATE TABLE IF NOT EXISTS public.saved_coaches (
  user_id   UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  client_id UUID     REFERENCES public.clients(id) ON DELETE SET NULL,
  coach_id  UUID NOT NULL REFERENCES public.coaches(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  saved_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, coach_id)
);

CREATE INDEX IF NOT EXISTS idx_saved_coaches_user   ON public.saved_coaches(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_coaches_client ON public.saved_coaches(client_id);

ALTER TABLE public.saved_coaches DISABLE ROW LEVEL SECURITY;

-- =========================================================
-- SEARCH_HISTORY
-- =========================================================
CREATE TABLE IF NOT EXISTS public.search_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  client_id UUID,
  query TEXT NOT NULL,
  filters JSONB DEFAULT '{}'::jsonb,
  search_criteria JSONB DEFAULT '{}'::jsonb,
  results_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION public.search_history_sync_fields()
RETURNS TRIGGER AS $$
BEGIN
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

CREATE OR REPLACE FUNCTION public.search_history_sync_ids()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.user_id IS NULL AND NEW.client_id IS NOT NULL THEN
    NEW.user_id := NEW.client_id;
  ELSIF NEW.client_id IS NULL AND NEW.user_id IS NOT NULL THEN
    NEW.client_id := NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_search_history_sync_ids ON public.search_history;
CREATE TRIGGER trg_search_history_sync_ids
  BEFORE INSERT OR UPDATE ON public.search_history
  FOR EACH ROW EXECUTE FUNCTION public.search_history_sync_ids();

CREATE INDEX IF NOT EXISTS idx_search_history_user_time   ON public.search_history (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_search_history_client_time ON public.search_history (client_id, created_at DESC);

ALTER TABLE public.search_history DISABLE ROW LEVEL SECURITY;

-- =========================================================
-- MESSAGES
-- =========================================================
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID,
  sender_id UUID NOT NULL,
  recipient_id UUID NOT NULL,
  session_id UUID REFERENCES public.sessions(id) ON DELETE SET NULL,
  body TEXT NOT NULL,
  content TEXT,
  attachment_url TEXT,
  attachment_name TEXT,
  attachment_size BIGINT,
  attachment_type TEXT,
  read_at TIMESTAMPTZ,
  deleted_for_everyone BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMPTZ,
  hidden_for_users UUID[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION public.trg_messages_sync_content()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.content IS NULL OR NEW.content <> NEW.body THEN
    NEW.content := NEW.body;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_messages_sync_content ON public.messages;
CREATE TRIGGER trg_messages_sync_content
  BEFORE INSERT OR UPDATE ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.trg_messages_sync_content();

CREATE INDEX IF NOT EXISTS idx_messages_parties ON public.messages (sender_id, recipient_id, created_at);

ALTER TABLE public.messages DISABLE ROW LEVEL SECURITY;

DO $do$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='messages' AND column_name='receiver_id'
  ) THEN
    ALTER TABLE public.messages
      ADD COLUMN receiver_id UUID GENERATED ALWAYS AS (recipient_id) STORED;
  END IF;
END
$do$;

-- Add attachment columns if they don't exist
DO $do$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='messages' AND column_name='attachment_url'
  ) THEN
    ALTER TABLE public.messages
      ADD COLUMN attachment_url TEXT,
      ADD COLUMN attachment_name TEXT,
      ADD COLUMN attachment_size BIGINT,
      ADD COLUMN attachment_type TEXT;
  END IF;
END
$do$;

-- Add message deletion columns if they don't exist
DO $do$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='messages' AND column_name='deleted_for_everyone'
  ) THEN
    ALTER TABLE public.messages
      ADD COLUMN deleted_for_everyone BOOLEAN DEFAULT FALSE,
      ADD COLUMN deleted_at TIMESTAMPTZ,
      ADD COLUMN hidden_for_users UUID[] DEFAULT '{}';
  END IF;
END
$do$;

-- Function to add user to hidden_for_users array
CREATE OR REPLACE FUNCTION public.add_user_to_hidden_array(message_id UUID, user_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.messages 
  SET hidden_for_users = array_append(hidden_for_users, user_id)
  WHERE id = message_id 
  AND NOT (user_id = ANY(hidden_for_users));
END;
$$ LANGUAGE plpgsql;

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

CREATE OR REPLACE FUNCTION public.recompute_coach_rating(p_coach_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.coaches c
  SET rating = sub.avg_rating
  FROM (
    SELECT coach_id, ROUND(AVG(rating)::numeric, 2) AS avg_rating
    FROM public.reviews
    WHERE coach_id = p_coach_id
    GROUP BY coach_id
  ) AS sub
  WHERE c.id = sub.coach_id;

  UPDATE public.coaches c
  SET rating = NULL
  WHERE c.id = p_coach_id
    AND NOT EXISTS (SELECT 1 FROM public.reviews r WHERE r.coach_id = p_coach_id);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.trg_reviews_update_coach_rating()
RETURNS TRIGGER AS $$
DECLARE
  v_coach_id UUID;
BEGIN
  IF (TG_OP = 'INSERT') THEN
    v_coach_id := NEW.coach_id;
  ELSIF (TG_OP = 'UPDATE') THEN
    IF NEW.coach_id IS DISTINCT FROM OLD.coach_id THEN
      PERFORM public.recompute_coach_rating(OLD.coach_id);
    END IF;
    v_coach_id := NEW.coach_id;
  ELSIF (TG_OP = 'DELETE') THEN
    v_coach_id := OLD.coach_id;
  END IF;

  PERFORM public.recompute_coach_rating(v_coach_id);
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_reviews_update_coach_rating ON public.reviews;
CREATE TRIGGER trg_reviews_update_coach_rating
AFTER INSERT OR UPDATE OR DELETE ON public.reviews
FOR EACH ROW EXECUTE FUNCTION public.trg_reviews_update_coach_rating();

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

--
