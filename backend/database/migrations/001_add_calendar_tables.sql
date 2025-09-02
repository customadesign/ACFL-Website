-- =========================================================
-- GHL-STYLE CALENDAR AVAILABILITY SYSTEM
-- =========================================================

-- Coach availability slots - specific time slots when coaches are available
CREATE TABLE IF NOT EXISTS public.coach_availability_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID NOT NULL REFERENCES public.coaches(id) ON DELETE CASCADE,
  
  -- Recurring schedule (weekly pattern)
  day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0 = Sunday, 6 = Saturday
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  
  -- Date range for this availability (optional - for temporary schedules)
  start_date DATE,
  end_date DATE,
  
  -- Slot configuration
  slot_duration_minutes INT NOT NULL DEFAULT 60 CHECK (slot_duration_minutes BETWEEN 15 AND 180),
  buffer_minutes INT DEFAULT 5 CHECK (buffer_minutes >= 0), -- Time between appointments
  
  -- Availability status
  is_active BOOLEAN DEFAULT true,
  max_bookings_per_slot INT DEFAULT 1 CHECK (max_bookings_per_slot >= 1),
  
  -- Metadata
  title VARCHAR(255), -- e.g., "Morning Sessions", "Therapy Hours"
  description TEXT,
  timezone VARCHAR(50) DEFAULT 'UTC',
  
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT chk_slot_time CHECK (end_time > start_time),
  CONSTRAINT chk_date_range CHECK (end_date IS NULL OR end_date >= start_date)
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_availability_slots_coach ON public.coach_availability_slots(coach_id);
CREATE INDEX IF NOT EXISTS idx_availability_slots_day ON public.coach_availability_slots(day_of_week);
CREATE INDEX IF NOT EXISTS idx_availability_slots_active ON public.coach_availability_slots(is_active);
CREATE INDEX IF NOT EXISTS idx_availability_slots_time ON public.coach_availability_slots(start_time, end_time);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS set_timestamp_coach_availability_slots ON public.coach_availability_slots;
CREATE TRIGGER set_timestamp_coach_availability_slots
  BEFORE UPDATE ON public.coach_availability_slots
  FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();

ALTER TABLE public.coach_availability_slots DISABLE ROW LEVEL SECURITY;

-- =========================================================
-- BLOCKED TIME SLOTS
-- =========================================================
-- For coaches to block specific dates/times (vacations, personal time, etc.)
CREATE TABLE IF NOT EXISTS public.coach_blocked_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID NOT NULL REFERENCES public.coaches(id) ON DELETE CASCADE,
  
  -- Specific date and time blocking
  blocked_date DATE NOT NULL,
  start_time TIME,  -- NULL means entire day is blocked
  end_time TIME,    -- NULL means entire day is blocked
  
  -- Blocking details
  reason VARCHAR(255), -- e.g., "Vacation", "Personal", "Training"
  is_recurring BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT chk_blocked_time CHECK (
    (start_time IS NULL AND end_time IS NULL) OR 
    (start_time IS NOT NULL AND end_time IS NOT NULL AND end_time > start_time)
  )
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_blocked_slots_coach ON public.coach_blocked_slots(coach_id);
CREATE INDEX IF NOT EXISTS idx_blocked_slots_date ON public.coach_blocked_slots(blocked_date);
CREATE INDEX IF NOT EXISTS idx_blocked_slots_recurring ON public.coach_blocked_slots(is_recurring);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS set_timestamp_coach_blocked_slots ON public.coach_blocked_slots;
CREATE TRIGGER set_timestamp_coach_blocked_slots
  BEFORE UPDATE ON public.coach_blocked_slots
  FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();

ALTER TABLE public.coach_blocked_slots DISABLE ROW LEVEL SECURITY;

