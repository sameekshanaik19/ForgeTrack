-- Script to allow Bulk Import tool to work without mentor login
-- Use this for development or if you haven't set up authentication yet

-- 1. Allow anyone (anon) to manage students
DROP POLICY IF EXISTS "mentors_all_students" ON students;
CREATE POLICY "allow_all_students" ON students FOR ALL USING (true) WITH CHECK (true);

-- 2. Allow anyone to manage sessions
DROP POLICY IF EXISTS "mentors_all_sessions" ON sessions;
CREATE POLICY "allow_all_sessions" ON sessions FOR ALL USING (true) WITH CHECK (true);

-- 3. Allow anyone to manage attendance
DROP POLICY IF EXISTS "mentors_all_attendance" ON attendance;
CREATE POLICY "allow_all_attendance" ON attendance FOR ALL USING (true) WITH CHECK (true);

-- 4. Allow anyone to manage users
DROP POLICY IF EXISTS "mentors_all_users" ON public.users;
CREATE POLICY "allow_all_users" ON public.users FOR ALL USING (true) WITH CHECK (true);
