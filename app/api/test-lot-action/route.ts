import { NextResponse } from 'next/server'
import { getLotByIdAction } from '@/lib/actions'

export async function GET() {
  const lotId = '156f47f9-66d4-4973-8a0d-05765fa43387'
  
  console.log('🔍 Testing getLotByIdAction via API route')
  
  try {
    const result = await getLotByIdAction(lotId)
    
    const summary = {
      success: result.success,
      lotId: result.data?.id,
      lot_number: result.data?.lot_number,
      lot_itp_assignments_count: result.data?.lot_itp_assignments?.length || 0,
      itp_templates_count: result.data?.itp_templates?.length || 0,
      assignments: result.data?.lot_itp_assignments?.map((a: any) => ({
        id: a.id,
        template_id: a.template_id,
        status: a.status
      })) || [],
      templates: result.data?.itp_templates?.map((t: any) => ({
        id: t.id,
        name: t.name
      })) || []
    }
    
    console.log('🔍 getLotByIdAction result summary:', JSON.stringify(summary, null, 2))
    
    return NextResponse.json(summary)
  } catch (error) {
    console.error('Error testing action:', error)
    return NextResponse.json({ error: 'Failed to test action', details: error }, { status: 500 })
  }
}