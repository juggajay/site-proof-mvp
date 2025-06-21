const fetch = require('node-fetch')
require('dotenv').config({ path: '.env.local' })

const baseUrl = 'http://localhost:3000'

async function testAPIRoutes() {
  console.log('🧪 Testing New ITP API Routes\n')
  
  const results = {
    passed: [],
    failed: []
  }

  try {
    // First, let's test creating an ITP directly via the API
    console.log('📋 Test 1: Testing direct ITP creation via API...')
    
    const createResponse = await fetch(`${baseUrl}/api/itps/create-from-template`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        template_id: '7fd887dd-a451-41f3-bebc-0b0bc37b4425', // Concrete Works ITP
        project_id: 'e262b3bc-2f16-4056-847a-fc26285d01b0',
        lot_id: 'ccb46536-0e8a-4a02-b293-f5a0d0669b68',
        name: 'API Test ITP'
      })
    })

    const createResult = await createResponse.json()
    
    if (createResponse.ok && createResult.success) {
      console.log('✅ ITP created via API:', createResult.data?.id)
      results.passed.push('Create ITP via API')
      
      const itpId = createResult.data.id
      
      // Test 2: Fetch ITP details
      console.log('\n📋 Test 2: Fetching ITP details via API...')
      const getResponse = await fetch(`${baseUrl}/api/itps/${itpId}`)
      const getResult = await getResponse.json()
      
      if (getResponse.ok && getResult.success) {
        console.log('✅ Fetched ITP:', getResult.data?.name)
        console.log('  - Status:', getResult.data?.status)
        console.log('  - Items:', getResult.data?.items?.length || 0)
        results.passed.push('Fetch ITP details via API')
        
        // Test 3: Update an item
        if (getResult.data?.items?.length > 0) {
          console.log('\n📋 Test 3: Updating ITP item via API...')
          const item = getResult.data.items[0]
          
          const updateResponse = await fetch(`${baseUrl}/api/itps/${itpId}/items`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              itemId: item.id,
              status: 'Pass',
              inspection_notes: 'API test passed'
            })
          })
          
          const updateResult = await updateResponse.json()
          
          if (updateResponse.ok && updateResult.success) {
            console.log('✅ Updated item:', item.description)
            results.passed.push('Update ITP item via API')
          } else {
            console.log('❌ Failed to update item:', updateResult.error)
            results.failed.push('Update ITP item via API')
          }
        }
        
        // Test 4: Get ITP overview
        console.log('\n📋 Test 4: Testing ITP overview API...')
        const overviewResponse = await fetch(`${baseUrl}/api/itps/overview?lot_id=${getResult.data.lot_id}`)
        const overviewResult = await overviewResponse.json()
        
        if (overviewResponse.ok && overviewResult.success) {
          console.log('✅ ITP overview fetched:', overviewResult.data?.length || 0, 'records')
          results.passed.push('Fetch ITP overview via API')
        } else {
          console.log('❌ Failed to fetch overview:', overviewResult.error)
          results.failed.push('Fetch ITP overview via API')
        }
        
      } else {
        console.log('❌ Failed to fetch ITP:', getResult.error)
        results.failed.push('Fetch ITP details via API')
      }
      
    } else {
      console.log('❌ Failed to create ITP:', createResult.error)
      results.failed.push('Create ITP via API')
    }

  } catch (error) {
    console.error('\n❌ API test error:', error.message)
    console.log('\nMake sure the Next.js development server is running on port 3000')
    results.failed.push('API connection error')
  }

  // Summary
  console.log('\n' + '='.repeat(50))
  console.log('📊 API TEST SUMMARY')
  console.log('='.repeat(50))
  console.log(`✅ Passed: ${results.passed.length}`)
  results.passed.forEach(test => console.log(`   - ${test}`))
  console.log(`\n❌ Failed: ${results.failed.length}`)
  results.failed.forEach(test => console.log(`   - ${test}`))
  console.log('='.repeat(50))
  
  process.exit(results.failed.length > 0 ? 1 : 0)
}

// Check if fetch is available
if (!globalThis.fetch) {
  globalThis.fetch = fetch
}

testAPIRoutes()