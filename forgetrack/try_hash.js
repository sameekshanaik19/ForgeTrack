
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

async function tryDifferentHash() {
  const client = new Client({ connectionString });
  try {
    await client.connect();
    console.log('Trying different hashing options...');

    // Try setting mentor password with explicit rounds and salt type
    await client.query(`
      UPDATE auth.users 
      SET encrypted_password = crypt('password', gen_salt('bf', 10))
      WHERE email = 'nischay@theboringpeople.in'
    `);

    const res = await client.query("SELECT encrypted_password FROM auth.users WHERE email = 'nischay@theboringpeople.in'");
    console.log('New hash:', res.rows[0].encrypted_password);
    
    await client.end();
  } catch (err) {
    console.error('Error:', err.message);
  }
}

tryDifferentHash();
