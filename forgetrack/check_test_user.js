
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

async function checkTestUser() {
  const client = new Client({ connectionString });
  try {
    await client.connect();
    const res = await client.query("SELECT email, aud, role, instance_id FROM auth.users WHERE email = 'test@example.com'");
    console.table(res.rows);
    await client.end();
  } catch (err) {
    console.error('Error:', err.message);
  }
}

checkTestUser();
