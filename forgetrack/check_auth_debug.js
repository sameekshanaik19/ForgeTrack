
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const envPath = path.resolve(process.cwd(), '.env.local');
let envContent = '';
try { envContent = fs.readFileSync(envPath, 'utf8'); } catch (e) {
  try { envContent = fs.readFileSync(path.resolve(process.cwd(), '..', '.env.local'), 'utf8'); } catch (e2) {
    console.error('❌ Could not find .env.local'); process.exit(1);
  }
}

const env = {};
envContent.split('\n').forEach(line => {
  const [key, ...val] = line.split('=');
  if (key && val.length) env[key.trim()] = val.join('=').trim().replace(/^["']|["']$/g, '');
});

async function checkAuth() {
  const client = new Client({ connectionString: env.DATABASE_URL });
  await client.connect();
  
  console.log('--- Auth Users Table ---');
  const res = await client.query('SELECT id, email, instance_id, aud, role, email_confirmed_at FROM auth.users');
  console.table(res.rows);
  
  console.log('\n--- Auth Identities Table ---');
  const res2 = await client.query('SELECT id, user_id, provider, provider_id FROM auth.identities');
  console.table(res2.rows);

  console.log('\n--- Public Users Table ---');
  const res3 = await client.query('SELECT id, email, role FROM public.users');
  console.table(res3.rows);

  await client.end();
}

checkAuth();
