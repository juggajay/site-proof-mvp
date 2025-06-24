const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  db: { schema: 'public' },
  auth: { persistSession: false }
})

async function checkLotAssignments() {
  const lotId = '156f47f9-66d4-4973-8a0d-05765fa43387'
  
  console.log(`\nChecking assignments for lot: ${lotId}\n`)
  
  // 1. Check assignments for this lot
  console.log('1. Assignment Check:')
  const { data: assignments, error: assignError } = await supabase
    .from('lot_itp_assignments')
    .select(`
      *,
      template:itp_templates(name)
    `)
    .eq('lot_id', lotId)
    .order('created_at', { ascending: false })
  
  if (assignError) {
    console.log('Error fetching assignments:', assignError)
  } else {
    console.log(`Found ${assignments?.length || 0} assignments:`)
    assignments?.forEach(a => {
      console.log(`  - Template: ${a.template?.name || a.template_id}`)
      console.log(`    Status: ${a.status}`)
      console.log(`    Created: ${a.created_at}`)
      console.log(`    ID: ${a.id}`)
    })
  }
  
  // 2. Check type and status values
  console.log('\n2. Type Check:')
  if (assignments && assignments.length > 0) {
    const first = assignments[0]
    console.log(`  - lot_id type: ${typeof first.lot_id}`)
    console.log(`  - lot_id value: "${first.lot_id}"`)
    console.log(`  - status type: ${typeof first.status}`)
    console.log(`  - status value: "${first.status}"`)
    console.log(`  - status is null: ${first.status === null}`)
    console.log(`  - status is empty: ${first.status === ''}`)
  }
  
  // 3. Count by status
  console.log('\n3. Status Summary:')
  const { data: statusCounts, error: statusError } = await supabase
    .rpc('query_json', {
      query_text: `
        SELECT status, COUNT(*) as count
        FROM lot_itp_assignments
        WHERE lot_id = $1
        GROUP BY status
      `,
      params: [lotId]
    })
  
  if (!statusError && statusCounts) {
    console.log('Status counts:', statusCounts)
  }
  
  // 4. Check with status filter (what the app uses)
  console.log('\n4. With Status Filter (app query):')
  const { data: filtered, error: filterError } = await supabase
    .from('lot_itp_assignments')
    .select('*')
    .eq('lot_id', lotId)
    .in('status', ['pending', 'in_progress', 'completed', 'approved'])
  
  console.log(`Found ${filtered?.length || 0} assignments with status filter`)
  
  // 5. Check recent assignments across all lots
  console.log('\n5. Recent Assignments (all lots):')
  const { data: recent, error: recentError } = await supabase
    .from('lot_itp_assignments')
    .select(`
      lot_id,
      template_id,
      status,
      created_at
    `)
    .order('created_at', { ascending: false })
    .limit(10)
  
  if (!recentError) {
    console.log('Most recent assignments:')
    recent?.forEach(r => {
      console.log(`  - Lot: ${r.lot_id.substring(0, 8)}... Status: ${r.status} Created: ${r.created_at}`)
    })
  }
  
  // 6. Check the lot itself
  console.log('\n6. Lot Check:')
  const { data: lot, error: lotError } = await supabase
    .from('lots')
    .select('id, lot_number, project_id')
    .eq('id', lotId)
    .single()
  
  if (!lotError && lot) {
    console.log(`  - Lot exists: ${lot.lot_number}`)
    console.log(`  - Project: ${lot.project_id}`)
  } else {
    console.log('  - Lot not found or error:', lotError?.message)
  }
}

checkLotAssignments().catch(console.error)