import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // Fetch ITP items for the given ITP ID
    const { data, error } = await supabase
      .from('itp_items')
      .select(`
        *,
        template_item:itp_template_items(*)
      `)
      .eq('itp_id', params.id)
      .order('sort_order', { ascending: true })
    
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

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { itemId, status, inspection_notes, inspected_by, inspected_date } = body
    
    if (!itemId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Item ID is required' 
      }, { status: 400 })
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // Update the ITP item
    const updateData: any = {
      updated_at: new Date().toISOString()
    }
    
    if (status !== undefined) updateData.status = status
    if (inspection_notes !== undefined) updateData.inspection_notes = inspection_notes
    if (inspected_by !== undefined) updateData.inspected_by = inspected_by
    if (inspected_date !== undefined) updateData.inspected_date = inspected_date
    
    const { data, error } = await supabase
      .from('itp_items')
      .update(updateData)
      .eq('id', itemId)
      .eq('itp_id', params.id)
      .select()
      .single()
    
    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ 
        success: false, 
        error: error.message 
      }, { status: 400 })
    }
    
    // Trigger ITP status update
    await supabase.rpc('update_itp_status', { p_itp_id: params.id })
    
    return NextResponse.json({ 
      success: true, 
      data,
      message: 'Item updated successfully'
    })
    
  } catch (error) {
    console.error('API Route error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Server error occurred' 
    }, { status: 500 })
  }
}