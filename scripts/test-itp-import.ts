import { mockITPItems } from '@/lib/mock-data'
import { ITPItem } from '@/types/database'
import fs from 'fs'

// Load the import data
const importData = JSON.parse(fs.readFileSync('/home/juggajay/site-proof-mvp/itp_items_import.json', 'utf8'))

async function testImport() {
  console.log(`Starting ITP items import with ${importData.items.length} items...`)
  
  const initialCount = mockITPItems.length
  const results = {
    imported: 0,
    errors: [] as string[]
  }

  // Process each item
  for (let i = 0; i < importData.items.length; i++) {
    try {
      const item = importData.items[i]
      
      // Validate required fields
      if (!item.description) {
        results.errors.push(`Row ${i + 2}: Missing required field 'description'`)
        continue
      }

      // Create new ITP item
      const newItem: ITPItem = {
        id: item.id || `item_${Date.now()}_${i}`,
        itp_template_id: item.itp_id || item.itp_template_id || 1,
        item_number: item.item_number || `${i + 1}`,
        description: item.description,
        specification_reference: item.specification_reference || null,
        inspection_method: item.inspection_type || item.inspection_method || 'PASS_FAIL',
        acceptance_criteria: item.acceptance_criteria || item.required_value || 'As specified',
        item_type: (item.inspection_type || item.item_type || 'PASS_FAIL').toLowerCase(),
        is_mandatory: item.is_mandatory === 'true' || item.is_mandatory === true || true,
        order_index: parseInt(item.order_index) || (i + 1),
        created_at: item.created_at || new Date().toISOString()
      }

      // Add to mock database
      mockITPItems.push(newItem)
      results.imported++

      console.log(`✅ Imported ITP item ${newItem.id}: ${newItem.description}`)

    } catch (error) {
      console.error(`❌ Error processing item ${i + 1}:`, error)
      results.errors.push(`Row ${i + 2}: ${error}`)
    }
  }

  const finalCount = mockITPItems.length
  
  console.log('\n📊 Import Results:')
  console.log(`- Items imported: ${results.imported}`)
  console.log(`- Errors: ${results.errors.length}`)
  console.log(`- Total ITP items before: ${initialCount}`)
  console.log(`- Total ITP items after: ${finalCount}`)
  
  if (results.errors.length > 0) {
    console.log('\n❌ Errors encountered:')
    results.errors.forEach(error => console.log(`  - ${error}`))
  }
  
  console.log('\n✅ ITP items import completed successfully!')
  
  return results
}

// Run the import
testImport().catch(error => {
  console.error('Import failed:', error)
  process.exit(1)
})