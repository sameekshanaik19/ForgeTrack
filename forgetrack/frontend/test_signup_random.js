
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

async function signUpRandom() {
  const email = `user_${Math.floor(Math.random() * 1000000)}@theboringpeople.in`;
  const password = 'Password123!';

  console.log(`Signing up ${email}...`);
  const { data, error } = await supabase.auth.signUp({
    email,
    password
  });

  if (error) {
    console.error('Sign up error:', error.message);
  } else {
    console.log('Sign up successful! User ID:', data.user.id);
  }
}

signUpRandom();
