
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

async function checkHash() {
  const client = new Client({ connectionString });
  try {
    await client.connect();
    const res = await client.query("SELECT encrypted_password FROM auth.users WHERE email = '4sh24cs999@forge.local'");
    console.log('Hash for 4sh24cs999@forge.local:', res.rows[0].encrypted_password);
    await client.end();
  } catch (err) {
    console.error('Error:', err.message);
  }
}

checkHash();
