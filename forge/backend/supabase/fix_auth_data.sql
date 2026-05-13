-- ForgeTrack Auth Repair Script
-- Run this in the Supabase SQL Editor to fix login issues

BEGIN;

-- 1. Ensure students have deterministic auth emails (usn@forge.local)
-- This fixes the mismatch between custom student emails and the USN login logic
UPDATE auth.users
SET email = LOWER(students.usn) || '@forge.local'
FROM public.users
JOIN students ON users.student_id = students.id
WHERE auth.users.id = users.id
AND users.role = 'student';

-- 2. Ensure mentors have the correct instance_id and fields
-- Standard Supabase Cloud uses NULL for instance_id
UPDATE auth.users
SET instance_id = NULL,
    aud = 'authenticated',
    role = 'authenticated',
    email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
    updated_at = NOW()
WHERE email IN (SELECT email FROM public.users WHERE role = 'mentor');

-- 3. Ensure all users have entries in auth.identities
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
WHERE i.id IS NULL;

-- 4. Reset Mentor Passwords (Optional but recommended for testing)
-- This ensures 'nischay@theboringpeople.in' has password 'password'
-- and 'varun@theboringpeople.in' has password 'password'
UPDATE auth.users
SET encrypted_password = crypt('password', gen_salt('bf'))
WHERE email IN ('nischay@theboringpeople.in', 'varun@theboringpeople.in');

COMMIT;

-- 4. Verification check
SELECT u.email, u.role, au.email as auth_email, au.instance_id
FROM public.users u
JOIN auth.users au ON u.id = au.id
WHERE u.role = 'mentor' OR u.email LIKE '%@forge.local';
