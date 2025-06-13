export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string
          name: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          updated_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          name: string | null
          email: string
          role: string | null
          organization_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          name?: string | null
          email: string
          role?: string | null
          organization_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          name?: string | null
          role?: string | null
          organization_id?: string
          updated_at?: string
        }
      }
      projects: {
        Row: {
          id: string
          name: string
          description: string | null
          organization_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          organization_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          name?: string
          description?: string | null
          updated_at?: string
        }
      }
      lots: {
        Row: {
          id: string
          name: string
          description: string | null
          location: string | null
          priority: 'low' | 'medium' | 'high'
          project_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          location?: string | null
          priority?: 'low' | 'medium' | 'high'
          project_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          name?: string
          description?: string | null
          location?: string | null
          priority?: 'low' | 'medium' | 'high'
          updated_at?: string
        }
      }
      itps: {
        Row: {
          id: string
          title: string
          description: string | null
          category: string
          estimated_duration: string
          complexity: 'simple' | 'moderate' | 'complex'
          required_certifications: string[] | null
          is_active: boolean
          organization_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          category: string
          estimated_duration?: string
          complexity?: 'simple' | 'moderate' | 'complex'
          required_certifications?: string[] | null
          is_active?: boolean
          organization_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          title?: string
          description?: string | null
          category?: string
          estimated_duration?: string
          complexity?: 'simple' | 'moderate' | 'complex'
          required_certifications?: string[] | null
          is_active?: boolean
          updated_at?: string
        }
      }
      itp_assignments: {
        Row: {
          id: string
          lot_id: string
          project_id: string
          itp_id: string
          assigned_to: string
          assigned_by: string
          scheduled_date: string
          estimated_completion_date: string | null
          actual_completion_date: string | null
          priority: 'low' | 'medium' | 'high'
          status: 'assigned' | 'in_progress' | 'completed' | 'failed' | 'cancelled'
          notes: string | null
          completion_notes: string | null
          organization_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          lot_id: string
          project_id: string
          itp_id: string
          assigned_to: string
          assigned_by: string
          scheduled_date: string
          estimated_completion_date?: string | null
          priority?: 'low' | 'medium' | 'high'
          status?: 'assigned' | 'in_progress' | 'completed' | 'failed' | 'cancelled'
          notes?: string | null
          organization_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          scheduled_date?: string
          estimated_completion_date?: string | null
          actual_completion_date?: string | null
          priority?: 'low' | 'medium' | 'high'
          status?: 'assigned' | 'in_progress' | 'completed' | 'failed' | 'cancelled'
          notes?: string | null
          completion_notes?: string | null
          updated_at?: string
        }
      }
      compliance_checks: {
        Row: {
          id: string
          lot_id: string
          project_id: string
          check_type: string
          status: 'compliant' | 'non_compliant' | 'pending'
          notes: string | null
          checked_by: string
          checked_at: string
          photo_url: string | null
          organization_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          lot_id: string
          project_id: string
          check_type: string
          status: 'compliant' | 'non_compliant' | 'pending'
          notes?: string | null
          checked_by: string
          checked_at: string
          photo_url?: string | null
          organization_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          check_type?: string
          status?: 'compliant' | 'non_compliant' | 'pending'
          notes?: string | null
          checked_at?: string
          photo_url?: string | null
          updated_at?: string
        }
      }
      conformance_records: {
        Row: {
          id: string
          lot_id: string
          project_id: string
          itp_id: string
          item_id: string
          status: 'pass' | 'fail' | 'na' | 'pending'
          notes: string | null
          checked_by: string
          checked_at: string
          photo_url: string | null
          organization_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          lot_id: string
          project_id: string
          itp_id: string
          item_id: string
          status: 'pass' | 'fail' | 'na' | 'pending'
          notes?: string | null
          checked_by: string
          checked_at: string
          photo_url?: string | null
          organization_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          status?: 'pass' | 'fail' | 'na' | 'pending'
          notes?: string | null
          checked_at?: string
          photo_url?: string | null
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

// Additional type exports for the application
export type Project = Database['public']['Tables']['projects']['Row']
export type Lot = Database['public']['Tables']['lots']['Row']
export type Organization = Database['public']['Tables']['organizations']['Row']
export type Profile = Database['public']['Tables']['profiles']['Row']
export type ComplianceCheckRow = Database['public']['Tables']['compliance_checks']['Row']
export type ConformanceRecordRow = Database['public']['Tables']['conformance_records']['Row']
export type ITP = Database['public']['Tables']['itps']['Row']
export type ITPAssignment = Database['public']['Tables']['itp_assignments']['Row']

// Extended types for application use
export interface LotWithProject {
  id: string
  name: string
  description: string | null
  status: string
  project_id: string
  created_at: string
  updated_at: string
  projects: Project
}

export interface DailyLotReport {
  id: string
  lot_id: string
  project_id: string
  report_date: string
  weather: string
  temperature: number | null
  general_activities: string
  safety_incidents: string | null
  progress_summary: string
  issues_concerns: string | null
  next_day_plan: string | null
  created_by: string
  created_at: string
  updated_at: string
}

export interface DiaryEntry {
  id: string
  daily_report_id: string
  timestamp: string
  entry_type: 'general' | 'safety' | 'quality' | 'progress' | 'issue'
  title: string
  description: string
  location: string | null
  gps_coordinates: GPSCoordinates | null
  photo_url: string | null
  created_by: string
  created_at: string
}

export interface LabourDocket {
  id: string
  daily_report_id: string
  worker_name: string
  trade: string
  start_time: string
  end_time: string
  break_duration: number
  hourly_rate: number
  total_hours: number
  total_cost: number
  task_description: string
  location: string | null
  supervisor: string | null
  created_at: string
}

export interface PlantDocket {
  id: string
  daily_report_id: string
  equipment_type: string
  equipment_id: string
  operator_name: string
  start_time: string
  end_time: string
  hourly_rate: number
  total_hours: number
  total_cost: number
  task_description: string
  location: string | null
  fuel_usage: number | null
  maintenance_notes: string | null
  created_at: string
}

export interface MaterialDocket {
  id: string
  daily_report_id: string
  material_type: string
  supplier: string
  quantity: number
  unit: string
  unit_cost: number
  total_cost: number
  delivery_time: string
  location: string | null
  quality_check: boolean
  notes: string | null
  created_at: string
}

export interface ComplianceCheck {
  id: string
  lot_id: string
  project_id: string
  check_type: string
  status: 'compliant' | 'non_compliant' | 'pending'
  notes: string | null
  checked_by: string
  checked_at: string
  photo_url: string | null
  organization_id: string
  created_at: string
  updated_at: string
}

export interface GPSCoordinates {
  latitude: number
  longitude: number
  accuracy?: number
}

// Form types for creating new records
export interface CreateDiaryEntryForm {
  entry_type: DiaryEntry['entry_type']
  title: string
  description: string
  location?: string
  gps_coordinates?: GPSCoordinates
  photo?: File
  photos?: string[]
}

export interface CreateLabourDocketForm {
  worker_name: string
  trade: string
  start_time: string
  end_time: string
  break_duration: number
  hourly_rate: number
  task_description: string
  location?: string
  supervisor?: string
}

export interface CreatePlantDocketForm {
  equipment_type: string
  equipment_id: string
  operator_name: string
  start_time: string
  end_time: string
  hourly_rate: number
  task_description: string
  location?: string
  fuel_usage?: number
  maintenance_notes?: string
}

export interface CreateMaterialDocketForm {
  material_type: string
  supplier: string
  quantity: number
  unit: string
  unit_cost: number
  delivery_time: string
  location?: string
  quality_check: boolean
  notes?: string
}

export interface CreateComplianceCheckForm {
  id?: string
  lot_id: string
  project_id: string
  check_type: string
  status: 'compliant' | 'non_compliant' | 'pending'
  notes?: string
  checked_by: string
  checked_at: string
  organization_id: string
  photo?: File | null // This is the missing property
  photo_url?: string // For storing the uploaded photo URL
}

export interface UpdateComplianceCheckForm {
  status?: 'compliant' | 'non_compliant' | 'pending'
  notes?: string
  photo?: File | null
  photo_url?: string
}