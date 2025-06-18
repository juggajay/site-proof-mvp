import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/actions'
import { mockITPTemplates } from '@/lib/mock-data'
import { ITPTemplate } from '@/types/database'

export async function POST(request: NextRequest) {
  console.log('=== API POST ITP TEMPLATES IMPORT ROUTE CALLED ===')
  
  try {
    // Check authentication
    const user = await getCurrentUser()
    console.log('API Route: User authenticated for template import:', !!user, user ? user.email : 'no user')
    
    if (!user) {
      return NextResponse.json({ 
        success: false, 
        error: 'Authentication required' 
      }, { status: 401 })
    }

    const body = await request.json()
    const { templates } = body

    if (!templates || !Array.isArray(templates)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid templates data'
      }, { status: 400 })
    }

    const results = {
      imported: 0,
      errors: [] as string[]
    }

    // Process each template
    for (let i = 0; i < templates.length; i++) {
      try {
        const template = templates[i]
        
        // Validate required fields
        if (!template.name) {
          results.errors.push(`Row ${i + 2}: Missing required field 'name'`)
          continue
        }

        // Create new ITP template - use original UUID as string ID
        const newTemplate: ITPTemplate = {
          id: template.id || `template_${Date.now()}_${i}`,
          name: template.name,
          description: template.description || '',
          category: template.category || 'general',
          version: template.version || '1.0',
          is_active: template.is_active !== false,
          organization_id: 1,
          created_by: 1,
          created_at: template.created_at || new Date().toISOString(),
          updated_at: template.updated_at || new Date().toISOString()
        }

        // Add to mock database
        mockITPTemplates.push(newTemplate)
        results.imported++

        console.log(`Imported ITP template ${newTemplate.id}:`, newTemplate.name)

      } catch (error) {
        console.error(`Error processing template ${i + 1}:`, error)
        results.errors.push(`Row ${i + 2}: ${error}`)
      }
    }

    console.log('Template import results:', results)

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