const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// Create a new client with no schema caching
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  db: {
    schema: 'public'
  },
  auth: {
    persistSession: false,
    autoRefreshToken: false
  },
  global: {
    headers: {
      'x-no-cache': '1'
    }
  }
})

async function testSupabaseDirect() {
  console.log('Testing direct Supabase project creation...\n')

  try {
    // Test with RPC to bypass any caching
    console.log('Testing with raw SQL via RPC...')
    
    const projectName = 'Direct SQL Test ' + Date.now()
    const query = `
      INSERT INTO projects (name, description, location, organization_id)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `
    
    const { data: rpcResult, error: rpcError } = await supabase.rpc('execute_project_insert', {
      project_name: projectName,
      project_desc: 'Test description',
      project_loc: 'Test location',
      org_id: '550e8400-e29b-41d4-a716-446655440001'
    }).single()
    
    if (rpcError) {
      console.log('RPC approach failed (expected if function doesn\'t exist):', rpcError.message)
      
      // Try direct insert with fresh client
      console.log('\nTrying direct insert with fresh client...')
      
      const freshSupabase = createClient(supabaseUrl, supabaseServiceKey, {
        db: { schema: 'public' },
        auth: { persistSession: false }
      })
      
      const { data: direct, error: directError } = await freshSupabase
        .from('projects')
        .insert({
          name: projectName,
          description: 'Test description',
          location: 'Test location',
          organization_id: '550e8400-e29b-41d4-a716-446655440001'
        })
        .select()
        .single()
      
      if (directError) {
        console.error('❌ Direct insert also failed:', directError.message)
      } else {
        console.log('✅ Direct insert succeeded:', direct.id)
        await freshSupabase.from('projects').delete().eq('id', direct.id)
      }
    } else {
      console.log('✅ RPC insert succeeded:', rpcResult)
    }

  } catch (error) {
    console.error('Error:', error)
  }

  process.exit(0)
}

testSupabaseDirect()