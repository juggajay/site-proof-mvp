import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const lotId = searchParams.get('lotId') || '156f47f9-66d4-4973-8a0d-05765fa43387'
  
  console.log('🔍 DEBUG ENDPOINT: Testing lot queries for:', lotId)
  
  const results: any = {
    lotId,
    timestamp: new Date().toISOString(),
    queries: {}
  }
  
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Admin client not available' }, { status: 500 })
  }
  
  // 1. Check lot exists
  const { data: lot, error: lotError } = await supabaseAdmin
    .from('lots')
    .select('*')
    .eq('id', lotId)
    .single()
  
  results.queries.lot = {
    found: !!lot,
    error: lotError?.message,
    data: lot
  }
  
  // 2. Check assignments with status filter
  const { data: withFilter, error: filterError } = await supabaseAdmin
    .from('lot_itp_assignments')
    .select('*')
    .eq('lot_id', lotId)
    .in('status', ['pending', 'in_progress', 'completed', 'approved'])
  
  results.queries.withStatusFilter = {
    count: withFilter?.length || 0,
    error: filterError?.message,
    data: withFilter
  }
  
  // 3. Check assignments without filter
  const { data: noFilter, error: noFilterError } = await supabaseAdmin
    .from('lot_itp_assignments')
    .select('*')
    .eq('lot_id', lotId)
  
  results.queries.noFilter = {
    count: noFilter?.length || 0,
    error: noFilterError?.message,
    data: noFilter
  }
  
  // 4. Check all assignments (first 10)
  const { data: allAssignments, error: allError } = await supabaseAdmin
    .from('lot_itp_assignments')
    .select('*')
    .limit(10)
    .order('created_at', { ascending: false })
  
  results.queries.allAssignments = {
    count: allAssignments?.length || 0,
    error: allError?.message,
    data: allAssignments?.map(a => ({
      id: a.id,
      lot_id: a.lot_id,
      template_id: a.template_id,
      status: a.status,
      lot_matches: a.lot_id === lotId
    }))
  }
  
  // 5. Direct SQL query
  const { data: sqlResult, error: sqlError } = await supabaseAdmin
    .rpc('query_json', {
      query_text: `
        SELECT COUNT(*) as count 
        FROM lot_itp_assignments 
        WHERE lot_id = $1
      `,
      params: [lotId]
    })
  
  results.queries.directSql = {
    result: sqlResult,
    error: sqlError?.message
  }
  
  console.log('🔍 DEBUG ENDPOINT RESULTS:', JSON.stringify(results, null, 2))
  
  return NextResponse.json(results)
}