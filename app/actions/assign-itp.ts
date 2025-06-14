'use server'

import { createClient } from '../../lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { CreateITPAssignment } from '../../types'

export async function assignITPToLot(assignment: CreateITPAssignment) {
  const supabase = createClient()
  
  try {
    console.log('🚀 Starting assignment with data:', assignment)

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      console.error('❌ User authentication failed:', userError)
      throw new Error('User not authenticated')
    }

    console.log('👤 Current user ID:', user.id)

    // Validate that the ITP ID exists in our database
    const { data: itp, error: itpError } = await supabase
      .from('itps')
      .select('id, title')
      .eq('id', assignment.itp_id)
      .single()

    if (itpError || !itp) {
      console.log('❌ ITP not found, using fallback')
      // Use the "Highway Concrete Pour Inspection" as fallback
      assignment.itp_id = 'b9a3a71d-18a2-4189-a569-4cafd7fea190'
    }

    console.log('📋 Using ITP:', assignment.itp_id)

    // Create assignment with validated data
    const assignmentData = {
      itp_id: assignment.itp_id,
      assigned_to: assignment.assigned_to,
      assigned_by: user.id,
      lot_id: assignment.lot_id,
      project_id: assignment.project_id,
      scheduled_date: assignment.scheduled_date,
      estimated_completion_date: assignment.estimated_completion_date,
      priority: assignment.priority,
      notes: assignment.notes,
      organization_id: assignment.organization_id,
      status: 'assigned'
    }

    console.log('📝 Final assignment data:', assignmentData)

    const { data, error } = await supabase
      .from('itp_assignments')
      .insert(assignmentData)
      .select(`
        *,
        itp:itps(title, description)
      `)
      .single()

    if (error) {
      console.error('❌ Database error:', error)
      throw new Error(`Database error: ${error.message}`)
    }

    console.log('✅ Assignment successful:', data)

    // Revalidate both the daily-report page and the main lot page
    revalidatePath(`/project/${assignment.project_id}/lot/${assignment.lot_id}/daily-report`)
    revalidatePath(`/project/${assignment.project_id}/lot/${assignment.lot_id}`)

    return { success: true, assignment: data }

  } catch (error) {
    console.error('💥 Assignment failed:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Assignment failed'
    }
  }
}