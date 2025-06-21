const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function findSpecificLot() {
  const lotId = '1e250900-a9ab-472b-95ba-464dd8c756cd'
  const projectId = '9b9e6ef4-84e8-495b-84aa-6c6b53d94e4c'
  
  console.log('Looking for lot:', lotId)
  console.log('In project:', projectId)
  console.log('')

  try {
    // Try to find the lot
    const { data: lot, error } = await supabase
      .from('lots')
      .select('*')
      .eq('id', lotId)
      .single()
    
    if (error) {
      console.log('❌ Lot not found with ID:', lotId)
      console.log('Error:', error)
      
      // Try to find lots in that project
      console.log('\nLooking for lots in project:', projectId)
      const { data: projectLots, error: projectError } = await supabase
        .from('lots')
        .select('*')
        .eq('project_id', projectId)
      
      if (projectError) {
        console.log('Error finding project lots:', projectError)
      } else if (projectLots && projectLots.length > 0) {
        console.log(`\nFound ${projectLots.length} lots in project:`)
        projectLots.forEach(lot => {
          console.log(`  - ID: ${lot.id}, Number: ${lot.lot_number}`)
        })
      } else {
        console.log('No lots found in project')
      }
      
      // Check if project exists
      console.log('\nChecking if project exists...')
      const { data: project, error: projectCheckError } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single()
      
      if (projectCheckError) {
        console.log('❌ Project not found:', projectId)
      } else {
        console.log('✅ Project exists:', project.name)
      }
      
    } else {
      console.log('✅ Lot found!')
      console.log(JSON.stringify(lot, null, 2))
    }
    
    // List all lots to see what's available
    console.log('\n\nAll lots in database:')
    const { data: allLots } = await supabase
      .from('lots')
      .select('id, lot_number, project_id')
      .limit(10)
    
    if (allLots) {
      allLots.forEach(lot => {
        console.log(`  - ID: ${lot.id}, Number: ${lot.lot_number}, Project: ${lot.project_id}`)
      })
    }

  } catch (error) {
    console.error('Unexpected error:', error)
  }
}

findSpecificLot()