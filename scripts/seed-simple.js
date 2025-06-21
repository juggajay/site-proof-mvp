const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function seedDatabase() {
  console.log('🌱 Starting simple database seed...')

  try {
    // 1. Create organizations first
    console.log('\nCreating organizations...')
    const { data: orgs, error: orgError } = await supabase
      .from('organizations')
      .insert([
        {
          id: '550e8400-e29b-41d4-a716-446655440001',
          name: 'ABC Construction Ltd',
          slug: 'abc-construction',
          description: 'Leading construction company specializing in infrastructure projects'
        }
      ])
      .select()

    if (orgError && !orgError.message.includes('duplicate')) {
      console.error('Error creating organizations:', orgError)
    } else {
      console.log('✅ Organization created/exists')
    }

    // 2. Create ITP Templates
    console.log('\nCreating ITP templates...')
    const itpTemplates = [
      {
        id: '0fe09989-58f8-450d-aa85-2d387d99d2be',
        name: 'Rolling Operations ITP',
        description: 'Inspection Test Plan for rolling and compaction operations',
        category: 'earthworks',
        version: '1.0',
        is_active: true,
        organization_id: '550e8400-e29b-41d4-a716-446655440001'
      },
      {
        id: '6102a2f5-5aa2-40a2-8262-2c6e344e0176',
        name: 'Concrete Works ITP',
        description: 'Inspection Test Plan for concrete placement and testing',
        category: 'structural',
        version: '1.0',
        is_active: true,
        organization_id: '550e8400-e29b-41d4-a716-446655440001'
      },
      {
        id: 'de9df5cf-60de-4e5a-874a-26577bd396b5',
        name: 'Reinforcement ITP',
        description: 'Inspection Test Plan for reinforcement steel works',
        category: 'structural',
        version: '1.0',
        is_active: true,
        organization_id: '550e8400-e29b-41d4-a716-446655440001'
      }
    ]

    for (const template of itpTemplates) {
      const { error } = await supabase
        .from('itp_templates')
        .insert(template)
      
      if (error && !error.message.includes('duplicate')) {
        console.error(`Error creating ITP template ${template.name}:`, error)
      } else {
        console.log(`✅ ITP template created/exists: ${template.name}`)
      }
    }

    // 3. Update existing projects
    console.log('\nUpdating existing projects...')
    const { data: projects } = await supabase
      .from('projects')
      .select('id, organization_id')
    
    for (const project of projects || []) {
      if (!project.organization_id) {
        await supabase
          .from('projects')
          .update({ organization_id: '550e8400-e29b-41d4-a716-446655440001' })
          .eq('id', project.id)
        console.log(`✅ Updated project ${project.id} with organization`)
      }
    }

    // 4. Check final counts
    console.log('\nChecking final counts...')
    const tables = ['organizations', 'itp_templates', 'projects', 'lots']
    for (const table of tables) {
      const { count } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true })
      console.log(`${table}: ${count} records`)
    }

    console.log('\n🎉 Seeding completed!')

  } catch (error) {
    console.error('Seed error:', error)
    process.exit(1)
  }

  process.exit(0)
}

seedDatabase()