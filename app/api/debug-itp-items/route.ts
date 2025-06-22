import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const templateIds = [
    '8b5c78e1-9fe5-4c25-bb10-278e11d28c27', // Asphalt Layer Quality Check
    '2de7bb79-51b6-491a-abf6-02f63d78d597', // Bridge Foundation Inspection
    '7fd887dd-a451-41f3-bebc-0b0bc37b4425'  // Concrete Works ITP
  ]
  
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })
  }
  
  const results: any = {
    templates: []
  }
  
  // Check each template
  for (const templateId of templateIds) {
    const { data: template } = await supabase
      .from('itp_templates')
      .select('*')
      .eq('id', templateId)
      .single()
    
    const { data: items, error: itemsError } = await supabase
      .from('itp_items')
      .select('*')
      .eq('itp_template_id', templateId)
      .order('order_index')
    
    results.templates.push({
      template: template,
      itemsCount: items?.length || 0,
      items: items || [],
      error: itemsError
    })
  }
  
  // Also check if there are any items in the table at all
  const { data: allItems, count } = await supabase
    .from('itp_items')
    .select('*', { count: 'exact' })
    .limit(5)
  
  results.totalItemsInTable = count
  results.sampleItems = allItems
  
  return NextResponse.json(results)
}