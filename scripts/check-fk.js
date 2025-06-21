const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkFK() {
  console.log('Checking foreign key issue...')

  try {
    // Check if the ITP template exists
    const { data: template, error: templateError } = await supabase
      .from('itp_templates')
      .select('*')
      .eq('id', '7fd887dd-a451-41f3-bebc-0b0bc37b4425')
      .single()

    console.log('ITP Template exists:', !!template)
    console.log('Template error:', templateError)

    // Check lot
    const { data: lot, error: lotError } = await supabase
      .from('lots')
      .select('*')
      .eq('id', 'a00febf8-28bb-4932-80f2-3f9312a1bc90')
      .single()

    console.log('Lot exists:', !!lot)
    console.log('Lot error:', lotError)

    // Check what ITP IDs are in the lots table
    const { data: lotsWithITP } = await supabase
      .from('lots')
      .select('id, itp_id')
      .not('itp_id', 'is', null)
      .limit(5)

    console.log('Lots with ITP:', lotsWithITP)

  } catch (error) {
    console.error('Error:', error)
  }

  process.exit(0)
}

checkFK()