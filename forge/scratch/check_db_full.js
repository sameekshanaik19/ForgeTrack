const { Client } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../frontend/.env.local') });

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function checkDB() {
  try {
    await client.connect();
    console.log('Connected to database.');

    console.log('\n--- Mentors in public.users ---');
    const mentors = await client.query("SELECT id, email, role, display_name FROM public.users WHERE role = 'mentor'");
    console.table(mentors.rows);

    console.log('\n--- Students in students table (first 5) ---');
    const students = await client.query("SELECT id, name, usn, email FROM students LIMIT 5");
    console.table(students.rows);

    console.log('\n--- Auth users matching mentors ---');
    const authMentors = await client.query("SELECT id, email FROM auth.users WHERE email IN (SELECT email FROM public.users WHERE role = 'mentor')");
    console.table(authMentors.rows);

    console.log('\n--- Auth users for students (first 5) ---');
    const authStudents = await client.query("SELECT id, email FROM auth.users WHERE email LIKE '%@forge.local' LIMIT 5");
    console.table(authStudents.rows);

  } catch (err) {
    console.error('Database query error:', err.stack);
  } finally {
    await client.end();
  }
}

checkDB();
