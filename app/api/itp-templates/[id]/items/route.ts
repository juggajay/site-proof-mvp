import { NextRequest, NextResponse } from 'next/server'
import { getITPTemplateWithItemsAction } from '@/lib/actions'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  console.log('=== API GET ITP TEMPLATE ITEMS ROUTE CALLED ===')
  
  try {
    const templateId = params.id
    console.log('API Route: Template ID:', templateId)
    
    const result = await getITPTemplateWithItemsAction(templateId)
    console.log('API Route: ITP template items result:', result)
    
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