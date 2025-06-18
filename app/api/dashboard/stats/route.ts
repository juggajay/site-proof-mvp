import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/actions'
import { mockProjects, mockLots, mockConformanceRecords } from '@/lib/mock-data'
import { ProjectStats } from '@/types/database'

export async function GET(request: NextRequest) {
  console.log('=== API GET DASHBOARD STATS ROUTE CALLED ===')
  
  try {
    // Check authentication
    const user = await getCurrentUser()
    console.log('API Route: User authenticated for stats:', !!user, user ? user.email : 'no user')
    
    if (!user) {
      return NextResponse.json({ 
        success: false, 
        error: 'Authentication required' 
      }, { status: 401 })
    }

    const stats: ProjectStats = {
      total_projects: mockProjects.length,
      active_projects: mockProjects.filter(p => p.status === 'active').length,
      completed_projects: mockProjects.filter(p => p.status === 'completed').length,
      total_lots: mockLots.length,
      pending_inspections: mockLots.filter(l => l.status === 'pending').length,
      completed_inspections: mockLots.filter(l => l.status === 'completed').length,
      non_conformances: mockConformanceRecords.filter(r => r.is_non_conformance).length
    }

    console.log('API Route: Returning stats:', stats)
    
    return NextResponse.json({ 
      success: true, 
      data: stats
    })
    
  } catch (error) {
    console.error('API Route error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Server error occurred' 
    }, { status: 500 })
  }
}