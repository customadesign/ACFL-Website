-- =========================================================
-- SEARCH OPTIMIZATION INDEXES
-- =========================================================
-- This migration adds indexes to optimize coach search performance

-- Add missing columns to coach_demographics if they don't exist
DO $do$
BEGIN
  -- Add availability_options if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='coach_demographics' AND column_name='availability_options'
  ) THEN
    ALTER TABLE public.coach_demographics ADD COLUMN availability_options TEXT[] DEFAULT '{}';
  END IF;

  -- Add therapy_modalities if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='coach_demographics' AND column_name='therapy_modalities'
  ) THEN
    ALTER TABLE public.coach_demographics ADD COLUMN therapy_modalities TEXT[] DEFAULT '{}';
  END IF;

  -- Add location if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='coach_demographics' AND column_name='location'
  ) THEN
    ALTER TABLE public.coach_demographics ADD COLUMN location TEXT;
  END IF;
END
$do$;

-- Create comprehensive indexes for coach search optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_coaches_search_composite 
ON public.coaches (is_available, years_experience, rating) 
WHERE is_available = true;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_coaches_specialties_text_search 
ON public.coaches USING GIN (to_tsvector('english', array_to_string(specialties, ' ')));

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_coaches_languages_text_search 
ON public.coaches USING GIN (to_tsvector('english', array_to_string(languages, ' ')));

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_coach_demographics_gender_identity 
ON public.coach_demographics (gender_identity) 
WHERE gender_identity IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_coach_demographics_location 
ON public.coach_demographics (location) 
WHERE location IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_coach_demographics_therapy_modalities 
ON public.coach_demographics USING GIN (therapy_modalities);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_coach_demographics_availability_options 
ON public.coach_demographics USING GIN (availability_options);

-- Add missing columns to coach_applications for search functionality
DO $do$
BEGIN
  -- Add profile_photo if not exists (for consistency)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='coaches' AND column_name='profile_photo'
  ) THEN
    ALTER TABLE public.coaches ADD COLUMN profile_photo TEXT;
  END IF;
END
$do$;

-- Optimize reviews table for coach rating calculations
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reviews_coach_rating_calc 
ON public.reviews (coach_id, rating) 
WHERE rating BETWEEN 1 AND 5;

