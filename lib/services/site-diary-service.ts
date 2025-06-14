// Phase 1 Site Diary Service
// Comprehensive service for managing site diary operations

import { createClient } from '../supabase/client'
import type {
  SiteDiaryEntry,
  ManpowerEntry,
  EquipmentEntry,
  DeliveryEntry,
  EventEntry,
  SiteDiaryAttachment,
  CompleteSiteDiary,
  SiteDiaryForm,
  ManpowerEntryForm,
  EquipmentEntryForm,
  DeliveryEntryForm,
  EventEntryForm,
  WatermarkData,
  PhotoUploadResult,
  SiteDiaryFilters,
  DailySummary
} from '../../types/phase1-site-diary'

export class SiteDiaryService {
  private supabase = createClient()

  // =====================================================
  // CORE SITE DIARY OPERATIONS
  // =====================================================

  /**
   * Get or create a site diary entry for a specific project and date
   */
  async getOrCreateDiaryEntry(projectId: string, date: string = new Date().toISOString().split('T')[0]!): Promise<SiteDiaryEntry> {
    try {
      // First try to get existing entry
      const { data: existing, error: fetchError } = await this.supabase
        .from('site_diary_entries')
        .select('*')
        .eq('project_id', projectId)
        .eq('date', date)
        .single()

      if (existing && !fetchError) {
        return existing
      }

      // Create new entry if doesn't exist
      const { data: newEntry, error: createError } = await this.supabase
        .from('site_diary_entries')
        .insert([{
          project_id: projectId,
          date,
          safety_briefing_conducted: false
        }])
        .select()
        .single()

      if (createError) throw createError
      return newEntry
    } catch (error) {
      console.error('Error getting/creating diary entry:', error)
      throw error
    }
  }

