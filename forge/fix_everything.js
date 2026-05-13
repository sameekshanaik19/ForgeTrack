
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Load env from .env.local
const envPath = path.resolve(process.cwd(), '.env.local');
let envContent = '';
try {
  envContent = fs.readFileSync(envPath, 'utf8');
} catch (e) {
  // Try frontend/.env.local if not in root
  try {
    envContent = fs.readFileSync(path.resolve(process.cwd(), 'frontend', '.env.local'), 'utf8');
  } catch (e2) {
    console.error('❌ Could not find .env.local file in root or frontend/ directory.');
    process.exit(1);
  }
}

const env = {};
envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length > 0) {
    env[key.trim()] = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
  }
});

const connectionString = env.DATABASE_URL;

if (!connectionString) {
  console.error('❌ DATABASE_URL not found in .env.local');
  process.exit(1);
}

async function fixEverything() {
  const client = new Client({ connectionString });
  try {
    await client.connect();
    console.log('🚀 Starting Database Purge and Login Fix...');

    const sql = `
      BEGIN;

      -- 1. Clear all transactional data
      TRUNCATE TABLE public.attendance RESTART IDENTITY CASCADE;
      TRUNCATE TABLE public.materials RESTART IDENTITY CASCADE;
      TRUNCATE TABLE public.import_log RESTART IDENTITY CASCADE;
      TRUNCATE TABLE public.sessions RESTART IDENTITY CASCADE;

      -- 2. Clean up Users
      DELETE FROM public.users WHERE email NOT IN ('nischay@theboringpeople.in', 'varun@theboringpeople.in');
      DELETE FROM public.students;

      -- 3. Clean up Auth (This requires high permissions)
      DELETE FROM auth.identities WHERE user_id NOT IN (
          SELECT id FROM auth.users WHERE email IN ('nischay@theboringpeople.in', 'varun@theboringpeople.in')
      );
      DELETE FROM auth.users WHERE email NOT IN ('nischay@theboringpeople.in', 'varun@theboringpeople.in');

      -- 4. Fix Mentors (Explicitly setting password and instance_id)
      -- Using NULL for instance_id (Standard Supabase)
      UPDATE auth.users
      SET 
          encrypted_password = crypt('password', gen_salt('bf')),
          email_confirmed_at = NOW(),
          aud = 'authenticated',
          role = 'authenticated',
          instance_id = NULL,
          updated_at = NOW()
      WHERE email IN ('nischay@theboringpeople.in', 'varun@theboringpeople.in');

      -- 5. Ensure Identities exist
      INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
      SELECT 
          gen_random_uuid(), 
          u.id, 
          format('{"sub":"%s","email":"%s"}', u.id, u.email)::jsonb, 
          'email', 
          u.id::text, 
          NOW(), 
          NOW(), 
          NOW()
      FROM auth.users u
      LEFT JOIN auth.identities i ON u.id = i.user_id
      WHERE u.email IN ('nischay@theboringpeople.in', 'varun@theboringpeople.in')
      AND i.id IS NULL;

      COMMIT;
    `;

    await client.query(sql);
    console.log('✅ Database Purge and Repair Complete!');
    console.log('👉 You can now log in with:');
    console.log('   Email: nischay@theboringpeople.in');
    console.log('   Password: password');
    console.log('\n(Note: If login still fails, we may need to try setting instance_id to zeros)');

    await client.end();
  } catch (err) {
    console.error('💥 Error during fix:', err.message);
    if (err.message.includes('permission denied')) {
      console.log('❌ Permission Denied: Ensure your DATABASE_URL uses the "postgres" user or has superuser rights.');
    }
    process.exit(1);
  }
}

fixEverything();
