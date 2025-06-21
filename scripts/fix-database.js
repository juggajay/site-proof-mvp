const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function fixDatabase() {
  console.log('🔧 Fixing database...')

  try {
    // 1. First, let's check what columns organizations table has
    console.log('\nChecking organizations table...')
    const { data: orgTest, error: orgTestError } = await supabase
      .from('organizations')
      .select('*')
      .limit(1)

    if (orgTestError) {
      console.log('Organizations table query error:', orgTestError)
    } else {
      console.log('Organizations table is accessible')
    }

    // 2. Try to insert a simple organization
    console.log('\nInserting organization...')
    const { data: newOrg, error: orgError } = await supabase
      .from('organizations')
      .insert({
        id: '550e8400-e29b-41d4-a716-446655440001',
        name: 'ABC Construction Ltd',
        slug: 'abc-construction'
        // Omitting description as it might not exist
      })
      .select()
      .single()

    if (orgError) {
      console.error('Organization insert error:', orgError)
      
      // If it's a duplicate, try to get the existing one
      if (orgError.code === '23505') {
        console.log('Organization already exists, fetching...')
        const { data: existingOrg } = await supabase
          .from('organizations')
          .select('*')
          .eq('id', '550e8400-e29b-41d4-a716-446655440001')
          .single()
        
        if (existingOrg) {
          console.log('✅ Found existing organization:', existingOrg.name)
        }
      }
    } else {
      console.log('✅ Created organization:', newOrg?.name)
    }

    // 3. Now create ITP templates
    console.log('\nCreating ITP templates...')
    const templates = [
      {
        name: 'Concrete Works ITP',
        category: 'structural',
        version: '1.0',
        is_active: true,
        organization_id: '550e8400-e29b-41d4-a716-446655440001'
      },
      {
        name: 'Reinforcement ITP',
        category: 'structural', 
        version: '1.0',
        is_active: true,
        organization_id: '550e8400-e29b-41d4-a716-446655440001'
      },
      {
        name: 'Rolling Operations ITP',
        category: 'earthworks',
        version: '1.0', 
        is_active: true,
        organization_id: '550e8400-e29b-41d4-a716-446655440001'
      }
    ]

    for (const template of templates) {
      const { data, error } = await supabase
        .from('itp_templates')
        .insert(template)
        .select()
        .single()

      if (error) {
        console.error(`Error creating ${template.name}:`, error.message)
      } else {
        console.log(`✅ Created template: ${data.name}`)
      }
    }

    // 4. Check final counts
    console.log('\nFinal counts:')
    const tables = ['organizations', 'itp_templates', 'projects', 'lots', 'itp_items']
    
    for (const table of tables) {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true })
      
      if (!error) {
        console.log(`${table}: ${count} records`)
      }
    }

    console.log('\n✅ Database fix completed!')

  } catch (error) {
    console.error('Error:', error)
  }

  process.exit(0)
}

fixDatabase()