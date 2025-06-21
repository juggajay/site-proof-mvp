const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testConstraint() {
  console.log('Checking ITP table constraints...\n')

  try {
    // First, let's see what an existing ITP looks like
    const { data: existingItp, error: fetchError } = await supabase
      .from('itps')
      .select('*')
      .limit(1)
      .single()

    if (!fetchError && existingItp) {
      console.log('Existing ITP sample:')
      console.log('- complexity:', existingItp.complexity)
      console.log('- All fields:', JSON.stringify(existingItp, null, 2))
    }

    // Try to insert with explicit complexity
    console.log('\nTrying to create ITP with explicit complexity...')
    
    const { data: template } = await supabase
      .from('itp_templates')
      .select('*')
      .limit(1)
      .single()

    const testData = {
      name: 'Test ITP Direct Insert',
      description: 'Testing constraint',
      template_id: template.id,
      project_id: null,
      lot_id: null,
      status: 'Draft',
      category: template.category || 'general',
      complexity: 'Medium', // Explicitly set complexity
      organization_id: template.organization_id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    console.log('Attempting insert with:', JSON.stringify(testData, null, 2))

    const { data: newItp, error: insertError } = await supabase
      .from('itps')
      .insert(testData)
      .select()
      .single()

    if (insertError) {
      console.log('❌ Insert failed:', insertError.message)
      console.log('Error details:', insertError)
    } else {
      console.log('✅ Insert successful:', newItp.id)
      
      // Clean up test data
      await supabase.from('itps').delete().eq('id', newItp.id)
    }

    // Check the function exists by trying to get template items
    console.log('\nChecking if template has items...')
    const { data: templateItems, error: itemsError } = await supabase
      .from('itp_template_items')
      .select('*')
      .eq('template_id', template.id)

    if (!itemsError) {
      console.log('Template has', templateItems?.length || 0, 'items')
    } else {
      console.log('Error fetching template items:', itemsError.message)
    }

  } catch (error) {
    console.error('Error:', error)
  }

  process.exit(0)
}

testConstraint()