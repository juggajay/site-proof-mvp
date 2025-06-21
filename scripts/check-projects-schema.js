const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkProjectsSchema() {
  console.log('Checking projects table schema...\n')

  try {
    // Get a sample project to see columns
    const { data: project, error } = await supabase
      .from('projects')
      .select('*')
      .limit(1)
      .single()

    if (!error && project) {
      console.log('Projects table columns:', Object.keys(project))
      console.log('\nSample project:')
      console.log(JSON.stringify(project, null, 2))
    } else {
      console.log('Error getting project:', error)
    }

    // Try to create a minimal project
    console.log('\nTesting minimal project creation...')
    const { data: newProject, error: createError } = await supabase
      .from('projects')
      .insert({
        name: 'Test Project ' + Date.now(),
        organization_id: '550e8400-e29b-41d4-a716-446655440001'
      })
      .select()
      .single()

    if (createError) {
      console.log('Create error:', createError)
    } else {
      console.log('✅ Successfully created project:', newProject)
      
      // Clean up
      await supabase.from('projects').delete().eq('id', newProject.id)
      console.log('Cleaned up test project')
    }

  } catch (error) {
    console.error('Error:', error)
  }

  process.exit(0)
}

checkProjectsSchema()