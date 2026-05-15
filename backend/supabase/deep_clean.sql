-- ForgeTrack: Deep Clean & Reset
-- This will clear all student data to allow for a perfectly clean import
-- It PRESERVES mentor accounts.

BEGIN;

-- 1. Disable user triggers temporarily
ALTER TABLE students DISABLE TRIGGER USER;
ALTER TABLE attendance DISABLE TRIGGER USER;

-- 2. TRUNCATE tables (much faster and handles dependencies better)
TRUNCATE TABLE attendance, sessions, students CASCADE;

-- 3. Delete student users from public.users (keep mentors)
DELETE FROM public.users WHERE role = 'student';

-- 4. Delete student users from auth.users (keep mentors)
DELETE FROM auth.users 
WHERE email NOT IN ('nischay@theboringpeople.in', 'varun@theboringpeople.in')
AND id NOT IN (SELECT id FROM public.users WHERE role = 'mentor');

-- 5. Re-enable triggers
ALTER TABLE students ENABLE TRIGGER USER;
ALTER TABLE attendance ENABLE TRIGGER USER;

COMMIT;

-- Final check
SELECT 'Students' as table, count(*) FROM students
UNION ALL
SELECT 'Sessions', count(*) FROM sessions
UNION ALL
SELECT 'Attendance', count(*) FROM attendance
UNION ALL
SELECT 'Mentors', count(*) FROM public.users WHERE role = 'mentor';
