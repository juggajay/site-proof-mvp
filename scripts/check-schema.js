const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkSchema() {
  console.log('Checking database schema...\n')

  try {
    // Check what tables exist
    const { data: tables, error: tablesError } = await supabase
      .rpc('get_tables', {})
      .select()

    if (tablesError) {
      // Try a different approach - query information_schema
      console.log('Trying alternative approach...')
      
      // Check if 'itps' table exists
      const { data: itpsCheck, error: itpsError } = await supabase
        .from('itps')
        .select('*')
        .limit(1)

      if (!itpsError) {
        console.log('✅ Table "itps" exists')
        console.log('Sample data:', itpsCheck)
      } else {
        console.log('❌ Table "itps" does not exist or is not accessible')
        console.log('Error:', itpsError.message)
      }

      // Check if 'itp_templates' table exists
      const { data: templatesCheck, error: templatesError } = await supabase
        .from('itp_templates')
        .select('*')
        .limit(1)

      if (!templatesError) {
        console.log('\n✅ Table "itp_templates" exists')
        console.log('Sample data:', templatesCheck)
      } else {
        console.log('\n❌ Table "itp_templates" does not exist or is not accessible')
        console.log('Error:', templatesError.message)
      }

      // Check lots table structure
      console.log('\n--- Checking lots table ---')
      const { data: lot, error: lotError } = await supabase
        .from('lots')
        .select('*')
        .limit(1)
        .single()

      if (!lotError && lot) {
        console.log('Lots table columns:', Object.keys(lot))
        console.log('Sample lot:', lot)
      }

      // Try to query lots with their ITP relationship
      console.log('\n--- Checking lots with ITP relationship ---')
      const { data: lotsWithItp, error: joinError } = await supabase
        .from('lots')
        .select(`
          *,
          itps:itp_id (*)
        `)
        .not('itp_id', 'is', null)
        .limit(2)

      if (!joinError) {
        console.log('✅ Successfully joined lots with itps table')
        console.log('Data:', JSON.stringify(lotsWithItp, null, 2))
      } else {
        console.log('❌ Failed to join with itps table:', joinError.message)
        
        // Try with itp_templates
        const { data: lotsWithTemplates, error: templateJoinError } = await supabase
          .from('lots')
          .select(`
            *,
            itp_templates:itp_id (*)
          `)
          .not('itp_id', 'is', null)
          .limit(2)

        if (!templateJoinError) {
          console.log('✅ Successfully joined lots with itp_templates table')
          console.log('Data:', JSON.stringify(lotsWithTemplates, null, 2))
        } else {
          console.log('❌ Failed to join with itp_templates table:', templateJoinError.message)
        }
      }

    } else {
      console.log('Tables:', tables)
    }

  } catch (error) {
    console.error('Error:', error)
  }

  process.exit(0)
}

checkSchema()