const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testLotCreate() {
  console.log('Testing lot creation...')

  try {
    // First, let's check what columns the lots table has
    const { data: sampleLot, error: checkError } = await supabase
      .from('lots')
      .select('*')
      .limit(1)
      .single()

    if (sampleLot) {
      console.log('Lots table columns:', Object.keys(sampleLot))
    }

    // Try creating a lot with minimal fields
    const { data: newLot, error } = await supabase
      .from('lots')
      .insert({
        project_id: 'e262b3bc-2f16-4056-847a-fc26285d01b0',
        lot_number: 'API-TEST-' + Date.now(),
        description: 'Test lot from API',
        status: 'IN_PROGRESS'
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating lot:', error)
    } else {
      console.log('✅ Successfully created lot:', newLot)
    }

  } catch (error) {
    console.error('Error:', error)
  }

  process.exit(0)
}

testLotCreate()