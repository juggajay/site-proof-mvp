'use server'

import { supabase } from '@/lib/supabase'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function debugLotITPTemplates(lotId: string) {
  const client = supabaseAdmin || supabase
  
  if (!client) {
    return { error: 'Supabase not configured' }
  }
  
  console.log('🔍 debugLotITPTemplates using client:', supabaseAdmin ? 'admin' : 'regular')
  
  const debug: any = {
    lotId,
    queries: {}
  }
  
  // Query 1: Basic query (NEW TABLE)
  const { data: basicQuery, error: basicError } = await client
    .from('lot_itp_assignments')
    .select('*')
    .eq('lot_id', lotId)
  
  debug.queries.basic = {
    data: basicQuery,
    error: basicError,
    count: basicQuery?.length || 0
  }
  
  // Query 2: With status filter (what the app uses)
  const { data: activeQuery, error: activeError } = await client
    .from('lot_itp_assignments')
    .select('*')
    .eq('lot_id', lotId)
    .in('status', ['pending', 'in_progress', 'completed', 'approved'])
  
  debug.queries.withStatusFilter = {
    data: activeQuery,
    error: activeError,
    count: activeQuery?.length || 0
  }
  
  // Query 3: All records (first 5)
  const { data: allRecords } = await client
    .from('lot_itp_assignments')
    .select('*')
    .limit(5)
  
  debug.queries.allRecords = {
    data: allRecords,
    count: allRecords?.length || 0
  }
  
  // Query 4: With ITP template details
  const { data: withTemplates, error: templateError } = await client
    .from('lot_itp_assignments')
    .select(`
      *,
      template:itp_templates (
        id,
        name,
        description
      )
    `)
    .eq('lot_id', lotId)
    .in('status', ['pending', 'in_progress', 'completed', 'approved'])
  
  debug.queries.withTemplates = {
    data: withTemplates,
    error: templateError,
    count: withTemplates?.length || 0
  }
  
  // Query 5: Check OLD table too
  const { data: oldTableData } = await client
    .from('lot_itp_templates')
    .select('*')
    .eq('lot_id', lotId)
  
  debug.queries.oldTable = {
    data: oldTableData,
    count: oldTableData?.length || 0
  }
  
  return debug
}