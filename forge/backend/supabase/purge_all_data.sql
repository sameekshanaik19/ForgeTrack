-- ForgeTrack Full Data Purge
-- Preserves only Nischay and Varun mentor accounts
-- Run this in the Supabase SQL Editor

BEGIN;

-- 1. Clear transactional and related tables
TRUNCATE TABLE attendance RESTART IDENTITY CASCADE;
TRUNCATE TABLE materials RESTART IDENTITY CASCADE;
TRUNCATE TABLE import_log RESTART IDENTITY CASCADE;
TRUNCATE TABLE sessions RESTART IDENTITY CASCADE;

-- 2. Delete student users from public.users first
-- This is necessary because public.users references both auth.users and students
DELETE FROM public.users
WHERE email NOT IN ('nischay@theboringpeople.in', 'varun@theboringpeople.in');

-- 3. Now we can safely delete all students
DELETE FROM students;

-- 4. Delete identities from auth.identities except for mentors
DELETE FROM auth.identities
WHERE user_id NOT IN (
    SELECT id FROM auth.users 
    WHERE email IN ('nischay@theboringpeople.in', 'varun@theboringpeople.in')
);

-- 5. Delete users from auth.users except mentors
DELETE FROM auth.users
WHERE email NOT IN ('nischay@theboringpeople.in', 'varun@theboringpeople.in');

COMMIT;

-- Verification Query
SELECT 'Students remaining' as category, count(*) FROM students
UNION ALL
SELECT 'Public Users remaining', count(*) FROM public.users
UNION ALL
SELECT 'Auth Users remaining', count(*) FROM auth.users
UNION ALL
SELECT 'Sessions remaining', count(*) FROM sessions;
