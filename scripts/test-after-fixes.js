const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testAfterFixes() {
  console.log('🧪 Testing ITP System After Fixes\n')
  console.log('Prerequisites: Run URGENT-FIX-complexity-case-and-function.sql first!\n')
  
  const results = {
    passed: [],
    failed: []
  }

  try {
    // Test 1: Verify data cleanup worked
    console.log('📋 Test 1: Checking if data cleanup worked...')
    const { data: complexityCheck } = await supabase
      .from('itps')
      .select('complexity')
      .not('complexity', 'is', null)
    
    const uniqueComplexities = [...new Set(complexityCheck?.map(r => r.complexity) || [])]
    console.log('Unique complexity values:', uniqueComplexities)
    
    const hasLowercase = uniqueComplexities.some(c => c && c !== c.charAt(0).toUpperCase() + c.slice(1))
    if (hasLowercase) {
      console.log('❌ Still has lowercase complexity values')
      results.failed.push('Data cleanup - complexity case')
    } else {
      console.log('✅ All complexity values properly capitalized')
      results.passed.push('Data cleanup - complexity case')
    }

    // Test 2: Test create_itp_from_template function
    console.log('\n📋 Test 2: Testing create_itp_from_template function...')
    
    // Get a template and project/lot
    const { data: template } = await supabase
      .from('itp_templates')
      .select('*')
      .eq('is_active', true)
      .limit(1)
      .single()
    
    const { data: lot } = await supabase
      .from('lots')
      .select('*, project:projects(*)')
      .limit(1)
      .single()
    
    if (template && lot) {
      console.log(`Using template: ${template.name}`)
      console.log(`Using lot: ${lot.lot_number}`)
      
      // Call the function
      const { data: newItpId, error: funcError } = await supabase
        .rpc('create_itp_from_template', {
          p_template_id: template.id,
          p_project_id: lot.project_id,
          p_lot_id: lot.id,
          p_name: `Test ITP - ${new Date().toISOString()}`
        })
      
      if (funcError) {
        console.log('❌ Function failed:', funcError.message)
        results.failed.push('create_itp_from_template function')
      } else {
        console.log('✅ Function succeeded! ITP ID:', newItpId)
        results.passed.push('create_itp_from_template function')
        
        // Test 3: Verify the created ITP has proper values
        console.log('\n📋 Test 3: Verifying created ITP...')
        const { data: createdItp, error: fetchError } = await supabase
          .from('itps')
          .select('*')
          .eq('id', newItpId)
          .single()
        
        if (!fetchError && createdItp) {
          console.log('Created ITP details:')
          console.log('  - Name:', createdItp.name)
          console.log('  - Status:', createdItp.status)
          console.log('  - Complexity:', createdItp.complexity)
          console.log('  - Template ID:', createdItp.template_id)
          console.log('  - Project ID:', createdItp.project_id)
          console.log('  - Lot ID:', createdItp.lot_id)
          
          if (createdItp.complexity && ['Low', 'Medium', 'High'].includes(createdItp.complexity)) {
            console.log('✅ ITP has valid complexity')
            results.passed.push('ITP complexity validation')
          } else {
            console.log('❌ ITP has invalid complexity:', createdItp.complexity)
            results.failed.push('ITP complexity validation')
          }
          
          // Test 4: Check if items were created
          console.log('\n📋 Test 4: Checking ITP items...')
          const { data: items, count } = await supabase
            .from('itp_items')
            .select('*', { count: 'exact' })
            .eq('itp_id', newItpId)
          
          console.log(`Found ${count || 0} items for this ITP`)
          if (count > 0) {
            console.log('✅ ITP items created successfully')
            results.passed.push('ITP items creation')
            
            // Test 5: Update an item
            console.log('\n📋 Test 5: Testing item status update...')
            const itemToUpdate = items[0]
            
            const { error: updateError } = await supabase
              .from('itp_items')
              .update({
                status: 'Pass',
                inspection_notes: 'Test passed after fixes',
                inspected_date: new Date().toISOString()
              })
              .eq('id', itemToUpdate.id)
            
            if (updateError) {
              console.log('❌ Item update failed:', updateError.message)
              results.failed.push('ITP item update')
            } else {
              console.log('✅ Item updated successfully')
              results.passed.push('ITP item update')
              
              // Check if trigger updated ITP status
              const { data: updatedItp } = await supabase
                .from('itps')
                .select('status')
                .eq('id', newItpId)
                .single()
              
              console.log('ITP status after item update:', updatedItp?.status)
            }
          } else {
            console.log('⚠️  No items created for ITP')
            results.failed.push('ITP items creation')
          }
          
          // Test 6: Test views
          console.log('\n📋 Test 6: Testing database views...')
          const { data: overviewData, error: viewError } = await supabase
            .from('v_itp_overview')
            .select('*')
            .eq('id', newItpId)
            .single()
          
          if (viewError) {
            console.log('❌ View query failed:', viewError.message)
            results.failed.push('v_itp_overview query')
          } else {
            console.log('✅ View data retrieved:')
            console.log('  - ITP Name:', overviewData.itp_name)
            console.log('  - Template:', overviewData.template_name)
            console.log('  - Project:', overviewData.project_name)
            console.log('  - Lot:', overviewData.lot_name)
            console.log('  - Total Items:', overviewData.total_items)
            console.log('  - Completion:', overviewData.completion_percentage + '%')
            results.passed.push('v_itp_overview query')
          }
          
          // Cleanup
          console.log('\n📋 Cleaning up test data...')
          await supabase.from('itp_items').delete().eq('itp_id', newItpId)
          await supabase.from('itps').delete().eq('id', newItpId)
          console.log('✅ Cleanup complete')
        }
      }
    } else {
      console.log('❌ Could not find test data (template/lot)')
      results.failed.push('Test data availability')
    }

    // Test 7: Test direct API route
    console.log('\n📋 Test 7: Testing API route (if server is running)...')
    try {
      const response = await fetch('http://localhost:3000/api/itps/overview')
      if (response.ok) {
        const data = await response.json()
        console.log('✅ API route working, returned', data.data?.length || 0, 'ITPs')
        results.passed.push('API route test')
      } else {
        console.log('⚠️  API returned error:', response.status)
      }
    } catch (e) {
      console.log('⚠️  Could not test API (server may not be running)')
    }

  } catch (error) {
    console.error('\n❌ Unexpected error:', error)
    results.failed.push('Unexpected error: ' + error.message)
  }

  // Summary
  console.log('\n' + '='.repeat(50))
  console.log('📊 TEST SUMMARY')
  console.log('='.repeat(50))
  console.log(`✅ Passed: ${results.passed.length}`)
  results.passed.forEach(test => console.log(`   - ${test}`))
  console.log(`\n❌ Failed: ${results.failed.length}`)
  results.failed.forEach(test => console.log(`   - ${test}`))
  console.log('='.repeat(50))
  
  if (results.failed.length === 0) {
    console.log('\n🎉 All tests passed! The ITP system is working correctly.')
  } else {
    console.log('\n⚠️  Some tests failed. Check the details above.')
  }
  
  process.exit(results.failed.length > 0 ? 1 : 0)
}

testAfterFixes()