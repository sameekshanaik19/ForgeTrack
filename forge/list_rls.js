
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

async function listRLS() {
  const client = new Client({ connectionString: env.DATABASE_URL });
  await client.connect();
  
  console.log('--- RLS Policies for students ---');
  const res = await client.query(`
    SELECT * FROM pg_policies WHERE tablename = 'students'
  `);
  console.table(res.rows);

  console.log('\n--- RLS Policies for users ---');
  const res2 = await client.query(`
    SELECT * FROM pg_policies WHERE tablename = 'users'
  `);
  console.table(res2.rows);

  await client.end();
}

listRLS();
