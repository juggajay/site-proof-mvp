import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: Request) {
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })
  }
  
  const results: any = {
    tables: {},
    templateItemSearch: {}
  }
  
  // Check what tables exist with "template" and "item" in the name
  const { data: tables } = await supabase
    .from('information_schema.tables')
    .select('table_name')
    .eq('table_schema', 'public')
    .or('table_name.ilike.%template%,table_name.ilike.%item%')
  
  results.relatedTables = tables?.map(t => t.table_name) || []
  
  // Try common table names for template items
  const possibleTables = [
    'itp_template_items',
    'template_items',
    'itp_checklist_items',
    'checklist_items'
  ]
  
  for (const tableName of possibleTables) {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(2)
      
      if (!error && data) {
        results.tables[tableName] = {
          exists: true,
          sampleData: data,
          count: data.length
        }
      }
    } catch (e) {
      // Table doesn't exist
    }
  }
  
  // Check for any table that might link templates to their items
  const templateId = '8b5c78e1-9fe5-4c25-bb10-278e11d28c27' // Asphalt Layer Quality Check
  
  // Try to find items related to this template in various ways
  try {
    // Check if itp_items has template_item_id that we should be using
    const { data: itemsWithTemplateItemId } = await supabase
      .from('itp_items')
      .select('DISTINCT template_item_id')
      .not('template_item_id', 'is', null)
      .limit(5)
    
    results.templateItemSearch.distinctTemplateItemIds = itemsWithTemplateItemId
  } catch (e) {
    results.templateItemSearch.error = e
  }
  
  return NextResponse.json(results)
}