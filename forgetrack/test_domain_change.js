
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

async function testDomainChange() {
  const client = new Client({ connectionString });
  try {
    await client.connect();
    console.log('Changing test student email to @theboringpeople.in...');

    const usn = '4SH24CS999';
    const oldEmail = '4sh24cs999@forge.local';
    const newEmail = '4sh24cs999@theboringpeople.in';

    await client.query("UPDATE auth.users SET email = $1 WHERE email = $2", [newEmail, oldEmail]);
    await client.query("UPDATE public.users SET email = $1 WHERE email = $2", [newEmail, oldEmail]);
    await client.query("UPDATE auth.identities SET identity_data = jsonb_set(identity_data, '{email}', to_jsonb($1::text)) WHERE user_id = (SELECT id FROM auth.users WHERE email = $1)", [newEmail]);

    console.log('Domain changed! Now try sign in via test_student_auth_new.js (updating it first)');
    await client.end();
  } catch (err) {
    console.error('Error:', err.message);
  }
}

testDomainChange();
