const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testServerQuery() {
  const lotId = '156f47f9-66d4-4973-8a0d-05765fa43387'
  
  console.log('\n=== Testing Server Query Flow ===\n')
  
  // 1. Check if lot exists
  console.log('1. Checking lot exists:')
  const { data: lotExists, error: checkError } = await supabase
    .from('lots')
    .select('id, lot_number, project_id')
    .eq('id', lotId)
    .single()
  
  if (lotExists) {
    console.log('   Lot found:', lotExists.lot_number)
    console.log('   ID:', lotExists.id)
    console.log('   ID matches input:', lotExists.id === lotId)
  } else {
    console.log('   Error:', checkError)
  }
  
  // 2. Use the lot ID from the database (same as getLotByIdAction does)
  const lotIdToUse = lotExists ? lotExists.id : lotId
  console.log('\n2. Using lot ID for queries:', lotIdToUse)
  console.log('   Type:', typeof lotIdToUse)
  
  // 3. Query assignments with the exact same query as getLotByIdAction
  console.log('\n3. Querying lot_itp_assignments:')
  const { data: lotItpTemplates, error: lotItpError } = await supabase
    .from('lot_itp_assignments')
    .select('*')
    .eq('lot_id', lotIdToUse)
    .in('status', ['pending', 'in_progress', 'completed', 'approved'])
  
  console.log('   Result count:', lotItpTemplates?.length || 0)
  console.log('   Error:', lotItpError)
  if (lotItpTemplates && lotItpTemplates.length > 0) {
    console.log('   First assignment:', lotItpTemplates[0])
  }
  
  // 4. Try without status filter
  console.log('\n4. Query without status filter:')
  const { data: noFilter } = await supabase
    .from('lot_itp_assignments')
    .select('*')
    .eq('lot_id', lotIdToUse)
  
  console.log('   Result count:', noFilter?.length || 0)
  if (noFilter && noFilter.length > 0) {
    console.log('   Statuses:', noFilter.map(a => a.status))
  }
  
  // 5. Try with string conversion
  console.log('\n5. Query with explicit string conversion:')
  const { data: stringQuery } = await supabase
    .from('lot_itp_assignments')
    .select('*')
    .eq('lot_id', String(lotId))
  
  console.log('   Result count:', stringQuery?.length || 0)
}

testServerQuery().catch(console.error)