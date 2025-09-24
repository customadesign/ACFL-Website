-- =========================================================
-- PROGRESS TRACKING TABLES
-- =========================================================

-- Progress goals for clients
CREATE TABLE IF NOT EXISTS public.progress_goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    coach_id UUID NOT NULL REFERENCES public.coaches(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL DEFAULT 'personal',
    target_value NUMERIC(10,2),
    target_unit VARCHAR(50), -- e.g., 'sessions', 'days', 'score', 'percentage'
    target_date DATE,
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused', 'cancelled')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Progress metrics for tracking goal progress
CREATE TABLE IF NOT EXISTS public.progress_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    goal_id UUID NOT NULL REFERENCES public.progress_goals(id) ON DELETE CASCADE,
    session_id UUID REFERENCES public.sessions(id) ON DELETE SET NULL,
    recorded_by_coach UUID REFERENCES public.coaches(id) ON DELETE SET NULL,
    recorded_by_client UUID REFERENCES public.clients(id) ON DELETE SET NULL,
    value NUMERIC(10,2) NOT NULL,
    unit VARCHAR(50),
    notes TEXT,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (
        (recorded_by_coach IS NOT NULL AND recorded_by_client IS NULL) OR
        (recorded_by_coach IS NULL AND recorded_by_client IS NOT NULL)
    )
);

-- Session progress notes linking sessions to goals
CREATE TABLE IF NOT EXISTS public.session_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
    goal_id UUID REFERENCES public.progress_goals(id) ON DELETE SET NULL,
    progress_rating INTEGER CHECK (progress_rating BETWEEN 1 AND 10),
    achievements TEXT,
    challenges TEXT,
    next_session_focus TEXT,
    homework_assigned TEXT,
    coach_notes TEXT,
    client_reflection TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Wellness check-ins for clients
CREATE TABLE IF NOT EXISTS public.wellness_checkins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    session_id UUID REFERENCES public.sessions(id) ON DELETE SET NULL,
    mood_rating INTEGER CHECK (mood_rating BETWEEN 1 AND 10),
    energy_level INTEGER CHECK (energy_level BETWEEN 1 AND 10),
    stress_level INTEGER CHECK (stress_level BETWEEN 1 AND 10),
    sleep_quality INTEGER CHECK (sleep_quality BETWEEN 1 AND 10),
    exercise_frequency INTEGER CHECK (exercise_frequency BETWEEN 0 AND 7), -- days per week
    nutrition_quality INTEGER CHECK (nutrition_quality BETWEEN 1 AND 10),
    social_connection INTEGER CHECK (social_connection BETWEEN 1 AND 10),
    overall_wellbeing INTEGER CHECK (overall_wellbeing BETWEEN 1 AND 10),
    notes TEXT,
    checkin_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Progress milestones for significant achievements
CREATE TABLE IF NOT EXISTS public.progress_milestones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    goal_id UUID NOT NULL REFERENCES public.progress_goals(id) ON DELETE CASCADE,
    session_id UUID REFERENCES public.sessions(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    achievement_date DATE NOT NULL DEFAULT CURRENT_DATE,
    significance VARCHAR(20) DEFAULT 'medium' CHECK (significance IN ('low', 'medium', 'high')),
    coach_notes TEXT,
    client_reflection TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_progress_goals_client ON public.progress_goals(client_id);
CREATE INDEX IF NOT EXISTS idx_progress_goals_coach ON public.progress_goals(coach_id);
CREATE INDEX IF NOT EXISTS idx_progress_goals_status ON public.progress_goals(status);

CREATE INDEX IF NOT EXISTS idx_progress_metrics_goal ON public.progress_metrics(goal_id);
CREATE INDEX IF NOT EXISTS idx_progress_metrics_session ON public.progress_metrics(session_id);
CREATE INDEX IF NOT EXISTS idx_progress_metrics_recorded_at ON public.progress_metrics(recorded_at);

CREATE INDEX IF NOT EXISTS idx_session_progress_session ON public.session_progress(session_id);
CREATE INDEX IF NOT EXISTS idx_session_progress_goal ON public.session_progress(goal_id);

CREATE INDEX IF NOT EXISTS idx_wellness_checkins_client ON public.wellness_checkins(client_id);
CREATE INDEX IF NOT EXISTS idx_wellness_checkins_date ON public.wellness_checkins(checkin_date);

CREATE INDEX IF NOT EXISTS idx_progress_milestones_goal ON public.progress_milestones(goal_id);
CREATE INDEX IF NOT EXISTS idx_progress_milestones_date ON public.progress_milestones(achievement_date);

-- Triggers for updated_at timestamps
DROP TRIGGER IF EXISTS set_timestamp_progress_goals ON public.progress_goals;
CREATE TRIGGER set_timestamp_progress_goals
    BEFORE UPDATE ON public.progress_goals
    FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();

DROP TRIGGER IF EXISTS set_timestamp_session_progress ON public.session_progress;
CREATE TRIGGER set_timestamp_session_progress
    BEFORE UPDATE ON public.session_progress
    FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();

-- Disable row level security for all tables
ALTER TABLE public.progress_goals DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.progress_metrics DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_progress DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.wellness_checkins DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.progress_milestones DISABLE ROW LEVEL SECURITY;

-- Insert sample goals only if tables have data
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM public.clients LIMIT 1) AND EXISTS (SELECT 1 FROM public.coaches LIMIT 1) THEN
        INSERT INTO public.progress_goals (id, client_id, coach_id, title, description, category, target_value, target_unit, target_date, priority)
        SELECT
            gen_random_uuid(),
            c.id,
            coaches.id,
            'Sample Goal - ' || c.first_name,
            'This is a sample progress goal for demonstration',
            'personal',
            10.0,
            'sessions',
            CURRENT_DATE + INTERVAL '30 days',
            'medium'
        FROM public.clients c
        CROSS JOIN (SELECT id FROM public.coaches LIMIT 1) coaches
        LIMIT 3
        ON CONFLICT DO NOTHING;
    END IF;
END $$;