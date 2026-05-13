
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

async function signUpUser() {
  const email = 'temp_test@theboringpeople.in';
  const password = 'password123';

  console.log(`Signing up ${email}...`);
  const { data, error } = await supabase.auth.signUp({
    email,
    password
  });

  if (error) {
    console.error('Sign up error:', error.message);
    return;
  }

  console.log('Sign up successful! User ID:', data.user.id);
}

signUpUser();
