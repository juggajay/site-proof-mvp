// Test script for multiple ITPs per lot functionality
// This script demonstrates how to use the new multi-ITP assignment feature

import { assignMultipleITPsToLotAction, getLotByIdAction } from './lib/actions'

async function testMultipleITPs() {
  console.log('🧪 Testing Multiple ITPs per Lot Feature')
  console.log('========================================\n')

  // Example lot ID and ITP template IDs (replace with actual IDs from your database)
  const lotId = '123e4567-e89b-12d3-a456-426614174000' // Replace with actual lot ID
  const itpTemplateIds = [
    '456e7890-e89b-12d3-a456-426614174001', // Replace with actual ITP template ID
    '789e0123-e89b-12d3-a456-426614174002', // Replace with actual ITP template ID
  ]

  try {
    // 1. Assign multiple ITPs to a lot
    console.log('📝 Step 1: Assigning multiple ITPs to lot...')
    console.log(`Lot ID: ${lotId}`)
    console.log(`ITP Template IDs: ${itpTemplateIds.join(', ')}\n`)
    
    const assignResult = await assignMultipleITPsToLotAction(lotId, itpTemplateIds)
    
    if (assignResult.success) {
      console.log('✅ Successfully assigned ITPs!')
      console.log(`Message: ${assignResult.message}\n`)
    } else {
      console.error('❌ Failed to assign ITPs:', assignResult.error)
      return
    }

    // 2. Fetch the lot to verify assignments
    console.log('🔍 Step 2: Fetching lot to verify assignments...')
    const lotResult = await getLotByIdAction(lotId)
    
    if (lotResult.success && lotResult.data) {
      const lot = lotResult.data
      console.log(`\n✅ Lot retrieved successfully!`)
      console.log(`Lot Number: ${lot.lot_number}`)
      console.log(`Number of assigned ITPs: ${lot.itp_templates?.length || 0}`)
      
      if (lot.itp_templates && lot.itp_templates.length > 0) {
        console.log('\n📋 Assigned ITP Templates:')
        lot.itp_templates.forEach((template, index) => {
          console.log(`  ${index + 1}. ${template.name} (ID: ${template.id})`)
          console.log(`     - Items: ${template.itp_items?.length || 0}`)
          console.log(`     - Category: ${template.category || 'N/A'}`)
          console.log(`     - Version: ${template.version}`)
        })
      }
      
      if (lot.lot_itp_templates && lot.lot_itp_templates.length > 0) {
        console.log('\n🔗 Junction Table Records:')
        lot.lot_itp_templates.forEach((assignment, index) => {
          console.log(`  ${index + 1}. Template ID: ${assignment.itp_template_id}`)
          console.log(`     - Assigned at: ${new Date(assignment.assigned_at).toLocaleString()}`)
          console.log(`     - Active: ${assignment.is_active}`)
        })
      }
    } else {
      console.error('❌ Failed to fetch lot:', lotResult.error)
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

// Usage instructions
console.log('📚 Usage Instructions:')
console.log('====================')
console.log('1. Update the lotId and itpTemplateIds variables with actual IDs from your database')
console.log('2. Run this script using: npx tsx test-multiple-itps.ts')
console.log('3. Check the console output to verify the multi-ITP assignment worked correctly')
console.log('\n💡 Tip: You can find existing lot and ITP template IDs in your database or by')
console.log('   checking the network tab in your browser while using the application.\n')

// Export for use in other scripts
export { testMultipleITPs }