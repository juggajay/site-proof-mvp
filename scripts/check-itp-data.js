const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkITPData() {
  console.log('Checking ITP data...\n')

  try {
    // Check itps table
    console.log('=== ITPS TABLE ===')
    const { data: itps, error: itpsError } = await supabase
      .from('itps')
      .select('*')
      .order('name')
    
    if (itpsError) {
      console.error('Error fetching itps:', itpsError)
    } else {
      console.log(`Found ${itps.length} ITPs:`)
      itps.forEach(itp => {
        console.log(`- ${itp.name} (ID: ${itp.id})`)
        console.log(`  Category: ${itp.category || 'N/A'}`)
        console.log(`  Org ID: ${itp.organization_id}`)
      })
    }

    // Check itp_templates table  
    console.log('\n=== ITP_TEMPLATES TABLE ===')
    const { data: templates, error: templatesError } = await supabase
      .from('itp_templates')
      .select('*')
      .order('name')
    
    if (templatesError) {
      console.error('Error fetching itp_templates:', templatesError)
    } else {
      console.log(`Found ${templates.length} ITP templates:`)
      templates.forEach(template => {
        console.log(`- ${template.name} (ID: ${template.id})`)
        console.log(`  Category: ${template.category || 'N/A'}`)
        console.log(`  Version: ${template.version}`)
        console.log(`  Active: ${template.is_active}`)
        console.log(`  Org ID: ${template.organization_id}`)
      })
    }

    // Check itp_items table
    console.log('\n=== ITP_ITEMS TABLE ===')
    const { data: items, error: itemsError } = await supabase
      .from('itp_items')
      .select('*')
      .order('sort_order')
      .limit(10)
    
    if (itemsError) {
      console.error('Error fetching itp_items:', itemsError)
    } else {
      console.log(`Found ${items.length} ITP items (showing first 10):`)
      items.forEach(item => {
        console.log(`- ${item.item_number || 'No number'}: ${item.description.substring(0, 50)}...`)
        console.log(`  ITP ID: ${item.itp_id}`)
      })
    }

    // Check which table lots are using
    console.log('\n=== LOTS TABLE ITP REFERENCES ===')
    const { data: lots, error: lotsError } = await supabase
      .from('lots')
      .select('id, lot_number, itp_id')
      .not('itp_id', 'is', null)
      .limit(5)
    
    if (lotsError) {
      console.error('Error fetching lots:', lotsError)
    } else {
      console.log(`Found ${lots.length} lots with ITP assignments:`)
      for (const lot of lots) {
        console.log(`\nLot ${lot.lot_number} (ITP ID: ${lot.itp_id})`)
        
        // Check if this ITP ID exists in itps table
        const { data: itp } = await supabase
          .from('itps')
          .select('name')
          .eq('id', lot.itp_id)
          .single()
        
        if (itp) {
          console.log(`  ✅ Found in itps table: ${itp.name}`)
        } else {
          console.log(`  ❌ Not found in itps table`)
        }
      }
    }

  } catch (error) {
    console.error('Error:', error)
  }

  process.exit(0)
}

checkITPData()