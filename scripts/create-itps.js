const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function createITPs() {
  console.log('🔧 Creating ITP templates...')

  try {
    // Use the organization that exists
    const orgId = '550e8400-e29b-41d4-a716-446655440001'

    // ITP templates to create
    const templates = [
      {
        name: 'Concrete Works ITP',
        description: 'Inspection Test Plan for concrete placement and testing',
        category: 'structural',
        version: '1.0',
        is_active: true,
        organization_id: orgId
      },
      {
        name: 'Reinforcement ITP',
        description: 'Inspection Test Plan for reinforcement steel works',
        category: 'structural',
        version: '1.0',
        is_active: true,
        organization_id: orgId
      },
      {
        name: 'Rolling Operations ITP',
        description: 'Inspection Test Plan for rolling and compaction operations',
        category: 'earthworks',
        version: '1.0',
        is_active: true,
        organization_id: orgId
      },
      {
        name: 'Subgrade Preparation ITP',
        description: 'Inspection Test Plan for subgrade preparation and testing',
        category: 'earthworks',
        version: '1.0',
        is_active: true,
        organization_id: orgId
      },
      {
        name: 'Material Placement ITP',
        description: 'Inspection Test Plan for material delivery and placement',
        category: 'materials',
        version: '1.0',
        is_active: true,
        organization_id: orgId
      }
    ]

    console.log(`Creating ${templates.length} ITP templates for organization ${orgId}...`)

    for (const template of templates) {
      const { data, error } = await supabase
        .from('itp_templates')
        .insert(template)
        .select()
        .single()

      if (error) {
        console.error(`❌ Error creating ${template.name}:`, error.message)
      } else {
        console.log(`✅ Created: ${data.name} (ID: ${data.id})`)
        
        // Create sample items for Concrete Works ITP
        if (template.name === 'Concrete Works ITP' && data.id) {
          console.log('  Adding items to Concrete Works ITP...')
          const items = [
            {
              itp_template_id: data.id,
              item_number: '1',
              description: 'Check formwork dimensions and alignment',
              inspection_method: 'MEASUREMENT',
              acceptance_criteria: 'As per approved drawings ±10mm',
              item_type: 'numeric',
              is_mandatory: true,
              order_index: 1
            },
            {
              itp_template_id: data.id,
              item_number: '2',
              description: 'Verify reinforcement placement and cover',
              inspection_method: 'VISUAL',
              acceptance_criteria: 'Cover: 40mm ±5mm, spacing as per drawings',
              item_type: 'pass_fail',
              is_mandatory: true,
              order_index: 2
            },
            {
              itp_template_id: data.id,
              item_number: '3',
              description: 'Concrete slump test',
              inspection_method: 'TEST',
              acceptance_criteria: 'Slump: 100mm ±25mm',
              item_type: 'numeric',
              is_mandatory: true,
              order_index: 3
            },
            {
              itp_template_id: data.id,
              item_number: '4',
              description: 'Surface finish inspection',
              inspection_method: 'VISUAL',
              acceptance_criteria: 'Smooth finish, no honeycomb or major defects',
              item_type: 'pass_fail',
              is_mandatory: false,
              order_index: 4
            }
          ]

          for (const item of items) {
            const { error: itemError } = await supabase
              .from('itp_items')
              .insert(item)

            if (itemError) {
              console.error(`  ❌ Error creating item ${item.item_number}:`, itemError.message)
            } else {
              console.log(`  ✅ Created item ${item.item_number}: ${item.description}`)
            }
          }
        }
      }
    }

    // Check final counts
    console.log('\nFinal counts:')
    const { count: templateCount } = await supabase
      .from('itp_templates')
      .select('*', { count: 'exact', head: true })
    
    const { count: itemCount } = await supabase
      .from('itp_items')
      .select('*', { count: 'exact', head: true })

    console.log(`ITP Templates: ${templateCount}`)
    console.log(`ITP Items: ${itemCount}`)

    // List all templates
    const { data: allTemplates } = await supabase
      .from('itp_templates')
      .select('id, name, category, organization_id')
      .order('name')

    console.log('\nAll ITP Templates:')
    allTemplates?.forEach(t => {
      console.log(`- ${t.name} (${t.category}) - ID: ${t.id}`)
    })

  } catch (error) {
    console.error('Error:', error)
  }

  process.exit(0)
}

createITPs()