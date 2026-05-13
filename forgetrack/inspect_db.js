
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

async function inspectDatabase() {
  console.log('Inspecting database...');
  const client = new Client({ connectionString });
  try {
    await client.connect();
    
    console.log('Querying auth.users count...');
    const authUsersRes = await client.query('SELECT count(*) FROM auth.users');
    console.log('Auth users count:', authUsersRes.rows[0].count);

    console.log('Querying public.users count...');
    const publicUsersRes = await client.query('SELECT count(*) FROM public.users');
    console.log('Public users count:', publicUsersRes.rows[0].count);

    console.log('Checking for any triggers on auth.users...');
    const triggersRes = await client.query(`
      SELECT tgname 
      FROM pg_trigger 
      WHERE tgrelid = 'auth.users'::regclass
    `);
    console.log('Triggers on auth.users:', triggersRes.rows);

    await client.end();
  } catch (err) {
    console.error('Error during inspection:', err.message);
  }
}

inspectDatabase();
