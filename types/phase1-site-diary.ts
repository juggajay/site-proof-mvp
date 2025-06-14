// Phase 1 Site Diary TypeScript Interfaces
// These match the database schema for the comprehensive site diary system

// =====================================================
// CORE SITE DIARY INTERFACES
// =====================================================

export interface SiteDiaryEntry {
  id: string
  project_id: string
  date: string // ISO date string
  weather_conditions?: string
  temperature_celsius?: number
  site_supervisor?: string
  safety_briefing_conducted: boolean
  general_notes?: string
  created_by: string
  created_at: string
  updated_at: string
}

// =====================================================
// MANPOWER LOGGING
// =====================================================

export interface ManpowerEntry {
  id: string
  diary_entry_id: string
  trade: string // e.g., "Electrician", "Plumber", "General Labor"
  workers_count: number
  hours_worked: number
  supervisor?: string
  notes?: string
  weather_impact: boolean
  overtime_hours: number
  created_at: string
  updated_at: string
}

// Form data for creating manpower entries
export interface ManpowerEntryForm {
  trade: string
  workers_count: number
  hours_worked: number
  supervisor?: string
  notes?: string
  weather_impact?: boolean
  overtime_hours?: number
}

// =====================================================
// EQUIPMENT LOGGING
// =====================================================

export interface EquipmentEntry {
  id: string
  diary_entry_id: string
  equipment_type: string // e.g., "Excavator", "Crane", "Concrete Pump"
  equipment_id?: string
  hours_used: number
  operator?: string
  maintenance_issues?: string
  downtime_reason?: string
  downtime_hours: number
  fuel_usage?: number
  created_at: string
  updated_at: string
}

// Form data for creating equipment entries
export interface EquipmentEntryForm {
  equipment_type: string
  equipment_id?: string
  hours_used: number
  operator?: string
  maintenance_issues?: string
  downtime_reason?: string
  downtime_hours?: number
  fuel_usage?: number
}

// =====================================================
// DELIVERIES LOGGING
// =====================================================

export interface DeliveryEntry {
  id: string
  diary_entry_id: string
  delivery_time: string // Time string "HH:MM"
  supplier: string
  material_type: string
  quantity: number
  unit: string // e.g., "m3", "tonnes", "units"
  delivery_docket?: string
  received_by: string
  quality_issues?: string
  rejection_reason?: string
  photos_attached: boolean
  created_at: string
  updated_at: string
}

// Form data for creating delivery entries
export interface DeliveryEntryForm {
  delivery_time: string
  supplier: string
  material_type: string
  quantity: number
  unit: string
  delivery_docket?: string
  received_by: string
  quality_issues?: string
  rejection_reason?: string
  photos_attached?: boolean
}

// =====================================================
// EVENTS LOGGING (CATEGORIZED)
// =====================================================

export type EventCategory = 
  | 'DELAY' 
  | 'INSTRUCTION' 
  | 'SAFETY' 
  | 'WEATHER' 
  | 'INSPECTION' 
  | 'QUALITY_ISSUE'
  | 'VISITOR'
  | 'MEETING'
  | 'OTHER'

export type ImpactLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'

export interface EventEntry {
  id: string
  diary_entry_id: string
  event_time: string // Time string "HH:MM"
  category: EventCategory
  title: string
  description: string
  impact_level: ImpactLevel
  responsible_party?: string
  follow_up_required: boolean
  follow_up_date?: string // ISO date string
  photos_attached: boolean
  cost_impact?: number
  time_impact_hours?: number
  created_at: string
  updated_at: string
}

// Form data for creating event entries
export interface EventEntryForm {
  event_time: string
  category: EventCategory
  title: string
  description: string
  impact_level: ImpactLevel
  responsible_party?: string
  follow_up_required?: boolean
  follow_up_date?: string
  photos_attached?: boolean
  cost_impact?: number
  time_impact_hours?: number
}

// =====================================================
// WATERMARKED PHOTO ATTACHMENTS
// =====================================================

export interface WatermarkData {
  project_name: string
  date: string // "DD/MM/YYYY"
  time: string // "HH:MM"
  gps_coordinates?: string // "Lat: -33.8688, Lng: 151.2093"
  user_name: string
  lot_number?: string
  weather_conditions?: string
}

export interface SiteDiaryAttachment {
  id: string
  diary_entry_id?: string
  manpower_entry_id?: string
  equipment_entry_id?: string
  delivery_entry_id?: string
  event_entry_id?: string
  
  original_filename: string
  watermarked_filename: string
  file_size: number
  mime_type: string
  
  // Watermark metadata
  watermark_data?: WatermarkData
  gps_latitude?: number
  gps_longitude?: number
  
