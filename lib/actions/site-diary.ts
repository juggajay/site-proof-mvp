// lib/actions/site-diary.ts - Server Actions for Site Diary

'use server'

import { createServerActionClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { 
  SiteDiaryEntry, 
  SiteDiaryFormData,
  ManpowerEntry,
  ManpowerFormData,
  EquipmentEntry,
  EquipmentFormData,
  DeliveryEntry,
  DeliveryFormData,
  EventEntry,
  EventFormData,
  SiteDiaryFilters 
} from '../../types/site-diary'

// =====================================================
// SITE DIARY ENTRY ACTIONS
// =====================================================

export async function createSiteDiaryEntry(
  projectId: string, 
  data: SiteDiaryFormData
): Promise<{ success: boolean; data?: SiteDiaryEntry; error?: string }> {
  try {
    const supabase = createServerActionClient({ cookies })
    
    const { data: entry, error } = await supabase
      .from('site_diary_entries')
      .insert({
        project_id: projectId,
        ...data,
      })
      .select()
      .single()

    if (error) throw error

    revalidatePath('/projects/[id]', 'page')
    return { success: true, data: entry }
  } catch (error) {
    console.error('Error creating site diary entry:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to create diary entry' 
    }
  }
}

export async function updateSiteDiaryEntry(
  entryId: string,
  data: Partial<SiteDiaryFormData>
): Promise<{ success: boolean; data?: SiteDiaryEntry; error?: string }> {
  try {
    const supabase = createServerActionClient({ cookies })
    
    const { data: entry, error } = await supabase
      .from('site_diary_entries')
      .update(data)
      .eq('id', entryId)
      .select()
      .single()

    if (error) throw error

    revalidatePath('/projects/[id]', 'page')
    return { success: true, data: entry }
  } catch (error) {
    console.error('Error updating site diary entry:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to update diary entry' 
    }
  }
}

export async function getSiteDiaryEntry(
  projectId: string, 
  date: string
): Promise<{ success: boolean; data?: SiteDiaryEntry; error?: string }> {
  try {
    const supabase = createServerActionClient({ cookies })
    
    const { data: entry, error } = await supabase
      .from('site_diary_entries')
      .select(`
        *,
        manpower_entries(*),
        equipment_entries(*),
        delivery_entries(*),
        event_entries(*),
        attachments:site_diary_attachments(*)
      `)
      .eq('project_id', projectId)
      .eq('date', date)
      .single()

    if (error && error.code !== 'PGRST116') throw error // PGRST116 = no rows returned

    return { success: true, data: entry || undefined }
  } catch (error) {
    console.error('Error fetching site diary entry:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to fetch diary entry' 
    }
  }
}

export async function getSiteDiaryEntries(
  projectId: string,
  filters?: SiteDiaryFilters
): Promise<{ success: boolean; data?: SiteDiaryEntry[]; error?: string }> {
  try {
    const supabase = createServerActionClient({ cookies })
    
    let query = supabase
      .from('site_diary_entries')
      .select(`
        *,
        manpower_entries(*),
        equipment_entries(*),
        delivery_entries(*),
        event_entries(*),
        attachments:site_diary_attachments(*)
      `)
      .eq('project_id', projectId)
      .order('date', { ascending: false })

    // Apply filters
    if (filters?.date_from) {
      query = query.gte('date', filters.date_from)
    }
    if (filters?.date_to) {
      query = query.lte('date', filters.date_to)
    }

    const { data: entries, error } = await query

    if (error) throw error

    return { success: true, data: entries || [] }
  } catch (error) {
    console.error('Error fetching site diary entries:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to fetch diary entries' 
    }
  }
}

export async function getOrCreateDiaryEntry(
  projectId: string,
  date: string = new Date().toISOString().split('T')[0]!
): Promise<{ success: boolean; data?: SiteDiaryEntry; error?: string }> {
  try {
    const supabase = createServerActionClient({ cookies })
    
    // Call the database function
    const { data: diaryId, error: funcError } = await supabase
      .rpc('get_or_create_diary_entry', {
        p_project_id: projectId,
        p_date: date
      })

    if (funcError) throw funcError

    // Fetch the complete entry with relationships
    const { data: entry, error: fetchError } = await supabase
      .from('site_diary_entries')
      .select(`
        *,
        manpower_entries(*),
        equipment_entries(*),
        delivery_entries(*),
        event_entries(*),
        attachments:site_diary_attachments(*)
      `)
      .eq('id', diaryId)
      .single()

    if (fetchError) throw fetchError

    return { success: true, data: entry }
  } catch (error) {
    console.error('Error getting/creating diary entry:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to get diary entry' 
    }
  }
}

// =====================================================
// MANPOWER ENTRY ACTIONS
// =====================================================

export async function createManpowerEntry(
  diaryEntryId: string,
  data: ManpowerFormData
): Promise<{ success: boolean; data?: ManpowerEntry; error?: string }> {
  try {
    const supabase = createServerActionClient({ cookies })
    
    const { data: entry, error } = await supabase
      .from('manpower_entries')
      .insert({
        diary_entry_id: diaryEntryId,
        ...data,
      })
      .select()
      .single()

    if (error) throw error

    revalidatePath('/projects/[id]', 'page')
    return { success: true, data: entry }
  } catch (error) {
    console.error('Error creating manpower entry:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to create manpower entry' 
    }
  }
}

export async function updateManpowerEntry(
  entryId: string,
  data: Partial<ManpowerFormData>
): Promise<{ success: boolean; data?: ManpowerEntry; error?: string }> {
  try {
    const supabase = createServerActionClient({ cookies })
    
    const { data: entry, error } = await supabase
      .from('manpower_entries')
      .update(data)
      .eq('id', entryId)
      .select()
      .single()

    if (error) throw error

    revalidatePath('/projects/[id]', 'page')
    return { success: true, data: entry }
  } catch (error) {
    console.error('Error updating manpower entry:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to update manpower entry' 
    }
  }
}

export async function deleteManpowerEntry(entryId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createServerActionClient({ cookies })
    
    const { error } = await supabase
      .from('manpower_entries')
      .delete()
      .eq('id', entryId)

    if (error) throw error

    revalidatePath('/projects/[id]', 'page')
    return { success: true }
  } catch (error) {
    console.error('Error deleting manpower entry:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to delete manpower entry' 
    }
  }
}