-- Add indexes for search history analytics
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_search_history_client_created 
ON public.search_history (client_id, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_search_history_results_count 
ON public.search_history (results_count) 
WHERE results_count > 0;

-- Add GIN index on search_criteria for complex queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_search_history_criteria_gin 
ON public.search_history USING GIN (search_criteria);

-- Optimize saved_coaches for quick lookups
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_saved_coaches_client_saved_at 
ON public.saved_coaches (client_id, saved_at DESC);

-- Add text search capabilities for coach bio and philosophy
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_coaches_bio_text_search 
ON public.coaches USING GIN (to_tsvector('english', COALESCE(bio, ''))) 
WHERE bio IS NOT NULL AND bio != '';

-- Create a function to update coach rating from reviews (if not exists)
CREATE OR REPLACE FUNCTION public.update_coach_rating_from_reviews()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the coach's rating based on all their reviews
  UPDATE public.coaches 
  SET rating = (
    SELECT ROUND(AVG(rating)::numeric, 2)
    FROM public.reviews 
    WHERE coach_id = COALESCE(NEW.coach_id, OLD.coach_id)
  )
  WHERE id = COALESCE(NEW.coach_id, OLD.coach_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update coach ratings when reviews change
DROP TRIGGER IF EXISTS trigger_update_coach_rating ON public.reviews;
CREATE TRIGGER trigger_update_coach_rating
  AFTER INSERT OR UPDATE OR DELETE ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.update_coach_rating_from_reviews();

-- Add helpful search functions
CREATE OR REPLACE FUNCTION public.coach_search_score(
  coach_specialties TEXT[],
  coach_languages TEXT[],
  search_specialties TEXT[],
  search_languages TEXT[]
) RETURNS INTEGER AS $$
DECLARE
  specialty_score INTEGER := 0;
  language_score INTEGER := 0;
  total_score INTEGER := 0;
BEGIN
  -- Calculate specialty match score
  IF array_length(search_specialties, 1) > 0 AND array_length(coach_specialties, 1) > 0 THEN
    specialty_score := (
      SELECT COUNT(*)
      FROM unnest(coach_specialties) AS coach_spec
      JOIN unnest(search_specialties) AS search_spec ON LOWER(coach_spec) = LOWER(search_spec)
    ) * 40 / array_length(search_specialties, 1);
  END IF;
  
  -- Calculate language match score
  IF array_length(search_languages, 1) > 0 AND array_length(coach_languages, 1) > 0 THEN
    language_score := (
      SELECT COUNT(*)
      FROM unnest(coach_languages) AS coach_lang
      JOIN unnest(search_languages) AS search_lang ON LOWER(coach_lang) = LOWER(search_lang)
    ) * 20 / array_length(search_languages, 1);
  END IF;
  
  total_score := specialty_score + language_score;
  RETURN LEAST(100, total_score);
END;
$$ LANGUAGE plpgsql;

-- Create a materialized view for fast coach search (optional - can be used for very high traffic)
CREATE MATERIALIZED VIEW IF NOT EXISTS public.coach_search_view AS
SELECT 
  c.id,
  c.first_name || ' ' || c.last_name as name,
  c.email,
  c.bio,
  c.specialties,
  c.languages,
  c.years_experience,
  c.hourly_rate_usd,
  c.rating,
  c.is_available,
  c.profile_photo,
  cd.gender_identity,
  cd.ethnic_identity,
  cd.religious_background,
  cd.availability_options,
  cd.therapy_modalities,
  cd.location,
  cd.accepts_insurance,
  cd.accepts_sliding_scale,
  cd.timezone,
  cd.meta,
  -- Pre-calculate text search vectors
  to_tsvector('english', COALESCE(c.bio, '')) as bio_search,
  to_tsvector('english', array_to_string(COALESCE(c.specialties, '{}'), ' ')) as specialty_search,
  to_tsvector('english', array_to_string(COALESCE(c.languages, '{}'), ' ')) as language_search
FROM public.coaches c
LEFT JOIN public.coach_demographics cd ON c.id = cd.coach_id
WHERE c.is_available = true;

-- Create index on the materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_coach_search_view_id ON public.coach_search_view (id);
CREATE INDEX IF NOT EXISTS idx_coach_search_view_specialty_search ON public.coach_search_view USING GIN (specialty_search);
CREATE INDEX IF NOT EXISTS idx_coach_search_view_bio_search ON public.coach_search_view USING GIN (bio_search);
CREATE INDEX IF NOT EXISTS idx_coach_search_view_language_search ON public.coach_search_view USING GIN (language_search);

-- Function to refresh the materialized view
CREATE OR REPLACE FUNCTION public.refresh_coach_search_view()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.coach_search_view;
END;
$$ LANGUAGE plpgsql;

-- Auto-refresh the materialized view when coach data changes
CREATE OR REPLACE FUNCTION public.trigger_refresh_coach_search_view()
RETURNS TRIGGER AS $$
BEGIN
  -- Use pg_notify to refresh asynchronously to avoid blocking
  PERFORM pg_notify('refresh_coach_search_view', '');
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_coach_data_changed ON public.coaches;
CREATE TRIGGER trigger_coach_data_changed
  AFTER INSERT OR UPDATE OR DELETE ON public.coaches
  FOR EACH STATEMENT
  EXECUTE FUNCTION public.trigger_refresh_coach_search_view();

DROP TRIGGER IF EXISTS trigger_coach_demographics_changed ON public.coach_demographics;
CREATE TRIGGER trigger_coach_demographics_changed
  AFTER INSERT OR UPDATE OR DELETE ON public.coach_demographics
  FOR EACH STATEMENT
  EXECUTE FUNCTION public.trigger_refresh_coach_search_view();

-- Initial refresh of the materialized view
SELECT public.refresh_coach_search_view();

-- Create a function for efficient coach search with scoring
CREATE OR REPLACE FUNCTION public.search_coaches_optimized(
  p_search_criteria JSONB,
  p_limit INTEGER DEFAULT 50
) RETURNS TABLE (
  id UUID,
  name TEXT,
  email TEXT,
  bio TEXT,
  specialties TEXT[],
  languages TEXT[],
  years_experience INTEGER,
  hourly_rate_usd NUMERIC,
  rating NUMERIC,
  match_score INTEGER,
  profile_photo TEXT,
  gender_identity TEXT,
  location TEXT,
  availability_options TEXT[],
  therapy_modalities TEXT[],
  meta JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    csv.id,
    csv.name,
    csv.email,
    csv.bio,
    csv.specialties,
    csv.languages,
    csv.years_experience,
    csv.hourly_rate_usd,
    csv.rating,
    -- Calculate match score based on search criteria
    COALESCE(
      public.coach_search_score(
        csv.specialties,
        csv.languages,
        COALESCE(ARRAY(SELECT jsonb_array_elements_text(p_search_criteria->'coachingExpertise')), '{}'),
        COALESCE(ARRAY(SELECT jsonb_array_elements_text(p_search_criteria->'languagesFluent')), '{}')
      ), 0
    ) as match_score,
    csv.profile_photo,
    csv.gender_identity,
    csv.location,
    csv.availability_options,
    csv.therapy_modalities,
    csv.meta
  FROM public.coach_search_view csv
  WHERE 
    csv.is_available = true
    -- Add flexible filtering conditions
    AND (
      p_search_criteria->>'location' IS NULL 
      OR csv.location = p_search_criteria->>'location'
    )
    AND (
      p_search_criteria->>'therapistGender' IS NULL 
      OR p_search_criteria->>'therapistGender' = 'any'
      OR csv.gender_identity = p_search_criteria->>'therapistGender'
    )
  ORDER BY 
    match_score DESC,
    csv.rating DESC NULLS LAST,
    csv.years_experience DESC NULLS LAST
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;