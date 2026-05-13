
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

async function resetPasswords() {
  const client = new Client({ connectionString });
  try {
    await client.connect();
    console.log('Resetting mentor passwords to "password"...');
    await client.query(`
      UPDATE auth.users 
      SET encrypted_password = crypt('password', gen_salt('bf', 10))
      WHERE email IN ('nischay@theboringpeople.in', 'varun@theboringpeople.in')
    `);

    console.log('Resetting student passwords to their USN...');
    await client.query(`
      UPDATE auth.users au
      SET encrypted_password = crypt(s.usn, gen_salt('bf', 10))
      FROM public.users u
      JOIN students s ON u.student_id = s.id
      WHERE au.id = u.id AND u.role = 'student'
    `);

    console.log('Passwords reset successfully!');
    await client.end();
  } catch (err) {
    console.error('Error:', err.message);
  }
}

resetPasswords();
