-- Relax the date validation trigger to allow historical data (2024 onwards)
CREATE OR REPLACE FUNCTION validate_attendance_date()
RETURNS trigger AS $$
DECLARE
  session_date DATE;
BEGIN
  SELECT date INTO session_date FROM sessions WHERE id = NEW.session_id;
  IF session_date > CURRENT_DATE THEN
    RAISE EXCEPTION 'Cannot mark attendance for a future session date';
  END IF;
  -- Relaxed from 2025-08-04 to 2024-01-01
  IF session_date < '2024-01-01' THEN
    RAISE EXCEPTION 'Session date is too old (before 2024)';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Robust student user creation trigger
CREATE OR REPLACE FUNCTION public.create_student_user()
RETURNS trigger AS $$
DECLARE
  new_user_id UUID;
BEGIN
  new_user_id := gen_random_uuid();
  
  -- Insert into auth.users (ignore if already exists)
  INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, is_super_admin
  ) VALUES (
    NULL, new_user_id, 'authenticated', 'authenticated', LOWER(NEW.usn) || '@forge.local', crypt(NEW.usn, gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}', '{}', NOW(), NOW(), false
  ) ON CONFLICT (email) DO NOTHING;
  
  -- Insert into auth.identities
  INSERT INTO auth.identities (
    id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
  ) VALUES (
    gen_random_uuid(), new_user_id, format('{"sub":"%s","email":"%s"}', new_user_id, LOWER(NEW.usn) || '@forge.local')::jsonb, 'email', new_user_id, NOW(), NOW(), NOW()
  ) ON CONFLICT (provider, provider_id) DO NOTHING;
  
  -- Insert into public.users
  INSERT INTO public.users (id, email, role, student_id, display_name)
  VALUES (new_user_id, COALESCE(NEW.email, LOWER(NEW.usn) || '@forge.local'), 'student', NEW.id, NEW.name)
  ON CONFLICT (email) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure branch_code has a default if not provided (though we will fix it in frontend too)
ALTER TABLE students ALTER COLUMN branch_code SET DEFAULT 'DE';

-- Ensure month_number has a default or allow NULL if we can't calculate it (though we will fix it in frontend)
-- But better to keep it NOT NULL and fix the frontend.

-- 3. Ensure Unique Constraints exist for Upsert logic
-- These are required for the ON CONFLICT clause to work.
DO $$ 
BEGIN
    -- students usn unique
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'students_usn_key') THEN
        ALTER TABLE students ADD CONSTRAINT students_usn_key UNIQUE (usn);
    END IF;

    -- sessions date unique
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sessions_date_key') THEN
        ALTER TABLE sessions ADD CONSTRAINT sessions_date_key UNIQUE (date);
    END IF;

    -- attendance unique(student_id, session_id)
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'attendance_student_session_key') THEN
        ALTER TABLE attendance ADD CONSTRAINT attendance_student_session_key UNIQUE (student_id, session_id);
    END IF;
END $$;
