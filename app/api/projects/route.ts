import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/actions'
import { mockProjects } from '@/lib/mock-data'

export async function GET(request: NextRequest) {
  console.log('=== API GET PROJECTS ROUTE CALLED ===')
  
  try {
    // Check authentication
    const user = await getCurrentUser()
    console.log('API Route: User authenticated for projects list:', !!user, user ? user.email : 'no user')
    
    if (!user) {
      return NextResponse.json({ 
        success: false, 
        error: 'Authentication required' 
      }, { status: 401 })
    }

    console.log('API Route: Returning projects:', mockProjects.length, mockProjects)
    
    return NextResponse.json({ 
      success: true, 
      data: mockProjects
    })
    
  } catch (error) {
    console.error('API Route error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Server error occurred' 
    }, { status: 500 })
  }
}