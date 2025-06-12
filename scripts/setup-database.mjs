import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

async function setupDatabase() {
  // Read environment variables from .env.local
  const envPath = path.join(process.cwd(), '.env.local')
  let envContent = ''
  
  try {
    envContent = fs.readFileSync(envPath, 'utf8')
  } catch (error) {
    console.error('❌ Could not read .env.local file')
    process.exit(1)
  }

  // Parse environment variables
  const envVars = {}
  envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=')
    if (key && value) {
      envVars[key.trim()] = value.trim()
    }
  })

  const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase environment variables')
    console.log('Required: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY')
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, supabaseKey)

  console.log('🔧 Setting up database schema and triggers...')

  try {
    // Test connection first
    const { data, error } = await supabase.from('profiles').select('count').limit(1)
    
    if (error && error.code === 'PGRST116') {
      console.log('📋 Profiles table does not exist. Please run this SQL in your Supabase SQL Editor:')
      console.log('\n' + fs.readFileSync('./database-fix-simple.sql', 'utf8'))
      return
    }

    // Try to create a test profile to see if the trigger works
    console.log('🧪 Testing current setup...')
    
    // Check if we can access the profiles table
    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .limit(1)

    if (profilesError) {
      console.log('⚠️  Cannot access profiles table. Manual setup required.')
      console.log('📋 Please run this SQL in your Supabase SQL Editor:')
      console.log('\n' + fs.readFileSync('./database-fix-simple.sql', 'utf8'))
      return
    }

    console.log('✅ Database connection successful!')
    console.log('📋 To complete the setup, please run this SQL in your Supabase SQL Editor:')
    console.log('\n' + fs.readFileSync('./database-fix-simple.sql', 'utf8'))
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message)
    console.log('\n📋 Manual Setup Required:')
    console.log('Please run the following SQL in your Supabase SQL Editor:')
    console.log('\n' + fs.readFileSync('./database-fix-simple.sql', 'utf8'))
  }
}

setupDatabase()