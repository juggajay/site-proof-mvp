const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  db: {
    schema: 'public'
  },
  auth: {
    persistSession: false
  }
})

async function refreshSchemaCache() {
  console.log('Refreshing Supabase schema cache...\n')

  try {
    // Query to get the actual columns in the projects table
    const { data: columns, error: columnsError } = await supabase
      .rpc('get_table_columns', { table_name: 'projects' })
      .single()

    if (columnsError) {
      // Try a simpler approach
      console.log('RPC failed, trying direct query...')
      
      // Get a sample project to see actual columns
      const { data: sampleProject, error: sampleError } = await supabase
        .from('projects')
        .select('*')
        .limit(1)
        .single()

      if (!sampleError && sampleProject) {
        console.log('Actual columns in projects table:')
        console.log(Object.keys(sampleProject))
        console.log('\nColumn types:')
        Object.entries(sampleProject).forEach(([key, value]) => {
          console.log(`  ${key}: ${typeof value} (sample: ${JSON.stringify(value)})`)
        })
      } else if (sampleError) {
        console.log('Sample query error:', sampleError)
      }

      // Try inserting a test project with minimal fields
      console.log('\nTesting minimal project insert...')
      const testData = {
        name: 'Schema Test ' + Date.now(),
        organization_id: '550e8400-e29b-41d4-a716-446655440001'
      }
      
      const { data: testProject, error: testError } = await supabase
        .from('projects')
        .insert(testData)
        .select()
        .single()

      if (testError) {
        console.log('Test insert error:', testError)
        console.log('Error details:', JSON.stringify(testError, null, 2))
      } else {
        console.log('✅ Test insert successful!')
        console.log('Created project:', testProject)
        
        // Clean up
        await supabase.from('projects').delete().eq('id', testProject.id)
        console.log('Cleaned up test project')
      }
    } else {
      console.log('Table columns:', columns)
    }

    // Force a schema reload by making a query with explicit column selection
    console.log('\nForcing schema reload...')
    const { data, error } = await supabase
      .from('projects')
      .select('id, name, description, location, organization_id, created_at, updated_at')
      .limit(1)

    if (error) {
      console.log('Schema reload error:', error)
    } else {
      console.log('✅ Schema reload successful')
    }

  } catch (error) {
    console.error('Error:', error)
  }

  process.exit(0)
}

refreshSchemaCache()