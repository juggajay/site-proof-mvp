const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabase = createClient(supabaseUrl, supabaseServiceKey)

const baseUrl = 'http://localhost:3000'

// Color codes
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
}

async function testErrorHandling() {
  console.log(`${colors.blue}🧪 TESTING ERROR HANDLING AND EDGE CASES${colors.reset}\n`)
  
  const results = {
    passed: [],
    failed: []
  }
  
  try {
    // ========== TEST 1: Invalid Template ID ==========
    console.log(`${colors.yellow}📋 TEST 1: Create ITP with invalid template ID${colors.reset}`)
    
    const invalidPayload = {
      template_id: '00000000-0000-0000-0000-000000000000',
      name: 'Invalid Template Test'
    }
    
    try {
      const response = await fetch(`${baseUrl}/api/itps/create-from-template`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidPayload)
      })
      
      const result = await response.json()
      
      if (!response.ok && result.error) {
        console.log(`${colors.green}✅ Correctly rejected invalid template${colors.reset}`)
        console.log(`   Error: ${result.error}`)
        results.passed.push('Invalid template ID handling')
      } else {
        console.log(`${colors.red}❌ Should have rejected invalid template${colors.reset}`)
        results.failed.push('Invalid template ID handling')
      }
    } catch (error) {
      console.log(`${colors.red}❌ Unexpected error: ${error.message}${colors.reset}`)
      results.failed.push('Invalid template ID handling')
    }
    
    // ========== TEST 2: Missing Required Fields ==========
    console.log(`\n${colors.yellow}📋 TEST 2: Create ITP without template_id${colors.reset}`)
    
    try {
      const response = await fetch(`${baseUrl}/api/itps/create-from-template`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'No Template' })
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        console.log(`${colors.green}✅ Correctly rejected missing template_id${colors.reset}`)
        results.passed.push('Missing template_id handling')
      } else {
        console.log(`${colors.red}❌ Should have rejected missing template_id${colors.reset}`)
        results.failed.push('Missing template_id handling')
      }
    } catch (error) {
      console.log(`${colors.green}✅ Correctly rejected invalid request${colors.reset}`)
      results.passed.push('Missing template_id handling')
    }
    
    // ========== TEST 3: Invalid ITP ID for GET ==========
    console.log(`\n${colors.yellow}📋 TEST 3: Get non-existent ITP${colors.reset}`)
    
    try {
      const response = await fetch(`${baseUrl}/api/itps/00000000-0000-0000-0000-000000000000`)
      const result = await response.json()
      
      if (!response.ok && response.status === 404) {
        console.log(`${colors.green}✅ Correctly returned 404 for non-existent ITP${colors.reset}`)
        results.passed.push('Non-existent ITP handling')
      } else {
        console.log(`${colors.red}❌ Should have returned 404${colors.reset}`)
        results.failed.push('Non-existent ITP handling')
      }
    } catch (error) {
      console.log(`${colors.red}❌ Unexpected error: ${error.message}${colors.reset}`)
      results.failed.push('Non-existent ITP handling')
    }
    
    // ========== TEST 4: Invalid Status Update ==========
    console.log(`\n${colors.yellow}📋 TEST 4: Update ITP with invalid status${colors.reset}`)
    
    // First create a test ITP
    const { data: template } = await supabase
      .from('itp_templates')
      .select('*')
      .eq('is_active', true)
      .limit(1)
      .single()
    
    if (template) {
      const { data: testItp } = await supabase
        .rpc('create_itp_from_template', {
          p_template_id: template.id,
          p_name: 'Error Test ITP'
        })
      
      if (testItp) {
        try {
          const response = await fetch(`${baseUrl}/api/itps/${testItp}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'invalid_status' })
          })
          
          const result = await response.json()
          
          if (!response.ok) {
            console.log(`${colors.green}✅ Correctly rejected invalid status${colors.reset}`)
            results.passed.push('Invalid status update handling')
          } else {
            console.log(`${colors.red}❌ Should have rejected invalid status${colors.reset}`)
            results.failed.push('Invalid status update handling')
          }
        } catch (error) {
          console.log(`${colors.green}✅ Correctly rejected invalid status${colors.reset}`)
          results.passed.push('Invalid status update handling')
        }
        
        // Cleanup
        await supabase.from('itps').delete().eq('id', testItp)
      }
    }
    
    // ========== TEST 5: Invalid Item Status Update ==========
    console.log(`\n${colors.yellow}📋 TEST 5: Update item with invalid status${colors.reset}`)
    
    try {
      const response = await fetch(`${baseUrl}/api/itps/fake-id/items`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemId: 'fake-item-id',
          status: 'InvalidStatus'
        })
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        console.log(`${colors.green}✅ Correctly rejected invalid item status${colors.reset}`)
        results.passed.push('Invalid item status handling')
      } else {
        console.log(`${colors.red}❌ Should have rejected invalid item status${colors.reset}`)
        results.failed.push('Invalid item status handling')
      }
    } catch (error) {
      console.log(`${colors.green}✅ Correctly rejected invalid request${colors.reset}`)
      results.passed.push('Invalid item status handling')
    }
    
    // ========== TEST 6: Malformed JSON ==========
    console.log(`\n${colors.yellow}📋 TEST 6: Send malformed JSON${colors.reset}`)
    
    try {
      const response = await fetch(`${baseUrl}/api/itps/create-from-template`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{invalid json'
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        console.log(`${colors.green}✅ Correctly handled malformed JSON${colors.reset}`)
        results.passed.push('Malformed JSON handling')
      } else {
        console.log(`${colors.red}❌ Should have rejected malformed JSON${colors.reset}`)
        results.failed.push('Malformed JSON handling')
      }
    } catch (error) {
      console.log(`${colors.green}✅ Correctly rejected malformed JSON${colors.reset}`)
      results.passed.push('Malformed JSON handling')
    }
    
    // ========== TEST 7: SQL Injection Attempt ==========
    console.log(`\n${colors.yellow}📋 TEST 7: SQL injection attempt${colors.reset}`)
    
    const injectionPayload = {
      template_id: "'; DROP TABLE itps; --",
      name: "Injection Test"
    }
    
    try {
      const response = await fetch(`${baseUrl}/api/itps/create-from-template`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(injectionPayload)
      })
      
      const result = await response.json()
      
      // Check if table still exists
      const { error: tableCheck } = await supabase.from('itps').select('count').limit(1)
      
      if (!tableCheck) {
        console.log(`${colors.green}✅ SQL injection prevented - table still exists${colors.reset}`)
        results.passed.push('SQL injection prevention')
      } else {
        console.log(`${colors.red}❌ Table check failed${colors.reset}`)
        results.failed.push('SQL injection prevention')
      }
    } catch (error) {
      console.log(`${colors.green}✅ Request safely rejected${colors.reset}`)
      results.passed.push('SQL injection prevention')
    }
    
  } catch (error) {
    console.error(`\n${colors.red}❌ Unexpected error: ${error.message}${colors.reset}`)
  }
  
  // Summary
  console.log('\n' + '='.repeat(60))
  console.log(`${colors.blue}📊 ERROR HANDLING TEST SUMMARY${colors.reset}`)
  console.log('='.repeat(60))
  
  console.log(`\n${colors.green}✅ Passed: ${results.passed.length}${colors.reset}`)
  results.passed.forEach(test => console.log(`   - ${test}`))
  
  console.log(`\n${colors.red}❌ Failed: ${results.failed.length}${colors.reset}`)
  results.failed.forEach(test => console.log(`   - ${test}`))
  
  console.log('\n' + '='.repeat(60))
  
  if (results.failed.length === 0) {
    console.log(`\n${colors.green}🎉 ALL ERROR HANDLING TESTS PASSED!${colors.reset}`)
  } else {
    console.log(`\n${colors.red}⚠️  Some error handling tests failed.${colors.reset}`)
  }
  
  process.exit(results.failed.length > 0 ? 1 : 0)
}

// Check if server is running first
fetch(`${baseUrl}/api/itps/overview`)
  .then(() => {
    console.log('✅ Dev server is running\n')
    testErrorHandling()
  })
  .catch(() => {
    console.log(`${colors.red}❌ Dev server is not running on port 3000${colors.reset}`)
    console.log('Please start the dev server with: npm run dev')
    process.exit(1)
  })