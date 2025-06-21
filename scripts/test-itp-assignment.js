const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testITPAssignment() {
  console.log('Testing ITP assignment...\n')

  try {
    // Get the constraint definition
    console.log('Checking constraint definition...')
    
    // Skip constraint check as we can't access system tables directly
    const constraintDef = null
    
    if (constraintDef) {
      console.log('Constraint found:', constraintDef)
    } else {
      console.log('Could not retrieve constraint definition')
    }
    
    // Check if the constraint references 'itps' table instead of 'itp_templates'
    console.log('\nChecking if itps table exists...')
    const { data: itps, error: itpsError } = await supabase
      .from('itps')
      .select('id, name')
      .limit(10)
    
    if (!itpsError && itps) {
      console.log(`Found ${itps.length} records in 'itps' table`)
      console.log('ITP samples in itps table:', itps.map(i => ({ id: i.id, name: i.name })))
      
      // Check if our specific ID exists in itps table
      const { data: specificItp } = await supabase
        .from('itps')
        .select('*')
        .eq('id', '7fd887dd-a451-41f3-bebc-0b0bc37b4425')
        .single()
      
      if (specificItp) {
        console.log('✅ Found our specific ITP in itps table:', specificItp.name)
      } else {
        console.log('❌ Our specific ITP NOT found in itps table')
      }
    } else {
      console.log('❌ No itps table or error:', itpsError?.message)
    }
    
    // Check itp_templates table
    console.log('\nChecking itp_templates table...')
    const { data: templates, error: templatesError } = await supabase
      .from('itp_templates')
      .select('id, name')
      .limit(10)
    
    if (!templatesError && templates) {
      console.log(`Found ${templates.length} records in 'itp_templates' table`)
      console.log('ITP samples in itp_templates table:', templates.map(t => ({ id: t.id, name: t.name })))
      
      // Check if our specific ID exists in itp_templates table
      const { data: specificTemplate } = await supabase
        .from('itp_templates')
        .select('*')
        .eq('id', '7fd887dd-a451-41f3-bebc-0b0bc37b4425')
        .single()
      
      if (specificTemplate) {
        console.log('✅ Found our specific ITP in itp_templates table:', specificTemplate.name)
      } else {
        console.log('❌ Our specific ITP NOT found in itp_templates table')
      }
    } else {
      console.log('❌ No itp_templates table or error:', templatesError?.message)
    }
    
    // Try to find which table the constraint actually references
    console.log('\n\nTesting assignment with ITP from each table...')
    
    const testLotId = '7948e379-1753-4a50-a647-2923e2b63dfe'
    const testItpId = '7fd887dd-a451-41f3-bebc-0b0bc37b4425'
    
    // First, check current value
    const { data: currentLot } = await supabase
      .from('lots')
      .select('id, lot_number, itp_id')
      .eq('id', testLotId)
      .single()
    
    console.log('\nCurrent lot state:', currentLot)
    
    // Try update
    console.log('\nTrying to update lot with ITP ID:', testItpId)
    const { data: updated, error: updateError } = await supabase
      .from('lots')
      .update({ 
        itp_id: testItpId,
        updated_at: new Date().toISOString()
      })
      .eq('id', testLotId)
      .select()
      .single()
    
    if (updateError) {
      console.log('\n❌ Update failed!')
      console.log('Error code:', updateError.code)
      console.log('Error message:', updateError.message)
      console.log('Error details:', updateError.details)
      console.log('Error hint:', updateError.hint)
      
      // Check if the ITP exists in itps table
      const { data: itpInItps } = await supabase
        .from('itps')
        .select('*')
        .eq('id', testItpId)
        .single()
      
      if (itpInItps) {
        console.log('\n⚠️  This ITP exists in the itps table:', itpInItps.name)
        console.log('The foreign key constraint might be pointing to the itps table instead of itp_templates!')
      }
    } else {
      console.log('\n✅ Update successful!')
      console.log('Updated lot:', updated)
    }
    
  } catch (error) {
    console.error('Unexpected error:', error)
  }
}

testITPAssignment()