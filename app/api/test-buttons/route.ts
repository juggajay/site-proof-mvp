import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/actions'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  const user = await getCurrentUser()
  
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  // Test what works and what doesn't
  const tests: any = {
    auth: {
      userLoggedIn: !!user,
      userEmail: user.email,
      hasProfile: !!user.profile
    },
    database: {
      supabaseEnabled: !!supabase
    },
    dataCheck: {}
  }

  if (supabase) {
    // Check organizations
    const { data: orgs, error: orgError } = await supabase
      .from('organizations')
      .select('*')
    
    tests.dataCheck.organizations = {
      count: orgs?.length || 0,
      error: orgError?.message,
      sample: orgs?.[0]
    }

    // Check ITP templates
    const { data: itps, error: itpError } = await supabase
      .from('itp_templates')
      .select('*')
    
    tests.dataCheck.itpTemplates = {
      count: itps?.length || 0,
      error: itpError?.message,
      sample: itps?.[0]
    }

    // Check projects
    const { data: projects, error: projectError } = await supabase
      .from('projects')
      .select('*')
    
    tests.dataCheck.projects = {
      count: projects?.length || 0,
      error: projectError?.message,
      sample: projects?.[0]
    }

    // Check lots
    const { data: lots, error: lotsError } = await supabase
      .from('lots')
      .select('*')
    
    tests.dataCheck.lots = {
      count: lots?.length || 0,
      error: lotsError?.message,
      sample: lots?.[0]
    }
  }

  return NextResponse.json(tests)
}