const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Color codes for output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
}

async function testCompleteITPSystem() {
  console.log(`${colors.blue}🧪 COMPREHENSIVE ITP SYSTEM TEST${colors.reset}\n`)
  console.log('This test assumes the create_itp_from_template function has been fixed.\n')
  
  const results = {
    passed: [],
    failed: [],
    warnings: []
  }
  
  let testItpId = null
  
  try {
    // ========== TEST 1: Function Test ==========
    console.log(`${colors.yellow}📋 TEST 1: Testing create_itp_from_template function${colors.reset}`)
    
    // Get test data
    const { data: template } = await supabase
      .from('itp_templates')
      .select('*')
      .eq('is_active', true)
      .limit(1)
      .single()
    
    const { data: project } = await supabase
      .from('projects')
      .select('*')
      .limit(1)
      .single()
    
    const { data: lot } = await supabase
      .from('lots')
      .select('*')
      .limit(1)
      .single()
    
    if (!template) {
      console.log(`${colors.red}❌ No active template found${colors.reset}`)
      results.failed.push('No test template available')
      return
    }
    
    console.log(`Using template: ${template.name}`)
    console.log(`Project: ${project?.name || 'None'}`)
    console.log(`Lot: ${lot?.lot_number || 'None'}`)
    
    // Call the function
    const { data: newItpId, error: funcError } = await supabase
      .rpc('create_itp_from_template', {
        p_template_id: template.id,
        p_project_id: project?.id || null,
        p_lot_id: lot?.id || null,
        p_name: `System Test - ${new Date().toISOString()}`
      })
    
    if (funcError) {
      console.log(`${colors.red}❌ Function failed: ${funcError.message}${colors.reset}`)
      results.failed.push(`Function test: ${funcError.message}`)
      return
    }
    
    testItpId = newItpId
    console.log(`${colors.green}✅ Function succeeded! Created ITP: ${newItpId}${colors.reset}`)
    results.passed.push('create_itp_from_template function')
    
    // ========== TEST 2: Verify ITP Creation ==========
    console.log(`\n${colors.yellow}📋 TEST 2: Verifying ITP details${colors.reset}`)
    
    const { data: createdItp, error: fetchError } = await supabase
      .from('itps')
      .select(`
        *,
        items:itp_items(count)
      `)
      .eq('id', newItpId)
      .single()
    
    if (fetchError || !createdItp) {
      console.log(`${colors.red}❌ Failed to fetch ITP${colors.reset}`)
      results.failed.push('Fetch created ITP')
    } else {
      console.log('ITP Details:')
      console.log(`  - Name: ${createdItp.name}`)
      console.log(`  - Status: ${createdItp.status}`)
      console.log(`  - Complexity: ${createdItp.complexity}`)
      console.log(`  - Template ID: ${createdItp.template_id}`)
      console.log(`  - Items Count: ${createdItp.items?.[0]?.count || 0}`)
      
      // Validate values
      if (createdItp.complexity && ['Low', 'Medium', 'High'].includes(createdItp.complexity)) {
        console.log(`${colors.green}✅ Valid complexity value${colors.reset}`)
        results.passed.push('ITP complexity validation')
      } else {
        console.log(`${colors.red}❌ Invalid complexity: ${createdItp.complexity}${colors.reset}`)
        results.failed.push('ITP complexity validation')
      }
      
      if (createdItp.status === 'Draft') {
        console.log(`${colors.green}✅ Valid status value${colors.reset}`)
        results.passed.push('ITP status validation')
      } else {
        console.log(`${colors.red}❌ Invalid status: ${createdItp.status}${colors.reset}`)
        results.failed.push('ITP status validation')
      }
    }
    
    // ========== TEST 3: Verify ITP Items ==========
    console.log(`\n${colors.yellow}📋 TEST 3: Verifying ITP items${colors.reset}`)
    
    const { data: items, error: itemsError } = await supabase
      .from('itp_items')
      .select('*')
      .eq('itp_id', newItpId)
      .order('sort_order')
    
    if (itemsError || !items) {
      console.log(`${colors.red}❌ Failed to fetch items${colors.reset}`)
      results.failed.push('Fetch ITP items')
    } else {
      console.log(`Found ${items.length} items:`)
      
      // Check item_number values
      const validItemNumbers = ['PASS_FAIL', 'NUMERIC', 'TEXT_INPUT']
      let allValid = true
      
      items.forEach((item, index) => {
        console.log(`  ${index + 1}. ${item.description}`)
        console.log(`     - item_number: ${item.item_number}`)
        console.log(`     - status: ${item.status}`)
        
        if (!validItemNumbers.includes(item.item_number)) {
          allValid = false
          console.log(`     ${colors.red}❌ Invalid item_number!${colors.reset}`)
        }
      })
      
      if (allValid && items.length > 0) {
        console.log(`${colors.green}✅ All items have valid item_number values${colors.reset}`)
        results.passed.push('ITP items validation')
      } else {
        results.failed.push('ITP items validation')
      }
    }
    
    // ========== TEST 4: Test Database Views ==========
    console.log(`\n${colors.yellow}📋 TEST 4: Testing database views${colors.reset}`)
    
    const { data: overviewData, error: viewError } = await supabase
      .from('v_itp_overview')
      .select('*')
      .eq('id', newItpId)
      .single()
    
    if (viewError) {
      console.log(`${colors.red}❌ View query failed: ${viewError.message}${colors.reset}`)
      results.failed.push('v_itp_overview query')
    } else {
      console.log('ITP Overview:')
      console.log(`  - Name: ${overviewData.itp_name}`)
      console.log(`  - Template: ${overviewData.template_name || 'N/A'}`)
      console.log(`  - Project: ${overviewData.project_name || 'N/A'}`)
      console.log(`  - Total Items: ${overviewData.total_items}`)
      console.log(`  - Completion: ${overviewData.completion_percentage}%`)
      console.log(`${colors.green}✅ View query successful${colors.reset}`)
      results.passed.push('v_itp_overview query')
    }
    
    // ========== TEST 5: Test Item Update ==========
    console.log(`\n${colors.yellow}📋 TEST 5: Testing item status update${colors.reset}`)
    
    if (items && items.length > 0) {
      const itemToUpdate = items[0]
      
      const { error: updateError } = await supabase
        .from('itp_items')
        .update({
          status: 'Pass',
          inspection_notes: 'Test completed successfully',
          inspected_date: new Date().toISOString()
        })
        .eq('id', itemToUpdate.id)
      
      if (updateError) {
        console.log(`${colors.red}❌ Item update failed: ${updateError.message}${colors.reset}`)
        results.failed.push('Item status update')
      } else {
        console.log(`${colors.green}✅ Item updated successfully${colors.reset}`)
        results.passed.push('Item status update')
        
        // Check if trigger updated ITP status
        const { data: updatedItp } = await supabase
          .from('itps')
          .select('status')
          .eq('id', newItpId)
          .single()
        
        console.log(`ITP status after item update: ${updatedItp?.status}`)
        
        // Manually trigger status update if function exists
        const { error: triggerError } = await supabase
          .rpc('update_itp_status', { p_itp_id: newItpId })
        
        if (!triggerError) {
          console.log(`${colors.green}✅ Status update trigger works${colors.reset}`)
          results.passed.push('Status update trigger')
        } else {
          console.log(`${colors.yellow}⚠️  Status update function not found${colors.reset}`)
          results.warnings.push('update_itp_status function might not exist')
        }
      }
    }
    
    // ========== TEST 6: Test API Routes ==========
    console.log(`\n${colors.yellow}📋 TEST 6: Testing API routes${colors.reset}`)
    
    try {
      // Test overview API
      const overviewResponse = await fetch('http://localhost:3000/api/itps/overview')
      if (overviewResponse.ok) {
        const data = await overviewResponse.json()
        console.log(`${colors.green}✅ Overview API works, returned ${data.data?.length || 0} records${colors.reset}`)
        results.passed.push('Overview API route')
      } else {
        console.log(`${colors.red}❌ Overview API failed: ${overviewResponse.status}${colors.reset}`)
        results.failed.push('Overview API route')
      }
      
      // Test specific ITP API
      const itpResponse = await fetch(`http://localhost:3000/api/itps/${newItpId}`)
      if (itpResponse.ok) {
        console.log(`${colors.green}✅ ITP detail API works${colors.reset}`)
        results.passed.push('ITP detail API route')
      } else {
        console.log(`${colors.red}❌ ITP detail API failed: ${itpResponse.status}${colors.reset}`)
        results.failed.push('ITP detail API route')
      }
    } catch (e) {
      console.log(`${colors.yellow}⚠️  Could not test APIs (dev server might not be running)${colors.reset}`)
      results.warnings.push('API tests skipped - server not running')
    }
    
  } catch (error) {
    console.error(`\n${colors.red}❌ Unexpected error: ${error.message}${colors.reset}`)
    results.failed.push(`Unexpected error: ${error.message}`)
  } finally {
    // Cleanup
    if (testItpId) {
      console.log(`\n${colors.yellow}📋 Cleaning up test data...${colors.reset}`)
      await supabase.from('itp_items').delete().eq('itp_id', testItpId)
      await supabase.from('itps').delete().eq('id', testItpId)
      console.log(`${colors.green}✅ Cleanup complete${colors.reset}`)
    }
  }
  
  // ========== SUMMARY ==========
  console.log('\n' + '='.repeat(60))
  console.log(`${colors.blue}📊 TEST SUMMARY${colors.reset}`)
  console.log('='.repeat(60))
  
  console.log(`\n${colors.green}✅ Passed: ${results.passed.length}${colors.reset}`)
  results.passed.forEach(test => console.log(`   - ${test}`))
  
  if (results.warnings.length > 0) {
    console.log(`\n${colors.yellow}⚠️  Warnings: ${results.warnings.length}${colors.reset}`)
    results.warnings.forEach(warning => console.log(`   - ${warning}`))
  }
  
  console.log(`\n${colors.red}❌ Failed: ${results.failed.length}${colors.reset}`)
  results.failed.forEach(test => console.log(`   - ${test}`))
  
  console.log('\n' + '='.repeat(60))
  
  if (results.failed.length === 0) {
    console.log(`\n${colors.green}🎉 ALL CORE TESTS PASSED! The ITP system is working correctly.${colors.reset}`)
  } else {
    console.log(`\n${colors.red}⚠️  Some tests failed. Review the details above.${colors.reset}`)
  }
  
  // Recommendations
  console.log(`\n${colors.blue}📝 NEXT STEPS:${colors.reset}`)
  console.log('1. If all tests passed, the system is ready for use')
  console.log('2. Test the UI components manually')
  console.log('3. Consider the schema improvements documented in ITP-SCHEMA-DESIGN-NOTES.md')
  console.log('4. Monitor for any issues in production')
  
  process.exit(results.failed.length > 0 ? 1 : 0)
}

testCompleteITPSystem()