
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Load env from .env.local
const envPath = path.resolve(process.cwd(), '.env.local');
let envContent = '';
try {
  envContent = fs.readFileSync(envPath, 'utf8');
} catch (e) {
  try {
    envContent = fs.readFileSync(path.resolve(process.cwd(), 'frontend', '.env.local'), 'utf8');
  } catch (e2) {
    console.error('❌ Could not find .env.local');
    process.exit(1);
  }
}

const env = {};
envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length > 0) {
    env[key.trim()] = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
  }
});

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function signupMentor() {
  console.log('🚀 Attempting to SIGN UP mentor via public API...');
  
  const email = 'nischay@theboringpeople.in';
  const password = 'Password123!'; // More complex password

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    if (error.message.includes('already registered')) {
      console.log('ℹ️ User already exists. This is good.');
      console.log('🧪 Testing login with "password"...');
      const { error: loginError } = await supabase.auth.signInWithPassword({ email, password: 'password' });
      if (loginError) console.log('❌ Login failed with "password":', loginError.message);
      else console.log('✅ Login SUCCEEDED with "password"!');
    } else {
      console.error('❌ Signup failed:', error.message);
    }
  } else {
    console.log('✅ Signup successful! User created correctly by Supabase.');
    console.log('User ID:', data.user.id);
  }
}

signupMentor();
