-- Simple Progress Tracking Tables
-- Run this if you encounter issues with the main migration

-- 1. Progress Goals
CREATE TABLE IF NOT EXISTS public.progress_goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL,
    coach_id UUID NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(50) DEFAULT 'personal',
    target_value NUMERIC(10,2),
    target_unit VARCHAR(50),
    target_date DATE,
    priority VARCHAR(20) DEFAULT 'medium',
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Progress Metrics
CREATE TABLE IF NOT EXISTS public.progress_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    goal_id UUID NOT NULL,
    session_id UUID,
    recorded_by_coach UUID,
    recorded_by_client UUID,
    value NUMERIC(10,2) NOT NULL,
    unit VARCHAR(50),
    notes TEXT,
    recorded_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Session Progress
CREATE TABLE IF NOT EXISTS public.session_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL,
    goal_id UUID,
    progress_rating INTEGER,
    achievements TEXT,
    challenges TEXT,
    next_session_focus TEXT,
    homework_assigned TEXT,
    coach_notes TEXT,
    client_reflection TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Wellness Check-ins
CREATE TABLE IF NOT EXISTS public.wellness_checkins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL,
    session_id UUID,
    mood_rating INTEGER,
    energy_level INTEGER,
    stress_level INTEGER,
    sleep_quality INTEGER,
    exercise_frequency INTEGER,
    nutrition_quality INTEGER,
    social_connection INTEGER,
    overall_wellbeing INTEGER,
    notes TEXT,
    checkin_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Progress Milestones
CREATE TABLE IF NOT EXISTS public.progress_milestones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    goal_id UUID NOT NULL,
    session_id UUID,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    achievement_date DATE DEFAULT CURRENT_DATE,
    significance VARCHAR(20) DEFAULT 'medium',
    coach_notes TEXT,
    client_reflection TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create basic indexes
CREATE INDEX IF NOT EXISTS idx_progress_goals_client ON public.progress_goals(client_id);
CREATE INDEX IF NOT EXISTS idx_progress_goals_coach ON public.progress_goals(coach_id);
CREATE INDEX IF NOT EXISTS idx_progress_metrics_goal ON public.progress_metrics(goal_id);
CREATE INDEX IF NOT EXISTS idx_session_progress_session ON public.session_progress(session_id);
CREATE INDEX IF NOT EXISTS idx_wellness_checkins_client ON public.wellness_checkins(client_id);
CREATE INDEX IF NOT EXISTS idx_progress_milestones_goal ON public.progress_milestones(goal_id);

-- Add foreign key constraints only if the referenced tables exist
DO $$
BEGIN
    -- Check if clients table exists before adding foreign key
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'clients') THEN
        ALTER TABLE public.progress_goals
        ADD CONSTRAINT IF NOT EXISTS fk_progress_goals_client
        FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE;

        ALTER TABLE public.wellness_checkins
        ADD CONSTRAINT IF NOT EXISTS fk_wellness_checkins_client
        FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE;
    END IF;

    -- Check if coaches table exists before adding foreign key
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'coaches') THEN
        ALTER TABLE public.progress_goals
        ADD CONSTRAINT IF NOT EXISTS fk_progress_goals_coach
        FOREIGN KEY (coach_id) REFERENCES public.coaches(id) ON DELETE CASCADE;

        ALTER TABLE public.progress_metrics
        ADD CONSTRAINT IF NOT EXISTS fk_progress_metrics_coach
        FOREIGN KEY (recorded_by_coach) REFERENCES public.coaches(id) ON DELETE SET NULL;
    END IF;

    -- Add goal foreign keys
    ALTER TABLE public.progress_metrics
    ADD CONSTRAINT IF NOT EXISTS fk_progress_metrics_goal
    FOREIGN KEY (goal_id) REFERENCES public.progress_goals(id) ON DELETE CASCADE;

    ALTER TABLE public.session_progress
    ADD CONSTRAINT IF NOT EXISTS fk_session_progress_goal
    FOREIGN KEY (goal_id) REFERENCES public.progress_goals(id) ON DELETE SET NULL;

    ALTER TABLE public.progress_milestones
    ADD CONSTRAINT IF NOT EXISTS fk_progress_milestones_goal
    FOREIGN KEY (goal_id) REFERENCES public.progress_goals(id) ON DELETE CASCADE;

EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Some foreign key constraints could not be added: %', SQLERRM;
END $$;

-- Disable row level security
ALTER TABLE public.progress_goals DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.progress_metrics DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_progress DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.wellness_checkins DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.progress_milestones DISABLE ROW LEVEL SECURITY;