const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testProjectError() {
  console.log('Testing project creation with extra fields...\n')

  try {
    // Test 1: Insert with only valid fields
    console.log('Test 1: Valid fields only')
    const validData = {
      name: 'Test Valid ' + Date.now(),
      description: 'Test description',
      location: 'Test location',
      organization_id: '550e8400-e29b-41d4-a716-446655440001'
    }
    
    const { data: valid, error: validError } = await supabase
      .from('projects')
      .insert([validData])
      .select()
      .single()
    
    if (validError) {
      console.error('❌ Valid insert failed:', validError.message)
    } else {
      console.log('✅ Valid insert succeeded:', valid.id)
      await supabase.from('projects').delete().eq('id', valid.id)
    }

    // Test 2: Insert with extra fields (like the form is sending)
    console.log('\nTest 2: With extra fields')
    const extraData = {
      name: 'Test Extra ' + Date.now(),
      description: 'Test description',
      location: 'Test location',
      organization_id: '550e8400-e29b-41d4-a716-446655440001',
      start_date: '2025-06-21',
      end_date: '2025-06-29',
      project_number: '1'
    }
    
    const { data: extra, error: extraError } = await supabase
      .from('projects')
      .insert([extraData])
      .select()
      .single()
    
    if (extraError) {
      console.error('❌ Extra fields insert failed:', extraError.message)
      console.error('Full error:', JSON.stringify(extraError, null, 2))
    } else {
      console.log('✅ Extra fields insert succeeded:', extra.id)
      await supabase.from('projects').delete().eq('id', extra.id)
    }

    // Test 3: Check if the error is consistent
    console.log('\nTest 3: Minimal extra field')
    const minimalExtra = {
      name: 'Test Minimal ' + Date.now(),
      organization_id: '550e8400-e29b-41d4-a716-446655440001',
      end_date: '2025-06-29'
    }
    
    const { data: minimal, error: minimalError } = await supabase
      .from('projects')
      .insert([minimalExtra])
      .select()
      .single()
    
    if (minimalError) {
      console.error('❌ Minimal extra insert failed:', minimalError.message)
    } else {
      console.log('✅ Minimal extra insert succeeded:', minimal.id)
      await supabase.from('projects').delete().eq('id', minimal.id)
    }

  } catch (error) {
    console.error('Unexpected error:', error)
  }

  process.exit(0)
}

testProjectError()