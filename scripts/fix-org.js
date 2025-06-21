const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function fixOrganizations() {
  console.log('🔧 Fixing organizations...')

  try {
    // 1. Create the missing organizations that projects reference
    const orgIds = [
      '039c1283-4505-4f58-b355-31fefd342fab',
      '550e8400-e29b-41d4-a716-446655440001'
    ]

    for (const orgId of orgIds) {
      console.log(`\nCreating organization ${orgId}...`)
      
      // First check if it exists
      const { data: existing } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', orgId)
        .single()

      if (existing) {
        console.log('✅ Organization already exists')
        continue
      }

      // Try minimal insert - just id and name
      const { data, error } = await supabase
        .from('organizations')
        .insert({
          id: orgId,
          name: orgId === '039c1283-4505-4f58-b355-31fefd342fab' 
            ? 'Jayson Ryan Construction' 
            : 'ABC Construction Ltd'
        })
        .select()
        .single()

      if (error) {
        console.error('Error:', error.message)
        
        // Try without ID to see if it auto-generates
        if (error.message.includes('id')) {
          console.log('Trying without ID...')
          const { data: newOrg, error: newError } = await supabase
            .from('organizations')
            .insert({
              name: 'Test Organization'
            })
            .select()
            .single()

          if (newError) {
            console.error('Still failed:', newError.message)
          } else {
            console.log('✅ Created org with auto ID:', newOrg)
          }
        }
      } else {
        console.log('✅ Created organization:', data.name)
      }
    }

    // 2. Check what we have now
    console.log('\nChecking all organizations...')
    const { data: allOrgs, error: listError } = await supabase
      .from('organizations')
      .select('*')

    if (listError) {
      console.error('List error:', listError)
    } else {
      console.log(`Found ${allOrgs?.length || 0} organizations:`)
      allOrgs?.forEach(org => {
        console.log(`- ${org.id}: ${org.name}`)
      })
    }

  } catch (error) {
    console.error('Error:', error)
  }

  process.exit(0)
}

fixOrganizations()