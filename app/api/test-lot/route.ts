import { NextResponse } from 'next/server'
import { supabase, isSupabaseEnabled } from '@/lib/supabase'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const lotId = searchParams.get('id') || '1e250900-a9ab-472b-95ba-464dd8c756cd'
  
  console.log('🔍 Test lot API called for:', lotId)
  console.log('🔍 Supabase enabled:', isSupabaseEnabled)
  console.log('🔍 Supabase client:', !!supabase)
  
  if (!supabase) {
    return NextResponse.json({ 
      error: 'Supabase not configured',
      isSupabaseEnabled,
      hasClient: false 
    })
  }
  
  try {
    // Simple query first
    const { data: lot, error } = await supabase
      .from('lots')
      .select('*')
      .eq('id', lotId)
      .single()
    
    if (error) {
      return NextResponse.json({ 
        error: 'Lot not found',
        details: error,
        lotId 
      })
    }
    
    // Try with joins
    const { data: lotWithJoins, error: joinError } = await supabase
      .from('lots')
      .select(`
        *,
        project:projects(*),
        itp:itp_templates(*)
      `)
      .eq('id', lotId)
      .single()
    
    return NextResponse.json({
      success: true,
      simpleLot: lot,
      lotWithJoins: lotWithJoins,
      joinError: joinError
    })
    
  } catch (error) {
    return NextResponse.json({ 
      error: 'Unexpected error',
      details: error 
    })
  }
}