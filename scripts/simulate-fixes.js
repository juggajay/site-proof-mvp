const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function simulateFixes() {
  console.log('🔧 Simulating fixes (data cleanup only)\n')
  console.log('NOTE: This only updates data. The function fix must be applied in Supabase SQL editor.\n')
  
  try {
    // Step 1: Update complexity values to proper case
    console.log('📋 Step 1: Updating complexity values to proper case...')
    
    // First, let's see what we have
    const { data: beforeData } = await supabase
      .from('itps')
      .select('id, complexity')
      .not('complexity', 'is', null)
    
    console.log('Before update:')
    const beforeCounts = {}
    beforeData?.forEach(row => {
      beforeCounts[row.complexity] = (beforeCounts[row.complexity] || 0) + 1
    })
    console.log(beforeCounts)
    
    // Update each record individually (since we can't use CASE in Supabase client)
    let updateCount = 0
    for (const row of beforeData || []) {
      let newComplexity = row.complexity
      
      // Map to correct values
      const mapping = {
        'low': 'Simple',
        'medium': 'Moderate', 
        'high': 'Complex',
        'simple': 'Simple',
        'moderate': 'Moderate',
        'complex': 'Complex',
        'Low': 'Simple',
        'Medium': 'Moderate',
        'High': 'Complex'
      }
      
      if (mapping[row.complexity]) {
        newComplexity = mapping[row.complexity]
        
        const { error } = await supabase
          .from('itps')
          .update({ complexity: newComplexity })
          .eq('id', row.id)
        
        if (!error) {
          updateCount++
        } else {
          console.log(`Failed to update ${row.id}:`, error.message)
        }
      }
    }
    
    console.log(`✅ Updated ${updateCount} records`)
    
    // Verify the update
    const { data: afterData } = await supabase
      .from('itps')
      .select('complexity')
      .not('complexity', 'is', null)
    
    console.log('\nAfter update:')
    const afterCounts = {}
    afterData?.forEach(row => {
      afterCounts[row.complexity] = (afterCounts[row.complexity] || 0) + 1
    })
    console.log(afterCounts)
    
    // Step 2: Check status values
    console.log('\n📋 Step 2: Checking status values...')
    const { data: statusData } = await supabase
      .from('itps')
      .select('status')
      .limit(10)
    
    const uniqueStatuses = [...new Set(statusData?.map(r => r.status) || [])]
    console.log('Current status values:', uniqueStatuses)
    
    if (uniqueStatuses.some(s => s !== s.toLowerCase())) {
      console.log('⚠️  Some status values are not lowercase. You may need to update these too.')
    }
    
    // Step 3: Test if we can create an ITP now
    console.log('\n📋 Step 3: Testing ITP creation with fixed values...')
    
    const testData = {
      name: 'Test ITP with Fixed Values',
      status: 'Draft', // Try with current case
      complexity: 'Moderate', // Use proper case
      organization_id: '00000000-0000-0000-0000-000000000000',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    const { data: testItp, error: testError } = await supabase
      .from('itps')
      .insert(testData)
      .select()
      .single()
    
    if (testError) {
      console.log('❌ Still cannot create ITP:', testError.message)
      console.log('\nThis might be because:')
      console.log('1. The function still needs to be fixed in Supabase')
      console.log('2. Status might need to be lowercase')
      console.log('3. Other constraints might be in play')
    } else {
      console.log('✅ Successfully created test ITP!')
      console.log('   ID:', testItp.id)
      console.log('   Complexity:', testItp.complexity)
      console.log('   Status:', testItp.status)
      
      // Clean up
      await supabase.from('itps').delete().eq('id', testItp.id)
      console.log('   (Test ITP deleted)')
    }
    
    console.log('\n' + '='.repeat(50))
    console.log('📌 NEXT STEPS:')
    console.log('='.repeat(50))
    console.log('1. Run URGENT-FIX-complexity-case-and-function.sql in Supabase SQL editor')
    console.log('2. This will fix the create_itp_from_template function')
    console.log('3. Then run: node scripts/test-after-fixes.js')
    console.log('='.repeat(50))
    
  } catch (error) {
    console.error('Error:', error)
  }
  
  process.exit(0)
}

simulateFixes()