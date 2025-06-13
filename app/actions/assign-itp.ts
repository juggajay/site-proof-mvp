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
      console.log('❌ No authenticated user')
      throw new Error('User not authenticated')
    }

    console.log('👤 Current user ID:', user.id)

    // Generate UUIDs for missing fields if needed
    const assignmentData = {
      itp_id: assignment.itp_id,
      assigned_to: assignment.assigned_to,
      assigned_by: user.id,
      lot_id: assignment.lot_id || '00000000-0000-0000-0000-000000000001', // Default UUID if missing
      project_id: assignment.project_id || '00000000-0000-0000-0000-000000000002', // Default UUID if missing
      scheduled_date: assignment.scheduled_date,
      estimated_completion_date: assignment.estimated_completion_date,
      priority: assignment.priority,
      notes: assignment.notes,
      organization_id: '550e8400-e29b-41d4-a716-446655440000', // Use our sample org ID
      status: 'assigned'
    }

    console.log('📝 Assignment data being inserted:', assignmentData)

    // Simple insert
    const { data, error } = await supabase
      .from('itp_assignments')
      .insert(assignmentData)
      .select()
      .single()

    if (error) {
      console.error('❌ Database error:', error)
      throw new Error(`Database error: ${error.message}`)
    }

    console.log('✅ Assignment successful:', data)

    return { success: true, assignment: data }

  } catch (error) {
    console.error('💥 Assignment failed:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Assignment failed'
    }
  }
}