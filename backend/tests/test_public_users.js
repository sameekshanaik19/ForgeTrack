
import { createClient } from '@supabase/supabase-js';
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

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testPublicUsers() {
  console.log('Testing query on public.users...');
  try {
    const { data, error } = await supabase.from('users').select('*');
    if (error) {
      console.error('Error querying public.users:', error.message);
      console.error('Full error:', JSON.stringify(error, null, 2));
    } else {
      console.log('Public users data:', data);
    }
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

testPublicUsers();
