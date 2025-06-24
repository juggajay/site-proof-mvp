const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function debugAssignmentIssue() {
  const lotId = '156f47f9-66d4-4973-8a0d-05765fa43387'
  
  console.log(`\n=== Debugging Assignment Issue for Lot ${lotId} ===\n`)
  
  // 1. Check what's in lot_itp_assignments
  console.log('1. Checking lot_itp_assignments table:')
  const { data: assignments, error: assignError } = await supabase
    .from('lot_itp_assignments')
    .select('*')
    .eq('lot_id', lotId)
  
  console.log('   All assignments:', assignments?.length || 0)
  if (assignments) {
    assignments.forEach(a => {
      console.log(`   - ID: ${a.id}`)
      console.log(`     Template: ${a.template_id}`)
      console.log(`     Status: ${a.status}`)
      console.log(`     Created: ${a.created_at}`)
    })
  }
  
  // 2. Check with the exact query from getLotByIdAction
  console.log('\n2. Query with status filter (app query):')
  const { data: filteredAssignments, error: filterError } = await supabase
    .from('lot_itp_assignments')
    .select('*')
    .eq('lot_id', lotId)
    .in('status', ['pending', 'in_progress', 'completed', 'approved'])
  
  console.log('   Filtered assignments:', filteredAssignments?.length || 0)
  
  // 3. Check if the lot ID matches exactly
  console.log('\n3. Checking lot existence:')
  const { data: lot, error: lotError } = await supabase
    .from('lots')
    .select('id, lot_number')
    .eq('id', lotId)
    .single()
  
  if (lot) {
    console.log(`   Lot found: ${lot.lot_number}`)
    console.log(`   ID matches: ${lot.id === lotId}`)
    console.log(`   ID type: ${typeof lot.id}`)
  } else {
    console.log('   Lot not found!')
  }
  
  // 4. Check the most recent assignments
  console.log('\n4. Most recent assignments (any lot):')
  const { data: recentAssignments } = await supabase
    .from('lot_itp_assignments')
    .select('id, lot_id, template_id, status, created_at')
    .order('created_at', { ascending: false })
    .limit(5)
  
  recentAssignments?.forEach(a => {
    console.log(`   - Lot: ${a.lot_id === lotId ? '*** THIS LOT ***' : a.lot_id.substring(0, 8) + '...'}`)
    console.log(`     Status: ${a.status}, Created: ${a.created_at}`)
  })
  
  // 5. Try different query approaches
  console.log('\n5. Testing different query approaches:')
  
  // Direct SQL-like query
  const { data: directQuery } = await supabase
    .rpc('query_json', {
      query_text: `
        SELECT COUNT(*) as count 
        FROM lot_itp_assignments 
        WHERE lot_id = $1
      `,
      params: [lotId]
    })
  
  if (directQuery) {
    console.log('   Direct SQL count:', directQuery)
  }
  
  // Check without any filters
  const { data: noFilters } = await supabase
    .from('lot_itp_assignments')
    .select('id, status')
    .eq('lot_id', lotId)
  
  console.log('   Without filters:', noFilters?.length || 0)
  if (noFilters && noFilters.length > 0) {
    console.log('   Statuses found:', noFilters.map(a => a.status))
  }
}

debugAssignmentIssue().catch(console.error)