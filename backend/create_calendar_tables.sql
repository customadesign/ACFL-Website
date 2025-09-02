-- =========================================================
-- CREATE CALENDAR TABLES - RUN THIS IN SUPABASE SQL EDITOR
-- =========================================================

-- 1. Coach availability slots table
CREATE TABLE IF NOT EXISTS public.coach_availability_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID NOT NULL REFERENCES public.coaches(id) ON DELETE CASCADE,
  day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  start_date DATE,
  end_date DATE,
  slot_duration_minutes INT NOT NULL DEFAULT 60 CHECK (slot_duration_minutes BETWEEN 15 AND 180),
  buffer_minutes INT DEFAULT 5 CHECK (buffer_minutes >= 0),
  is_active BOOLEAN DEFAULT true,
  max_bookings_per_slot INT DEFAULT 1 CHECK (max_bookings_per_slot >= 1),
  title VARCHAR(255),
  description TEXT,
  timezone VARCHAR(50) DEFAULT 'UTC',
  -- New fields for flexible session lengths
  available_durations JSONB DEFAULT '[60]'::jsonb, -- Array of available duration options in minutes
  is_flexible_duration BOOLEAN DEFAULT false, -- True if coach offers flexible/unlimited sessions
  min_session_minutes INT DEFAULT 30 CHECK (min_session_minutes >= 15),
  max_session_minutes INT DEFAULT 120 CHECK (max_session_minutes >= min_session_minutes),
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_slot_time CHECK (end_time > start_time),
  CONSTRAINT chk_date_range CHECK (end_date IS NULL OR end_date >= start_date)
);

-- 2. Coach blocked slots table
CREATE TABLE IF NOT EXISTS public.coach_blocked_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID NOT NULL REFERENCES public.coaches(id) ON DELETE CASCADE,
  blocked_date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  reason VARCHAR(255),
  is_recurring BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_blocked_time CHECK (
    (start_time IS NULL AND end_time IS NULL) OR 
    (start_time IS NOT NULL AND end_time IS NOT NULL AND end_time > start_time)
  )
);

-- 3. Create indexes
CREATE INDEX IF NOT EXISTS idx_availability_slots_coach ON public.coach_availability_slots(coach_id);
CREATE INDEX IF NOT EXISTS idx_availability_slots_day ON public.coach_availability_slots(day_of_week);
CREATE INDEX IF NOT EXISTS idx_availability_slots_active ON public.coach_availability_slots(is_active);
CREATE INDEX IF NOT EXISTS idx_blocked_slots_coach ON public.coach_blocked_slots(coach_id);
CREATE INDEX IF NOT EXISTS idx_blocked_slots_date ON public.coach_blocked_slots(blocked_date);

-- 4. Add session table enhancements
ALTER TABLE public.sessions 
ADD COLUMN IF NOT EXISTS booking_confirmed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS reminder_sent_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS meeting_url TEXT,
ADD COLUMN IF NOT EXISTS cancellation_reason TEXT,
ADD COLUMN IF NOT EXISTS timezone VARCHAR(50) DEFAULT 'UTC';

-- Make meeting_id nullable if it exists and is NOT NULL
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'sessions' 
    AND column_name = 'meeting_id' 
    AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE public.sessions ALTER COLUMN meeting_id DROP NOT NULL;
  END IF;
END $$;

-- 5. Drop existing function first (required due to return type change)
DROP FUNCTION IF EXISTS get_coach_available_slots(UUID, DATE, TEXT);

-- 5. Helper function to get available slots with flexible durations
CREATE OR REPLACE FUNCTION get_coach_available_slots(
  p_coach_id UUID,
  p_date DATE,
  p_timezone TEXT DEFAULT 'UTC'
) RETURNS TABLE (
  slot_start TIMESTAMPTZ,
  slot_end TIMESTAMPTZ,
  duration_minutes INT,
  available_durations JSONB,
  is_flexible_duration BOOLEAN,
  min_session_minutes INT,
  max_session_minutes INT
) AS $$
DECLARE
  availability_record RECORD;
  current_slot_time TIME;
  slot_datetime TIMESTAMPTZ;
  slot_end_datetime TIMESTAMPTZ;
  total_buffer_minutes INT;
  duration_option INT;
