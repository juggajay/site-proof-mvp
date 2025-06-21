const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkConformanceSchema() {
  console.log('Checking conformance_records table schema...\n')

  try {
    // Get a real lot and ITP item
    const { data: lot } = await supabase
      .from('lots')
      .select('id, itp_id')
      .not('itp_id', 'is', null)
      .limit(1)
      .single()
    
    if (!lot) {
      console.log('No lot with ITP found')
      return
    }
    
    const { data: item } = await supabase
      .from('itp_items')
      .select('id')
      .eq('itp_id', lot.itp_id)
      .limit(1)
      .single()
    
    if (!item) {
      console.log('No ITP item found')
      return
    }
    
    // Try a minimal insert to discover required fields
    console.log('Testing minimal insert...')
    console.log(`Using lot ID: ${lot.id}, ITP item ID: ${item.id}`)
    const { data: test1, error: error1 } = await supabase
      .from('conformance_records')
      .insert({
        lot_id: lot.id,
        itp_item_id: item.id
      })
      .select()
      .single()
    
    if (error1) {
      console.log('Minimal insert error:', error1.message)
      
      // Try with more fields
      console.log('\nTrying with basic fields...')
      const { data: test2, error: error2 } = await supabase
        .from('conformance_records')
        .insert({
          lot_id: lot.id,
          itp_item_id: item.id,
          result: 'PASS'
        })
        .select()
        .single()
      
      if (error2) {
        console.log('Basic fields error:', error2.message)
        
        // Check if table exists at all
        console.log('\nChecking if table exists...')
        const { error: checkError } = await supabase
          .from('conformance_records')
          .select('*')
          .limit(0)
        
        if (checkError) {
          console.log('Table check error:', checkError.message)
          
          // Table might not exist, let's create it
          console.log('\nTable might not exist. Creating conformance_records table...')
          
          const { error: createError } = await supabase.rpc('create_conformance_records_table')
          
          if (createError) {
            console.log('RPC not available, table needs to be created manually')
            console.log('\nSQL to create table:')
            console.log(`
CREATE TABLE IF NOT EXISTS conformance_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lot_id UUID NOT NULL REFERENCES lots(id),
  itp_item_id UUID NOT NULL REFERENCES itp_items(id),
  result_pass_fail TEXT CHECK (result_pass_fail IN ('PASS', 'FAIL', 'NA')),
  result_numeric NUMERIC,
  result_text TEXT,
  is_non_conformance BOOLEAN DEFAULT false,
  corrective_action TEXT,
  inspector_id INTEGER,
  inspection_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(lot_id, itp_item_id)
);`)
          }
        } else {
          console.log('Table exists but has unexpected schema')
        }
      } else {
        console.log('✅ Basic insert worked! Columns found:')
        console.log(Object.keys(test2))
        
        // Clean up
        await supabase.from('conformance_records').delete().eq('id', test2.id)
      }
    } else {
      console.log('✅ Minimal insert worked! Columns found:')
      console.log(Object.keys(test1))
      
      // Clean up
      await supabase.from('conformance_records').delete().eq('id', test1.id)
    }

  } catch (error) {
    console.error('Error:', error)
  }

  process.exit(0)
}

checkConformanceSchema()