// =====================================================
// EQUIPMENT ENTRY ACTIONS
// =====================================================

export async function createEquipmentEntry(
  diaryEntryId: string,
  data: EquipmentFormData
): Promise<{ success: boolean; data?: EquipmentEntry; error?: string }> {
  try {
    const supabase = createServerActionClient({ cookies })
    
    const { data: entry, error } = await supabase
      .from('equipment_entries')
      .insert({
        diary_entry_id: diaryEntryId,
        ...data,
      })
      .select()
      .single()

    if (error) throw error

    revalidatePath('/projects/[id]', 'page')
    return { success: true, data: entry }
  } catch (error) {
    console.error('Error creating equipment entry:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to create equipment entry' 
    }
  }
}

export async function updateEquipmentEntry(
  entryId: string,
  data: Partial<EquipmentFormData>
): Promise<{ success: boolean; data?: EquipmentEntry; error?: string }> {
  try {
    const supabase = createServerActionClient({ cookies })
    
    const { data: entry, error } = await supabase
      .from('equipment_entries')
      .update(data)
      .eq('id', entryId)
      .select()
      .single()

    if (error) throw error

    revalidatePath('/projects/[id]', 'page')
    return { success: true, data: entry }
  } catch (error) {
    console.error('Error updating equipment entry:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to update equipment entry' 
    }
  }
}

export async function deleteEquipmentEntry(entryId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createServerActionClient({ cookies })
    
    const { error } = await supabase
      .from('equipment_entries')
      .delete()
      .eq('id', entryId)

    if (error) throw error

    revalidatePath('/projects/[id]', 'page')
    return { success: true }
  } catch (error) {
    console.error('Error deleting equipment entry:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to delete equipment entry' 
    }
  }
}

// =====================================================
// DELIVERY ENTRY ACTIONS
// =====================================================

export async function createDeliveryEntry(
  diaryEntryId: string,
  data: DeliveryFormData
): Promise<{ success: boolean; data?: DeliveryEntry; error?: string }> {
  try {
    const supabase = createServerActionClient({ cookies })
    
    const { data: entry, error } = await supabase
      .from('delivery_entries')
      .insert({
        diary_entry_id: diaryEntryId,
        ...data,
      })
      .select()
      .single()

    if (error) throw error

    revalidatePath('/projects/[id]', 'page')
    return { success: true, data: entry }
  } catch (error) {
    console.error('Error creating delivery entry:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to create delivery entry' 
    }
  }
}

export async function updateDeliveryEntry(
  entryId: string,
  data: Partial<DeliveryFormData>
): Promise<{ success: boolean; data?: DeliveryEntry; error?: string }> {
  try {
    const supabase = createServerActionClient({ cookies })
    
    const { data: entry, error } = await supabase
      .from('delivery_entries')
      .update(data)
      .eq('id', entryId)
      .select()
      .single()

    if (error) throw error

    revalidatePath('/projects/[id]', 'page')
    return { success: true, data: entry }
  } catch (error) {
    console.error('Error updating delivery entry:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to update delivery entry' 
    }
  }
}

export async function deleteDeliveryEntry(entryId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createServerActionClient({ cookies })
    
    const { error } = await supabase
      .from('delivery_entries')
      .delete()
      .eq('id', entryId)

    if (error) throw error

    revalidatePath('/projects/[id]', 'page')
    return { success: true }
  } catch (error) {
    console.error('Error deleting delivery entry:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to delete delivery entry' 
    }
  }
}

// =====================================================
// EVENT ENTRY ACTIONS
// =====================================================

export async function createEventEntry(
  diaryEntryId: string,
  data: EventFormData
): Promise<{ success: boolean; data?: EventEntry; error?: string }> {
  try {
    const supabase = createServerActionClient({ cookies })
    
    const { data: entry, error } = await supabase
      .from('event_entries')
      .insert({
        diary_entry_id: diaryEntryId,
        ...data,
      })
      .select()
      .single()

    if (error) throw error

    revalidatePath('/projects/[id]', 'page')
    return { success: true, data: entry }
  } catch (error) {
    console.error('Error creating event entry:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to create event entry' 
    }
  }
}

export async function updateEventEntry(
  entryId: string,
  data: Partial<EventFormData>
): Promise<{ success: boolean; data?: EventEntry; error?: string }> {
  try {
    const supabase = createServerActionClient({ cookies })
    
    const { data: entry, error } = await supabase
      .from('event_entries')
      .update(data)
      .eq('id', entryId)
      .select()
      .single()

    if (error) throw error

    revalidatePath('/projects/[id]', 'page')
    return { success: true, data: entry }
  } catch (error) {
    console.error('Error updating event entry:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to update event entry' 
    }
  }
}

export async function deleteEventEntry(entryId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createServerActionClient({ cookies })
    
    const { error } = await supabase
      .from('event_entries')
      .delete()
      .eq('id', entryId)

    if (error) throw error

    revalidatePath('/projects/[id]', 'page')
    return { success: true }
  } catch (error) {
    console.error('Error deleting event entry:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to delete event entry' 
    }
  }
}