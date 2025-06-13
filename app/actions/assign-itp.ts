'use server'

import { createClient } from '../../lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { CreateITPAssignment } from '../../types'

// Helper function to ensure valid UUID
function ensureUUID(value: string): string {
  // If it's already a valid UUID format, return it
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) {
    return value
  }
  
  // If it's a simple number like "1", convert it to a UUID
  if (/^\d+$/.test(value)) {
    const num = parseInt(value)
    return `00000000-0000-0000-0000-${num.toString().padStart(12, '0')}`
  }
  
  // Default fallback UUID
  return '00000000-0000-0000-0000-000000000000'
}

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

    // Ensure all IDs are valid UUIDs
    const assignmentData = {
      itp_id: ensureUUID(assignment.itp_id),
      assigned_to: ensureUUID(assignment.assigned_to),
      assigned_by: user.id,
      lot_id: ensureUUID(assignment.lot_id),
      project_id: ensureUUID(assignment.project_id),
      scheduled_date: assignment.scheduled_date,
      estimated_completion_date: assignment.estimated_completion_date,
      priority: assignment.priority,
      notes: assignment.notes,
      organization_id: ensureUUID(assignment.organization_id),
      status: 'assigned'
    }

    console.log('📝 UUID-safe assignment data:', assignmentData)

    // Insert the assignment
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