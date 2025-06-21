const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkForeignKeyIssue() {
  console.log('Checking ITP foreign key issue...\n')

  try {
    // Get all ITP templates
    const { data: templates, error: templatesError } = await supabase
      .from('itp_templates')
      .select('id, name')
      .order('name')
    
    if (templatesError) {
      console.error('Error fetching itp_templates:', templatesError)
      return
    }
    
    console.log(`Found ${templates?.length || 0} ITP templates`)
    console.log('ITP template IDs:', templates?.map(t => t.id))
    
    // Check a specific ITP that might be causing issues
    const problematicId = '8b5c78e1-9fe5-4c25-bb10-278e11d28c27' // Asphalt Layer Quality Check
    
    const { data: specific, error: specificError } = await supabase
      .from('itp_templates')
      .select('*')
      .eq('id', problematicId)
      .single()
    
    if (specificError) {
      console.log('\n❌ Asphalt Layer Quality Check NOT found in itp_templates')
      console.log('Error:', specificError)
    } else {
      console.log('\n✅ Asphalt Layer Quality Check found:', specific)
    }
    
    // Check the lots table foreign key constraint
    console.log('\n\nChecking lots table constraint...')
    const { data: constraint, error: constraintError } = await supabase
      .rpc('get_table_constraints', {
        table_name: 'lots'
      })
      .catch(() => null)
    
    // Try a test update to see the exact error
    console.log('\n\nTesting ITP assignment...')
    const testLotId = '1e250900-a9ab-472b-95ba-464dd8c756cd'
    
    const { error: updateError } = await supabase
      .from('lots')
      .update({ 
        itp_id: problematicId,
        updated_at: new Date().toISOString()
      })
      .eq('id', testLotId)
    
    if (updateError) {
      console.log('❌ Update failed:', updateError)
      console.log('Error code:', updateError.code)
      console.log('Error details:', updateError.details)
      console.log('Error hint:', updateError.hint)
    } else {
      console.log('✅ Update successful!')
    }
    
  } catch (error) {
    console.error('Unexpected error:', error)
  }
}

checkForeignKeyIssue()