const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testNewITPSchema() {
  console.log('🧪 Testing New ITP Schema Implementation\n')
  
  const results = {
    passed: [],
    failed: []
  }

  try {
    // Test 1: Get a template to use for testing
    console.log('📋 Test 1: Fetching ITP templates...')
    const { data: templates, error: templateError } = await supabase
      .from('itp_templates')
      .select('*')
      .limit(1)
    
    if (templateError || !templates?.length) {
      results.failed.push('Failed to fetch ITP templates')
      console.log('❌ Failed:', templateError?.message || 'No templates found')
      return
    }
    
    const testTemplate = templates[0]
    console.log('✅ Found template:', testTemplate.name)
    results.passed.push('Fetch ITP templates')

    // Test 2: Get a project and lot for testing
    console.log('\n📋 Test 2: Fetching test project and lot...')
    const { data: lots, error: lotError } = await supabase
      .from('lots')
      .select('*, project:projects(*)')
      .limit(1)
    
    if (lotError || !lots?.length) {
      results.failed.push('Failed to fetch test lot')
      console.log('❌ Failed:', lotError?.message || 'No lots found')
      return
    }
    
    const testLot = lots[0]
    const testProject = testLot.project
    console.log('✅ Found lot:', testLot.lot_number, 'in project:', testProject?.name)
    results.passed.push('Fetch test lot and project')

    // Test 3: Create ITP from template using the function
    console.log('\n📋 Test 3: Creating ITP from template...')
    const { data: newItpId, error: createError } = await supabase
      .rpc('create_itp_from_template', {
        p_template_id: testTemplate.id,
        p_project_id: testProject?.id || null,
        p_lot_id: testLot.id,
        p_name: `Test ITP - ${new Date().toISOString()}`
      })
    
    if (createError) {
      results.failed.push('Failed to create ITP from template')
      console.log('❌ Failed:', createError.message)
    } else {
      console.log('✅ Created ITP with ID:', newItpId)
      results.passed.push('Create ITP from template')

      // Test 4: Fetch the created ITP with details
      console.log('\n📋 Test 4: Fetching ITP with details...')
      const { data: itp, error: fetchError } = await supabase
        .from('itps')
        .select(`
          *,
          template:itp_templates(*),
          items:itp_items(*)
        `)
        .eq('id', newItpId)
        .single()
      
      if (fetchError) {
        results.failed.push('Failed to fetch ITP details')
        console.log('❌ Failed:', fetchError.message)
      } else {
        console.log('✅ Fetched ITP:', itp.name)
        console.log('  - Status:', itp.status)
        console.log('  - Items:', itp.items?.length || 0)
        console.log('  - Template:', itp.template?.name)
        results.passed.push('Fetch ITP with details')

        // Test 5: Update an ITP item status
        if (itp.items?.length > 0) {
          console.log('\n📋 Test 5: Updating ITP item status...')
          const testItem = itp.items[0]
          
          const { data: updatedItem, error: updateError } = await supabase
            .from('itp_items')
            .update({
              status: 'Pass',
              inspection_notes: 'Test inspection passed',
              inspected_date: new Date().toISOString()
            })
            .eq('id', testItem.id)
            .select()
            .single()
          
          if (updateError) {
            results.failed.push('Failed to update ITP item')
            console.log('❌ Failed:', updateError.message)
          } else {
            console.log('✅ Updated item:', testItem.description)
            console.log('  - New status:', updatedItem.status)
            results.passed.push('Update ITP item status')

            // Test 6: Check if ITP status was updated by trigger
            console.log('\n📋 Test 6: Checking ITP status update trigger...')
            const { data: updatedItp, error: statusError } = await supabase
              .from('itps')
              .select('status')
              .eq('id', newItpId)
              .single()
            
            if (statusError) {
              results.failed.push('Failed to check ITP status')
              console.log('❌ Failed:', statusError.message)
            } else {
              console.log('✅ ITP status after item update:', updatedItp.status)
              results.passed.push('ITP status trigger')
            }
          }
        }
      }

      // Test 7: Check v_itp_overview view
      console.log('\n📋 Test 7: Testing v_itp_overview view...')
      const { data: overview, error: viewError } = await supabase
        .from('v_itp_overview')
        .select('*')
        .eq('id', newItpId)
        .single()
      
      if (viewError) {
        results.failed.push('Failed to query v_itp_overview')
        console.log('❌ Failed:', viewError.message)
      } else {
        console.log('✅ ITP Overview:')
        console.log('  - Name:', overview.itp_name)
        console.log('  - Template:', overview.template_name)
        console.log('  - Total items:', overview.total_items)
        console.log('  - Completion %:', overview.completion_percentage)
        results.passed.push('Query v_itp_overview view')
      }

      // Test 8: Create an assignment
      console.log('\n📋 Test 8: Creating ITP assignment...')
      const { data: assignment, error: assignError } = await supabase
        .from('itp_assignments')
        .insert({
          itp_id: newItpId,
          assigned_to: '00000000-0000-0000-0000-000000000000', // Placeholder user ID
          assigned_by: '00000000-0000-0000-0000-000000000000',
          role: 'Inspector',
          scheduled_date: new Date().toISOString().split('T')[0],
          notes: 'Test assignment'
        })
        .select()
        .single()
      
      if (assignError) {
        results.failed.push('Failed to create assignment')
        console.log('❌ Failed:', assignError.message)
      } else {
        console.log('✅ Created assignment:', assignment.id)
        results.passed.push('Create ITP assignment')
      }
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
  
  process.exit(results.failed.length > 0 ? 1 : 0)
}

testNewITPSchema()