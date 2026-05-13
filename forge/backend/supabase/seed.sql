-- 4. Seed Data

-- Add Mentors (We must insert into auth.users directly for seeding)
DO $$
DECLARE
  mentor_id UUID;
  co_mentor_id UUID;
BEGIN
  -- Check and insert Mentor 1
  SELECT id INTO mentor_id FROM auth.users WHERE email = 'nischay@theboringpeople.in';
  IF mentor_id IS NULL THEN
    mentor_id := gen_random_uuid();
    INSERT INTO auth.users (id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, instance_id)
    VALUES (mentor_id, 'authenticated', 'authenticated', 'nischay@theboringpeople.in', crypt('password', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}', '{}', NULL);
    
    INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    VALUES (gen_random_uuid(), mentor_id, format('{"sub":"%s","email":"%s"}', mentor_id, 'nischay@theboringpeople.in')::jsonb, 'email', mentor_id, NOW(), NOW(), NOW());
  END IF;

  -- Check and insert Mentor 2
  SELECT id INTO co_mentor_id FROM auth.users WHERE email = 'varun@theboringpeople.in';
  IF co_mentor_id IS NULL THEN
    co_mentor_id := gen_random_uuid();
    INSERT INTO auth.users (id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, instance_id)
    VALUES (co_mentor_id, 'authenticated', 'authenticated', 'varun@theboringpeople.in', crypt('password', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}', '{}', NULL);
    
    INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    VALUES (gen_random_uuid(), co_mentor_id, format('{"sub":"%s","email":"%s"}', co_mentor_id, 'varun@theboringpeople.in')::jsonb, 'email', co_mentor_id, NOW(), NOW(), NOW());
  END IF;

  -- Upsert into public.users
  INSERT INTO public.users (id, email, role, display_name)
  VALUES 
    (mentor_id, 'nischay@theboringpeople.in', 'mentor', 'Nischay B K'),
    (co_mentor_id, 'varun@theboringpeople.in', 'mentor', 'Varun')
  ON CONFLICT (id) DO NOTHING;
END $$;

-- Add Students
-- Note: inserting into students will trigger the auto-create user function
INSERT INTO students (name, usn, email, branch_code) VALUES
('Aarav Patel', '4SH24CS001', 'aarav.4sh24cs001@forge.local', 'AI'),
('Vihaan Sharma', '4SH24CS002', 'vihaan.4sh24cs002@forge.local', 'EC'),
('Vivaan Kumar', '4SH24CS003', 'vivaan.4sh24cs003@forge.local', 'IS'),
('Ananya Singh', '4SH24CS004', 'ananya.4sh24cs004@forge.local', 'EC'),
('Diya Gupta', '4SH24CS005', 'diya.4sh24cs005@forge.local', 'EC'),
('Aditya Rao', '4SH24CS006', 'aditya.4sh24cs006@forge.local', 'CS'),
('Ishaan Desai', '4SH24CS007', 'ishaan.4sh24cs007@forge.local', 'CS'),
('Saanvi Reddy', '4SH24CS008', 'saanvi.4sh24cs008@forge.local', 'IS'),
('Neha Joshi', '4SH24CS009', 'neha.4sh24cs009@forge.local', 'EC'),
('Rohan Mehta', '4SH24CS010', 'rohan.4sh24cs010@forge.local', 'IS'),
('Kavya Nair', '4SH24CS011', 'kavya.4sh24cs011@forge.local', 'IS'),
('Arjun Verma', '4SH24CS012', 'arjun.4sh24cs012@forge.local', 'EC'),
('Aryan Choudhury', '4SH24CS013', 'aryan.4sh24cs013@forge.local', 'CS'),
('Meera Iyer', '4SH24CS014', 'meera.4sh24cs014@forge.local', 'CS'),
('Karthik Pillai', '4SH24CS015', 'karthik.4sh24cs015@forge.local', 'IS'),
('Rahul Kapoor', '4SH24CS016', 'rahul.4sh24cs016@forge.local', 'EC'),
('Shruti Das', '4SH24CS017', 'shruti.4sh24cs017@forge.local', 'IS'),
('Nikhil Menon', '4SH24CS018', 'nikhil.4sh24cs018@forge.local', 'AI'),
('Pooja Bhatt', '4SH24CS019', 'pooja.4sh24cs019@forge.local', 'IS'),
('Siddharth Sen', '4SH24CS020', 'siddharth.4sh24cs020@forge.local', 'IS'),
('Sneha Mukherjee', '4SH24CS021', 'sneha.4sh24cs021@forge.local', 'CS'),
('Vikram Ahuja', '4SH24CS022', 'vikram.4sh24cs022@forge.local', 'IS'),
('Nisha Malhotra', '4SH24CS023', 'nisha.4sh24cs023@forge.local', 'AI'),
('Ravi Teja', '4SH24CS024', 'ravi.4sh24cs024@forge.local', 'EC'),
('Swati Kulkarni', '4SH24CS025', 'swati.4sh24cs025@forge.local', 'EC'),
('Amitabh Bose', '4SH24CS026', 'amitabh.4sh24cs026@forge.local', 'IS'),
('Priya K', '4SH24CS027', 'priya.4sh24cs027@forge.local', 'AI'),
('Rishabh Jain', '4SH24CS028', 'rishabh.4sh24cs028@forge.local', 'CS'),
('Aditi Rao', '4SH24CS029', 'aditi.4sh24cs029@forge.local', 'CS'),
('Varun M', '4SH24CS030', 'varun.4sh24cs030@forge.local', 'IS');

-- Add Sessions
INSERT INTO sessions (date, topic, month_number, session_type, duration_hours) VALUES
('2026-04-15', '8-Layer AI Application Stack', 4, 'offline', 2.0),
('2026-04-22', 'ReAct Agent Pattern', 4, 'offline', 2.0),
('2026-05-01', 'pgvector RAG', 5, 'offline', 2.0),
('2026-05-08', 'Tiered Autonomy Multi-Agent', 5, 'offline', 2.0);

-- Add Materials
INSERT INTO materials (session_id, title, type, url) VALUES
((SELECT id FROM sessions WHERE topic = '8-Layer AI Application Stack'), 'Slides: 8-Layer AI', 'slides', 'https://docs.google.com/presentation/d/...'),
((SELECT id FROM sessions WHERE topic = '8-Layer AI Application Stack'), 'Recording: Session 1', 'recording', 'https://youtube.com/...'),
((SELECT id FROM sessions WHERE topic = 'ReAct Agent Pattern'), 'Slides: ReAct Agents', 'slides', 'https://docs.google.com/presentation/d/...');

-- Add Attendance
-- Let's give everyone attendance for the first two sessions, except Ravi missed the second one
INSERT INTO attendance (student_id, session_id, present, marked_by)
SELECT s.id, sess.id, true, 'Nischay B K'
FROM students s, sessions sess
WHERE sess.topic = '8-Layer AI Application Stack';

INSERT INTO attendance (student_id, session_id, present, marked_by)
SELECT s.id, sess.id, CASE WHEN s.name = 'Ravi Teja' THEN false ELSE true END, 'Nischay B K'
FROM students s, sessions sess
WHERE sess.topic = 'ReAct Agent Pattern';

-- Add Import Log
INSERT INTO import_log (filename, uploaded_by, total_rows, imported_rows, skipped_rows, status) VALUES
('month3_attendance.csv', 'Nischay B K', 150, 150, 0, 'completed'),
('month4_attendance.csv', 'Varun', 160, 158, 2, 'completed');
