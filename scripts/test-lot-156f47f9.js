const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testLot() {
  const lotId = '156f47f9-66d4-4973-8a0d-05765fa43387'
  
  console.log('\n=== Testing Lot', lotId, '===\n')
  
  // 1. Check lot exists
  const { data: lot, error: lotError } = await supabase
    .from('lots')
    .select('id, lot_number, project_id')
    .eq('id', lotId)
    .single()
  
  console.log('1. Lot exists:', lot ? `Yes (Lot ${lot.lot_number})` : 'No')
  if (lotError) console.log('   Error:', lotError.message)
  
  // 2. Check assignments with app query
  const { data: assignments, error: assignError } = await supabase
    .from('lot_itp_assignments')
    .select('*')
    .eq('lot_id', lotId)
    .in('status', ['pending', 'in_progress', 'completed', 'approved'])
  
  console.log('\n2. Assignments (with status filter):', assignments?.length || 0)
  if (assignments && assignments.length > 0) {
    assignments.forEach(a => {
      console.log(`   - Template: ${a.template_id}`)
      console.log(`     Status: ${a.status}`)
      console.log(`     Created: ${a.created_at}`)
    })
  }
  
  // 3. Try the exact query from getLotByIdAction
  const { data: lotWithProject } = await supabase
    .from('lots')
    .select(`
      *,
      project:projects(*)
    `)
    .eq('id', lotId)
    .single()
  
  console.log('\n3. Lot with project:', lotWithProject ? 'Success' : 'Failed')
  
  // 4. Simulate the full getLotByIdAction query sequence
  console.log('\n4. Simulating getLotByIdAction:')
  
  // First get assignments
  const { data: lotItpTemplates } = await supabase
    .from('lot_itp_assignments')
    .select('*')
    .eq('lot_id', lotId)
    .in('status', ['pending', 'in_progress', 'completed', 'approved'])
  
  console.log('   - Found assignments:', lotItpTemplates?.length || 0)
  
  // Then fetch templates for each assignment
  if (lotItpTemplates && lotItpTemplates.length > 0) {
    for (const assignment of lotItpTemplates) {
      const { data: template } = await supabase
        .from('itp_templates')
        .select('*')
        .eq('id', assignment.template_id)
        .single()
      
      console.log('   - Template:', template?.name || 'Not found')
      
      // Fetch template items
      const { data: templateItems } = await supabase
        .from('itp_template_items')
        .select('*')
        .eq('template_id', assignment.template_id)
        .order('sort_order')
      
      console.log('     Items:', templateItems?.length || 0)
    }
  }
}

testLot().catch(console.error)