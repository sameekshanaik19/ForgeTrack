import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.join(__dirname, '../frontend/.env.local') })

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '' // I might not have this

// Use anon key if service key is missing, but it might not see all users
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function checkUsers() {
  console.log('Checking public.users...')
  const { data: publicUsers, error: publicError } = await supabase
    .from('users')
    .select('*')
    .limit(5)

  if (publicError) {
    console.error('Error fetching public.users:', publicError.message)
  } else {
    console.log('Public Users:', publicUsers)
  }

  // We can't check auth.users with anon key, but we can try to sign in
  console.log('\nTesting sign in for mentor nischay@theboringpeople.in...')
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email: 'nischay@theboringpeople.in',
    password: 'password'
  })

  if (signInError) {
    console.error('Sign in failed:', signInError.message)
  } else {
    console.log('Sign in successful for mentor!')
  }

  console.log('\nTesting sign in for student 4SH24CS001...')
  // Try both formats
  const formats = ['4sh24cs001@forge.local', 'aarav.4sh24cs001@forge.local']
  for (const email of formats) {
    const { data: studentData, error: studentError } = await supabase.auth.signInWithPassword({
      email: email,
      password: '4SH24CS001'
    })
    if (studentError) {
      console.error(`Sign in failed for ${email}:`, studentError.message)
    } else {
      console.log(`Sign in successful for student ${email}!`)
    }
  }
}

checkUsers()