-- =========================================================
-- ENHANCED SESSIONS TABLE
-- =========================================================
-- Add fields to existing sessions table for better calendar integration
DO $$
BEGIN
  -- Add booking-related fields if they don't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sessions' AND column_name='booking_confirmed_at') THEN
    ALTER TABLE public.sessions ADD COLUMN booking_confirmed_at TIMESTAMPTZ;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sessions' AND column_name='reminder_sent_at') THEN
    ALTER TABLE public.sessions ADD COLUMN reminder_sent_at TIMESTAMPTZ;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sessions' AND column_name='meeting_url') THEN
    ALTER TABLE public.sessions ADD COLUMN meeting_url TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sessions' AND column_name='cancellation_reason') THEN
    ALTER TABLE public.sessions ADD COLUMN cancellation_reason TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sessions' AND column_name='timezone') THEN
    ALTER TABLE public.sessions ADD COLUMN timezone VARCHAR(50) DEFAULT 'UTC';
  END IF;
END $$;

-- =========================================================
-- HELPER FUNCTIONS
-- =========================================================

-- Function to get available time slots for a coach on a specific date
CREATE OR REPLACE FUNCTION get_coach_available_slots(
  p_coach_id UUID,
  p_date DATE,
  p_timezone TEXT DEFAULT 'UTC'
) RETURNS TABLE (
  slot_start TIMESTAMPTZ,
  slot_end TIMESTAMPTZ,
  duration_minutes INT
) AS $$
DECLARE
  slot_record RECORD;
  current_time TIME;
  slot_start_time TIMESTAMPTZ;
  slot_end_time TIMESTAMPTZ;
BEGIN
  -- Get day of week (0 = Sunday, 6 = Saturday)
  DECLARE day_num INT := EXTRACT(DOW FROM p_date);
  
  -- Loop through availability slots for this day
  FOR slot_record IN
    SELECT 
      start_time, 
      end_time, 
      slot_duration_minutes,
      buffer_minutes
    FROM coach_availability_slots 
    WHERE coach_id = p_coach_id 
      AND day_of_week = day_num 
      AND is_active = true
      AND (start_date IS NULL OR p_date >= start_date)
      AND (end_date IS NULL OR p_date <= end_date)
  LOOP
    -- Generate time slots within the availability window
    current_time := slot_record.start_time;
    
    WHILE current_time + INTERVAL '1 minute' * slot_record.slot_duration_minutes <= slot_record.end_time LOOP
      slot_start_time := (p_date + current_time) AT TIME ZONE p_timezone;
      slot_end_time := slot_start_time + INTERVAL '1 minute' * slot_record.slot_duration_minutes;
      
      -- Check if slot is not blocked
      IF NOT EXISTS (
        SELECT 1 FROM coach_blocked_slots 
        WHERE coach_id = p_coach_id 
          AND blocked_date = p_date
          AND (
            (start_time IS NULL) OR -- Entire day blocked
            (start_time <= current_time AND end_time > current_time) -- Time slot blocked
          )
      )
      -- Check if slot is not already booked
      AND NOT EXISTS (
        SELECT 1 FROM sessions 
        WHERE coach_id = p_coach_id 
          AND DATE(starts_at AT TIME ZONE p_timezone) = p_date
          AND starts_at < slot_end_time 
          AND ends_at > slot_start_time
          AND status NOT IN ('cancelled', 'no_show')
      ) THEN
        -- Return available slot
        slot_start := slot_start_time;
        slot_end := slot_end_time;
        duration_minutes := slot_record.slot_duration_minutes;
        RETURN NEXT;
      END IF;
      
      -- Move to next slot (including buffer time)
      current_time := current_time + INTERVAL '1 minute' * (slot_record.slot_duration_minutes + slot_record.buffer_minutes);
    END LOOP;
  END LOOP;
  
  RETURN;
END;
$$ LANGUAGE plpgsql;

-- Function to check if a specific time slot is available
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
  -- Extract date and time components
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
        (start_time IS NULL) OR -- Entire day blocked
        (start_time < end_time_only AND end_time > start_time_only) -- Time overlap
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