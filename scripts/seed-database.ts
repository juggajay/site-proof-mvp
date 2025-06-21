import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'

// Use service role key for admin operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

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
  console.log('🌱 Starting database seed...')

  try {
    // 1. Create test users in auth.users
    console.log('Creating test users...')
    const testUsers = [
      { email: 'admin@example.com', password: 'password123' },
      { email: 'inspector@example.com', password: 'password123' },
      { email: 'viewer@example.com', password: 'password123' }
    ]

    const createdUsers = []
    for (const user of testUsers) {
      const { data, error } = await supabase.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true
      })
      
      if (error) {
        console.error(`Error creating user ${user.email}:`, error)
      } else {
        console.log(`✅ Created user: ${user.email}`)
        createdUsers.push(data.user)
      }
    }

    // 2. Create organizations
    console.log('\nCreating organizations...')
    const { data: orgs, error: orgError } = await supabase
      .from('organizations')
      .insert([
        {
          id: '550e8400-e29b-41d4-a716-446655440001',
          name: 'ABC Construction Ltd',
          slug: 'abc-construction',
          description: 'Leading construction company specializing in infrastructure projects',
          website_url: 'https://abcconstruction.com',
          created_by: createdUsers[0]?.id
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440002',
          name: 'XYZ Engineering',
          slug: 'xyz-engineering',
          description: 'Engineering consultancy firm',
          website_url: 'https://xyzengineering.com',
          created_by: createdUsers[1]?.id
        }
      ])
      .select()

    if (orgError) {
      console.error('Error creating organizations:', orgError)
    } else {
      console.log(`✅ Created ${orgs?.length || 0} organizations`)
    }

    // 3. Create profiles for users
    console.log('\nCreating user profiles...')
    if (createdUsers.length > 0) {
      const profiles = createdUsers.map((user, index) => ({
        user_id: user.id,
        first_name: ['Admin', 'Inspector', 'Viewer'][index],
        last_name: 'User',
        phone: `+1234567890${index}`,
        timezone: 'UTC'
      }))

      const { error: profileError } = await supabase
        .from('profiles')
        .insert(profiles)

      if (profileError) {
        console.error('Error creating profiles:', profileError)
      } else {
        console.log(`✅ Created ${profiles.length} profiles`)
      }
    }

    // 4. Create ITP Templates
    console.log('\nCreating ITP templates...')
    const itpTemplates = [
      {
        id: '0fe09989-58f8-450d-aa85-2d387d99d2be',
        name: 'Rolling Operations ITP',
        description: 'Inspection Test Plan for rolling and compaction operations',
        category: 'earthworks',
        version: '1.0',
        is_active: true,
        organization_id: '550e8400-e29b-41d4-a716-446655440001',
        created_by: createdUsers[0]?.id
      },
      {
        id: '57de0413-13e1-4876-9e5f-5140b98e2ea8',
        name: 'Subgrade Preparation ITP',
        description: 'Inspection Test Plan for subgrade preparation and testing',
        category: 'earthworks',
        version: '1.0',
        is_active: true,
        organization_id: '550e8400-e29b-41d4-a716-446655440001',
        created_by: createdUsers[0]?.id
      },
      {
        id: '6102a2f5-5aa2-40a2-8262-2c6e344e0176',
        name: 'Concrete Works ITP',
        description: 'Inspection Test Plan for concrete placement and testing',
        category: 'structural',
        version: '1.0',
        is_active: true,
        organization_id: '550e8400-e29b-41d4-a716-446655440001',
        created_by: createdUsers[0]?.id
      },
      {
        id: '6f1c4c55-836e-4432-8c77-7a0eab24f56d',
        name: 'Landscaping & Seeding ITP',
        description: 'Inspection Test Plan for landscaping and seeding works',
        category: 'landscaping',
        version: '1.0',
        is_active: true,
        organization_id: '550e8400-e29b-41d4-a716-446655440001',
        created_by: createdUsers[0]?.id
      },
      {
        id: '90eaae06-b84f-4bb5-aa49-fd549e9ac2cb',
        name: 'Material Placement ITP',
        description: 'Inspection Test Plan for material delivery and placement',
        category: 'materials',
        version: '1.0',
        is_active: true,
        organization_id: '550e8400-e29b-41d4-a716-446655440001',
        created_by: createdUsers[0]?.id
      },
      {
        id: '920c39b7-9f4e-485d-aac2-f2ccbaa34404',
        name: 'Conduit Installation ITP',
        description: 'Inspection Test Plan for conduit installation works',
        category: 'utilities',
        version: '1.0',
        is_active: true,
        organization_id: '550e8400-e29b-41d4-a716-446655440001',
        created_by: createdUsers[0]?.id
      },
      {
        id: 'de9df5cf-60de-4e5a-874a-26577bd396b5',
        name: 'Reinforcement ITP',
        description: 'Inspection Test Plan for reinforcement steel works',
        category: 'structural',
        version: '1.0',
        is_active: true,
        organization_id: '550e8400-e29b-41d4-a716-446655440001',
        created_by: createdUsers[0]?.id
      }
    ]

    const { error: itpError } = await supabase
      .from('itp_templates')
      .insert(itpTemplates)

    if (itpError) {
      console.error('Error creating ITP templates:', itpError)
    } else {
      console.log(`✅ Created ${itpTemplates.length} ITP templates`)
    }

    // 5. Update existing projects with organization
    console.log('\nUpdating existing projects...')
    const { error: updateError } = await supabase
      .from('projects')
      .update({ 
        organization_id: '550e8400-e29b-41d4-a716-446655440001',
        created_by: createdUsers[0]?.id,
        project_manager_id: createdUsers[0]?.id
      })
      .is('organization_id', null)

    if (updateError) {
      console.error('Error updating projects:', updateError)
    } else {
      console.log('✅ Updated projects with organization')
    }

    // 6. Create sample ITP items for Concrete Works ITP
    console.log('\nCreating sample ITP items...')
    const concreteItpItems = [
      {
        itp_id: '6102a2f5-5aa2-40a2-8262-2c6e344e0176',
        item_number: '1',
        description: 'Check formwork dimensions and alignment',
        inspection_method: 'MEASUREMENT',
        acceptance_criteria: 'As per approved drawings ±10mm',
        is_mandatory: true,
        sort_order: 1,
        status: 'Pending'
      },
      {
        itp_id: '6102a2f5-5aa2-40a2-8262-2c6e344e0176',
        item_number: '2',
        description: 'Verify reinforcement placement and cover',
        inspection_method: 'VISUAL',
        acceptance_criteria: 'Cover: 40mm ±5mm, spacing as per drawings',
        is_mandatory: true,
        sort_order: 2,
        status: 'Pending'
      },
      {
        itp_id: '6102a2f5-5aa2-40a2-8262-2c6e344e0176',
        item_number: '3',
        description: 'Concrete slump test',
        inspection_method: 'TEST',
        acceptance_criteria: 'Slump: 100mm ±25mm',
        is_mandatory: true,
        sort_order: 3,
        status: 'Pending'
      },
      {
        itp_id: '6102a2f5-5aa2-40a2-8262-2c6e344e0176',
        item_number: '4',
        description: 'Surface finish inspection',
        inspection_method: 'VISUAL',
        acceptance_criteria: 'Smooth finish, no honeycomb or major defects',
        is_mandatory: false,
        sort_order: 4,
        status: 'Pending'
      }
    ]

    const { error: itemsError } = await supabase
      .from('itp_items')
      .insert(concreteItpItems)

    if (itemsError) {
      console.error('Error creating ITP items:', itemsError)
    } else {
      console.log(`✅ Created ${concreteItpItems.length} ITP items`)
    }

    console.log('\n🎉 Database seeding completed!')
    
    // Display summary
    const { data: finalCounts } = await supabase.rpc('get_table_counts')
    console.log('\nFinal table counts:', finalCounts)

  } catch (error) {
    console.error('Seed error:', error)
    process.exit(1)
  }
}

// Run the seed
seedDatabase()