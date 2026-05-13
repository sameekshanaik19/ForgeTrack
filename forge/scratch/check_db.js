import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY; // Using anon key for simple count check

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkCounts() {
  const tables = ['students', 'sessions', 'attendance', 'materials', 'import_log'];
  
  console.log('Database Counts:');
  for (const table of tables) {
    const { count, error } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      console.error(`Error checking ${table}:`, error.message);
    } else {
      console.log(`${table}: ${count}`);
    }
  }

  // Check users count
  const { count: userCount, error: userError } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true });
  
  if (userError) {
    console.error(`Error checking users:`, userError.message);
  } else {
    console.log(`public.users: ${userCount}`);
  }
}

checkCounts();
