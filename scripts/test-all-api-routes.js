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

async function testAllAPIRoutes() {
  console.log(`${colors.blue}🧪 TESTING ALL ITP API ROUTES${colors.reset}\n`)
  
  const results = {
    passed: [],
    failed: [],
    testItpId: null
  }
  
  try {
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
      console.log(`${colors.red}No template found for testing${colors.reset}`)
      return
    }
    
    // ========== TEST 1: Create ITP via API ==========
    console.log(`${colors.yellow}📋 TEST 1: POST /api/itps/create-from-template${colors.reset}`)
    
    const createPayload = {
      template_id: template.id,
      project_id: project?.id || null,
      lot_id: lot?.id || null,
      name: `API Test ITP - ${new Date().toISOString()}`
    }
    
    console.log('Request payload:', JSON.stringify(createPayload, null, 2))
    
    try {
      const createResponse = await fetch(`${baseUrl}/api/itps/create-from-template`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(createPayload)
      })
      
      const createResult = await createResponse.json()
      
      if (createResponse.ok && createResult.success) {
        results.testItpId = createResult.data?.id
        console.log(`${colors.green}✅ Created ITP: ${results.testItpId}${colors.reset}`)
        console.log('Response:', JSON.stringify(createResult.data, null, 2))
        results.passed.push('POST /api/itps/create-from-template')
      } else {
        console.log(`${colors.red}❌ Failed: ${createResult.error || 'Unknown error'}${colors.reset}`)
        results.failed.push('POST /api/itps/create-from-template')
        
        // Try creating directly for other tests
        const { data: directItp } = await supabase
          .rpc('create_itp_from_template', {
            p_template_id: template.id,
            p_name: 'Direct Test ITP'
          })
        results.testItpId = directItp
      }
    } catch (error) {
      console.log(`${colors.red}❌ Error: ${error.message}${colors.reset}`)
      results.failed.push('POST /api/itps/create-from-template')
    }
    
    if (!results.testItpId) {
      console.log(`${colors.red}Cannot continue without ITP ID${colors.reset}`)
      return
    }
    
    // ========== TEST 2: Get ITP Details ==========
    console.log(`\n${colors.yellow}📋 TEST 2: GET /api/itps/[id]${colors.reset}`)
    
    try {
      const getResponse = await fetch(`${baseUrl}/api/itps/${results.testItpId}`)
      const getResult = await getResponse.json()
      
      if (getResponse.ok && getResult.success) {
        console.log(`${colors.green}✅ Fetched ITP details${colors.reset}`)
        console.log(`  - Name: ${getResult.data?.name}`)
        console.log(`  - Status: ${getResult.data?.status}`)
        console.log(`  - Complexity: ${getResult.data?.complexity}`)
        console.log(`  - Items: ${getResult.data?.items?.length || 0}`)
        results.passed.push('GET /api/itps/[id]')
      } else {
        console.log(`${colors.red}❌ Failed: ${getResult.error || 'Unknown error'}${colors.reset}`)
        results.failed.push('GET /api/itps/[id]')
      }
    } catch (error) {
      console.log(`${colors.red}❌ Error: ${error.message}${colors.reset}`)
      results.failed.push('GET /api/itps/[id]')
    }
    
    // ========== TEST 3: Get ITP Items ==========
    console.log(`\n${colors.yellow}📋 TEST 3: GET /api/itps/[id]/items${colors.reset}`)
    
    try {
      const itemsResponse = await fetch(`${baseUrl}/api/itps/${results.testItpId}/items`)
      const itemsResult = await itemsResponse.json()
      
      if (itemsResponse.ok && itemsResult.success) {
        console.log(`${colors.green}✅ Fetched ${itemsResult.data?.length || 0} items${colors.reset}`)
        
        // Show first item details
        if (itemsResult.data?.length > 0) {
          const firstItem = itemsResult.data[0]
          console.log('First item:')
          console.log(`  - Description: ${firstItem.description}`)
          console.log(`  - item_number: ${firstItem.item_number}`)
          console.log(`  - Status: ${firstItem.status}`)
        }
        results.passed.push('GET /api/itps/[id]/items')
      } else {
        console.log(`${colors.red}❌ Failed: ${itemsResult.error || 'Unknown error'}${colors.reset}`)
        results.failed.push('GET /api/itps/[id]/items')
      }
    } catch (error) {
      console.log(`${colors.red}❌ Error: ${error.message}${colors.reset}`)
      results.failed.push('GET /api/itps/[id]/items')
    }
    
    // ========== TEST 4: Update ITP Item ==========
    console.log(`\n${colors.yellow}📋 TEST 4: PATCH /api/itps/[id]/items${colors.reset}`)
    
    // First get an item to update
    const { data: items } = await supabase
      .from('itp_items')
      .select('*')
      .eq('itp_id', results.testItpId)
      .limit(1)
    
    if (items && items.length > 0) {
      const itemToUpdate = items[0]
      
      const updatePayload = {
        itemId: itemToUpdate.id,
        status: 'Pass',
        inspection_notes: 'API test passed',
        inspected_date: new Date().toISOString()
      }
      
      console.log('Update payload:', JSON.stringify(updatePayload, null, 2))
      
      try {
        const updateResponse = await fetch(`${baseUrl}/api/itps/${results.testItpId}/items`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updatePayload)
        })
        
        const updateResult = await updateResponse.json()
        
        if (updateResponse.ok && updateResult.success) {
          console.log(`${colors.green}✅ Updated item successfully${colors.reset}`)
          console.log(`  - New status: ${updateResult.data?.status}`)
          results.passed.push('PATCH /api/itps/[id]/items')
        } else {
          console.log(`${colors.red}❌ Failed: ${updateResult.error || 'Unknown error'}${colors.reset}`)
          results.failed.push('PATCH /api/itps/[id]/items')
        }
      } catch (error) {
        console.log(`${colors.red}❌ Error: ${error.message}${colors.reset}`)
        results.failed.push('PATCH /api/itps/[id]/items')
      }
    } else {
      console.log(`${colors.yellow}⚠️  No items found to update${colors.reset}`)
    }
    
    // ========== TEST 5: Update ITP ==========
    console.log(`\n${colors.yellow}📋 TEST 5: PATCH /api/itps/[id]${colors.reset}`)
    
    const updateItpPayload = {
      name: 'Updated ITP Name',
      status: 'Active'
    }
    
    try {
      const updateItpResponse = await fetch(`${baseUrl}/api/itps/${results.testItpId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateItpPayload)
      })
      
      const updateItpResult = await updateItpResponse.json()
      
      if (updateItpResponse.ok && updateItpResult.success) {
        console.log(`${colors.green}✅ Updated ITP successfully${colors.reset}`)
        console.log(`  - New name: ${updateItpResult.data?.name}`)
        console.log(`  - New status: ${updateItpResult.data?.status}`)
        results.passed.push('PATCH /api/itps/[id]')
      } else {
        console.log(`${colors.red}❌ Failed: ${updateItpResult.error || 'Unknown error'}${colors.reset}`)
        results.failed.push('PATCH /api/itps/[id]')
      }
    } catch (error) {
      console.log(`${colors.red}❌ Error: ${error.message}${colors.reset}`)
      results.failed.push('PATCH /api/itps/[id]')
    }
    
    // ========== TEST 6: Get ITP Overview ==========
    console.log(`\n${colors.yellow}📋 TEST 6: GET /api/itps/overview${colors.reset}`)
    
    try {
      const overviewResponse = await fetch(`${baseUrl}/api/itps/overview`)
      const overviewResult = await overviewResponse.json()
      
      if (overviewResponse.ok && overviewResult.success) {
        console.log(`${colors.green}✅ Fetched overview: ${overviewResult.data?.length || 0} records${colors.reset}`)
        results.passed.push('GET /api/itps/overview')
        
        // Test with filters
        const filteredResponse = await fetch(`${baseUrl}/api/itps/overview?status=Draft`)
        const filteredResult = await filteredResponse.json()
        console.log(`  - Filtered by status=Draft: ${filteredResult.data?.length || 0} records`)
      } else {
        console.log(`${colors.red}❌ Failed: ${overviewResult.error || 'Unknown error'}${colors.reset}`)
        results.failed.push('GET /api/itps/overview')
      }
    } catch (error) {
      console.log(`${colors.red}❌ Error: ${error.message}${colors.reset}`)
      results.failed.push('GET /api/itps/overview')
    }
    
    // ========== TEST 7: Delete ITP ==========
    console.log(`\n${colors.yellow}📋 TEST 7: DELETE /api/itps/[id]${colors.reset}`)
    
    try {
      const deleteResponse = await fetch(`${baseUrl}/api/itps/${results.testItpId}`, {
        method: 'DELETE'
      })
      
      const deleteResult = await deleteResponse.json()
      
      if (deleteResponse.ok && deleteResult.success) {
        console.log(`${colors.green}✅ Deleted ITP successfully${colors.reset}`)
        results.passed.push('DELETE /api/itps/[id]')
        results.testItpId = null // Clear so we don't try to clean up
      } else {
        console.log(`${colors.red}❌ Failed: ${deleteResult.error || 'Unknown error'}${colors.reset}`)
        results.failed.push('DELETE /api/itps/[id]')
      }
    } catch (error) {
      console.log(`${colors.red}❌ Error: ${error.message}${colors.reset}`)
      results.failed.push('DELETE /api/itps/[id]')
    }
    
  } catch (error) {
    console.error(`\n${colors.red}❌ Unexpected error: ${error.message}${colors.reset}`)
  } finally {
    // Cleanup if needed
    if (results.testItpId) {
      console.log(`\n${colors.yellow}Cleaning up...${colors.reset}`)
      await supabase.from('itp_items').delete().eq('itp_id', results.testItpId)
      await supabase.from('itps').delete().eq('id', results.testItpId)
    }
  }
  
  // Summary
  console.log('\n' + '='.repeat(60))
  console.log(`${colors.blue}📊 API TEST SUMMARY${colors.reset}`)
  console.log('='.repeat(60))
  
  console.log(`\n${colors.green}✅ Passed: ${results.passed.length}${colors.reset}`)
  results.passed.forEach(test => console.log(`   - ${test}`))
  
  console.log(`\n${colors.red}❌ Failed: ${results.failed.length}${colors.reset}`)
  results.failed.forEach(test => console.log(`   - ${test}`))
  
  console.log('\n' + '='.repeat(60))
  
  if (results.failed.length === 0) {
    console.log(`\n${colors.green}🎉 ALL API TESTS PASSED!${colors.reset}`)
  } else {
    console.log(`\n${colors.red}⚠️  Some API tests failed.${colors.reset}`)
  }
  
  process.exit(results.failed.length > 0 ? 1 : 0)
}

// Check if server is running first
fetch(`${baseUrl}/api/itps/overview`)
  .then(() => {
    console.log('✅ Dev server is running\n')
    testAllAPIRoutes()
  })
  .catch(() => {
    console.log(`${colors.red}❌ Dev server is not running on port 3000${colors.reset}`)
    console.log('Please start the dev server with: npm run dev')
    process.exit(1)
  })