
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

async function fixStudentEmails() {
  const client = new Client({ connectionString });
  try {
    await client.connect();
    console.log('Fixing student emails in auth.users and public.users...');

    // Update public.users first
    await client.query(`
      UPDATE public.users u
      SET email = LOWER(s.usn) || '@forge.local'
      FROM students s
      WHERE u.student_id = s.id AND u.role = 'student'
    `);

    // Update auth.users
    await client.query(`
      UPDATE auth.users au
      SET email = u.email
      FROM public.users u
      WHERE au.id = u.id AND u.role = 'student'
    `);

    // Update auth.identities - only identity_data
    await client.query(`
      UPDATE auth.identities ai
      SET identity_data = jsonb_set(identity_data, '{email}', to_jsonb(u.email))
      FROM public.users u
      WHERE ai.user_id = u.id AND u.role = 'student'
    `);

    console.log('Emails fixed successfully!');
    await client.end();
  } catch (err) {
    console.error('Error fixing emails:', err.message);
  }
}

fixStudentEmails();
