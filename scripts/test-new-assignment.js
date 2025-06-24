const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testNewAssignment() {
  // Find a lot without assignments
  const { data: lotsWithoutAssignments } = await supabase
    .from('lots')
    .select('id, lot_number, project_id')
    .limit(10)
  
  console.log('\nAvailable lots:')
  for (const lot of lotsWithoutAssignments || []) {
    // Check if lot has assignments
    const { data: assignments } = await supabase
      .from('lot_itp_assignments')
      .select('id')
      .eq('lot_id', lot.id)
    
    if (!assignments || assignments.length === 0) {
      console.log(`  - Lot ${lot.lot_number} (${lot.id}) - No assignments`)
    }
  }
  
  // Get a template to assign
  const { data: templates } = await supabase
    .from('itp_templates')
    .select('id, name')
    .limit(5)
  
  console.log('\nAvailable templates:')
  templates?.forEach(t => console.log(`  - ${t.name} (${t.id})`))
  
  // Test assignment creation
  const testLotId = '156f47f9-66d4-4973-8a0d-05765fa43387'
  const testTemplateId = templates?.[1]?.id // Get a different template
  
  if (testTemplateId) {
    console.log(`\nTesting assignment of template ${testTemplateId} to lot ${testLotId}`)
    
    // Check current state
    const { data: before } = await supabase
      .from('lot_itp_assignments')
      .select('*')
      .eq('lot_id', testLotId)
    
    console.log('Before:', before?.length || 0, 'assignments')
    
    // Create new assignment
    const { data: newAssignment, error } = await supabase
      .from('lot_itp_assignments')
      .insert({
        lot_id: testLotId,
        template_id: testTemplateId,
        assigned_by: null,
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()
    
    if (error) {
      console.log('Error creating assignment:', error)
    } else {
      console.log('Created assignment:', newAssignment.id)
      
      // Check after
      const { data: after } = await supabase
        .from('lot_itp_assignments')
        .select('*')
        .eq('lot_id', testLotId)
      
      console.log('After:', after?.length || 0, 'assignments')
    }
  }
}

testNewAssignment().catch(console.error)