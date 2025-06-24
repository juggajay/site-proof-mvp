import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { supabase } from '@/lib/supabase'
import { getLotByIdAction } from '@/lib/actions'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const lotId = searchParams.get('lotId') || '156f47f9-66d4-4973-8a0d-05765fa43387'
  
  const diagnostics: any = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    lotId,
    checks: {}
  }
  
  // 1. Check Supabase clients
  diagnostics.checks.supabaseClients = {
    regularClient: !!supabase,
    adminClient: !!supabaseAdmin,
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'configured' : 'missing',
    supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'configured' : 'missing',
    supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'configured' : 'missing'
  }
  
  // 2. Test direct query with admin client
  if (supabaseAdmin) {
    try {
      const { data: assignments, error } = await supabaseAdmin
        .from('lot_itp_assignments')
        .select('*')
        .eq('lot_id', lotId)
        .in('status', ['pending', 'in_progress', 'completed', 'approved'])
      
      diagnostics.checks.directAdminQuery = {
        success: !error,
        count: assignments?.length || 0,
        error: error?.message,
        data: assignments?.slice(0, 2) // First 2 for brevity
      }
    } catch (e: any) {
      diagnostics.checks.directAdminQuery = {
        success: false,
        error: e.message
      }
    }
  }
  
  // 3. Test direct query with regular client
  if (supabase) {
    try {
      const { data: assignments, error } = await supabase
        .from('lot_itp_assignments')
        .select('*')
        .eq('lot_id', lotId)
        .in('status', ['pending', 'in_progress', 'completed', 'approved'])
      
      diagnostics.checks.directRegularQuery = {
        success: !error,
        count: assignments?.length || 0,
        error: error?.message,
        data: assignments?.slice(0, 2) // First 2 for brevity
      }
    } catch (e: any) {
      diagnostics.checks.directRegularQuery = {
        success: false,
        error: e.message
      }
    }
  }
  
  // 4. Test getLotByIdAction
  try {
    const result = await getLotByIdAction(lotId)
    diagnostics.checks.getLotByIdAction = {
      success: result.success,
      error: result.error,
      lotFound: !!result.data,
      assignmentsCount: result.data?.lot_itp_assignments?.length || 0,
      templatesCount: result.data?.itp_templates?.length || 0
    }
  } catch (e: any) {
    diagnostics.checks.getLotByIdAction = {
      success: false,
      error: e.message
    }
  }
  
  // 5. Check RLS status
  if (supabaseAdmin) {
    try {
      const { data: rlsStatus } = await supabaseAdmin
        .rpc('query_json', {
          query_text: `
            SELECT 
              tablename,
              rowsecurity::text as rls_enabled
            FROM pg_tables
            WHERE schemaname = 'public'
            AND tablename IN ('lot_itp_assignments', 'itp_templates', 'lots')
          `,
          params: []
        })
      
      diagnostics.checks.rlsStatus = rlsStatus
    } catch (e) {
      // RPC might not exist
      diagnostics.checks.rlsStatus = 'Unable to check'
    }
  }
  
  return NextResponse.json(diagnostics, {
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    }
  })
}