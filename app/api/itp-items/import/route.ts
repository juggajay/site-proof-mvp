import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/actions'
import { mockITPItems } from '@/lib/mock-data'
import { ITPItem } from '@/types/database'

export async function POST(request: NextRequest) {
  console.log('=== API POST ITP ITEMS IMPORT ROUTE CALLED ===')
  
  try {
    // Check authentication
    const user = await getCurrentUser()
    console.log('API Route: User authenticated for import:', !!user, user ? user.email : 'no user')
    
    if (!user) {
      return NextResponse.json({ 
        success: false, 
        error: 'Authentication required' 
      }, { status: 401 })
    }

    const body = await request.json()
    const { items } = body

    if (!items || !Array.isArray(items)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid items data'
      }, { status: 400 })
    }

    const results = {
      imported: 0,
      errors: [] as string[]
    }

    // Process each item
    for (let i = 0; i < items.length; i++) {
      try {
        const item = items[i]
        
        // Validate required fields
        if (!item.description) {
          results.errors.push(`Row ${i + 2}: Missing required field 'description'`)
          continue
        }

        // Create new ITP item - use original UUID as string ID
        const newItem: ITPItem = {
          id: item.id || `item_${Date.now()}_${i}`,
          itp_template_id: item.itp_id || item.itp_template_id || 1,
          item_number: item.item_number || `${i + 1}`,
          description: item.description,
          specification_reference: item.specification_reference || null,
          inspection_method: item.inspection_type || item.inspection_method || 'PASS_FAIL',
          acceptance_criteria: item.acceptance_criteria || item.required_value || 'As specified',
          item_type: (item.inspection_type || item.item_type || 'PASS_FAIL').toLowerCase(),
          is_mandatory: item.is_mandatory === 'true' || item.is_mandatory === true || true,
          order_index: parseInt(item.order_index) || (i + 1),
          created_at: item.created_at || new Date().toISOString()
        }

        // Add to mock database
        mockITPItems.push(newItem)
        results.imported++

        console.log(`Imported ITP item ${newItem.id}:`, newItem.description)

      } catch (error) {
        console.error(`Error processing item ${i + 1}:`, error)
        results.errors.push(`Row ${i + 2}: ${error}`)
      }
    }

    console.log('Import results:', results)

    return NextResponse.json({
      success: true,
      data: results
    })

  } catch (error) {
    console.error('API Route error:', error)
    return NextResponse.json({
      success: false,
      error: 'Server error occurred'
    }, { status: 500 })
  }
}