-- ForgeTrack: Restore Mentor Accounts
-- Run this in the Supabase SQL Editor to recreate Nischay and Varun

BEGIN;

-- 1. Create Mentor 1 in auth.users
INSERT INTO auth.users (
  id, aud, role, email, encrypted_password, email_confirmed_at, 
  raw_app_meta_data, raw_user_meta_data, instance_id, created_at, updated_at
)
SELECT 
  gen_random_uuid(), 'authenticated', 'authenticated', 'nischay@theboringpeople.in', 
  crypt('password', gen_salt('bf')), NOW(), 
  '{"provider":"email","providers":["email"]}', '{}', NULL, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'nischay@theboringpeople.in');

-- 2. Create Mentor 2 in auth.users
INSERT INTO auth.users (
  id, aud, role, email, encrypted_password, email_confirmed_at, 
  raw_app_meta_data, raw_user_meta_data, instance_id, created_at, updated_at
)
SELECT 
  gen_random_uuid(), 'authenticated', 'authenticated', 'varun@theboringpeople.in', 
  crypt('password', gen_salt('bf')), NOW(), 
  '{"provider":"email","providers":["email"]}', '{}', NULL, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'varun@theboringpeople.in');

-- 3. Ensure they have identities
INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
SELECT 
    gen_random_uuid(), u.id, format('{"sub":"%s","email":"%s"}', u.id, u.email)::jsonb, 'email', u.id, NOW(), NOW(), NOW()
FROM auth.users u
LEFT JOIN auth.identities i ON u.id = i.user_id
WHERE u.email IN ('nischay@theboringpeople.in', 'varun@theboringpeople.in')
AND i.id IS NULL;

-- 4. Re-add to public.users
INSERT INTO public.users (id, email, role, display_name)
SELECT id, email, 'mentor', 'Nischay B K'
FROM auth.users WHERE email = 'nischay@theboringpeople.in'
ON CONFLICT (id) DO UPDATE SET role = 'mentor', display_name = 'Nischay B K';

INSERT INTO public.users (id, email, role, display_name)
SELECT id, email, 'mentor', 'Varun'
FROM auth.users WHERE email = 'varun@theboringpeople.in'
ON CONFLICT (id) DO UPDATE SET role = 'mentor', display_name = 'Varun';

COMMIT;

-- Verification
SELECT email, role, display_name FROM public.users WHERE role = 'mentor';
