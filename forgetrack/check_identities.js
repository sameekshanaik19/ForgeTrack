
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

async function checkIdentities() {
  const client = new Client({ connectionString });
  try {
    await client.connect();
    
    console.log('Checking auth.identities:');
    const res = await client.query('SELECT count(*) FROM auth.identities');
    console.log('Total identities:', res.rows[0].count);

    const identities = await client.query('SELECT user_id, provider, identity_data FROM auth.identities');
    console.table(identities.rows);

    await client.end();
  } catch (err) {
    console.error('Error:', err.message);
  }
}

checkIdentities();
