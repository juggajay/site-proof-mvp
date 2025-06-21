import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase not configured' })
  }
  
  try {
    // First, let's check what the foreign key constraint actually is
    const { data: constraintInfo, error: constraintError } = await supabase
      .rpc('get_constraint_info', {
        constraint_name: 'lots_itp_id_fkey'
      })
      .single()
      .catch(() => ({ data: null, error: 'RPC not available' }))
    
    // Try a raw SQL query to get constraint details
    const { data: rawConstraint, error: rawError } = await supabase
      .from('information_schema.constraint_column_usage')
      .select('*')
      .eq('constraint_name', 'lots_itp_id_fkey')
      .single()
      .catch(() => ({ data: null, error: 'Cannot query information_schema' }))
    
    // Check if the lots table has itp_id column
    const { data: lotSample, error: lotError } = await supabase
      .from('lots')
      .select('*')
      .limit(1)
      .single()
    
    // Check what happens when we try to update with a known good ITP ID
    const testItpId = '8b5c78e1-9fe5-4c25-bb10-278e11d28c27'
    const testLotId = '1e250900-a9ab-472b-95ba-464dd8c756cd'
    
    const { error: updateError } = await supabase
      .from('lots')
      .update({ 
        itp_id: testItpId
      })
      .eq('id', testLotId)
    
    return NextResponse.json({
      constraintInfo,
      constraintError,
      rawConstraint,
      rawError,
      lotColumns: lotSample ? Object.keys(lotSample) : null,
      lotError,
      updateTest: {
        itpId: testItpId,
        lotId: testLotId,
        error: updateError
      }
    })
    
  } catch (error) {
    return NextResponse.json({ 
      error: 'Unexpected error',
      details: error 
    })
  }
}