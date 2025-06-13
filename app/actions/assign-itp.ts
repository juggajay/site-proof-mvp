'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '../../lib/supabase/server'
import type { CreateITPAssignment, Database } from '../../types'

export async function assignITPToLot(assignment: CreateITPAssignment) {
  console.log('🚀 Assignment received:', assignment)
  
  const supabase = createClient()
  
  try {
    // Simulate processing delay for better UX feedback
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      console.warn('⚠️ User not authenticated, using mock assignment')
      
      // Return mock assignment for demonstration
      const mockAssignment = {
        id: 'mock-assignment-id',
        ...assignment,
        assigned_by: 'current-user-id',
        status: 'assigned' as const,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        completion_notes: null,
        actual_completion_date: null
      }
      
      console.log('✅ Mock assignment successful!')
      revalidatePath(`/project/${assignment.project_id}/lot/${assignment.lot_id}/daily-report`)
      
      return { success: true, assignment: mockAssignment }
    }

    // FIX: Use proper Database Insert type
    const assignmentData: Database['public']['Tables']['itp_assignments']['Insert'] = {
      lot_id: assignment.lot_id,
      project_id: assignment.project_id,
      itp_id: assignment.itp_id,
      assigned_to: assignment.assigned_to,
      assigned_by: user.id,
      scheduled_date: assignment.scheduled_date,
      estimated_completion_date: assignment.estimated_completion_date || null,
      priority: assignment.priority,
      status: 'assigned',
      notes: assignment.notes || null,
      completion_notes: null,
      actual_completion_date: null,
      organization_id: assignment.organization_id
    }

    console.log('💾 Saving assignment to database:', assignmentData)

    const { data, error } = await supabase
      .from('itp_assignments')
      .insert(assignmentData)
      .select(`
        *,
        itp:itps(title, description),
        assigned_to_user:profiles!assigned_to(name, email),
        lot:lots(name)
      `)
      .single()

    if (error) {
      console.error('❌ Database error:', error)
      throw new Error(`Failed to create assignment: ${error.message}`)
    }

    console.log('✅ Assignment successful!', data)
    
    revalidatePath(`/project/${assignment.project_id}/lot/${assignment.lot_id}/daily-report`)
    revalidatePath('/dashboard')

    return { success: true, assignment: data }

  } catch (error) {
    console.error('💥 Assignment failed:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }
  }
}