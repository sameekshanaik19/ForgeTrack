
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

async function finalizeRepair() {
  const client = new Client({ connectionString });
  try {
    await client.connect();
    console.log('Performing deep repair of auth.users...');

    await client.query(`
      UPDATE auth.users 
      SET 
        instance_id = NULL,
        aud = 'authenticated',
        role = 'authenticated',
        email_confirmed_at = NOW(),
        confirmation_token = NULL,
        recovery_token = NULL,
        email_change_token_new = NULL,
        is_super_admin = FALSE,
        raw_app_meta_data = '{"provider":"email","providers":["email"]}',
        raw_user_meta_data = '{}'
    `);

    console.log('Repair complete. Trying one more hash reset for mentors...');
    await client.query(`
      UPDATE auth.users 
      SET encrypted_password = crypt('password', gen_salt('bf', 10))
      WHERE email IN ('nischay@theboringpeople.in', 'varun@theboringpeople.in')
    `);

    await client.end();
    console.log('Deep repair finished.');
  } catch (err) {
    console.error('Error:', err.message);
  }
}

finalizeRepair();
