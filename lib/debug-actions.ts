'use server'

import { supabase } from '@/lib/supabase'

export async function debugLotITPTemplates(lotId: string) {
  if (!supabase) {
    return { error: 'Supabase not configured' }
  }
  
  const debug: any = {
    lotId,
    queries: {}
  }
  
  // Query 1: Basic query
  const { data: basicQuery, error: basicError } = await supabase
    .from('lot_itp_templates')
    .select('*')
    .eq('lot_id', lotId)
  
  debug.queries.basic = {
    data: basicQuery,
    error: basicError,
    count: basicQuery?.length || 0
  }
  
  // Query 2: With is_active filter
  const { data: activeQuery, error: activeError } = await supabase
    .from('lot_itp_templates')
    .select('*')
    .eq('lot_id', lotId)
    .eq('is_active', true)
  
  debug.queries.withActive = {
    data: activeQuery,
    error: activeError,
    count: activeQuery?.length || 0
  }
  
  // Query 3: All records (first 5)
  const { data: allRecords } = await supabase
    .from('lot_itp_templates')
    .select('*')
    .limit(5)
  
  debug.queries.allRecords = {
    data: allRecords,
    count: allRecords?.length || 0
  }
  
  // Query 4: With ITP template details
  const { data: withTemplates, error: templateError } = await supabase
    .from('lot_itp_templates')
    .select(`
      *,
      itp_templates (
        id,
        name,
        description
      )
    `)
    .eq('lot_id', lotId)
    .eq('is_active', true)
  
  debug.queries.withTemplates = {
    data: withTemplates,
    error: templateError,
    count: withTemplates?.length || 0
  }
  
  return debug
}