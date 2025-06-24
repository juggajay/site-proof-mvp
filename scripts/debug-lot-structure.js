const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function debugLotStructure() {
  // Test with lot that has preloaded ITPs (working)
  const workingLotId = '3fd647f4-8ca8-487f-85a8-627bf3b2a120'
  
  // Test with lot that has newly assigned ITP (not showing)
  const problematicLotId = '156f47f9-66d4-4973-8a0d-05765fa43387'
  
  console.log('\n=== Comparing Lot Structures ===\n')
  
  for (const lotId of [workingLotId, problematicLotId]) {
    console.log(`\n--- Lot ${lotId} ---`)
    
    // Get assignments
    const { data: assignments } = await supabase
      .from('lot_itp_assignments')
      .select('*')
      .eq('lot_id', lotId)
      .in('status', ['pending', 'in_progress', 'completed', 'approved'])
    
    console.log(`Assignments: ${assignments?.length || 0}`)
    
    // For each assignment, get template details
    if (assignments && assignments.length > 0) {
      for (const assignment of assignments) {
        console.log(`\nAssignment ${assignment.id}:`)
        console.log(`  Template ID: ${assignment.template_id}`)
        console.log(`  Status: ${assignment.status}`)
        console.log(`  Created: ${assignment.created_at}`)
        
        // Get template
        const { data: template } = await supabase
          .from('itp_templates')
          .select('id, name')
          .eq('id', assignment.template_id)
          .single()
        
        console.log(`  Template Name: ${template?.name || 'Not found'}`)
        
        // Get items count
        const { data: items } = await supabase
          .from('itp_template_items')
          .select('id')
          .eq('template_id', assignment.template_id)
        
        console.log(`  Items: ${items?.length || 0}`)
        
        // Get inspection records
        const { data: records } = await supabase
          .from('itp_inspection_records')
          .select('id, status')
          .eq('assignment_id', assignment.id)
        
        console.log(`  Inspection Records: ${records?.length || 0}`)
        if (records && records.length > 0) {
          const statusCounts = records.reduce((acc, r) => {
            acc[r.status] = (acc[r.status] || 0) + 1
            return acc
          }, {})
          console.log(`  Record Statuses:`, statusCounts)
        }
      }
    }
  }
}

debugLotStructure().catch(console.error)