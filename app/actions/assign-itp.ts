'use server'

import { createClient } from '../../lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { CreateITPAssignment } from '../../types'

export async function assignITPToLot(assignment: CreateITPAssignment) {
  const supabase = createClient()
  
  try {
    // Simple insert without complex relationships for now
    const { data, error } = await supabase
      .from('itp_assignments')
      .insert({
        itp_id: assignment.itp_id,
        assigned_to: assignment.assigned_to,
        assigned_by: 'current-user',
        lot_id: assignment.lot_id,
        project_id: assignment.project_id,
        scheduled_date: assignment.scheduled_date,
        estimated_completion_date: assignment.estimated_completion_date,
        priority: assignment.priority,
        notes: assignment.notes,
        organization_id: assignment.organization_id,
        status: 'assigned'
      })
      .select()
      .single()

    if (error) {
      console.error('Assignment error:', error)
      throw new Error(`Failed to create assignment: ${error.message}`)
    }

    console.log('✅ Assignment successful:', data)

    revalidatePath(`/project/${assignment.project_id}/lot/${assignment.lot_id}/daily-report`)
    
    return { success: true, assignment: data }

  } catch (error) {
    console.error('❌ Assignment failed:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Assignment failed'
    }
  }
}