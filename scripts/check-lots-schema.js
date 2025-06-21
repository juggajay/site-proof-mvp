const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkLotsSchema() {
  console.log('Checking lots table schema...\n')

  try {
    // Get a sample lot to see the actual structure
    const { data: lots, error } = await supabase
      .from('lots')
      .select('*')
      .limit(1)
    
    if (error) {
      console.error('Error fetching lots:', error)
      return
    }

    if (lots && lots.length > 0) {
      console.log('Sample lot record:')
      console.log(JSON.stringify(lots[0], null, 2))
      console.log('\nActual columns in lots table:')
      console.log(Object.keys(lots[0]))
      
      console.log('\nColumn types:')
      Object.entries(lots[0]).forEach(([key, value]) => {
        console.log(`  ${key}: ${typeof value} (value: ${JSON.stringify(value)})`)
      })
    } else {
      console.log('No lots found in database')
    }

    // Try to query specifically for itp_template_id
    console.log('\n\nTesting itp_template_id column...')
    const { data: lotsWithItp, error: itpError } = await supabase
      .from('lots')
      .select('id, lot_number, itp_template_id')
      .limit(1)
    
    if (itpError) {
      console.error('Error querying itp_template_id:', itpError)
    } else {
      console.log('Query with itp_template_id successful:')
      console.log(JSON.stringify(lotsWithItp, null, 2))
    }

    // Check if we can update itp_id (actual field in database)
    console.log('\n\nTesting itp_id update...')
    const testLotId = lots?.[0]?.id
    if (testLotId) {
      const { error: updateError } = await supabase
        .from('lots')
        .update({ itp_id: null })
        .eq('id', testLotId)
      
      if (updateError) {
        console.error('Error updating itp_id:', updateError)
      } else {
        console.log('✅ Successfully updated itp_id (set to null)')
      }
    }

  } catch (error) {
    console.error('Unexpected error:', error)
  }
}

checkLotsSchema()