import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const project_id = searchParams.get('project_id')
    const lot_id = searchParams.get('lot_id')
    const status = searchParams.get('status')
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // Build query for the view
    let query = supabase.from('v_itp_overview').select('*')
    
    // Apply filters
    if (project_id) {
      query = query.eq('project_id', project_id)
    }
    if (lot_id) {
      query = query.eq('lot_id', lot_id)
    }
    if (status) {
      query = query.eq('status', status)
    }
    
    // Order by creation date
    query = query.order('created_at', { ascending: false })
    
    const { data, error } = await query
    
    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ 
        success: false, 
        error: error.message 
      }, { status: 400 })
    }
    
    return NextResponse.json({ 
      success: true, 
      data 
    })
    
  } catch (error) {
    console.error('API Route error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Server error occurred' 
    }, { status: 500 })
  }
}