const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testWithoutComplexity() {
  console.log('Testing ITP creation without complexity field...\n')

  try {
    // Test 1: Create without complexity (NULL)
    console.log('1. Testing with complexity = NULL:')
    const testData1 = {
      name: 'Test ITP - No Complexity',
      status: 'Draft',
      organization_id: '00000000-0000-0000-0000-000000000000',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const { data: result1, error: error1 } = await supabase
      .from('itps')
      .insert(testData1)
      .select()
      .single()

    if (!error1) {
      console.log('   ✅ SUCCESS - Created with NULL complexity')
      console.log('   - ID:', result1.id)
      console.log('   - Complexity:', result1.complexity)
      await supabase.from('itps').delete().eq('id', result1.id)
    } else {
      console.log('   ❌ FAILED:', error1.message)
    }

    // Test 2: Try with different status values
    console.log('\n2. Testing different status values:')
    const statusTests = ['draft', 'Draft', 'active', 'Active']
    
    for (const status of statusTests) {
      const testData = {
        name: `Test ITP - Status ${status}`,
        status: status,
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
        console.log(`   ✅ Status '${status}' - WORKS`)
        await supabase.from('itps').delete().eq('id', data.id)
      } else {
        console.log(`   ❌ Status '${status}' - ${error.message.includes('constraint') ? 'CONSTRAINT VIOLATION' : 'FAILED'}`)
      }
    }

    // Test 3: Check if there's a different constraint on complexity
    console.log('\n3. Testing if complexity can be updated on existing record:')
    
    // First create a record with NULL complexity
    const { data: testRecord } = await supabase
      .from('itps')
      .insert({
        name: 'Test ITP for Update',
        status: 'Draft',
        organization_id: '00000000-0000-0000-0000-000000000000'
      })
      .select()
      .single()

    if (testRecord) {
      // Try updating with different complexity values
      const updateTests = ['Low', 'Medium', 'High']
      
      for (const complexity of updateTests) {
        const { error } = await supabase
          .from('itps')
          .update({ complexity })
          .eq('id', testRecord.id)

        if (!error) {
          console.log(`   ✅ Update to '${complexity}' - WORKS`)
        } else {
          console.log(`   ❌ Update to '${complexity}' - FAILED`)
        }
      }
      
      // Clean up
      await supabase.from('itps').delete().eq('id', testRecord.id)
    }

  } catch (error) {
    console.error('Error:', error)
  }

  process.exit(0)
}

testWithoutComplexity()