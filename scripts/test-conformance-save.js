const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testConformanceSave() {
  console.log('Testing conformance record save...\n')

  try {
    // Get a lot with ITP
    const { data: lot } = await supabase
      .from('lots')
      .select('id, lot_number, itp_id')
      .not('itp_id', 'is', null)
      .limit(1)
      .single()
    
    if (!lot) {
      console.log('No lot with ITP found')
      return
    }
    
    console.log(`Using lot: ${lot.lot_number} (${lot.id})`)
    
    // Get an ITP item
    const { data: item } = await supabase
      .from('itp_items')
      .select('id, item_number, description')
      .eq('itp_id', lot.itp_id)
      .limit(1)
      .single()
    
    if (!item) {
      console.log('No ITP item found')
      return
    }
    
    console.log(`Using ITP item: ${item.item_number} - ${item.description.substring(0, 50)}...`)
    
    // Test saving a conformance record
    const testData = {
      lot_id: lot.id,
      itp_item_id: item.id,
      result: 'PASS',
      notes: 'Test conformance record created by script',
      inspector_name: 'Test Inspector',
      inspection_date: new Date().toISOString()
    }
    
    console.log('\nSaving conformance record...')
    const { data: saved, error: saveError } = await supabase
      .from('conformance_records')
      .insert(testData)
      .select()
      .single()
    
    if (saveError) {
      console.error('❌ Save error:', saveError)
    } else {
      console.log('✅ Conformance record saved successfully!')
      console.log('Record ID:', saved.id)
      console.log('Result:', saved.result)
      console.log('Notes:', saved.notes)
      
      // Update the record
      console.log('\nTesting update...')
      const { data: updated, error: updateError } = await supabase
        .from('conformance_records')
        .update({
          result: 'FAIL',
          notes: 'Updated - test failed',
          updated_at: new Date().toISOString()
        })
        .eq('id', saved.id)
        .select()
        .single()
      
      if (updateError) {
        console.error('❌ Update error:', updateError)
      } else {
        console.log('✅ Record updated successfully!')
        console.log('New result:', updated.result)
        console.log('New notes:', updated.notes)
      }
      
      // Clean up
      console.log('\nCleaning up...')
      await supabase
        .from('conformance_records')
        .delete()
        .eq('id', saved.id)
      console.log('Test record deleted')
    }

  } catch (error) {
    console.error('Error:', error)
  }

  process.exit(0)
}

testConformanceSave()