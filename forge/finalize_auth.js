
import pkg from 'pg';
const { Client } = pkg;
import fs from 'fs';
import path from 'path';

const envPath = path.resolve(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) {
    env[key.trim()] = value.trim().replace(/^["']|["']$/g, '');
  }
});

const connectionString = env.DATABASE_URL;

async function finalizeAuth() {
  const client = new Client({ connectionString });
  try {
    await client.connect();
    console.log('Finalizing Auth setup...');

    console.log('Re-applying create_student_user function...');
    const functionDef = `
CREATE OR REPLACE FUNCTION public.create_student_user()
RETURNS trigger AS $$
DECLARE
  new_user_id UUID;
BEGIN
  new_user_id := gen_random_uuid();
  
  -- Insert into auth.users
  INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token, email_change_token_new, is_super_admin
  ) VALUES (
    NULL, new_user_id, 'authenticated', 'authenticated', LOWER(NEW.usn) || '@forge.local', crypt(NEW.usn, gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}', '{}', NOW(), NOW(), '', '', '', false
  );
  
  -- Insert into auth.identities
  INSERT INTO auth.identities (
    id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
  ) VALUES (
    gen_random_uuid(), new_user_id, format('{"sub":"%s","email":"%s"}', new_user_id, LOWER(NEW.usn) || '@forge.local')::jsonb, 'email', new_user_id::text, NOW(), NOW(), NOW()
  );
  
  -- Insert into public.users
  INSERT INTO public.users (id, email, role, student_id, display_name)
  VALUES (new_user_id, LOWER(NEW.usn) || '@forge.local', 'student', NEW.id, NEW.name);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
    `;
    await client.query(functionDef);

    console.log('Adding missing identities for existing students...');
    const usersRes = await client.query(`
      SELECT au.id, au.email 
      FROM auth.users au
      LEFT JOIN auth.identities ai ON au.id = ai.user_id
      WHERE ai.id IS NULL
    `);
    
    console.log(`Found ${usersRes.rowCount} users without identities.`);
    
    for (const user of usersRes.rows) {
      console.log(`Adding identity for ${user.email}...`);
      await client.query(`
        INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
        VALUES (gen_random_uuid(), $1::uuid, $2::jsonb, 'email', $1::text, NOW(), NOW(), NOW())
      `, [user.id, JSON.stringify({ sub: user.id, email: user.email })]);
    }

    console.log('Auth setup finalized!');
    await client.end();
  } catch (err) {
    console.error('Finalization failed:', err.message);
  }
}

finalizeAuth();
