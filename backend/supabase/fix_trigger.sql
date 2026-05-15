-- ForgeTrack: Fix Student User Trigger
-- This makes the trigger more robust to prevent "duplicate key" errors during bulk import

CREATE OR REPLACE FUNCTION public.create_student_user()
RETURNS trigger AS $$
DECLARE
  new_user_id UUID;
  existing_user_id UUID;
  student_email TEXT;
BEGIN
  student_email := LOWER(COALESCE(NEW.email, NEW.usn || '@forge.local'));
  
  -- Check if user already exists in auth.users
  SELECT id INTO existing_user_id FROM auth.users WHERE email = student_email;
  
  IF existing_user_id IS NULL THEN
    new_user_id := gen_random_uuid();
    
    -- Insert into auth.users
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token, email_change_token_new, is_super_admin
    ) VALUES (
      NULL, new_user_id, 'authenticated', 'authenticated', student_email, crypt(NEW.usn, gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}', '{}', NOW(), NOW(), '', '', '', false
    );
    
    -- Insert into auth.identities
    INSERT INTO auth.identities (
      id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
    ) VALUES (
      gen_random_uuid(), new_user_id, format('{"sub":"%s","email":"%s"}', new_user_id, student_email)::jsonb, 'email', new_user_id, NOW(), NOW(), NOW()
    );
  ELSE
    new_user_id := existing_user_id;
  END IF;
  
  -- Upsert into public.users
  INSERT INTO public.users (id, email, role, student_id, display_name)
  VALUES (new_user_id, student_email, 'student', NEW.id, NEW.name)
  ON CONFLICT (id) DO UPDATE SET 
    student_id = EXCLUDED.student_id,
    display_name = EXCLUDED.display_name,
    email = EXCLUDED.email;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-apply the trigger
DROP TRIGGER IF EXISTS on_student_created ON students;
CREATE TRIGGER on_student_created
  AFTER INSERT ON students
  FOR EACH ROW EXECUTE FUNCTION public.create_student_user();
