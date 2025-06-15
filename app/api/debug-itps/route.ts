import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = createClient()
    
    console.log('🧪 DEBUG: Testing ITP database queries...')
    
    // Test 1: Get all ITPs
    const { data: allItps, error: allError } = await supabase
      .from('itps')
      .select('*')
      .limit(20)
    
    console.log('📊 All ITPs:', allItps)
    console.log('📊 Total ITPs found:', allItps?.length || 0)
    console.log('❌ All ITPs error:', allError)
    
    // Test 2: Get all projects
    const { data: allProjects, error: projectsError } = await supabase
      .from('projects')
      .select('id, name')
      .limit(10)
    
    console.log('📊 All Projects:', allProjects)
    console.log('❌ Projects error:', projectsError)
    
    // Test 3: Get active ITPs
    const { data: activeItps, error: activeError } = await supabase
      .from('itps')
      .select('*')
      .eq('is_active', true)
    
    console.log('📊 Active ITPs:', activeItps)
    console.log('❌ Active ITPs error:', activeError)
    
    return NextResponse.json({
      success: true,
      data: {
        allItps: allItps || [],
        allItpsCount: allItps?.length || 0,
        allItpsError: allError,
        allProjects: allProjects || [],
        allProjectsCount: allProjects?.length || 0,
        projectsError: projectsError,
        activeItps: activeItps || [],
        activeItpsCount: activeItps?.length || 0,
        activeItpsError: activeError,
        sampleItp: allItps?.[0] || null,
        availableColumns: allItps?.[0] ? Object.keys(allItps[0]) : []
      }
    })
  } catch (error) {
    console.error('💥 Debug API error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}