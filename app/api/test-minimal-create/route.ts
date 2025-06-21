import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  console.log('=== TEST MINIMAL CREATE ===')
  
  try {
    const body = await request.json()
    console.log('Request body:', JSON.stringify(body, null, 2))
    console.log('Body keys:', Object.keys(body))
    
    // Only use fields that exist
    const validData = {
      name: body.name || 'Test Project',
      description: body.description || null,
      location: body.location || null,
      organization_id: '550e8400-e29b-41d4-a716-446655440001'
    }
    
    console.log('Valid data:', JSON.stringify(validData, null, 2))
    
    if (supabase) {
      const { data, error } = await supabase
        .from('projects')
        .insert([validData])
        .select()
        .single()
      
      if (error) {
        console.error('Supabase error:', error)
        return NextResponse.json({ 
          success: false, 
          error: error.message,
          errorDetails: error
        })
      }
      
      return NextResponse.json({ 
        success: true, 
        data,
        message: 'Project created successfully'
      })
    } else {
      return NextResponse.json({ 
        success: false, 
        error: 'Supabase not configured'
      })
    }
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}