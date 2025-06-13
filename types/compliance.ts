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

export interface UpdateComplianceCheckForm {
  status?: 'compliant' | 'non_compliant' | 'pending'
  notes?: string
  photo?: File | null
  photo_url?: string
}