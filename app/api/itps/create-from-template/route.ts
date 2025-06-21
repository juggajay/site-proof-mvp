import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST(request: NextRequest) {
  console.log('=== CREATE ITP FROM TEMPLATE API ROUTE ===')
  
  try {
    const body = await request.json()
    console.log('Request body:', body)
    
    const { template_id, project_id, lot_id, name } = body
    
    if (!template_id) {
      return NextResponse.json({ 
        success: false, 
        error: 'Template ID is required' 
      }, { status: 400 })
    }
    
    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // Call the database function to create ITP from template
    const { data, error } = await supabase
      .rpc('create_itp_from_template', {
        p_template_id: template_id,
        p_project_id: project_id || null,
        p_lot_id: lot_id || null,
        p_name: name || null
      })
    
    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ 
        success: false, 
        error: error.message 
      }, { status: 400 })
    }
    
    console.log('ITP created successfully:', data)
    
    // Fetch the created ITP with details
    const { data: itpDetails, error: fetchError } = await supabase
      .from('itps')
      .select(`
        *,
        template:itp_templates(*),
        items:itp_items(*)
      `)
      .eq('id', data)
      .single()
    
    if (fetchError) {
      console.error('Error fetching ITP details:', fetchError)
      return NextResponse.json({ 
        success: true, 
        data: { id: data },
        message: 'ITP created successfully'
      })
    }
    
    return NextResponse.json({ 
      success: true, 
      data: itpDetails,
      message: 'ITP created successfully from template'
    })
    
  } catch (error) {
    console.error('API Route error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Server error occurred' 
    }, { status: 500 })
  }
}