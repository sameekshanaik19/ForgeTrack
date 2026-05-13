
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

async function testSimpleSignIn() {
  const email = `4sh24cs999@forge.local`;
  const password = 'test';

  console.log(`Testing student sign in for ${email} with password ${password}...`);
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      console.error('Sign in error:', error.message);
    } else {
      console.log('Sign in successful! Student ID:', data.user.id);
    }
  } catch (err) {
    console.error('Unexpected error during sign in:', err);
  }
}

testSimpleSignIn();
