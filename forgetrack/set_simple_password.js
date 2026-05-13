
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

async function setSimplePassword() {
  const client = new Client({ connectionString });
  try {
    await client.connect();
    console.log('Setting password for 4sh24cs999@forge.local to "test"...');
    await client.query(`
      UPDATE auth.users 
      SET encrypted_password = crypt('test', gen_salt('bf', 10))
      WHERE email = '4sh24cs999@forge.local'
    `);
    await client.end();
  } catch (err) {
    console.error('Error:', err.message);
  }
}

setSimplePassword();
