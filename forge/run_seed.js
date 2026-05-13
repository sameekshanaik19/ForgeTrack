
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

async function seedDatabase() {
  const client = new Client({ connectionString });
  try {
    await client.connect();
    console.log('Reading seed.sql...');
    const seedSql = fs.readFileSync(path.resolve(process.cwd(), 'backend/supabase/seed.sql'), 'utf8');
    
    console.log('Executing seed.sql...');
    await client.query(seedSql);
    
    console.log('Seed successful!');
    
    console.log('Verifying student count...');
    const res = await client.query('SELECT count(*) FROM students');
    console.log('Total students:', res.rows[0].count);

    console.log('Verifying auth.users count (students)...');
    const authRes = await client.query("SELECT count(*) FROM auth.users WHERE email LIKE '%@forge.local'");
    console.log('Total auth student users:', authRes.rows[0].count);

    await client.end();
  } catch (err) {
    console.error('Seed failed:', err.message);
    console.error('Full error:', err);
  }
}

seedDatabase();
