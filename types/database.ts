// types/database.ts
export interface Project {
  id: string
  name: string
  description?: string
  project_number?: string
  location?: string
  status?: string
  organization_id: string
  created_at: string
  updated_at?: string
}

export interface Lot {
  id: string
  name: string
  description?: string
  status?: string
  project_id: string
  created_at: string
  updated_at?: string
}

export interface LotWithProject extends Lot {
  projects: Project // Single project (not array)
}

export interface DailyLotReport {
  id: string
  lot_id: string
  report_date: string
  weather: string
  general_activities: string
  created_at: string
  updated_at: string
}

export interface DiaryEntry {
  id: string
  daily_report_id: string
  timestamp: string
  title: string
  description: string
  photo_url?: string
  gps_coordinates?: string
  created_by: string
}

export interface LabourDocket {
  id: string
  daily_report_id: string
  person_name: string
  company?: string
  hours_worked: number
  hourly_rate?: number
  created_at: string
}

export interface PlantDocket {
  id: string
  daily_report_id: string
  equipment_name: string
  docket_number?: string
  hours_worked: number
  hourly_rate?: number
  created_at: string
}

export interface MaterialDocket {
  id: string
  daily_report_id: string
  material_name: string
  supplier?: string
  docket_number?: string
  quantity: number
  unit?: string
  unit_rate?: number
  created_at: string
}

export interface ComplianceCheck {
  id: string
  daily_report_id: string
  check_type: 'itp' | 'environmental'
  item_name: string
  status: 'pass' | 'fail' | 'na'
  comments?: string
  photo_url?: string
  checked_by: string
  checked_at: string
}

// API Response types
export interface SupabaseResponse<T> {
  data: T | null
  error: any
}

// Form types
export interface CreateDiaryEntryForm {
  title: string
  description: string
  photo?: File
}

export interface CreateLabourDocketForm {
  person_name: string
  company?: string
  hours_worked: number
  hourly_rate?: number
}

export interface CreatePlantDocketForm {
  equipment_name: string
  docket_number?: string
  hours_worked: number
  hourly_rate?: number
}

export interface CreateMaterialDocketForm {
  material_name: string
  supplier?: string
  docket_number?: string
  quantity: number
  unit?: string
  unit_rate?: number
}

export interface CreateComplianceCheckForm {
  check_type: 'itp' | 'environmental'
  item_name: string
  status: 'pass' | 'fail' | 'na'
  comments?: string
  photo?: File
}

// UI State types
export interface LoadingState {
  lot: boolean
  dailyReport: boolean
  diaryEntries: boolean
  labourDockets: boolean
  plantDockets: boolean
  materialDockets: boolean
  complianceChecks: boolean
}

export interface ErrorState {
  lot?: string
  dailyReport?: string
  diaryEntries?: string
  labourDockets?: string
  plantDockets?: string
  materialDockets?: string
  complianceChecks?: string
  general?: string
}

export type TabType = 'diary' | 'dockets' | 'compliance'

// GPS Coordinates type
export interface GPSCoordinates {
  latitude: number
  longitude: number
}