const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function syncITPsToTemplates() {
  console.log('Syncing ITPs to ITP Templates...\n')

  try {
    // Get all ITPs
    const { data: itps, error: itpsError } = await supabase
      .from('itps')
      .select('*')
      .order('name')
    
    if (itpsError) {
      console.error('Error fetching ITPs:', itpsError)
      return
    }

    // Get all existing ITP templates
    const { data: existingTemplates, error: templatesError } = await supabase
      .from('itp_templates')
      .select('id')
    
    if (templatesError) {
      console.error('Error fetching templates:', templatesError)
      return
    }

    const existingIds = new Set(existingTemplates.map(t => t.id))
    const missingITPs = itps.filter(itp => !existingIds.has(itp.id))

    console.log(`Found ${itps.length} ITPs`)
    console.log(`Found ${existingTemplates.length} existing templates`)
    console.log(`Found ${missingITPs.length} ITPs missing from templates table:\n`)

    for (const itp of missingITPs) {
      console.log(`- ${itp.name} (ID: ${itp.id})`)
    }

    if (missingITPs.length === 0) {
      console.log('\nAll ITPs are already in the templates table!')
      return
    }

    console.log('\nAdding missing ITPs to templates table...')

    for (const itp of missingITPs) {
      const template = {
        id: itp.id,
        name: itp.name,
        description: itp.description || `Template for ${itp.name}`,
        category: itp.category ? itp.category.toLowerCase() : 'general',
        version: '1.0',
        is_active: true,
        organization_id: '550e8400-e29b-41d4-a716-446655440001', // Use the same org ID as other templates
        created_at: itp.created_at,
        updated_at: itp.updated_at
      }

      const { data, error } = await supabase
        .from('itp_templates')
        .insert(template)
        .select()
        .single()

      if (error) {
        console.error(`❌ Error adding ${itp.name}:`, error.message)
      } else {
        console.log(`✅ Added: ${data.name}`)
      }
    }

    // Also copy ITP items if they exist
    console.log('\nChecking for ITP items to copy...')
    
    for (const itp of missingITPs) {
      const { data: items, error: itemsError } = await supabase
        .from('itp_items')
        .select('*')
        .eq('itp_id', itp.id)
      
      if (!itemsError && items && items.length > 0) {
        console.log(`Found ${items.length} items for ${itp.name}`)
        // Items should already be linked properly via itp_id
      }
    }

    console.log('\n✅ Sync complete!')

  } catch (error) {
    console.error('Error:', error)
  }

  process.exit(0)
}

syncITPsToTemplates()