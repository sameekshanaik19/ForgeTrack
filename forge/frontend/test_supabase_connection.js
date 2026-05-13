
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Manual env parsing to avoid dependency on dotenv if not in frontend
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

console.log('Testing connection to:', supabaseUrl);

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testConnection() {
  try {
    console.log('Attempting to query students table...');
    const { data, error } = await supabase.from('students').select('*').limit(1);
    if (error) {
      console.error('Error querying students table:', error.message);
      console.error('Full error object:', JSON.stringify(error, null, 2));
    } else {
      console.log('Successfully connected to students table. Data:', data);
    }

    console.log('Attempting to check auth session...');
    const { data: authData, error: authError } = await supabase.auth.getSession();
    if (authError) {
      console.error('Error checking auth session:', authError.message);
    } else {
      console.log('Auth service is responsive.');
    }
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

testConnection();
