import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const lotId = searchParams.get('lotId') || '2924e1e1-9d03-4b34-8e25-24cbb4d51836'
  
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })
  }
  
  // Test various queries
  const results: any = {
    lotId,
    queries: {}
  }
  
  // Query 1: Get lot
  const { data: lot, error: lotError } = await supabase
    .from('lots')
    .select('*')
    .eq('id', lotId)
    .single()
  
  results.queries.lot = { data: lot, error: lotError }
  
  // Query 2: Get junction table records
  const { data: junctionRecords, error: junctionError } = await supabase
    .from('lot_itp_templates')
    .select('*')
    .eq('lot_id', lotId)
  
  results.queries.junctionRecords = { 
    count: junctionRecords?.length || 0,
    data: junctionRecords, 
    error: junctionError 
  }
  
  // Query 3: Get junction records with is_active
  const { data: activeRecords, error: activeError } = await supabase
    .from('lot_itp_templates')
    .select('*')
    .eq('lot_id', lotId)
    .eq('is_active', true)
  
  results.queries.activeRecords = { 
    count: activeRecords?.length || 0,
    data: activeRecords, 
    error: activeError 
  }
  
  // Query 4: Get with template details
  const { data: withTemplates, error: templateError } = await supabase
    .from('lot_itp_templates')
    .select(`
      *,
      itp_templates (*)
    `)
    .eq('lot_id', lotId)
    .eq('is_active', true)
  
  results.queries.withTemplates = { 
    count: withTemplates?.length || 0,
    data: withTemplates, 
    error: templateError 
  }
  
  return NextResponse.json(results)
}