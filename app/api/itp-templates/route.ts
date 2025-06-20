import { NextRequest, NextResponse } from 'next/server'
import { getITPTemplatesAction } from '@/lib/actions'

export async function GET(request: NextRequest) {
  console.log('=== API GET ITP TEMPLATES ROUTE CALLED ===')
  
  try {
    const result = await getITPTemplatesAction()
    console.log('API Route: ITP templates result:', result)
    
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