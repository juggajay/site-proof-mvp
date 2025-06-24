// Test calling the server action directly
const { getLotByIdAction } = require('../lib/actions.ts')

async function testAction() {
  const lotId = '156f47f9-66d4-4973-8a0d-05765fa43387'
  
  console.log('\n=== Testing getLotByIdAction directly ===\n')
  console.log('Calling getLotByIdAction with lot ID:', lotId)
  
  try {
    const result = await getLotByIdAction(lotId)
    
    console.log('\n=== ACTION RESULT ===')
    console.log('Success:', result.success)
    
    if (result.success && result.data) {
      console.log('\nLot data:')
      console.log('- ID:', result.data.id)
      console.log('- Lot number:', result.data.lot_number)
      console.log('- lot_itp_assignments:', result.data.lot_itp_assignments?.length || 0)
      console.log('- lot_itp_templates:', result.data.lot_itp_templates?.length || 0)
      console.log('- itp_templates:', result.data.itp_templates?.length || 0)
      
      if (result.data.lot_itp_assignments && result.data.lot_itp_assignments.length > 0) {
        console.log('\nAssignments:')
        result.data.lot_itp_assignments.forEach((a, i) => {
          console.log(`  ${i + 1}. ID: ${a.id}, Template: ${a.template_id}, Status: ${a.status}`)
        })
      }
      
      if (result.data.itp_templates && result.data.itp_templates.length > 0) {
        console.log('\nTemplates:')
        result.data.itp_templates.forEach((t, i) => {
          console.log(`  ${i + 1}. ID: ${t.id}, Name: ${t.name}, Items: ${t.itp_items?.length || 0}`)
        })
      }
    } else {
      console.log('Error:', result.error)
    }
  } catch (error) {
    console.error('Error calling action:', error)
  }
}

testAction()