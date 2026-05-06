-- ForgeTrack Initial Schema and Seed Script

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Tables Creation

CREATE TABLE IF NOT EXISTS students (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  usn TEXT UNIQUE NOT NULL,
  admission_number TEXT,
  email TEXT,
  branch_code TEXT NOT NULL,
  batch TEXT DEFAULT '2024-2028',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sessions (
  id SERIAL PRIMARY KEY,
  date DATE NOT NULL UNIQUE,
  topic TEXT NOT NULL,
  month_number INTEGER NOT NULL,
  duration_hours DECIMAL(3,1) DEFAULT 2.0,
  session_type TEXT DEFAULT 'offline',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS import_log (
  id SERIAL PRIMARY KEY,
  filename TEXT NOT NULL,
  uploaded_by TEXT NOT NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  total_rows INTEGER NOT NULL,
  imported_rows INTEGER NOT NULL,
  skipped_rows INTEGER NOT NULL,
  warnings TEXT,
  column_mapping TEXT,
  status TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS attendance (
  id SERIAL PRIMARY KEY,
  student_id INTEGER REFERENCES students(id) NOT NULL,
  session_id INTEGER REFERENCES sessions(id) NOT NULL,
  present BOOLEAN NOT NULL,
  marked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  marked_by TEXT DEFAULT 'system',
  import_id INTEGER REFERENCES import_log(id),
  UNIQUE(student_id, session_id)
);

CREATE TABLE IF NOT EXISTS materials (
  id SERIAL PRIMARY KEY,
  session_id INTEGER REFERENCES sessions(id) NOT NULL,
  title TEXT NOT NULL,
  type TEXT NOT NULL,
  url TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('mentor', 'student')),
  student_id INTEGER REFERENCES students(id),
  display_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Constraints & Triggers

-- Trigger to prevent future dates and dates before program start in attendance
CREATE OR REPLACE FUNCTION validate_attendance_date()
RETURNS trigger AS $$
DECLARE
  session_date DATE;
BEGIN
  SELECT date INTO session_date FROM sessions WHERE id = NEW.session_id;
  IF session_date > CURRENT_DATE THEN
    RAISE EXCEPTION 'Cannot mark attendance for a future session date';
  END IF;
  IF session_date < '2025-08-04' THEN
    RAISE EXCEPTION 'Session date is before program start date';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_attendance_date
  BEFORE INSERT OR UPDATE ON attendance
  FOR EACH ROW EXECUTE FUNCTION validate_attendance_date();

-- Trigger to auto-create user when student is added
CREATE OR REPLACE FUNCTION public.create_student_user()
RETURNS trigger AS $$
DECLARE
  new_user_id UUID;
BEGIN
  new_user_id := gen_random_uuid();
  
  -- Insert into auth.users (works on standard Supabase setups)
  INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
  ) VALUES (
    '00000000-0000-0000-0000-000000000000', new_user_id, 'authenticated', 'authenticated', COALESCE(NEW.email, NEW.usn || '@forge.local'), crypt(NEW.usn, gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}', '{}', NOW(), NOW()
  );
  
  -- Insert into public.users
  INSERT INTO public.users (id, email, role, student_id, display_name)
  VALUES (new_user_id, COALESCE(NEW.email, NEW.usn || '@forge.local'), 'student', NEW.id, NEW.name);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_student_created
  AFTER INSERT ON students
  FOR EACH ROW EXECUTE FUNCTION public.create_student_user();

-- 3. Row Level Security

ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE import_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Students
CREATE POLICY "mentors_all_students" ON students FOR ALL USING (
  (SELECT role FROM public.users WHERE id = auth.uid()) = 'mentor'
);
CREATE POLICY "students_read_own_student" ON students FOR SELECT USING (
  id = (SELECT student_id FROM public.users WHERE id = auth.uid())
);

-- Sessions
CREATE POLICY "mentors_all_sessions" ON sessions FOR ALL USING (
  (SELECT role FROM public.users WHERE id = auth.uid()) = 'mentor'
);
CREATE POLICY "students_read_sessions" ON sessions FOR SELECT USING (
  true
);

-- Attendance
CREATE POLICY "mentors_all_attendance" ON attendance FOR ALL USING (
  (SELECT role FROM public.users WHERE id = auth.uid()) = 'mentor'
);
CREATE POLICY "students_read_own_attendance" ON attendance FOR SELECT USING (
  student_id = (SELECT student_id FROM public.users WHERE id = auth.uid())
);

-- Materials
CREATE POLICY "mentors_all_materials" ON materials FOR ALL USING (
  (SELECT role FROM public.users WHERE id = auth.uid()) = 'mentor'
);
CREATE POLICY "students_read_materials" ON materials FOR SELECT USING (
  true
);

-- Import Log
CREATE POLICY "mentors_all_import_log" ON import_log FOR ALL USING (
  (SELECT role FROM public.users WHERE id = auth.uid()) = 'mentor'
);

-- Users
CREATE POLICY "mentors_all_users" ON public.users FOR ALL USING (
  (SELECT role FROM public.users WHERE id = auth.uid()) = 'mentor'
);
CREATE POLICY "users_read_own" ON public.users FOR SELECT USING (
  id = auth.uid()
);

