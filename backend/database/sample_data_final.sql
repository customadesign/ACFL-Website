-- Sample Data for ACT Coaching For Life Database
-- Run this after running schema.sql
-- This version uses completely valid UUID format (8-4-4-4-12 hexadecimal)

-- =============================================================================
-- SAMPLE DATA WITH VALID UUIDs (only 0-9, a-f characters)
-- =============================================================================

-- Sample Users (passwords should be hashed in real implementation)
INSERT INTO users (id, email, password, role, first_name, last_name, is_active, email_verified) VALUES
  ('a1b2c3d4-e5f6-4890-abcd-123456789001', 'admin@actcoaching.com', '$2b$10$example_hashed_password', 'admin', 'Admin', 'User', true, true),
  ('a1b2c3d4-e5f6-4890-abcd-123456789002', 'client1@example.com', '$2b$10$example_hashed_password', 'client', 'Sarah', 'Johnson', true, true),
  ('a1b2c3d4-e5f6-4890-abcd-123456789003', 'client2@example.com', '$2b$10$example_hashed_password', 'client', 'Mike', 'Davis', true, true),
  ('a1b2c3d4-e5f6-4890-abcd-123456789004', 'coach1@example.com', '$2b$10$example_hashed_password', 'coach', 'Dr. Lisa', 'Thompson', true, true),
  ('a1b2c3d4-e5f6-4890-abcd-123456789005', 'coach2@example.com', '$2b$10$example_hashed_password', 'coach', 'Dr. James', 'Wilson', true, true),
  ('a1b2c3d4-e5f6-4890-abcd-123456789006', 'coach3@example.com', '$2b$10$example_hashed_password', 'coach', 'Dr. Maria', 'Rodriguez', true, true),
  ('a1b2c3d4-e5f6-4890-abcd-123456789007', 'coach4@example.com', '$2b$10$example_hashed_password', 'coach', 'Dr. David', 'Kim', true, true),
  ('a1b2c3d4-e5f6-4890-abcd-123456789008', 'coach5@example.com', '$2b$10$example_hashed_password', 'coach', 'Dr. Emily', 'Brown', true, true);

-- Sample Clients
INSERT INTO clients (id, user_id, first_name, last_name, phone, date_of_birth) VALUES
  ('c1b2c3d4-e5f6-4890-abcd-123456789001', 'a1b2c3d4-e5f6-4890-abcd-123456789002', 'Sarah', 'Johnson', '555-0123', '1995-06-15'),
  ('c1b2c3d4-e5f6-4890-abcd-123456789002', 'a1b2c3d4-e5f6-4890-abcd-123456789003', 'Mike', 'Davis', '555-0124', '1988-03-22');

