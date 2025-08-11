-- Sample Sessions Data for Testing
-- Run this after creating sessions table and having coaches/clients

-- Insert sample sessions (you'll need to replace the coach_id and client_id with actual values)
-- This is example syntax - you'll need real UUIDs from your coaches and clients tables

/*
INSERT INTO public.sessions (coach_id, client_id, scheduled_at, duration, session_type, status, notes) VALUES
-- Today's appointments
('00000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', CURRENT_DATE + INTERVAL '10 hours', 60, 'Initial Consultation', 'confirmed', 'First session with new client'),
('00000000-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', CURRENT_DATE + INTERVAL '14 hours', 50, 'Follow-up Session', 'confirmed', 'Progress check'),

-- Upcoming appointments
('00000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', CURRENT_DATE + INTERVAL '1 day' + INTERVAL '10 hours', 60, 'Values Workshop', 'scheduled', 'Working on values clarification'),
('00000000-0000-0000-0000-000000000001', '33333333-3333-3333-3333-333333333333', CURRENT_DATE + INTERVAL '2 days' + INTERVAL '15 hours', 45, 'Mindfulness Session', 'scheduled', 'Stress management techniques'),

-- Past completed appointments
('00000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', CURRENT_DATE - INTERVAL '1 day' + INTERVAL '10 hours', 60, 'Initial Consultation', 'completed', 'Great first session'),
('00000000-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', CURRENT_DATE - INTERVAL '3 days' + INTERVAL '14 hours', 50, 'Progress Session', 'completed', 'Excellent progress');

*/

-- To use this data:
-- 1. First run: SELECT id, first_name, last_name, email FROM coaches LIMIT 5;
-- 2. Then run: SELECT id, first_name, last_name, email FROM clients LIMIT 5; 
-- 3. Replace the UUIDs above with real ones from your database
-- 4. Then run the INSERT statements