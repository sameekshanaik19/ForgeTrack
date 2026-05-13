
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

async function testTrigger() {
  const client = new Client({ connectionString });
  try {
    await client.connect();
    console.log('Testing trigger with a NEW student...');

    const usn = '4SH24CS999';
    const email = `${usn.toLowerCase()}@forge.local`;
    
    console.log('Inserting student to trigger auto-creation...');
    await client.query("INSERT INTO students (name, usn, branch_code) VALUES ('Test Student', $1, 'AI')", [usn]);

    console.log('Checking created user and identity...');
    const newUser = await client.query("SELECT id, email, instance_id FROM auth.users WHERE email = $1", [email]);
    if (newUser.rowCount === 0) {
      console.log('No user created!');
    } else {
      console.table(newUser.rows);
      const newIdentity = await client.query("SELECT id, user_id, provider_id FROM auth.identities WHERE user_id = $1", [newUser.rows[0].id]);
      console.table(newIdentity.rows);
    }

    await client.end();
  } catch (err) {
    console.error('Trigger test failed:', err.message);
  }
}

testTrigger();