-- Sample Coaches
INSERT INTO coaches (id, user_id, first_name, last_name, phone, bio, specialties, languages, qualifications, experience, hourly_rate, session_rate, is_available, is_verified, rating, total_sessions, total_reviews) VALUES
  (
    'c0ac0001-0000-0000-0000-000000000001', 
    'a1b2c3d4-e5f6-4890-abcd-123456789004', 
    'Dr. Lisa', 
    'Thompson', 
    '555-0201', 
    'Dr. Thompson is a licensed clinical psychologist with over 10 years of experience specializing in Acceptance and Commitment Therapy (ACT). She has helped hundreds of clients overcome anxiety, depression, and work-related stress through evidence-based ACT techniques.',
    ARRAY['Anxiety', 'Depression', 'Work Stress', 'Life Transitions', 'Mindfulness'],
    ARRAY['English', 'Spanish'],
    ARRAY['Licensed Clinical Psychologist', 'Certified ACT Therapist', 'PhD in Clinical Psychology'],
    10,
    120.00,
    120.00,
    true,
    true,
    4.8,
    156,
    42
  ),
  (
    'c0ac0002-0000-0000-0000-000000000002', 
    'a1b2c3d4-e5f6-4890-abcd-123456789005', 
    'Dr. James', 
    'Wilson', 
    '555-0202', 
    'Dr. Wilson specializes in trauma recovery and PTSD treatment using ACT principles. With 8 years of experience, he provides compassionate care for individuals dealing with past traumatic experiences and helps them build psychological flexibility.',
    ARRAY['Trauma', 'PTSD', 'Anxiety', 'Grief', 'Emotional Regulation'],
    ARRAY['English'],
    ARRAY['Licensed Clinical Social Worker', 'Trauma Specialist', 'ACT Certified'],
    8,
    110.00,
    110.00,
    true,
    true,
    4.9,
    203,
    67
  ),
  (
    'c0ac0003-0000-0000-0000-000000000003', 
    'a1b2c3d4-e5f6-4890-abcd-123456789006', 
    'Dr. Maria', 
    'Rodriguez', 
    '555-0203', 
    'Dr. Rodriguez brings a culturally sensitive approach to ACT therapy, specializing in working with diverse populations. She has extensive experience helping clients navigate relationship issues, identity concerns, and cultural transitions.',
    ARRAY['Relationships', 'Cultural Identity', 'LGBTQ+ Issues', 'Anxiety', 'Self-Esteem'],
    ARRAY['English', 'Spanish', 'Portuguese'],
    ARRAY['Licensed Marriage and Family Therapist', 'Cultural Competency Certified', 'ACT Trained'],
    12,
    130.00,
    130.00,
    true,
    true,
    4.7,
    298,
    89
  ),
  (
    'c0ac0004-0000-0000-0000-000000000004', 
    'a1b2c3d4-e5f6-4890-abcd-123456789007', 
    'Dr. David', 
    'Kim', 
    '555-0204', 
    'Dr. Kim combines traditional ACT approaches with mindfulness practices, helping clients develop greater self-awareness and emotional resilience. He specializes in working with young adults and professionals dealing with academic and career stress.',
    ARRAY['Academic Stress', 'Career Counseling', 'Mindfulness', 'Young Adults', 'Performance Anxiety'],
    ARRAY['English', 'Korean'],
    ARRAY['Licensed Professional Counselor', 'Mindfulness-Based Stress Reduction Certified', 'ACT Practitioner'],
    6,
    100.00,
    100.00,
    true,
    true,
    4.6,
    124,
    31
  ),
  (
    'c0ac0005-0000-0000-0000-000000000005', 
    'a1b2c3d4-e5f6-4890-abcd-123456789008', 
    'Dr. Emily', 
    'Brown', 
    '555-0205', 
    'Dr. Brown specializes in helping individuals overcome addiction and substance abuse using ACT principles. She focuses on building psychological flexibility and helping clients develop healthy coping strategies for long-term recovery.',
    ARRAY['Addiction Recovery', 'Substance Abuse', 'Behavioral Addictions', 'Relapse Prevention', 'Coping Strategies'],
    ARRAY['English'],
    ARRAY['Licensed Addiction Counselor', 'Certified Substance Abuse Counselor', 'ACT for Addiction Specialist'],
    9,
    115.00,
    115.00,
    true,
    true,
    4.5,
    187,
    54
  );

