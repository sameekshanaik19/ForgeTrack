-- ForgeTrack: TOTAL CLEANUP & LOGIN FIX
-- 1. Deletes all student data, attendance, and sessions.
-- 2. Keeps only Nischay and Varun mentor accounts.
-- 3. Fixes mentor passwords and authentication settings.

BEGIN;

-- Part 1: Clear all data
TRUNCATE TABLE attendance RESTART IDENTITY CASCADE;
TRUNCATE TABLE materials RESTART IDENTITY CASCADE;
TRUNCATE TABLE import_log RESTART IDENTITY CASCADE;
TRUNCATE TABLE sessions RESTART IDENTITY CASCADE;

-- Part 2: Clean up Users
-- Delete students and other users from public.users
DELETE FROM public.users
WHERE email NOT IN ('nischay@theboringpeople.in', 'varun@theboringpeople.in');

-- Delete all records from students table
DELETE FROM students;

-- Delete orphaned identities
DELETE FROM auth.identities
WHERE user_id NOT IN (
    SELECT id FROM auth.users 
    WHERE email IN ('nischay@theboringpeople.in', 'varun@theboringpeople.in')
);

-- Delete all other users from auth.users
DELETE FROM auth.users
WHERE email NOT IN ('nischay@theboringpeople.in', 'varun@theboringpeople.in');

-- Part 3: Fix Mentor Auth (The Login Fix)
-- We ensure the mentors have the correct password and instance settings
UPDATE auth.users
SET 
    encrypted_password = crypt('password', gen_salt('bf')),
    email_confirmed_at = NOW(),
    aud = 'authenticated',
    role = 'authenticated',
    instance_id = NULL, -- Try NULL first. If login still fails, change this to '00000000-0000-0000-0000-000000000000'
    updated_at = NOW()
WHERE email IN ('nischay@theboringpeople.in', 'varun@theboringpeople.in');

-- Ensure they have identities (required for login)
INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
SELECT 
    gen_random_uuid(), 
    u.id, 
    format('{"sub":"%s","email":"%s"}', u.id, u.email)::jsonb, 
    'email', 
    u.id, 
    NOW(), 
    NOW(), 
    NOW()
FROM auth.users u
LEFT JOIN auth.identities i ON u.id = i.user_id
WHERE u.email IN ('nischay@theboringpeople.in', 'varun@theboringpeople.in')
AND i.id IS NULL;

COMMIT;

-- Verification
SELECT 'Students remaining' as category, count(*) FROM students
UNION ALL
SELECT 'Public Users remaining', count(*) FROM public.users
UNION ALL
SELECT 'Auth Users remaining', count(*) FROM auth.users
UNION ALL
SELECT 'Sessions remaining', count(*) FROM sessions;
