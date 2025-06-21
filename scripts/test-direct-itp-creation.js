const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testDirectITPCreation() {
  console.log('🧪 Testing Direct ITP Creation (Workaround)\n')
  
  const results = {
    passed: [],
    failed: []
  }

  try {
    // Get a template with items
    const { data: template } = await supabase
      .from('itp_templates')
      .select('*, template_items:itp_template_items(*)')
      .eq('name', 'Concrete Works ITP')
      .single()
    
    console.log('Using template:', template.name, 'with', template.template_items?.length || 0, 'items')
    
    // Get a test lot
    const { data: lot } = await supabase
      .from('lots')
      .select('*, project:projects(*)')
      .limit(1)
      .single()
    
    console.log('Using lot:', lot.lot_number)
    
    // Step 1: Create ITP manually
    console.log('\n📋 Creating ITP manually...')
    const itpData = {
      name: `Test ITP - ${new Date().toISOString()}`,
      description: template.description,
      template_id: template.id,
      project_id: lot.project_id,
      lot_id: lot.id,
      status: 'Draft', // Try with uppercase
      category: template.category,
      complexity: 'Medium', // Use correct complexity value
      organization_id: template.organization_id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    const { data: newItp, error: itpError } = await supabase
      .from('itps')
      .insert(itpData)
      .select()
      .single()
    
    if (itpError) {
      console.log('❌ Failed to create ITP:', itpError.message)
      results.failed.push('Create ITP')
      return
    }
    
    console.log('✅ Created ITP:', newItp.id)
    results.passed.push('Create ITP')
    
    // Step 2: Copy template items
    console.log('\n📋 Copying template items...')
    if (template.template_items?.length > 0) {
      const itemsToInsert = template.template_items.map((item, index) => ({
        itp_id: newItp.id,
        template_item_id: item.id,
        item_number: 'PASS_FAIL', // Must use enum value, not sequential number
        description: item.description,
        acceptance_criteria: item.acceptance_criteria,
        inspection_method: item.inspection_method,
        is_mandatory: item.is_mandatory,
        sort_order: item.sort_order || index + 1,
        status: 'Pending',
        created_at: new Date().toISOString()
      }))
      
      const { error: itemsError } = await supabase
        .from('itp_items')
        .insert(itemsToInsert)
      
      if (itemsError) {
        console.log('❌ Failed to create items:', itemsError.message)
        results.failed.push('Create ITP items')
      } else {
        console.log('✅ Created', itemsToInsert.length, 'items')
        results.passed.push('Create ITP items')
      }
    }
    
    // Step 3: Test fetching with relationships
    console.log('\n📋 Testing fetch with relationships...')
    const { data: fetchedItp, error: fetchError } = await supabase
      .from('itps')
      .select(`
        *,
        template:itp_templates(*),
        project:projects(*),
        lot:lots(*),
        items:itp_items(*)
      `)
      .eq('id', newItp.id)
      .single()
    
    if (fetchError) {
      console.log('❌ Failed to fetch ITP:', fetchError.message)
      results.failed.push('Fetch ITP with relationships')
    } else {
      console.log('✅ Fetched ITP with:')
      console.log('  - Template:', fetchedItp.template?.name)
      console.log('  - Project:', fetchedItp.project?.name)
      console.log('  - Lot:', fetchedItp.lot?.lot_number)
      console.log('  - Items:', fetchedItp.items?.length)
      results.passed.push('Fetch ITP with relationships')
    }
    
    // Step 4: Test updating an item
    if (fetchedItp?.items?.length > 0) {
      console.log('\n📋 Testing item status update...')
      const itemToUpdate = fetchedItp.items[0]
      
      const { data: updatedItem, error: updateError } = await supabase
        .from('itp_items')
        .update({
          status: 'Pass',
          inspection_notes: 'Test passed',
          inspected_date: new Date().toISOString()
        })
        .eq('id', itemToUpdate.id)
        .select()
        .single()
      
      if (updateError) {
        console.log('❌ Failed to update item:', updateError.message)
        results.failed.push('Update item status')
      } else {
        console.log('✅ Updated item to status:', updatedItem.status)
        results.passed.push('Update item status')
        
        // Check if trigger updated ITP status
        const { data: updatedItp } = await supabase
          .from('itps')
          .select('status')
          .eq('id', newItp.id)
          .single()
        
        console.log('  - ITP status after update:', updatedItp?.status)
      }
    }
    
    // Step 5: Test views
    console.log('\n📋 Testing database views...')
    const { data: overviewData, error: overviewError } = await supabase
      .from('v_itp_overview')
      .select('*')
      .eq('id', newItp.id)
      .single()
    
    if (overviewError) {
      console.log('❌ Failed to query overview:', overviewError.message)
      results.failed.push('Query v_itp_overview')
    } else {
      console.log('✅ Overview data:')
      console.log('  - Completion:', overviewData.completion_percentage + '%')
      console.log('  - Total items:', overviewData.total_items)
      console.log('  - Passed items:', overviewData.passed_items)
      results.passed.push('Query v_itp_overview')
    }
    
    // Cleanup
    console.log('\n📋 Cleaning up test data...')
    await supabase.from('itp_items').delete().eq('itp_id', newItp.id)
    await supabase.from('itps').delete().eq('id', newItp.id)
    console.log('✅ Cleanup complete')
    
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
    console.log('\n🎉 All tests passed! The new ITP schema is working correctly.')
    console.log('\n⚠️  NOTE: The create_itp_from_template function needs to be updated')
    console.log('   to include complexity field. See scripts/fix-create-itp-function.sql')
  }
  
  process.exit(results.failed.length > 0 ? 1 : 0)
}

testDirectITPCreation()