-- Sample Coach Demographics
INSERT INTO coach_demographics (coach_id, gender, ethnicity, religion, available_times, location_states, video_available, in_person_available, phone_available, insurance_accepted, min_age, max_age) VALUES
  (
    'c0ac0001-0000-0000-0000-000000000001',
    'female',
    'white',
    'christian',
    ARRAY['weekday-mornings', 'weekday-evenings', 'weekend-mornings'],
    ARRAY['CA', 'NV', 'AZ'],
    true,
    true,
    true,
    ARRAY['Blue Cross Blue Shield', 'Aetna', 'Cigna', 'United Healthcare'],
    18,
    65
  ),
  (
    'c0ac0002-0000-0000-0000-000000000002',
    'male',
    'white',
    'agnostic',
    ARRAY['weekday-afternoons', 'weekday-evenings'],
    ARRAY['NY', 'NJ', 'CT'],
    true,
    false,
    true,
    ARRAY['Medicare', 'Medicaid', 'Blue Cross Blue Shield'],
    21,
    null
  ),
  (
    'c0ac0003-0000-0000-0000-000000000003',
    'female',
    'hispanic',
    'catholic',
    ARRAY['weekday-mornings', 'weekday-afternoons', 'weekend-afternoons'],
    ARRAY['TX', 'NM', 'AZ', 'CA'],
    true,
    true,
    false,
    ARRAY['Aetna', 'Humana', 'United Healthcare', 'Cigna'],
    16,
    70
  ),
  (
    'c0ac0004-0000-0000-0000-000000000004',
    'male',
    'asian',
    'buddhist',
    ARRAY['weekday-evenings', 'weekend-mornings', 'weekend-afternoons'],
    ARRAY['CA', 'WA', 'OR'],
    true,
    true,
    true,
    ARRAY['Kaiser Permanente', 'Blue Cross Blue Shield', 'Aetna'],
    18,
    35
  ),
  (
    'c0ac0005-0000-0000-0000-000000000005',
    'female',
    'white',
    'other',
    ARRAY['weekday-mornings', 'weekday-afternoons'],
    ARRAY['FL', 'GA', 'SC', 'NC'],
    true,
    true,
    true,
    ARRAY['Blue Cross Blue Shield', 'Anthem', 'Tricare'],
    21,
    null
  );

-- Sample Client Assessment
INSERT INTO client_assessments (
  client_id, 
  areas_of_concern, 
  treatment_modalities,
  location, 
  gender_identity, 
  ethnic_identity, 
  religious_background,
  preferred_therapist_gender,
  preferred_therapist_ethnicity,
  preferred_therapist_religion,
  payment_method,
  availability,
  language,
  is_current
) VALUES (
  'c1b2c3d4-e5f6-4890-abcd-123456789001',
  ARRAY['anxiety', 'work-stress', 'relationships'],
  ARRAY['cbt', 'act', 'mindfulness'],
  'CA',
  'female',
  'white',
  'christian',
  'any',
  'any',
  'any',
  'blue-cross-blue-shield',
  ARRAY['weekday-evenings', 'weekend-mornings'],
  'English',
  true
);

-- Sample Sessions
INSERT INTO sessions (
  id,
  client_id, 
  coach_id, 
  scheduled_at, 
  duration, 
  status, 
  session_type, 
  session_focus,
  amount_charged,
  payment_status
) VALUES 
  (
    '5e550001-0000-0000-0000-000000000001',
    'c1b2c3d4-e5f6-4890-abcd-123456789001',
    'c0ac0001-0000-0000-0000-000000000001',
    '2024-02-15 10:00:00-08:00',
    60,
    'completed',
    'video',
    'Initial assessment and goal setting',
    120.00,
    'paid'
  ),
  (
    '5e550002-0000-0000-0000-000000000002',
    'c1b2c3d4-e5f6-4890-abcd-123456789001',
    'c0ac0001-0000-0000-0000-000000000001',
    '2024-02-22 10:00:00-08:00',
    60,
    'completed',
    'video',
    'Working on work-related anxiety',
    120.00,
    'paid'
  ),
  (
    '5e550003-0000-0000-0000-000000000003',
    'c1b2c3d4-e5f6-4890-abcd-123456789001',
    'c0ac0001-0000-0000-0000-000000000001',
    '2024-03-01 10:00:00-08:00',
    60,
    'scheduled',
    'video',
    'Mindfulness techniques for stress management',
    120.00,
    'pending'
  );

-- Sample Saved Coaches
INSERT INTO saved_coaches (client_id, coach_id, notes, priority) VALUES
  ('c1b2c3d4-e5f6-4890-abcd-123456789001', 'c0ac0002-0000-0000-0000-000000000002', 'Specializes in trauma, might be good for future reference', 2),
  ('c1b2c3d4-e5f6-4890-abcd-123456789001', 'c0ac0003-0000-0000-0000-000000000003', 'Great reviews for relationship counseling', 1);

