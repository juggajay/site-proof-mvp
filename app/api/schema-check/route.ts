import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })
  }

  try {
    // Get column information for key tables
    const queries = [
      `SELECT column_name, data_type, is_nullable 
       FROM information_schema.columns 
       WHERE table_name = 'organizations' 
       ORDER BY ordinal_position`,
      
      `SELECT column_name, data_type, is_nullable 
       FROM information_schema.columns 
       WHERE table_name = 'itp_templates' 
       ORDER BY ordinal_position`,
       
      `SELECT column_name, data_type, is_nullable 
       FROM information_schema.columns 
       WHERE table_name = 'projects' 
       ORDER BY ordinal_position`,
       
      `SELECT column_name, data_type, is_nullable 
       FROM information_schema.columns 
       WHERE table_name = 'lots' 
       ORDER BY ordinal_position`
    ]

    const results = await Promise.all(
      queries.map(query => supabase!.rpc('execute_sql', { query }))
    )

    // Also check if organizations has any data
    const { data: orgs } = await supabase!
      .from('organizations')
      .select('*')
      .limit(5)

    return NextResponse.json({
      schemas: {
        organizations: results[0].data,
        itp_templates: results[1].data,
        projects: results[2].data,
        lots: results[3].data
      },
      sample_orgs: orgs
    })
  } catch (error) {
    // Try a simpler approach
    try {
      const { data: org, error: orgError } = await supabase!
        .from('organizations')
        .select('*')
        .limit(1)
        .single()

      const orgColumns = org ? Object.keys(org) : []

      return NextResponse.json({
        orgColumns,
        orgError: orgError?.message,
        sampleOrg: org
      })
    } catch (e) {
      return NextResponse.json({ 
        error: 'Failed to check schema',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, { status: 500 })
    }
  }
}