BEGIN
  -- Loop through each availability slot for this coach and date
  FOR availability_record IN 
    SELECT cas.*
    FROM coach_availability_slots cas
    WHERE cas.coach_id = p_coach_id 
      AND cas.day_of_week = EXTRACT(DOW FROM p_date)
      AND cas.is_active = true
      AND (cas.start_date IS NULL OR p_date >= cas.start_date)
      AND (cas.end_date IS NULL OR p_date <= cas.end_date)
      -- Check if the entire availability window is not blocked
      AND NOT EXISTS (
        SELECT 1 FROM coach_blocked_slots cbs
        WHERE cbs.coach_id = p_coach_id 
          AND cbs.blocked_date = p_date
          AND cbs.start_time IS NULL -- Full day block
      )
    ORDER BY cas.start_time
  LOOP
    -- Calculate total buffer time
    total_buffer_minutes := availability_record.buffer_minutes;
    
    -- If flexible duration is enabled, generate slots for the smallest duration option
    -- and return flexibility info for the frontend to handle
    IF availability_record.is_flexible_duration THEN
      current_slot_time := availability_record.start_time;
      
      -- Use the minimum session duration for slot generation when flexible
      WHILE current_slot_time + INTERVAL '1 minute' * availability_record.min_session_minutes <= availability_record.end_time LOOP
        slot_datetime := (p_date + current_slot_time) AT TIME ZONE p_timezone;
        slot_end_datetime := (p_date + current_slot_time + INTERVAL '1 minute' * availability_record.min_session_minutes) AT TIME ZONE p_timezone;
        
        -- Check availability for this time slot
        IF NOT EXISTS (
          SELECT 1 FROM coach_blocked_slots cbs
          WHERE cbs.coach_id = p_coach_id 
            AND cbs.blocked_date = p_date
            AND cbs.start_time IS NOT NULL 
            AND cbs.end_time IS NOT NULL
            AND (
              (cbs.start_time <= current_slot_time AND cbs.end_time > current_slot_time) OR
              (cbs.start_time < current_slot_time + INTERVAL '1 minute' * availability_record.min_session_minutes AND cbs.end_time >= current_slot_time + INTERVAL '1 minute' * availability_record.min_session_minutes)
            )
        ) AND NOT EXISTS (
          SELECT 1 FROM sessions s
          WHERE s.coach_id = p_coach_id 
            AND s.starts_at < slot_end_datetime
            AND s.ends_at > slot_datetime
            AND s.status NOT IN ('cancelled', 'no_show')
        ) THEN
          -- Return flexible slot with metadata
          slot_start := slot_datetime;
          slot_end := slot_end_datetime;
          duration_minutes := availability_record.min_session_minutes;
          available_durations := availability_record.available_durations;
          is_flexible_duration := availability_record.is_flexible_duration;
          min_session_minutes := availability_record.min_session_minutes;
          max_session_minutes := availability_record.max_session_minutes;
          RETURN NEXT;
        END IF;
        
        current_slot_time := current_slot_time + INTERVAL '1 minute' * (availability_record.min_session_minutes + total_buffer_minutes);
      END LOOP;
      
    ELSE
      -- Handle fixed duration options from available_durations array
      FOR duration_option IN SELECT jsonb_array_elements_text(availability_record.available_durations)::INT LOOP
        current_slot_time := availability_record.start_time;
        
        WHILE current_slot_time + INTERVAL '1 minute' * duration_option <= availability_record.end_time LOOP
          slot_datetime := (p_date + current_slot_time) AT TIME ZONE p_timezone;
          slot_end_datetime := (p_date + current_slot_time + INTERVAL '1 minute' * duration_option) AT TIME ZONE p_timezone;
          
          IF NOT EXISTS (
            SELECT 1 FROM coach_blocked_slots cbs
            WHERE cbs.coach_id = p_coach_id 
              AND cbs.blocked_date = p_date
              AND cbs.start_time IS NOT NULL 
              AND cbs.end_time IS NOT NULL
              AND (
                (cbs.start_time <= current_slot_time AND cbs.end_time > current_slot_time) OR
                (cbs.start_time < current_slot_time + INTERVAL '1 minute' * duration_option AND cbs.end_time >= current_slot_time + INTERVAL '1 minute' * duration_option)
              )
          ) AND NOT EXISTS (
            SELECT 1 FROM sessions s
            WHERE s.coach_id = p_coach_id 
              AND s.starts_at < slot_end_datetime
              AND s.ends_at > slot_datetime
              AND s.status NOT IN ('cancelled', 'no_show')
          ) THEN
            slot_start := slot_datetime;
            slot_end := slot_end_datetime;
            duration_minutes := duration_option;
            available_durations := availability_record.available_durations;
            is_flexible_duration := availability_record.is_flexible_duration;
            min_session_minutes := availability_record.min_session_minutes;
            max_session_minutes := availability_record.max_session_minutes;
            RETURN NEXT;
          END IF;
          
          current_slot_time := current_slot_time + INTERVAL '1 minute' * (duration_option + total_buffer_minutes);
        END LOOP;
      END LOOP;
    END IF;
  END LOOP;
  
  RETURN;
