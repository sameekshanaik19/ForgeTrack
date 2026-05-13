
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
    console.log('Testing trigger by deleting and re-inserting one student...');

    // Delete student and its cascading users
    // Wait, cascaded deletes might not work if not set up.
    // I'll delete manually.
    const usn = '4SH24CS001';
    
    console.log(`Cleaning up ${usn}...`);
    const userRes = await client.query("SELECT id FROM public.users WHERE email = $1", [`${usn.toLowerCase()}@forge.local`]);
    if (userRes.rowCount > 0) {
      const userId = userRes.rows[0].id;
      await client.query("DELETE FROM auth.identities WHERE user_id = $1", [userId]);
      await client.query("DELETE FROM public.users WHERE id = $1", [userId]);
      await client.query("DELETE FROM auth.users WHERE id = $1", [userId]);
    }
    await client.query("DELETE FROM students WHERE usn = $1", [usn]);

    console.log('Inserting student to trigger auto-creation...');
    await client.query("INSERT INTO students (name, usn, branch_code) VALUES ('Aarav Patel', '4SH24CS001', 'AI')");

    console.log('Checking created user and identity...');
    const newUser = await client.query("SELECT id, email, instance_id FROM auth.users WHERE email = $1", [`${usn.toLowerCase()}@forge.local`]);
    console.table(newUser.rows);

    const newIdentity = await client.query("SELECT id, user_id, provider_id FROM auth.identities WHERE user_id = $1", [newUser.rows[0].id]);
    console.table(newIdentity.rows);

    await client.end();
  } catch (err) {
    console.error('Trigger test failed:', err.message);
  }
}

testTrigger();
