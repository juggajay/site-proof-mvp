const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkActualConstraints() {
  console.log('Checking actual database constraints and values...\n')

  try {
    // Check what complexity values are actually in the database
    console.log('1. Checking existing complexity values:')
    const { data: complexityValues, error: complexityError } = await supabase
      .from('itps')
      .select('complexity')
      .not('complexity', 'is', null)
      .limit(10)

    if (!complexityError && complexityValues) {
      const uniqueValues = [...new Set(complexityValues.map(r => r.complexity))]
      console.log('   Unique complexity values found:', uniqueValues)
    }

    // Check what status values are actually in the database
    console.log('\n2. Checking existing status values:')
    const { data: statusValues, error: statusError } = await supabase
      .from('itps')
      .select('status')
      .not('status', 'is', null)
      .limit(10)

    if (!statusError && statusValues) {
      const uniqueStatuses = [...new Set(statusValues.map(r => r.status))]
      console.log('   Unique status values found:', uniqueStatuses)
    }

    // Try different complexity values to see what works
    console.log('\n3. Testing different complexity values:')
    const testValues = ['Low', 'Medium', 'High', 'Simple', 'Moderate', 'Complex', 'low', 'medium', 'high']
    
    for (const testValue of testValues) {
      try {
        const testData = {
          name: `Test ITP - ${testValue}`,
          complexity: testValue,
          status: 'draft',
          organization_id: '00000000-0000-0000-0000-000000000000',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }

        const { data, error } = await supabase
          .from('itps')
          .insert(testData)
          .select()
          .single()

        if (!error) {
          console.log(`   ✅ '${testValue}' - WORKS`)
          // Clean up
          await supabase.from('itps').delete().eq('id', data.id)
        } else {
          console.log(`   ❌ '${testValue}' - ${error.message.includes('constraint') ? 'CONSTRAINT VIOLATION' : error.message}`)
        }
      } catch (e) {
        console.log(`   ❌ '${testValue}' - ERROR`)
      }
    }

    // Check one successful ITP to see all its values
    console.log('\n4. Checking a complete ITP record:')
    const { data: sampleItp } = await supabase
      .from('itps')
      .select('*')
      .limit(1)
      .single()

    if (sampleItp) {
      console.log('   Sample ITP:')
      console.log('   - complexity:', sampleItp.complexity)
      console.log('   - status:', sampleItp.status)
      console.log('   - All fields:', Object.keys(sampleItp).join(', '))
    }

  } catch (error) {
    console.error('Error:', error)
  }

  process.exit(0)
}

checkActualConstraints()