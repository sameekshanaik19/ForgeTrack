-- ForgeTrack Cleanup Script: Fix RLS & Remove Seed Data
-- Run this in the Supabase SQL Editor

-- 1. Fix Recursive RLS Policies
-- Using SECURITY DEFINER function to break the infinite loop
CREATE OR REPLACE FUNCTION public.check_is_mentor()
RETURNS boolean AS $$
BEGIN
  RETURN (SELECT role FROM public.users WHERE id = auth.uid()) = 'mentor';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-apply policies using the safe function
DO $$ 
BEGIN
    -- Students
    DROP POLICY IF EXISTS "mentors_all_students" ON students;
    CREATE POLICY "mentors_all_students" ON students FOR ALL USING (public.check_is_mentor());
    
    -- Sessions
    DROP POLICY IF EXISTS "mentors_all_sessions" ON sessions;
    CREATE POLICY "mentors_all_sessions" ON sessions FOR ALL USING (public.check_is_mentor());
    
    -- Attendance
    DROP POLICY IF EXISTS "mentors_all_attendance" ON attendance;
    CREATE POLICY "mentors_all_attendance" ON attendance FOR ALL USING (public.check_is_mentor());
    
    -- Materials
    DROP POLICY IF EXISTS "mentors_all_materials" ON materials;
    CREATE POLICY "mentors_all_materials" ON materials FOR ALL USING (public.check_is_mentor());
    
    -- Import Log
    DROP POLICY IF EXISTS "mentors_all_import_log" ON import_log;
    CREATE POLICY "mentors_all_import_log" ON import_log FOR ALL USING (public.check_is_mentor());
    
    -- Users
    DROP POLICY IF EXISTS "mentors_all_users" ON public.users;
    CREATE POLICY "mentors_all_users" ON public.users FOR ALL USING (public.check_is_mentor());
END $$;

-- 2. Cleanup Seed Data
BEGIN;

-- Clear transactional tables
TRUNCATE TABLE attendance RESTART IDENTITY CASCADE;
TRUNCATE TABLE materials RESTART IDENTITY CASCADE;
TRUNCATE TABLE import_log RESTART IDENTITY CASCADE;
TRUNCATE TABLE sessions RESTART IDENTITY CASCADE;

-- Identify and delete seed students
DELETE FROM public.users 
WHERE role = 'student' 
   OR email LIKE '%@forge.local';

DELETE FROM students 
WHERE email LIKE '%@forge.local' 
   OR email IS NULL;

-- Note: This requires 'postgres' role permissions
DELETE FROM auth.users 
WHERE email LIKE '%@forge.local'
  AND id NOT IN (SELECT id FROM public.users WHERE role = 'mentor');

COMMIT;

-- 3. Verification Query
SELECT 'Students remaining' as status, count(*) FROM students
UNION ALL
SELECT 'Users remaining', count(*) FROM public.users
UNION ALL
SELECT 'Sessions remaining', count(*) FROM sessions;
