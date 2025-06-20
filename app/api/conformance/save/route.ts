import { NextRequest, NextResponse } from 'next/server'
import { saveConformanceRecordAction } from '@/lib/actions'

export async function POST(request: NextRequest) {
  console.log('=== API SAVE CONFORMANCE RECORD ROUTE CALLED ===')
  
  try {
    const body = await request.json()
    console.log('API Route: Request body:', body)
    
    const { lotId, itpItemId, ...recordData } = body
    
    if (!lotId || !itpItemId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Lot ID and ITP item ID are required' 
      }, { status: 400 })
    }
    
    const result = await saveConformanceRecordAction(lotId, itpItemId, recordData)
    console.log('API Route: Conformance record save result:', result)
    
    if (result.success) {
      return NextResponse.json(result)
    } else {
      return NextResponse.json(result, { status: 400 })
    }
    
  } catch (error) {
    console.error('API Route error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Server error occurred' 
    }, { status: 500 })
  }
}