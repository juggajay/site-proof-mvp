const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testLotView() {
  console.log('Testing lot view with ITP...\n')

  try {
    // Get a lot that has an ITP assigned
    const { data: lotWithITP } = await supabase
      .from('lots')
      .select(`
        *,
        project:projects(*),
        itp:itps(*)
      `)
      .not('itp_id', 'is', null)
      .limit(1)
      .single()

    console.log('Lot:', lotWithITP.lot_number)
    console.log('Project:', lotWithITP.project?.name)
    console.log('ITP:', lotWithITP.itp?.name)

    // Get ITP items
    if (lotWithITP.itp_id) {
      const { data: items } = await supabase
        .from('itp_items')
        .select('*')
        .eq('itp_id', lotWithITP.itp_id)
        .order('sort_order')

      console.log(`\nITP Items (${items?.length || 0}):`);
      items?.forEach(item => {
        console.log(`- ${item.item_number}: ${item.description}`)
      })
    }

  } catch (error) {
    console.error('Error:', error)
  }

  process.exit(0)
}

testLotView()