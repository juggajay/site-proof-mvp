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

export interface UpdateConformanceRecord {
  status?: 'pass' | 'fail' | 'na' | 'pending'
  notes?: string
  checked_by?: string
  checked_at?: string
  photo?: File | null
  photo_url?: string
}

// Additional conformance-related types
export interface ConformanceRecordWithAttachments extends ConformanceRecord {
  attachments?: string[]
  comment?: string
}

export interface ConformanceStats {
  total: number
  passed: number
  failed: number
  pending: number
  na: number
  passRate: number
}