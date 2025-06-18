import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/actions'
import { mockProjects } from '@/lib/mock-data'
import { Project } from '@/types/database'

export async function POST(request: NextRequest) {
  console.log('=== API CREATE PROJECT ROUTE CALLED ===')
  
  try {
    // Check authentication
    const user = await getCurrentUser()
    console.log('API Route: User authenticated:', !!user, user ? user.email : 'no user')
    
    if (!user) {
      return NextResponse.json({ 
        success: false, 
        error: 'Authentication required' 
      }, { status: 401 })
    }

    const body = await request.json()
    console.log('API Route: Request body:', body)
    
    if (!body.name) {
      return NextResponse.json({ 
        success: false, 
        error: 'Project name is required' 
      }, { status: 400 })
    }

    // Create new project - generate new numeric ID
    const numericIds = mockProjects.map(p => typeof p.id === 'number' ? p.id : 0)
    const newProject: Project = {
      id: Math.max(0, ...numericIds) + 1,
      name: body.name,
      project_number: body.projectNumber || undefined,
      description: body.description || undefined,
      location: body.location || undefined,
      start_date: body.startDate || undefined,
      end_date: body.endDate || undefined,
      status: 'active',
      organization_id: 1,
      created_by: user.id,
      project_manager_id: user.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    mockProjects.push(newProject)
    console.log('API Route: Project created:', newProject)
    
    return NextResponse.json({ 
      success: true, 
      data: newProject, 
      message: 'Project created successfully' 
    })
    
  } catch (error) {
    console.error('API Route error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Server error occurred' 
    }, { status: 500 })
  }
}