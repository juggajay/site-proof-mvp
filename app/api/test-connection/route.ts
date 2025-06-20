import { NextResponse } from 'next/server'
import { supabase, isSupabaseEnabled } from '@/lib/supabase'

export async function GET() {
  const results = {
    connectionEnabled: isSupabaseEnabled,
    url: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Not set',
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Not set',
    serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Set' : 'Not set',
    tests: {} as any
  }

  if (!isSupabaseEnabled) {
    return NextResponse.json({
      ...results,
      error: 'Supabase is not enabled. Check your environment variables.'
    })
  }

  try {
    // Test 1: Basic connection
    const { error: connError } = await supabase!
      .from('projects')
      .select('count')
      .limit(1)
    
    results.tests.connection = !connError || connError.code === 'PGRST116' 
      ? 'Connected' 
      : `Failed: ${connError.message}`

    // Test 2: Check tables
    const tables = [
      'projects', 'lots', 'organizations', 'profiles',
      'itp_templates', 'itp_items', 'conformance_records',
      'daily_reports', 'daily_events', 'daily_labour',
      'daily_plant', 'daily_materials'
    ]

    results.tests.tables = {}
    
    for (const table of tables) {
      const { error } = await supabase!
        .from(table)
        .select('count')
        .limit(1)
      
      results.tests.tables[table] = !error ? 'exists' 
        : error.code === 'PGRST116' ? 'missing' 
        : `error: ${error.code}`
    }

    // Test 3: Try to read projects
    const { data: projects, error: projectsError } = await supabase!
      .from('projects')
      .select('*')
      .limit(5)
    
    if (!projectsError) {
      results.tests.projectsTable = {
        status: 'readable',
        recordCount: projects.length,
        columns: projects.length > 0 ? Object.keys(projects[0]) : []
      }
    } else {
      results.tests.projectsTable = {
        status: 'error',
        error: projectsError.message,
        code: projectsError.code
      }
    }

  } catch (error) {
    results.tests.error = error instanceof Error ? error.message : 'Unknown error'
  }

  return NextResponse.json(results, { 
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  })
}