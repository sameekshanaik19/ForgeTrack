
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const envPath = path.resolve(process.cwd(), '.env.local');
let envContent = '';
try { envContent = fs.readFileSync(envPath, 'utf8'); } catch (e) {
  try { envContent = fs.readFileSync(path.resolve(process.cwd(), 'frontend', '.env.local'), 'utf8'); } catch (e2) {
    console.error('❌ Could not find .env.local'); process.exit(1);
  }
}

const env = {};
envContent.split('\n').forEach(line => {
  const [key, ...val] = line.split('=');
  if (key && val.length) env[key.trim()] = val.join('=').trim().replace(/^["']|["']$/g, '');
});

async function listTriggers() {
  const client = new Client({ connectionString: env.DATABASE_URL });
  await client.connect();
  
  console.log('--- Triggers in Auth Schema ---');
  const res = await client.query(`
    SELECT trigger_name, event_manipulation, event_object_table 
    FROM information_schema.triggers 
    WHERE event_object_schema = 'auth'
  `);
  console.table(res.rows);

  console.log('\n--- Triggers in Public Schema ---');
  const res2 = await client.query(`
    SELECT trigger_name, event_manipulation, event_object_table 
    FROM information_schema.triggers 
    WHERE event_object_schema = 'public'
  `);
  console.table(res2.rows);

  await client.end();
}

listTriggers();
