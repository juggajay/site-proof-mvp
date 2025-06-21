const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkConformance() {
  console.log('Checking conformance records...\n')

  try {
    // Check conformance_records table
    console.log('=== CONFORMANCE_RECORDS TABLE ===')
    const { data: sample, error: sampleError } = await supabase
      .from('conformance_records')
      .select('*')
      .limit(1)
      .single()
    
    if (!sampleError && sample) {
      console.log('Table columns:', Object.keys(sample))
      console.log('\nSample record:')
      console.log(JSON.stringify(sample, null, 2))
    } else if (sampleError && sampleError.code !== 'PGRST116') {
      console.log('Error:', sampleError)
    } else {
      console.log('No records found in table')
      
      // Try to get table structure
      const { data: emptySelect, error: structureError } = await supabase
        .from('conformance_records')
        .select('*')
        .limit(0)
      
      if (!structureError) {
        console.log('Table exists but is empty')
      } else {
        console.log('Table might not exist:', structureError.message)
      }
    }

    // Count records
    const { count, error: countError } = await supabase
      .from('conformance_records')
      .select('*', { count: 'exact', head: true })
    
    if (!countError) {
      console.log(`\nTotal conformance records: ${count}`)
    }

    // Check records by status
    const { data: passRecords } = await supabase
      .from('conformance_records')
      .select('id')
      .eq('result_pass_fail', 'PASS')
    
    const { data: failRecords } = await supabase
      .from('conformance_records')
      .select('id')
      .eq('result_pass_fail', 'FAIL')
    
    console.log(`\nRecords by status:`)
    console.log(`- PASS: ${passRecords?.length || 0}`)
    console.log(`- FAIL: ${failRecords?.length || 0}`)

    // Test creating a conformance record
    console.log('\nTesting conformance record creation...')
    
    // Get a lot with an ITP
    const { data: lotWithItp } = await supabase
      .from('lots')
      .select('id, lot_number, itp_id')
      .not('itp_id', 'is', null)
      .limit(1)
      .single()
    
    if (lotWithItp) {
      console.log(`Found lot ${lotWithItp.lot_number} with ITP ${lotWithItp.itp_id}`)
      
      // Get an ITP item
      const { data: itpItem } = await supabase
        .from('itp_items')
        .select('id, item_number, description')
        .eq('itp_id', lotWithItp.itp_id)
        .limit(1)
        .single()
      
      if (itpItem) {
        console.log(`Found ITP item: ${itpItem.item_number}`)
        
        // Try to create a test record
        const testRecord = {
          lot_id: lotWithItp.id,
          itp_item_id: itpItem.id,
          result_pass_fail: 'PASS',
          comments: 'Test record created by script',
          is_non_conformance: false,
          inspector_id: 1,
          inspection_date: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
        
        const { data: newRecord, error: createError } = await supabase
          .from('conformance_records')
          .insert(testRecord)
          .select()
          .single()
        
        if (createError) {
          console.log('Create error:', createError)
        } else {
          console.log('✅ Test record created successfully!')
          console.log('Record ID:', newRecord.id)
          
          // Clean up
          await supabase
            .from('conformance_records')
            .delete()
            .eq('id', newRecord.id)
          console.log('Cleaned up test record')
        }
      }
    }

  } catch (error) {
    console.error('Error:', error)
  }

  process.exit(0)
}

checkConformance()