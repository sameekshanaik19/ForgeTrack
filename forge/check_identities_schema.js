
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

async function checkSchema() {
  const client = new Client({ connectionString });
  try {
    await client.connect();
    const res = await client.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_schema = 'auth' AND table_name = 'identities'
    `);
    console.table(res.rows);
    await client.end();
  } catch (err) {
    console.error('Error:', err.message);
  }
}

checkSchema();
