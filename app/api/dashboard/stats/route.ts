import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/actions'
import { supabase } from '@/lib/supabase'
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

    if (supabase) {
      console.log('API Route: Fetching stats from Supabase...')
      
      // Fetch counts from Supabase
      const [
        { count: totalProjects },
        { data: activeProjects },
        { data: completedProjects },
        { count: totalLots },
        { data: pendingLots },
        { data: completedLots },
        { data: nonConformances }
      ] = await Promise.all([
        supabase.from('projects').select('*', { count: 'exact', head: true }),
        supabase.from('projects').select('id').eq('status', 'active'),
        supabase.from('projects').select('id').eq('status', 'completed'),
        supabase.from('lots').select('*', { count: 'exact', head: true }),
        supabase.from('lots').select('id').eq('status', 'pending'),
        supabase.from('lots').select('id').eq('status', 'completed'),
        supabase.from('conformance_records').select('id').eq('is_non_conformance', true)
      ])

      const stats: ProjectStats = {
        total_projects: totalProjects || 0,
        active_projects: activeProjects?.length || 0,
        completed_projects: completedProjects?.length || 0,
        total_lots: totalLots || 0,
        pending_inspections: pendingLots?.length || 0,
        completed_inspections: completedLots?.length || 0,
        non_conformances: nonConformances?.length || 0
      }

      console.log('API Route: Returning Supabase stats:', stats)
      
      return NextResponse.json({ 
        success: true, 
        data: stats,
        source: 'supabase'
      })
    } else {
      // Fallback to mock data
      const { mockProjects, mockLots, mockConformanceRecords } = await import('@/lib/mock-data')
      
      const stats: ProjectStats = {
        total_projects: mockProjects.length,
        active_projects: mockProjects.filter(p => p.status === 'active').length,
        completed_projects: mockProjects.filter(p => p.status === 'completed').length,
        total_lots: mockLots.length,
        pending_inspections: mockLots.filter(l => l.status === 'pending').length,
        completed_inspections: mockLots.filter(l => l.status === 'completed').length,
        non_conformances: mockConformanceRecords.filter(r => r.is_non_conformance).length
      }

      console.log('API Route: Returning mock stats:', stats)
      
      return NextResponse.json({ 
        success: true, 
        data: stats,
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