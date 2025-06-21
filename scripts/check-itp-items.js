const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkITPItems() {
  console.log('Checking ITP items...\n')

  try {
    // Check if itp_items references itps or itp_templates
    const { data: items, error: itemsError } = await supabase
      .from('itp_items')
      .select('*')
      .limit(5)

    if (!itemsError) {
      console.log('✅ ITP items exist')
      console.log('Sample item columns:', items[0] ? Object.keys(items[0]) : 'No items')
      console.log('First item:', items[0])
      
      // Check which ITP IDs are referenced
      if (items.length > 0) {
        const itpId = items[0].itp_template_id || items[0].itp_id
        console.log('\nChecking if item references itps or itp_templates...')
        console.log('ITP ID from item:', itpId)
        
        // Check in itps table
        const { data: itp } = await supabase
          .from('itps')
          .select('id, name')
          .eq('id', itpId)
          .single()
          
        if (itp) {
          console.log('✅ Found in itps table:', itp.name)
        }
        
        // Check in itp_templates table
        const { data: template } = await supabase
          .from('itp_templates')
          .select('id, name')
          .eq('id', itpId)
          .single()
          
        if (template) {
          console.log('✅ Found in itp_templates table:', template.name)
        }
      }
    } else {
      console.log('❌ Error accessing itp_items:', itemsError.message)
    }

    // Get all itps
    console.log('\n--- All ITPs in itps table ---')
    const { data: allItps } = await supabase
      .from('itps')
      .select('id, name, category')
      .order('name')

    console.log(`Found ${allItps?.length || 0} ITPs:`)
    allItps?.forEach(itp => {
      console.log(`- ${itp.name} (${itp.category}) - ID: ${itp.id}`)
    })

    // Count items per ITP
    console.log('\n--- Items per ITP ---')
    for (const itp of allItps || []) {
      const { count } = await supabase
        .from('itp_items')
        .select('*', { count: 'exact', head: true })
        .eq('itp_template_id', itp.id)

      console.log(`${itp.name}: ${count} items`)
    }

  } catch (error) {
    console.error('Error:', error)
  }

  process.exit(0)
}

checkITPItems()