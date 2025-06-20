import { NextRequest, NextResponse } from 'next/server'
import { createLotAction } from '@/lib/actions'

export async function POST(request: NextRequest) {
  console.log('=== API CREATE LOT ROUTE CALLED ===')
  
  try {
    const body = await request.json()
    console.log('API Route: Request body:', body)
    
    // Convert JSON to FormData for the action
    const formData = new FormData()
    formData.append('projectId', body.projectId.toString())
    formData.append('lotNumber', body.lotNumber)
    if (body.description) formData.append('description', body.description)
    if (body.locationDescription) formData.append('locationDescription', body.locationDescription)
    
    const result = await createLotAction(formData)
    console.log('API Route: Lot creation result:', result)
    
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