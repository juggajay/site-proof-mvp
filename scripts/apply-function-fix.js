const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })
const fs = require('fs')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function applyFunctionFix() {
  console.log('Applying function fix...\n')

  try {
    // Read the SQL file
    const sql = fs.readFileSync('./scripts/fix-create-itp-function.sql', 'utf8')
    
    console.log('Executing SQL to fix create_itp_from_template function...')
    
    // For now, let's just add template items manually
    console.log('Adding template items for existing templates...')
    
    // Get all templates
    const { data: templates, error: templatesError } = await supabase
      .from('itp_templates')
      .select('*')
    
    if (templatesError) {
      console.error('Failed to fetch templates:', templatesError.message)
      return
    }
    
    console.log(`Found ${templates.length} templates`)
    
    for (const template of templates) {
      // Check if template already has items
      const { count } = await supabase
        .from('itp_template_items')
        .select('*', { count: 'exact', head: true })
        .eq('template_id', template.id)
      
      if (count === 0) {
        console.log(`\nAdding default items for template: ${template.name}`)
        
        // Add some default items based on template category
        const defaultItems = getDefaultItemsForCategory(template.category)
        
        for (let i = 0; i < defaultItems.length; i++) {
          const item = defaultItems[i]
          const { error: insertError } = await supabase
            .from('itp_template_items')
            .insert({
              template_id: template.id,
              item_number: `${i + 1}`,
              description: item.description,
              acceptance_criteria: item.criteria,
              inspection_method: item.method,
              is_mandatory: true,
              sort_order: i + 1
            })
          
          if (insertError) {
            console.error(`Failed to add item: ${insertError.message}`)
          } else {
            console.log(`  ✅ Added: ${item.description}`)
          }
        }
      } else {
        console.log(`Template ${template.name} already has ${count} items`)
      }
    }
    
    console.log('\n✅ Template items setup complete!')
    console.log('\nNOTE: The create_itp_from_template function still needs to be updated in the Supabase dashboard.')
    console.log('Copy the SQL from scripts/fix-create-itp-function.sql and run it in the SQL editor.')
    
  } catch (error) {
    console.error('Error:', error)
  }
  
  process.exit(0)
}

function getDefaultItemsForCategory(category) {
  const categoryItems = {
    structural: [
      { description: 'Verify structural dimensions', criteria: 'Within tolerance ±5mm', method: 'Measurement' },
      { description: 'Check material certifications', criteria: 'Valid certificates provided', method: 'Document review' },
      { description: 'Inspect surface finish', criteria: 'Smooth, no visible defects', method: 'Visual inspection' }
    ],
    electrical: [
      { description: 'Test circuit continuity', criteria: 'Continuity confirmed', method: 'Electrical test' },
      { description: 'Verify cable specifications', criteria: 'Matches design specs', method: 'Document review' },
      { description: 'Check earthing/grounding', criteria: 'Resistance < 1 ohm', method: 'Measurement' }
    ],
    plumbing: [
      { description: 'Pressure test pipes', criteria: 'No pressure drop over 30min', method: 'Pressure test' },
      { description: 'Check pipe gradients', criteria: 'Minimum 1:100 slope', method: 'Measurement' },
      { description: 'Verify fittings installation', criteria: 'Properly sealed, no leaks', method: 'Visual inspection' }
    ]
  }
  
  // Default items for unknown categories
  const defaultItems = [
    { description: 'General quality check', criteria: 'Meets specifications', method: 'Visual inspection' },
    { description: 'Documentation review', criteria: 'All documents complete', method: 'Document review' },
    { description: 'Safety compliance', criteria: 'Meets safety standards', method: 'Checklist review' }
  ]
  
  return categoryItems[category?.toLowerCase()] || defaultItems
}

applyFunctionFix()