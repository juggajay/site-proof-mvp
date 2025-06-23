import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  console.log('=== DEBUG ITP TEMPLATES ===')
  
  try {
    if (!supabase) {
      return NextResponse.json({ 
        error: 'Supabase not configured',
        templates: []
      })
    }

    // Check if templates exist
    const { data: templates, error: templatesError } = await supabase
      .from('itp_templates')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10)
    
    if (templatesError) {
      console.error('Templates query error:', templatesError)
      return NextResponse.json({ 
        error: templatesError.message,
        templates: []
      })
    }

    // Check template items
    const { data: items, error: itemsError } = await supabase
      .from('itp_template_items')
      .select('*')
      .limit(20)
    
    // Get count
    const { count } = await supabase
      .from('itp_templates')
      .select('*', { count: 'exact', head: true })

    return NextResponse.json({
      success: true,
      templateCount: count || 0,
      templates: templates || [],
      sampleItems: items || [],
      message: count === 0 ? 'No templates found - run seed scripts' : `Found ${count} templates`
    })
    
  } catch (error) {
    console.error('Debug error:', error)
    return NextResponse.json({ 
      error: 'Server error occurred',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}