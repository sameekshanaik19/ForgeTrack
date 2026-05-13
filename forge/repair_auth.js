
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

async function repairAuth() {
  const client = new Client({ connectionString });
  try {
    await client.connect();
    console.log('Beginning Auth Repair...');

    console.log('Setting instance_id to NULL...');
    await client.query("UPDATE auth.users SET instance_id = NULL");

    console.log('Adding missing identities...');
    const users = await client.query("SELECT id, email FROM auth.users");
    
    for (const user of users.rows) {
      const identityRes = await client.query("SELECT id FROM auth.identities WHERE user_id = $1", [user.id]);
      if (identityRes.rowCount === 0) {
        console.log(`Adding identity for ${user.email}...`);
        await client.query(`
          INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
          VALUES (gen_random_uuid(), $1, $2, $3, $4, NOW(), NOW(), NOW())
        `, [user.id, JSON.stringify({ sub: user.id, email: user.email }), 'email', user.id]);
      }
    }

    console.log('Auth Repair Complete!');
    await client.end();
  } catch (err) {
    console.error('Repair failed:', err.message);
  }
}

repairAuth();
