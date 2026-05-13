
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

async function checkLogin() {
  const client = new Client({ connectionString });
  try {
    await client.connect();
    // Test the crypt function in DB
    const res = await client.query("SELECT crypt('test', '$2a$10$CWjt2WWZ.s.yXqY.s.yXqO') = '$2a$10$CWjt2WWZ.s.yXqY.s.yXqO' as match");
    console.log('Crypt test match:', res.rows[0].match);
    await client.end();
  } catch (err) {
    console.error('Error:', err.message);
  }
}

checkLogin();
