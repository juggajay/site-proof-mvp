// Test the debug action directly
const { debugLotITPTemplates } = require('../lib/debug-actions.ts')

async function testDebugAction() {
  const lotId = '156f47f9-66d4-4973-8a0d-05765fa43387'
  
  console.log('Testing debug action for lot:', lotId)
  
  const result = await debugLotITPTemplates(lotId)
  
  console.log('\nDebug Results:')
  console.log(JSON.stringify(result, null, 2))
}

testDebugAction().catch(console.error)