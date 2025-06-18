import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  console.log('=== API ROUTE CALLED ===')
  
  try {
    const body = await request.json()
    console.log('Request body:', body)
    
    if (!body.name) {
      return NextResponse.json({ success: false, error: 'Project name is required' })
    }

    // Simulate creating a project
    const project = {
      id: Date.now(),
      name: body.name,
      created_at: new Date().toISOString()
    }

    console.log('Created project:', project)
    
    return NextResponse.json({ 
      success: true, 
      data: project, 
      message: 'Project created successfully' 
    })
    
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Server error occurred' 
    })
  }
}