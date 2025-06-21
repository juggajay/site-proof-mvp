const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function fixMissingITPs() {
  console.log('Creating missing ITP templates...')

  try {
    // These are the ITP IDs referenced by existing lots
    const missingTemplates = [
      {
        id: '6102a2f5-5aa2-40a2-8262-2c6e344e0176',
        name: 'Concrete Works ITP (Legacy)',
        description: 'Legacy concrete works ITP template',
        category: 'structural',
        version: '1.0',
        is_active: true,
        organization_id: '550e8400-e29b-41d4-a716-446655440001'
      },
      {
        id: 'de9df5cf-60de-4e5a-874a-26577bd396b5',
        name: 'Reinforcement ITP (Legacy)',
        description: 'Legacy reinforcement ITP template',
        category: 'structural',
        version: '1.0',
        is_active: true,
        organization_id: '550e8400-e29b-41d4-a716-446655440001'
      }
    ]

    for (const template of missingTemplates) {
      const { data, error } = await supabase
        .from('itp_templates')
        .insert(template)
        .select()
        .single()

      if (error) {
        if (error.code === '23505') {
          console.log(`Template ${template.id} already exists`)
        } else {
          console.error(`Error creating ${template.name}:`, error.message)
        }
      } else {
        console.log(`✅ Created: ${data.name}`)
      }
    }

    // Now try the update again
    console.log('\nTrying to assign ITP to lot again...')
    const { data: updatedLot, error: updateError } = await supabase
      .from('lots')
      .update({
        itp_id: '7fd887dd-a451-41f3-bebc-0b0bc37b4425',
        status: 'IN_PROGRESS',
        updated_at: new Date().toISOString()
      })
      .eq('id', 'a00febf8-28bb-4932-80f2-3f9312a1bc90')
      .select()
      .single()

    if (updateError) {
      console.error('Update error:', updateError)
    } else {
      console.log('✅ Successfully assigned ITP to lot!')
    }

  } catch (error) {
    console.error('Error:', error)
  }

  process.exit(0)
}

fixMissingITPs()