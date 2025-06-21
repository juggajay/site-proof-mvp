import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })
  }

  try {
    // Check all tables and their row counts
    const tableChecks = await Promise.all([
      supabase.from('organizations').select('*', { count: 'exact', head: true }),
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('projects').select('*', { count: 'exact', head: true }),
      supabase.from('lots').select('*', { count: 'exact', head: true }),
      supabase.from('itp_templates').select('*', { count: 'exact', head: true }),
      supabase.from('itp_items').select('*', { count: 'exact', head: true }),
      supabase.from('conformance_records').select('*', { count: 'exact', head: true }),
      supabase.from('daily_reports').select('*', { count: 'exact', head: true }),
      supabase.from('daily_events').select('*', { count: 'exact', head: true }),
      supabase.from('daily_labour').select('*', { count: 'exact', head: true }),
      supabase.from('daily_plant').select('*', { count: 'exact', head: true }),
      supabase.from('daily_materials').select('*', { count: 'exact', head: true }),
    ])

    const tables = [
      'organizations', 'profiles', 'projects', 'lots', 
      'itp_templates', 'itp_items', 'conformance_records',
      'daily_reports', 'daily_events', 'daily_labour',
      'daily_plant', 'daily_materials'
    ]

    const tableCounts: Record<string, number> = {}
    tables.forEach((table, index) => {
      tableCounts[table] = tableChecks[index].count || 0
    })

    // Get sample data from key tables
    const [
      { data: organizations },
      { data: profiles },
      { data: projects },
      { data: itpTemplates },
      { data: lots }
    ] = await Promise.all([
      supabase.from('organizations').select('*').limit(5),
      supabase.from('profiles').select('*').limit(5),
      supabase.from('projects').select('*').limit(5),
      supabase.from('itp_templates').select('*').limit(5),
      supabase.from('lots').select('*').limit(5)
    ])

    // Check auth.users table
    const { data: { users }, error: authError } = await supabase.auth.admin.listUsers()

    return NextResponse.json({
      success: true,
      tableCounts,
      sampleData: {
        organizations,
        profiles,
        projects,
        itpTemplates,
        lots
      },
      authUsers: {
        count: users?.length || 0,
        error: authError?.message
      }
    })
  } catch (error) {
    console.error('Database check error:', error)
    return NextResponse.json({ 
      error: 'Failed to check database',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}