  /**
   * Update site diary entry
   */
  async updateDiaryEntry(diaryId: string, updates: Partial<SiteDiaryForm>): Promise<SiteDiaryEntry> {
    try {
      const { data, error } = await this.supabase
        .from('site_diary_entries')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', diaryId)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error updating diary entry:', error)
      throw error
    }
  }

  /**
   * Get complete site diary with all related entries
   */
  async getCompleteDiary(projectId: string, date: string): Promise<CompleteSiteDiary | null> {
    try {
      const diaryEntry = await this.getOrCreateDiaryEntry(projectId, date)

      const [manpowerEntries, equipmentEntries, deliveryEntries, eventEntries, attachments] = await Promise.all([
        this.getManpowerEntries(diaryEntry.id),
        this.getEquipmentEntries(diaryEntry.id),
        this.getDeliveryEntries(diaryEntry.id),
        this.getEventEntries(diaryEntry.id),
        this.getAttachments(diaryEntry.id)
      ])

      return {
        diary_entry: diaryEntry,
        manpower_entries: manpowerEntries,
        equipment_entries: equipmentEntries,
        delivery_entries: deliveryEntries,
        event_entries: eventEntries,
        attachments
      }
    } catch (error) {
      console.error('Error getting complete diary:', error)
      throw error
    }
  }

  // =====================================================
  // MANPOWER OPERATIONS
  // =====================================================

  async addManpowerEntry(diaryEntryId: string, entry: ManpowerEntryForm): Promise<ManpowerEntry> {
    try {
      const { data, error } = await this.supabase
        .from('manpower_entries')
        .insert([{
          diary_entry_id: diaryEntryId,
          ...entry
        }])
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error adding manpower entry:', error)
      throw error
    }
  }

  async getManpowerEntries(diaryEntryId: string): Promise<ManpowerEntry[]> {
    try {
      const { data, error } = await this.supabase
        .from('manpower_entries')
        .select('*')
        .eq('diary_entry_id', diaryEntryId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error getting manpower entries:', error)
      throw error
    }
  }

  async updateManpowerEntry(entryId: string, updates: Partial<ManpowerEntryForm>): Promise<ManpowerEntry> {
    try {
      const { data, error } = await this.supabase
        .from('manpower_entries')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', entryId)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error updating manpower entry:', error)
      throw error
    }
  }

  async deleteManpowerEntry(entryId: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('manpower_entries')
        .delete()
        .eq('id', entryId)

      if (error) throw error
    } catch (error) {
      console.error('Error deleting manpower entry:', error)
      throw error
    }
  }

  // =====================================================
  // EQUIPMENT OPERATIONS
  // =====================================================

  async addEquipmentEntry(diaryEntryId: string, entry: EquipmentEntryForm): Promise<EquipmentEntry> {
    try {
      const { data, error } = await this.supabase
        .from('equipment_entries')
        .insert([{
          diary_entry_id: diaryEntryId,
          ...entry
        }])
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error adding equipment entry:', error)
      throw error
    }
  }

  async getEquipmentEntries(diaryEntryId: string): Promise<EquipmentEntry[]> {
    try {
      const { data, error } = await this.supabase
        .from('equipment_entries')
        .select('*')
        .eq('diary_entry_id', diaryEntryId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error getting equipment entries:', error)
      throw error
    }
  }

  async updateEquipmentEntry(entryId: string, updates: Partial<EquipmentEntryForm>): Promise<EquipmentEntry> {
    try {
      const { data, error } = await this.supabase
        .from('equipment_entries')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', entryId)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error updating equipment entry:', error)
      throw error
    }
  }

  async deleteEquipmentEntry(entryId: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('equipment_entries')
        .delete()
        .eq('id', entryId)

      if (error) throw error
    } catch (error) {
      console.error('Error deleting equipment entry:', error)
      throw error
    }
  }

  // =====================================================
  // DELIVERY OPERATIONS
  // =====================================================

  async addDeliveryEntry(diaryEntryId: string, entry: DeliveryEntryForm): Promise<DeliveryEntry> {
    try {
      const { data, error } = await this.supabase
        .from('delivery_entries')
        .insert([{
          diary_entry_id: diaryEntryId,
          ...entry
        }])
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error adding delivery entry:', error)
      throw error
    }
  }

  async getDeliveryEntries(diaryEntryId: string): Promise<DeliveryEntry[]> {
    try {
      const { data, error } = await this.supabase
        .from('delivery_entries')
        .select('*')
        .eq('diary_entry_id', diaryEntryId)
        .order('delivery_time', { ascending: true })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error getting delivery entries:', error)
      throw error
    }
  }

  async updateDeliveryEntry(entryId: string, updates: Partial<DeliveryEntryForm>): Promise<DeliveryEntry> {
    try {
      const { data, error } = await this.supabase
        .from('delivery_entries')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', entryId)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error updating delivery entry:', error)
      throw error
    }
  }

  async deleteDeliveryEntry(entryId: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('delivery_entries')
        .delete()
        .eq('id', entryId)

      if (error) throw error
    } catch (error) {
      console.error('Error deleting delivery entry:', error)
      throw error
    }
  }

  // =====================================================
  // EVENT OPERATIONS
  // =====================================================

  async addEventEntry(diaryEntryId: string, entry: EventEntryForm): Promise<EventEntry> {
    try {
      const { data, error } = await this.supabase
        .from('event_entries')
        .insert([{
          diary_entry_id: diaryEntryId,
          ...entry
        }])
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error adding event entry:', error)
      throw error
    }
  }

  async getEventEntries(diaryEntryId: string): Promise<EventEntry[]> {
    try {
      const { data, error } = await this.supabase
        .from('event_entries')
        .select('*')
        .eq('diary_entry_id', diaryEntryId)
        .order('event_time', { ascending: true })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error getting event entries:', error)
      throw error
    }
  }

  async updateEventEntry(entryId: string, updates: Partial<EventEntryForm>): Promise<EventEntry> {
    try {
      const { data, error } = await this.supabase
        .from('event_entries')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', entryId)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error updating event entry:', error)
      throw error
    }
  }

  async deleteEventEntry(entryId: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('event_entries')
        .delete()
        .eq('id', entryId)

      if (error) throw error
    } catch (error) {
      console.error('Error deleting event entry:', error)
      throw error
    }
  }

  // =====================================================
  // PHOTO WATERMARKING & ATTACHMENTS
  // =====================================================

  /**
   * Upload and watermark a photo
   */
  async uploadWatermarkedPhoto(
    file: File,
    watermarkData: WatermarkData,
    entryType: 'diary' | 'manpower' | 'equipment' | 'delivery' | 'event',
    entryId: string
  ): Promise<PhotoUploadResult> {
    try {
      // Generate unique filename
      const timestamp = Date.now()
      const randomId = Math.random().toString(36).substring(7)
      const fileExtension = file.name.split('.').pop()
      const baseFilename = `${timestamp}-${randomId}`
      
      const originalFilename = `${baseFilename}-original.${fileExtension}`
      const watermarkedFilename = `${baseFilename}-watermarked.${fileExtension}`

      // Upload original file
      const originalPath = `site-diary/${entryType}/${originalFilename}`
      const { data: originalUpload, error: originalError } = await this.supabase.storage
        .from('site-photos')
        .upload(originalPath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (originalError) throw originalError

      // For now, we'll use the original as watermarked (Phase 1 implementation)
      // In Phase 2, we'll implement server-side watermarking
      const watermarkedPath = originalPath

      // Get public URLs
      const { data: { publicUrl: originalUrl } } = this.supabase.storage
        .from('site-photos')
        .getPublicUrl(originalPath)

      const { data: { publicUrl: watermarkedUrl } } = this.supabase.storage
        .from('site-photos')
        .getPublicUrl(watermarkedPath)

      // Create attachment record
      const attachmentData: any = {
        original_filename: file.name,
        watermarked_filename: watermarkedFilename,
        file_size: file.size,
        mime_type: file.type,
        watermark_data: watermarkData,
        original_path: originalPath,
        watermarked_path: watermarkedPath
      }

      // Set the appropriate entry ID
      switch (entryType) {
        case 'diary':
          attachmentData.diary_entry_id = entryId
          break
        case 'manpower':
          attachmentData.manpower_entry_id = entryId
          break
        case 'equipment':
          attachmentData.equipment_entry_id = entryId
          break
        case 'delivery':
          attachmentData.delivery_entry_id = entryId
          break
        case 'event':
          attachmentData.event_entry_id = entryId
          break
      }

      // Extract GPS if available
      if (watermarkData.gps_coordinates) {
        const gpsMatch = watermarkData.gps_coordinates.match(/Lat: ([-\d.]+), Lng: ([-\d.]+)/)
        if (gpsMatch && gpsMatch[1] && gpsMatch[2]) {
          attachmentData.gps_latitude = parseFloat(gpsMatch[1])
          attachmentData.gps_longitude = parseFloat(gpsMatch[2])
        }
      }

      const { data: attachment, error: attachmentError } = await this.supabase
        .from('site_diary_attachments')
        .insert([attachmentData])
        .select()
        .single()

      if (attachmentError) throw attachmentError

      return {
        original_url: originalUrl,
        watermarked_url: watermarkedUrl,
        attachment_id: attachment.id,
        watermark_data: watermarkData
      }
    } catch (error) {
      console.error('Error uploading watermarked photo:', error)
      throw error
    }
  }

  /**
   * Get attachments for a diary entry
   */
  async getAttachments(diaryEntryId: string): Promise<SiteDiaryAttachment[]> {
    try {
      const { data, error } = await this.supabase
        .from('site_diary_attachments')
        .select('*')
        .eq('diary_entry_id', diaryEntryId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error getting attachments:', error)
      throw error
    }
  }

  // =====================================================
  // SEARCH AND ANALYTICS
  // =====================================================

  /**
   * Search site diary entries with filters
   */
  async searchDiaryEntries(filters: SiteDiaryFilters): Promise<SiteDiaryEntry[]> {
    try {
      let query = this.supabase
        .from('site_diary_entries')
        .select('*')

      if (filters.project_id) {
        query = query.eq('project_id', filters.project_id)
      }

      if (filters.date_from) {
        query = query.gte('date', filters.date_from)
      }

      if (filters.date_to) {
        query = query.lte('date', filters.date_to)
      }

      if (filters.weather_conditions && filters.weather_conditions.length > 0) {
        query = query.in('weather_conditions', filters.weather_conditions)
      }

      const { data, error } = await query.order('date', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error searching diary entries:', error)
      throw error
    }
  }

  /**
   * Generate daily summary for a specific date
   */
  async generateDailySummary(projectId: string, date: string): Promise<DailySummary> {
    try {
      const completeDiary = await this.getCompleteDiary(projectId, date)
      
      if (!completeDiary) {
        return {
          date,
          total_workers: 0,
          total_hours: 0,
          equipment_utilization: 0,
          deliveries_count: 0,
          events_count: 0,
          safety_incidents: 0,
          weather_delays: false,
          cost_impact: 0,
          time_impact_hours: 0
        }
      }

      const { manpower_entries, equipment_entries, delivery_entries, event_entries } = completeDiary

      // Calculate totals
      const total_workers = manpower_entries.reduce((sum, entry) => sum + entry.workers_count, 0)
      const total_hours = manpower_entries.reduce((sum, entry) => sum + entry.hours_worked, 0)
      const equipment_hours = equipment_entries.reduce((sum, entry) => sum + entry.hours_used, 0)
      const equipment_downtime = equipment_entries.reduce((sum, entry) => sum + entry.downtime_hours, 0)
      const equipment_utilization = equipment_hours > 0 ? ((equipment_hours - equipment_downtime) / equipment_hours) * 100 : 0

      const deliveries_count = delivery_entries.length
      const events_count = event_entries.length
      const safety_incidents = event_entries.filter(e => e.category === 'SAFETY').length
      const weather_delays = event_entries.some(e => e.category === 'WEATHER' && e.impact_level !== 'LOW')
      const cost_impact = event_entries.reduce((sum, entry) => sum + (entry.cost_impact || 0), 0)
      const time_impact_hours = event_entries.reduce((sum, entry) => sum + (entry.time_impact_hours || 0), 0)

      return {
        date,
        total_workers,
        total_hours,
        equipment_utilization,
        deliveries_count,
        events_count,
        safety_incidents,
        weather_delays,
        cost_impact,
        time_impact_hours
      }
    } catch (error) {
      console.error('Error generating daily summary:', error)
      throw error
    }
  }

  // =====================================================
  // UTILITY FUNCTIONS
  // =====================================================

  /**
   * Get current GPS coordinates
   */
  async getCurrentLocation(): Promise<{ latitude: number; longitude: number } | null> {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve(null)
        return
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          })
        },
        (error) => {
          console.error('Error getting location:', error)
          resolve(null)
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000
        }
      )
    })
  }

  /**
   * Create watermark data for photos
   */
  createWatermarkData(
    projectName: string,
    lotNumber?: string,
    weatherConditions?: string,
    userName?: string,
    gpsCoordinates?: { latitude: number; longitude: number }
  ): WatermarkData {
    const now = new Date()
    
    return {
      project_name: projectName,
      date: now.toLocaleDateString('en-AU'), // DD/MM/YYYY format
      time: now.toLocaleTimeString('en-AU', { hour12: false }), // HH:MM format
      gps_coordinates: gpsCoordinates 
        ? `Lat: ${gpsCoordinates.latitude.toFixed(6)}, Lng: ${gpsCoordinates.longitude.toFixed(6)}`
        : undefined,
      user_name: userName || 'Site User',
      lot_number: lotNumber,
      weather_conditions: weatherConditions
    }
  }
}

// Export singleton instance
export const siteDiaryService = new SiteDiaryService()