-- Sample Reviews
INSERT INTO reviews (session_id, client_id, coach_id, rating, review_text, is_public, is_verified) VALUES
  (
    '5e550001-0000-0000-0000-000000000001',
    'c1b2c3d4-e5f6-4890-abcd-123456789001',
    'c0ac0001-0000-0000-0000-000000000001',
    5,
    'Dr. Thompson was incredibly helpful in our first session. She made me feel comfortable and provided practical strategies I could use right away.',
    true,
    true
  ),
  (
    '5e550002-0000-0000-0000-000000000002',
    'c1b2c3d4-e5f6-4890-abcd-123456789001',
    'c0ac0001-0000-0000-0000-000000000001',
    5,
    'Another excellent session. Dr. Thompson really understands how to apply ACT principles to work stress. Highly recommend!',
    true,
    true
  );

-- Sample Messages
INSERT INTO messages (sender_id, receiver_id, subject, content, message_type, is_read) VALUES
  (
    'a1b2c3d4-e5f6-4890-abcd-123456789002',
    'a1b2c3d4-e5f6-4890-abcd-123456789004',
    'Thank you for the session',
    'Hi Dr. Thompson, I wanted to thank you for our session today. The breathing exercises you taught me have been really helpful.',
    'general',
    true
  ),
  (
    'a1b2c3d4-e5f6-4890-abcd-123456789004',
    'a1b2c3d4-e5f6-4890-abcd-123456789002',
    'Re: Thank you for the session',
    'You''re very welcome, Sarah! I''m so glad you''re finding the techniques helpful. Remember to practice daily and we''ll build on these in our next session.',
    'general',
    false
  );

-- Sample Search History
INSERT INTO search_history (client_id, search_criteria, results_count, selected_coach_id) VALUES
  (
    'c1b2c3d4-e5f6-4890-abcd-123456789001',
    '{"areas_of_concern": ["anxiety", "work-stress"], "location": "CA", "preferred_therapist_gender": "any", "payment_method": "blue-cross-blue-shield"}',
    3,
    'c0ac0001-0000-0000-0000-000000000001'
  );

-- =============================================================================
-- ADDITIONAL SAMPLE COACHES FOR SEARCH TESTING
-- =============================================================================

-- Add more diverse coaches for better search results
INSERT INTO users (id, email, password, role, first_name, last_name, is_active, email_verified) VALUES
  ('a1b2c3d4-e5f6-4890-abcd-123456789009', 'coach6@example.com', '$2b$10$example_hashed_password', 'coach', 'Dr. Sarah', 'Chen', true, true),
  ('a1b2c3d4-e5f6-4890-abcd-12345678900a', 'coach7@example.com', '$2b$10$example_hashed_password', 'coach', 'Dr. Michael', 'Johnson', true, true),
  ('a1b2c3d4-e5f6-4890-abcd-12345678900b', 'coach8@example.com', '$2b$10$example_hashed_password', 'coach', 'Dr. Jennifer', 'Martinez', true, true);

