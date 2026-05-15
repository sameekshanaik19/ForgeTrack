-- ForgeTrack: Fix Constraints and Clean Duplicates
-- Run this in your Supabase SQL Editor

-- 1. Clean up STUDENTS duplicates (keep only the newest record for each USN)
DELETE FROM students
WHERE id IN (
    SELECT id
    FROM (
        SELECT id,
               ROW_NUMBER() OVER (PARTITION BY usn ORDER BY created_at DESC, id DESC) as row_num
        FROM students
    ) t
    WHERE t.row_num > 1
);

-- 2. Clean up SESSIONS duplicates (keep only the newest record for each date)
DELETE FROM sessions
WHERE id IN (
    SELECT id
    FROM (
        SELECT id,
               ROW_NUMBER() OVER (PARTITION BY date ORDER BY created_at DESC, id DESC) as row_num
        FROM sessions
    ) t
    WHERE t.row_num > 1
);

-- 3. Clean up ATTENDANCE duplicates (keep only the newest record for each student+session)
DELETE FROM attendance
WHERE id IN (
    SELECT id
    FROM (
        SELECT id,
               ROW_NUMBER() OVER (PARTITION BY student_id, session_id ORDER BY marked_at DESC, id DESC) as row_num
        FROM attendance
    ) t
    WHERE t.row_num > 1
);

-- 4. Apply UNIQUE constraints (These are required for ON CONFLICT to work)
DO $$ 
BEGIN
    -- Ensure USN is unique for students
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'students_usn_key') THEN
        ALTER TABLE students ADD CONSTRAINT students_usn_key UNIQUE (usn);
    END IF;

    -- Ensure Date is unique for sessions
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sessions_date_key') THEN
        ALTER TABLE sessions ADD CONSTRAINT sessions_date_key UNIQUE (date);
    END IF;

    -- Ensure (Student, Session) pair is unique for attendance
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'attendance_student_session_key') THEN
        ALTER TABLE attendance ADD CONSTRAINT attendance_student_session_key UNIQUE (student_id, session_id);
    END IF;
END $$;

-- 5. Fix column defaults and triggers
ALTER TABLE students ALTER COLUMN branch_code SET DEFAULT 'DE';

-- Ensure the student creation trigger is robust
CREATE OR REPLACE FUNCTION public.create_student_user()
RETURNS trigger AS $$
DECLARE
  new_user_id UUID;
BEGIN
  new_user_id := gen_random_uuid();
  
  -- Insert into auth.users (ignore if email already exists)
  INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, is_super_admin
  ) VALUES (
    NULL, new_user_id, 'authenticated', 'authenticated', LOWER(NEW.usn) || '@forge.local', crypt(NEW.usn, gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}', '{}', NOW(), NOW(), false
  ) ON CONFLICT (email) DO NOTHING;
  
  -- Insert into auth.identities
  INSERT INTO auth.identities (
    id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
  ) VALUES (
    gen_random_uuid(), (SELECT id FROM auth.users WHERE email = LOWER(NEW.usn) || '@forge.local'), format('{"sub":"%s","email":"%s"}', (SELECT id FROM auth.users WHERE email = LOWER(NEW.usn) || '@forge.local'), LOWER(NEW.usn) || '@forge.local')::jsonb, 'email', (SELECT id FROM auth.users WHERE email = LOWER(NEW.usn) || '@forge.local'), NOW(), NOW(), NOW()
  ) ON CONFLICT (provider, provider_id) DO NOTHING;
  
  -- Insert into public.users
  INSERT INTO public.users (id, email, role, student_id, display_name)
  VALUES (
    (SELECT id FROM auth.users WHERE email = LOWER(NEW.usn) || '@forge.local'), 
    COALESCE(NEW.email, LOWER(NEW.usn) || '@forge.local'), 
    'student', 
    NEW.id, 
    NEW.name
  )
  ON CONFLICT (email) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
