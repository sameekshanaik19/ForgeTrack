
import { createClient } from '@supabase/supabase-js';
import pkg from 'pg';
const { Client: PostgresClient } = pkg;
import fs from 'fs';
import path from 'path';

const envPath = path.resolve(process.cwd(), '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) {
    env[key.trim()] = value.trim().replace(/^["']|["']$/g, '');
  }
});

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY;
const connectionString = env.DATABASE_URL;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testInstanceId() {
  const email = 'nischay@theboringpeople.in';
  const password = 'password';

  const pgClient = new PostgresClient({ connectionString });
  await pgClient.connect();

  console.log('Testing login with instance_id = NULL...');
  await pgClient.query("UPDATE auth.users SET instance_id = NULL WHERE email = $1", [email]);
  const { data: dataNull, error: errorNull } = await supabase.auth.signInWithPassword({ email, password });
  if (errorNull) console.log('NULL failed:', errorNull.message);
  else console.log('NULL succeeded!');

  console.log('\nTesting login with instance_id = zeros...');
  await pgClient.query("UPDATE auth.users SET instance_id = '00000000-0000-0000-0000-000000000000' WHERE email = $1", [email]);
  const { data: dataZeros, error: errorZeros } = await supabase.auth.signInWithPassword({ email, password });
  if (errorZeros) console.log('Zeros failed:', errorZeros.message);
  else console.log('Zeros succeeded!');

  await pgClient.end();
}

testInstanceId();
