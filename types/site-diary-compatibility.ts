// types/site-diary-compatibility.ts
// Fix for existing Site Proof codebase type compatibility

import { ManpowerEntry, EquipmentEntry, DeliveryEntry, EventEntry } from './site-diary'

// Your existing CompleteSiteDiary type (from the error)
export interface CompleteSiteDiary {
  diary_entry?: {
    id: string
    project_id: string
    date: string
    weather_conditions?: string
    temperature_celsius?: number
    site_supervisor?: string
    safety_briefing_conducted: boolean
    general_notes?: string
    created_by: string
    created_at: string
    updated_at: string
  }
  manpower_entries?: ManpowerEntry[]
  equipment_entries?: EquipmentEntry[]
  delivery_entries?: DeliveryEntry[]
  event_entries?: EventEntry[]
}

// Phase 1 compatible SiteDiaryEntry type
export interface SiteDiaryEntry {
  id: string
  project_id: string
  date: string
  weather_conditions?: string
  temperature_celsius?: number
  site_supervisor?: string
  safety_briefing_conducted: boolean
  general_notes?: string
  created_by: string
  created_at: string
  updated_at: string
  manpower_entries?: ManpowerEntry[]
  equipment_entries?: EquipmentEntry[]
  delivery_entries?: DeliveryEntry[]
  event_entries?: EventEntry[]
}

// Converter function to transform CompleteSiteDiary to SiteDiaryEntry
export function convertToSiteDiaryEntry(completeDiary: CompleteSiteDiary | null): SiteDiaryEntry | null {
  if (!completeDiary || !completeDiary.diary_entry) {
    return null
  }

  return {
    ...completeDiary.diary_entry,
    manpower_entries: completeDiary.manpower_entries || [],
    equipment_entries: completeDiary.equipment_entries || [],
    delivery_entries: completeDiary.delivery_entries || [],
    event_entries: completeDiary.event_entries || []
  }
}

// Quick utility function for component use
export const convertDiaryData = (diary: any) => {
  if (!diary?.diary_entry) return null
  
  return {
    ...diary.diary_entry,
    manpower_entries: diary.manpower_entries || [],
    equipment_entries: diary.equipment_entries || [],
    delivery_entries: diary.delivery_entries || [],
    event_entries: diary.event_entries || []
  }
}

// Type guard to check if data is CompleteSiteDiary
export function isCompleteSiteDiary(data: any): data is CompleteSiteDiary {
  return data && typeof data === 'object' && 'diary_entry' in data
}

// Type guard to check if data is SiteDiaryEntry
export function isSiteDiaryEntry(data: any): data is SiteDiaryEntry {
  return data && typeof data === 'object' && 'id' in data && 'project_id' in data
}