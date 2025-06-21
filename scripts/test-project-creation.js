const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testProjectCreation() {
  console.log('Testing project creation...\n')

  try {
    // First check the actual table schema
    const { data: sampleProject, error: sampleError } = await supabase
      .from('projects')
      .select('*')
      .limit(1)
      .single()
    
    if (!sampleError && sampleProject) {
      console.log('Existing project columns:', Object.keys(sampleProject))
      console.log('\nSample project:')
      console.log(JSON.stringify(sampleProject, null, 2))
    } else if (sampleError && sampleError.code !== 'PGRST116') {
      console.log('Error getting sample:', sampleError)
    }

    // Create a test project with only the fields that exist
    const projectData = {
      name: 'Test Project ' + new Date().toISOString(),
      description: 'Test description',
      location: 'Test location',
      organization_id: '550e8400-e29b-41d4-a716-446655440001'
    }

    console.log('\nCreating project with data:')
    console.log(JSON.stringify(projectData, null, 2))

    const { data: newProject, error: createError } = await supabase
      .from('projects')
      .insert([projectData])
      .select()
      .single()

    if (createError) {
      console.error('\n❌ Create error:', createError)
    } else {
      console.log('\n✅ Successfully created project!')
      console.log(JSON.stringify(newProject, null, 2))
      
      // Clean up
      const { error: deleteError } = await supabase
        .from('projects')
        .delete()
        .eq('id', newProject.id)
      
      if (deleteError) {
        console.error('Failed to clean up:', deleteError)
      } else {
        console.log('\n🧹 Cleaned up test project')
      }
    }

  } catch (error) {
    console.error('Error:', error)
  }

  process.exit(0)
}

testProjectCreation()