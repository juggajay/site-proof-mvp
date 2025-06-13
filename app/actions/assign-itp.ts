'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '../../lib/supabase/server'
import type { CreateITPAssignment, Database } from '../../types'

export async function assignITPToLot(assignment: CreateITPAssignment) {
  const supabase = createClient()
  
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      throw new Error('User not authenticated')
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
      throw new Error(`Failed to create assignment: ${error.message}`)
    }

    revalidatePath(`/project/${assignment.project_id}/lot/${assignment.lot_id}/daily-report`)
    revalidatePath('/dashboard')

    return { success: true, assignment: data }

  } catch (error) {
    console.error('ITP Assignment Error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    }
  }
}