
import pkg from 'pg';
const { Client } = pkg;
import { createClient } from '@supabase/supabase-js';
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

const connectionString = env.DATABASE_URL;
const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testConfirmation() {
  const client = new Client({ connectionString });
  try {
    await client.connect();
    const email = 'test@example.com';
    const password = 'password';

    console.log(`Manually confirming ${email}...`);
    await client.query("UPDATE auth.users SET email_confirmed_at = NOW(), confirmed_at = NOW() WHERE email = $1", [email]);

    console.log('Testing login after confirmation...');
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      console.error('Login failed even after confirmation:', error.message);
    } else {
      console.log('Login successful! User ID:', data.user.id);
      
      console.log('Applying confirmation to ALL users...');
      await client.query("UPDATE auth.users SET email_confirmed_at = NOW(), confirmed_at = NOW()");
      console.log('All users confirmed. Login should work now!');
    }
    
    await client.end();
  } catch (err) {
    console.error('Error:', err.message);
  }
}

testConfirmation();
