
import pkg from 'pg';
const { Client } = pkg;
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

async function nuclearFix() {
  const client = new Client({ connectionString });
  try {
    await client.connect();
    console.log('CONNECTED TO DATABASE. RUNNING NUCLEAR FIX...');

    const query = `
      -- 1. KILL ALL TRIGGERS AND CONSTRAINTS
      DROP TRIGGER IF EXISTS tr_check_future_attendance ON public.attendance;
      DROP TRIGGER IF EXISTS check_future_attendance_trigger ON public.attendance;
      ALTER TABLE public.attendance DROP CONSTRAINT IF EXISTS attendance_date_check;
      ALTER TABLE public.sessions DROP CONSTRAINT IF EXISTS sessions_date_check;
      ALTER TABLE public.sessions DROP CONSTRAINT IF EXISTS sessions_date_future_check;

      -- 2. ACTIVATE ALL STUDENTS
      UPDATE public.students SET is_active = true;

      -- 3. DISABLE RLS
      ALTER TABLE public.attendance DISABLE ROW LEVEL SECURITY;
      ALTER TABLE public.sessions DISABLE ROW LEVEL SECURITY;
      ALTER TABLE public.students DISABLE ROW LEVEL SECURITY;

      -- 4. CLEAN UP SESSIONS (Prepare for fresh import)
      TRUNCATE public.attendance CASCADE;
      TRUNCATE public.sessions CASCADE;
    `;

    await client.query(query);
    console.log('SUCCESS: DATABASE IS NOW CLEAN AND OPEN FOR IMPORT.');

    await client.end();
  } catch (err) {
    console.error('ERROR:', err.message);
  }
}

nuclearFix();
