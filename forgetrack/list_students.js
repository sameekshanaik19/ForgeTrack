
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

async function listStudents() {
  const client = new Client({ connectionString });
  try {
    await client.connect();
    
    console.log('Listing students from public.students:');
    const studentsRes = await client.query('SELECT name, usn, email FROM students');
    console.table(studentsRes.rows);

    console.log('Listing users from auth.users (students only):');
    const authRes = await client.query("SELECT email FROM auth.users WHERE email LIKE '%@forge.local'");
    console.table(authRes.rows);

    await client.end();
  } catch (err) {
    console.error('Error:', err.message);
  }
}

listStudents();
