const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkITPItemsStructure() {
  console.log('Checking ITP items table structure...\n')

  try {
    // Get an existing ITP item to see its structure
    const { data: existingItem, error } = await supabase
      .from('itp_items')
      .select('*')
      .limit(1)
      .single()

    if (!error && existingItem) {
      console.log('Existing ITP item structure:')
      console.log(JSON.stringify(existingItem, null, 2))
      console.log('\nColumns:', Object.keys(existingItem))
    } else {
      console.log('No existing items found or error:', error?.message)
    }

    // Try to understand the constraint
    console.log('\n\nChecking what inspection_type might be...')
    
    // Look for any column that might be inspection_type
    const possibleColumns = ['inspection_type', 'item_type', 'type', 'inspection_method']
    
    for (const col of possibleColumns) {
      if (existingItem && col in existingItem) {
        console.log(`Found column '${col}' with value:`, existingItem[col])
      }
    }

  } catch (error) {
    console.error('Error:', error)
  }

  process.exit(0)
}

checkITPItemsStructure()