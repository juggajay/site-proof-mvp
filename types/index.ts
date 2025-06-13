// types/index.ts
export interface ConformanceRecord {
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
  pass_fail_value: 'PASS' | 'FAIL' | 'N/A' | null
  text_value: string | null
  numeric_value: number | null
  organization_id: string
  created_at: string
  updated_at: string
}

export interface CreateConformanceRecord {
  lot_id: string
  project_id: string
  itp_id: string
  item_id: string
  status: 'pass' | 'fail' | 'na' | 'pending'
  notes?: string
  checked_by: string
  checked_at: string
  photo?: File | null
  organization_id: string
}

export interface Lot {
  id: string
  name: string
  description: string | null
  location: string | null
  priority: 'low' | 'medium' | 'high'
  project_id: string
  created_at: string
  updated_at: string
}

export interface Project {
  id: string
  name: string
  description: string | null
  project_number: string
  location: string
  organization_id: string
  created_at: string
  updated_at: string
}

export interface LotWithItp {
  id: string
  name: string
  lot_number: string
  description: string | null
  location: string | null
  priority: 'low' | 'medium' | 'high'
  status: string
  project_id: string
  created_at: string
  updated_at: string
  itps: ITP[]
}

export interface ITP {
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

export interface TeamMember {
  id: string
  name: string | null
  email: string
  role: string | null
  certifications: string[]
  current_workload: number
  organization_id: string
}

export interface ITPAssignment {
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

export interface CreateITPAssignment {
  lot_id: string
  project_id: string
  itp_id: string
  assigned_to: string
  scheduled_date: string
  estimated_completion_date?: string | null
  priority: 'low' | 'medium' | 'high'
  notes?: string | null
  organization_id: string
}

export interface ItpItem {
  id: string
  itp_id: string
  item_number: string
  description: string
  item_description: string
  acceptance_criteria: string
  test_method: string | null
  frequency: string | null
  responsibility: string | null
  item_type: 'PASS_FAIL' | 'TEXT_INPUT' | 'NUMERIC'
  order: number
  conformance_records?: ConformanceRecord[]
}

export interface ConformanceRecordWithAttachments extends ConformanceRecord {
  attachments?: string[]
  comment?: string
}

export interface FullLotData {
  id: string
  name: string
  lot_number: string
  description: string | null
  location: string | null
  priority: 'low' | 'medium' | 'high'
  status: string
  project_id: string
  created_at: string
  updated_at: string
  projects: {
    id: string
    name: string
    description: string | null
    project_number: string
    location: string
    organization_id: string
    created_at: string
    updated_at: string
  }
  itps: {
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
    itp_items: ItpItem[]
  }
}

export interface Database {
  public: {
    Tables: {
      conformance_records: {
        Row: ConformanceRecord
        Insert: Omit<ConformanceRecord, 'id' | 'created_at' | 'updated_at'> & {
          id?: string
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Omit<ConformanceRecord, 'id' | 'created_at' | 'updated_at'>> & {
          updated_at?: string
        }
      }
      lots: {
        Row: Lot
        Insert: Omit<Lot, 'id' | 'created_at' | 'updated_at'> & {
          id?: string
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Omit<Lot, 'id' | 'created_at' | 'updated_at'>> & {
          updated_at?: string
        }
      }
      itps: {
        Row: ITP
        Insert: Omit<ITP, 'id' | 'created_at' | 'updated_at'> & {
          id?: string
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Omit<ITP, 'id' | 'created_at' | 'updated_at'>> & {
          updated_at?: string
        }
      }
      itp_assignments: {
        Row: ITPAssignment
        Insert: Omit<ITPAssignment, 'id' | 'created_at' | 'updated_at'> & {
          id?: string
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Omit<ITPAssignment, 'id' | 'created_at' | 'updated_at'>> & {
          updated_at?: string
        }
      }
      profiles: {
        Row: TeamMember & {
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          name?: string | null
          email: string
          role?: string | null
          organization_id: string
          certifications?: string[]
          current_workload?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          name?: string | null
          role?: string | null
          certifications?: string[]
          current_workload?: number
          updated_at?: string
        }
      }
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
          name?: string
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

// Re-export from other files for backward compatibility
export * from './compliance'
export * from './auth'