  // Storage paths
  original_path: string
  watermarked_path: string
  
  uploaded_by: string
  created_at: string
}

// =====================================================
// COMPREHENSIVE SITE DIARY DATA
// =====================================================

// Complete site diary with all related entries
export interface CompleteSiteDiary {
  diary_entry: SiteDiaryEntry
  manpower_entries: ManpowerEntry[]
  equipment_entries: EquipmentEntry[]
  delivery_entries: DeliveryEntry[]
  event_entries: EventEntry[]
  attachments: SiteDiaryAttachment[]
}

// =====================================================
// FORM INTERFACES FOR UI COMPONENTS
// =====================================================

// Main site diary form
export interface SiteDiaryForm {
  weather_conditions?: string
  temperature_celsius?: number
  site_supervisor?: string
  safety_briefing_conducted: boolean
  general_notes?: string
}

// Quick add interfaces for mobile-optimized forms
export interface QuickManpowerAdd {
  trade: string
  workers_count: number
  hours_worked: number
}

export interface QuickEquipmentAdd {
  equipment_type: string
  hours_used: number
  operator?: string
}

export interface QuickDeliveryAdd {
  supplier: string
  material_type: string
  quantity: number
  unit: string
  received_by: string
}

export interface QuickEventAdd {
  category: EventCategory
  title: string
  description: string
  impact_level: ImpactLevel
}

// =====================================================
// SEARCH AND FILTER INTERFACES
// =====================================================

export interface SiteDiaryFilters {
  date_from?: string
  date_to?: string
  project_id?: string
  weather_conditions?: string[]
  event_categories?: EventCategory[]
  impact_levels?: ImpactLevel[]
  trades?: string[]
  equipment_types?: string[]
  suppliers?: string[]
}

export interface SiteDiarySearchResult {
  diary_entry: SiteDiaryEntry
  total_manpower_hours: number
  total_equipment_hours: number
  total_deliveries: number
  high_impact_events: number
  has_safety_issues: boolean
}

// =====================================================
// SUMMARY AND ANALYTICS INTERFACES
// =====================================================

export interface DailySummary {
  date: string
  total_workers: number
  total_hours: number
  equipment_utilization: number
  deliveries_count: number
  events_count: number
  safety_incidents: number
  weather_delays: boolean
  cost_impact: number
  time_impact_hours: number
}

export interface WeeklySummary {
  week_start: string
  week_end: string
  daily_summaries: DailySummary[]
  total_workers: number
  total_hours: number
  average_daily_workers: number
  equipment_efficiency: number
  delivery_performance: number
  safety_score: number
}

// =====================================================
// VOICE-TO-TEXT INTEGRATION
// =====================================================

export interface VoiceRecognitionConfig {
  language: string
  continuous: boolean
  interim_results: boolean
  max_alternatives: number
}

export interface VoiceRecognitionResult {
  transcript: string
  confidence: number
  is_final: boolean
}

// =====================================================
// PHOTO WATERMARKING
// =====================================================

export interface PhotoWatermarkConfig {
  position: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
  opacity: number
  font_size: number
  background_opacity: number
  include_gps: boolean
  include_weather: boolean
}

export interface PhotoUploadResult {
  original_url: string
  watermarked_url: string
  attachment_id: string
  watermark_data: WatermarkData
}

// =====================================================
// API RESPONSE TYPES
// =====================================================

export interface SiteDiaryApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  per_page: number
  total_pages: number
}

// =====================================================
// UTILITY TYPES
// =====================================================

// Common trade types for dropdowns
export const COMMON_TRADES = [
  'General Labourer',
  'Plant Operator',
  'Truck Driver',
  'Concrete Finisher',
  'Steel Fixer',
  'Carpenter',
  'Electrician',
  'Plumber',
  'Supervisor',
  'Foreman',
  'Safety Officer'
] as const

// Common equipment types
export const COMMON_EQUIPMENT = [
  'Excavator',
  'Crane',
  'Concrete Pump',
  'Bulldozer',
  'Loader',
  'Dump Truck',
  'Compactor',
  'Generator',
  'Welding Equipment',
  'Scaffolding'
] as const

// Common material units
export const COMMON_UNITS = [
  'm3',
  'tonnes',
  'units',
  'litres',
  'metres',
  'sheets',
  'bags',
  'pallets'
] as const

// Weather conditions
export const WEATHER_CONDITIONS = [
  'sunny',
  'partly_cloudy',
  'cloudy',
  'overcast',
  'light_rain',
  'rain',
  'heavy_rain',
  'storm',
  'wind',
  'fog'
] as const