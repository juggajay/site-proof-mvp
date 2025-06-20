import { NextRequest, NextResponse } from 'next/server'
import { createDailyLabourAction } from '@/lib/actions'

export async function POST(request: NextRequest) {
  console.log('=== API CREATE DAILY LABOUR ROUTE CALLED ===')
  
  try {
    const body = await request.json()
    console.log('API Route: Request body:', body)
    
    const result = await createDailyLabourAction(body)
    console.log('API Route: Daily labour creation result:', result)
    
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