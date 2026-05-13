
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

async function testSignIn() {
  console.log('Testing sign in with nischay@theboringpeople.in...');
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'nischay@theboringpeople.in',
      password: 'password'
    });

    if (error) {
      console.error('Sign in error:', error.message);
      console.error('Full error object:', JSON.stringify(error, null, 2));
    } else {
      console.log('Sign in successful! User ID:', data.user.id);
    }
  } catch (err) {
    console.error('Unexpected error during sign in:', err);
  }
}

testSignIn();
