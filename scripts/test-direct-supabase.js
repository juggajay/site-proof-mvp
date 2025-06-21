const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// Create a fresh client instance
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  db: {
    schema: 'public'
  },
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
})

async function testDirectSupabase() {
  console.log('Testing direct Supabase project creation...\n')

  try {
    // Test 1: Simple insert with minimal fields
    console.log('Test 1: Minimal fields insert')
    const test1Data = {
      name: 'Direct Test 1 - ' + Date.now(),
      organization_id: '550e8400-e29b-41d4-a716-446655440001'
    }
    
    const { data: test1, error: error1 } = await supabase
      .from('projects')
      .insert([test1Data])
      .select()
      .single()
    
    if (error1) {
      console.error('❌ Test 1 failed:', error1.message)
      console.error('Full error:', JSON.stringify(error1, null, 2))
    } else {
      console.log('✅ Test 1 successful:', test1.id)
      await supabase.from('projects').delete().eq('id', test1.id)
    }

    // Test 2: Insert with all valid fields
    console.log('\nTest 2: All valid fields insert')
    const test2Data = {
      name: 'Direct Test 2 - ' + Date.now(),
      description: 'Test description',
      location: 'Test location',
      organization_id: '550e8400-e29b-41d4-a716-446655440001',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    const { data: test2, error: error2 } = await supabase
      .from('projects')
      .insert([test2Data])
      .select()
      .single()
    
    if (error2) {
      console.error('❌ Test 2 failed:', error2.message)
    } else {
      console.log('✅ Test 2 successful:', test2.id)
      await supabase.from('projects').delete().eq('id', test2.id)
    }

    // Test 3: Try to reproduce the error
    console.log('\nTest 3: Testing with problematic fields')
    const test3Data = {
      name: 'Direct Test 3 - ' + Date.now(),
      organization_id: '550e8400-e29b-41d4-a716-446655440001',
      end_date: '2024-12-31' // This should cause an error
    }
    
    const { data: test3, error: error3 } = await supabase
      .from('projects')
      .insert([test3Data])
      .select()
      .single()
    
    if (error3) {
      console.log('✅ Test 3 correctly failed with error:', error3.message)
    } else {
      console.log('❌ Test 3 unexpectedly succeeded')
      await supabase.from('projects').delete().eq('id', test3.id)
    }

    // Test 4: Using upsert instead of insert
    console.log('\nTest 4: Using upsert')
    const test4Data = {
      name: 'Direct Test 4 - ' + Date.now(),
      organization_id: '550e8400-e29b-41d4-a716-446655440001'
    }
    
    const { data: test4, error: error4 } = await supabase
      .from('projects')
      .upsert([test4Data])
      .select()
      .single()
    
    if (error4) {
      console.error('❌ Test 4 failed:', error4.message)
    } else {
      console.log('✅ Test 4 successful:', test4.id)
      await supabase.from('projects').delete().eq('id', test4.id)
    }

  } catch (error) {
    console.error('Unexpected error:', error)
  }

  process.exit(0)
}

testDirectSupabase()