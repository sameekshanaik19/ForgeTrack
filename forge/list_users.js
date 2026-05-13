
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

const connectionString = env.DATABASE_URL.replace(/\[/g, '').replace(/\]/g, '');

async function listUsers() {
  const client = new Client({ connectionString });
  try {
    await client.connect();
    
    console.log('Listing users from auth.users:');
    const authRes = await client.query('SELECT email, instance_id FROM auth.users');
    console.table(authRes.rows);

    console.log('Listing users from public.users:');
    const publicRes = await client.query('SELECT email, role FROM public.users');
    console.table(publicRes.rows);

    await client.end();
  } catch (err) {
    console.error('Error:', err.message);
  }
}

listUsers();
