import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  console.log('=== DEBUG ITP TEMPLATES ===')
  
  try {
    if (!supabase) {
      return NextResponse.json({ 
        error: 'Supabase not configured',
        templates: [],
        supabaseEnabled: false
      })
    }

    // Test basic query
    const { data: templates, error: templatesError } = await supabase
      .from('itp_templates')
      .select('*')
      .order('name')
    
    if (templatesError) {
      console.error('Templates query error:', templatesError)
      return NextResponse.json({ 
        error: templatesError.message,
        errorDetails: templatesError,
        templates: [],
        query: 'SELECT * FROM itp_templates ORDER BY name'
      })
    }

    // Check active templates
    const { data: activeTemplates, error: activeError } = await supabase
      .from('itp_templates')
      .select('*')
      .eq('is_active', true)
    
    // Check template items
    const { data: items, error: itemsError } = await supabase
      .from('itp_template_items')
      .select('*')
      .limit(20)
    
    // Get counts
    const { count: totalCount } = await supabase
      .from('itp_templates')
      .select('*', { count: 'exact', head: true })
    
    const { count: activeCount } = await supabase
      .from('itp_templates')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)
    
    const { count: globalCount } = await supabase
      .from('itp_templates')
      .select('*', { count: 'exact', head: true })
      .is('organization_id', null)

    // Test the exact query used by getITPTemplatesAction
    const { data: actionQuery, error: actionError } = await supabase
      .from('itp_templates')
      .select('*')
      .order('name')

    return NextResponse.json({
      success: true,
      supabaseEnabled: true,
      counts: {
        total: totalCount || 0,
        active: activeCount || 0,
        global: globalCount || 0
      },
      templates: templates || [],
      activeTemplates: activeTemplates || [],
      actionQueryResult: {
        data: actionQuery || [],
        error: actionError
      },
      sampleItems: items || [],
      sampleTemplate: templates && templates.length > 0 ? templates[0] : null,
      message: totalCount === 0 ? 'No templates found - run seed scripts' : `Found ${totalCount} templates (${activeCount} active, ${globalCount} global)`
    })
    
  } catch (error) {
    console.error('Debug error:', error)
    return NextResponse.json({ 
      error: 'Server error occurred',
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}