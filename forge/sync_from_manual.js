
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

async function analyzeManualUser() {
  const client = new Client({ connectionString });
  try {
    await client.connect();
    console.log('Searching for the manually created user...');
    
    // Find the user created by the dashboard (it will have a different updated_at or id)
    const res = await client.query(`
      SELECT email, instance_id, aud, role, raw_app_meta_data, raw_user_meta_data, is_sso_user
      FROM auth.users 
      ORDER BY created_at DESC 
      LIMIT 1
    `);
    
    if (res.rowCount === 0) {
      console.log('No users found in auth.users.');
    } else {
      const user = res.rows[0];
      console.log('Target User Config found:');
      console.table([user]);

      const instanceId = user.instance_id;
      
      console.log(`Applying instance_id: ${instanceId} to all other users...`);
      await client.query("UPDATE auth.users SET instance_id = $1 WHERE email != $2", [instanceId, user.email]);
      
      // Also sync aud and role just in case
      await client.query("UPDATE auth.users SET aud = $1, role = $2 WHERE email != $3", [user.aud, user.role, user.email]);
      
      console.log('Sync complete! Checking dashboard again...');
    }
    
    await client.end();
  } catch (err) {
    console.error('Error:', err.message);
  }
}

analyzeManualUser();