INSERT INTO coaches (id, user_id, first_name, last_name, phone, bio, specialties, languages, qualifications, experience, hourly_rate, session_rate, is_available, is_verified, rating, total_sessions, total_reviews) VALUES
  (
    'c0ac0006-0000-0000-0000-000000000006', 
    'a1b2c3d4-e5f6-4890-abcd-123456789009', 
    'Dr. Sarah', 
    'Chen', 
    '555-0206', 
    'Dr. Chen specializes in eating disorders and body image issues using ACT approaches. She helps clients develop a healthier relationship with food and their bodies through acceptance-based strategies.',
    ARRAY['Eating Disorders', 'Body Image', 'Self-Esteem', 'Anxiety', 'Perfectionism'],
    ARRAY['English', 'Mandarin'],
    ARRAY['Licensed Clinical Psychologist', 'Eating Disorder Specialist', 'ACT Certified'],
    7,
    125.00,
    125.00,
    true,
    true,
    4.7,
    142,
    38
  ),
  (
    'c0ac0007-0000-0000-0000-000000000007', 
    'a1b2c3d4-e5f6-4890-abcd-12345678900a', 
    'Dr. Michael', 
    'Johnson', 
    '555-0207', 
    'Dr. Johnson works with adolescents and young adults, helping them navigate the challenges of growing up in today''s world. He uses ACT principles to help young people build resilience and find their values.',
    ARRAY['Adolescents', 'Young Adults', 'Academic Stress', 'Social Anxiety', 'Identity Development'],
    ARRAY['English'],
    ARRAY['Licensed Clinical Social Worker', 'Adolescent Specialist', 'ACT Practitioner'],
    5,
    95.00,
    95.00,
    true,
    true,
    4.4,
    89,
    23
  ),
  (
    'c0ac0008-0000-0000-0000-000000000008', 
    'a1b2c3d4-e5f6-4890-abcd-12345678900b', 
    'Dr. Jennifer', 
    'Martinez', 
    '555-0208', 
    'Dr. Martinez brings extensive experience in grief counseling and loss, helping clients process difficult emotions and find meaning after significant life changes or losses.',
    ARRAY['Grief', 'Loss', 'Life Transitions', 'Depression', 'Meaning-Making'],
    ARRAY['English', 'Spanish'],
    ARRAY['Licensed Professional Counselor', 'Grief Counseling Certificate', 'ACT Trained'],
    11,
    105.00,
    105.00,
    true,
    true,
    4.8,
    234,
    78
  );

INSERT INTO coach_demographics (coach_id, gender, ethnicity, religion, available_times, location_states, video_available, in_person_available, phone_available, insurance_accepted, min_age, max_age) VALUES
  (
    'c0ac0006-0000-0000-0000-000000000006',
    'female',
    'asian',
    'other',
    ARRAY['weekday-afternoons', 'weekend-afternoons'],
    ARRAY['CA', 'NV'],
    true,
    true,
    false,
    ARRAY['Blue Cross Blue Shield', 'Aetna', 'Kaiser Permanente'],
    16,
    45
  ),
  (
    'c0ac0007-0000-0000-0000-000000000007',
    'male',
    'black',
    'christian',
    ARRAY['weekday-afternoons', 'weekday-evenings'],
    ARRAY['NY', 'NJ'],
    true,
    false,
    true,
    ARRAY['Medicaid', 'Blue Cross Blue Shield', 'Aetna'],
    13,
    25
  ),
  (
    'c0ac0008-0000-0000-0000-000000000008',
    'female',
    'hispanic',
    'catholic',
    ARRAY['weekday-mornings', 'weekday-afternoons', 'weekend-mornings'],
    ARRAY['TX', 'AZ', 'NM'],
    true,
    true,
    true,
    ARRAY['United Healthcare', 'Cigna', 'Humana'],
    18,
    null
  );

-- =============================================================================
-- VERIFICATION QUERIES
-- =============================================================================

-- You can run these queries to verify the data was inserted correctly:

-- SELECT COUNT(*) as total_users FROM users;
-- SELECT COUNT(*) as total_coaches FROM coaches WHERE is_verified = true;
-- SELECT COUNT(*) as total_clients FROM clients;
-- SELECT COUNT(*) as total_sessions FROM sessions;
-- SELECT c.first_name, c.last_name, c.rating, array_length(c.specialties, 1) as specialty_count 
-- FROM coaches c WHERE c.is_verified = true ORDER BY c.rating DESC;

-- Test coach search query:
-- SELECT 
--   c.first_name,
--   c.last_name,
--   c.specialties,
--   c.languages,
--   cd.location_states
-- FROM coaches c
-- JOIN coach_demographics cd ON c.id = cd.coach_id
-- WHERE c.is_verified = true 
--   AND c.is_available = true
--   AND 'Anxiety' = ANY(c.specialties);