END;
$$ LANGUAGE plpgsql;

-- 6. Helper function to check slot availability
CREATE OR REPLACE FUNCTION is_slot_available(
  p_coach_id UUID,
  p_start_time TIMESTAMPTZ,
  p_end_time TIMESTAMPTZ,
  p_timezone TEXT DEFAULT 'UTC'
) RETURNS BOOLEAN AS $$
DECLARE
  slot_date DATE;
  day_num INT;
  start_time_only TIME;
  end_time_only TIME;
BEGIN
  slot_date := DATE(p_start_time AT TIME ZONE p_timezone);
  day_num := EXTRACT(DOW FROM slot_date);
  start_time_only := (p_start_time AT TIME ZONE p_timezone)::TIME;
  end_time_only := (p_end_time AT TIME ZONE p_timezone)::TIME;
  
  -- Check if coach has availability for this day/time
  IF NOT EXISTS (
    SELECT 1 FROM coach_availability_slots 
    WHERE coach_id = p_coach_id 
      AND day_of_week = day_num 
      AND is_active = true
      AND start_time <= start_time_only
      AND end_time >= end_time_only
      AND (start_date IS NULL OR slot_date >= start_date)
      AND (end_date IS NULL OR slot_date <= end_date)
  ) THEN
    RETURN false;
  END IF;
  
  -- Check if time slot is blocked
  IF EXISTS (
    SELECT 1 FROM coach_blocked_slots 
    WHERE coach_id = p_coach_id 
      AND blocked_date = slot_date
      AND (
        (start_time IS NULL) OR 
        (start_time < end_time_only AND end_time > start_time_only)
      )
  ) THEN
    RETURN false;
  END IF;
  
  -- Check if time slot is already booked
  IF EXISTS (
    SELECT 1 FROM sessions 
    WHERE coach_id = p_coach_id 
      AND starts_at < p_end_time 
      AND ends_at > p_start_time
      AND status NOT IN ('cancelled', 'no_show')
  ) THEN
    RETURN false;
  END IF;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql;

-- 7. Disable RLS for these tables (enable API access)
ALTER TABLE public.coach_availability_slots DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.coach_blocked_slots DISABLE ROW LEVEL SECURITY;