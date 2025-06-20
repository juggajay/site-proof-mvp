import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/actions'
import { supabase } from '@/lib/supabase'

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

    // Use Supabase to fetch projects
    if (supabase) {
      console.log('API Route: Fetching projects from Supabase...')
      const { data: projects, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) {
        console.error('Supabase error:', error)
        return NextResponse.json({ 
          success: false, 
          error: error.message 
        }, { status: 500 })
      }
      
      console.log('API Route: Returning Supabase projects:', projects?.length || 0)
      return NextResponse.json({ 
        success: true, 
        data: projects || [],
        source: 'supabase'
      })
    } else {
      // Fallback if Supabase is not configured
      const { mockProjects } = await import('@/lib/mock-data')
      console.log('API Route: Supabase not configured, using mock data')
      return NextResponse.json({ 
        success: true, 
        data: mockProjects,
        source: 'mock'
      })
    }
    
  } catch (error) {
    console.error('API Route error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Server error occurred' 
    }, { status: 500 })
  }
}