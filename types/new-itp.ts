// =====================================================
// NEW ITP SYSTEM TYPES
// =====================================================

// Inspection types enum
export type InspectionType = 'boolean' | 'numeric' | 'text' | 'multi_choice' | 'signature'
export type InspectionStatus = 'pending' | 'pass' | 'fail' | 'na' | 'deferred'
export type AssignmentStatus = 'pending' | 'in_progress' | 'completed' | 'approved'
export type NonConformanceSeverity = 'critical' | 'major' | 'minor' | 'observation'
export type NonConformanceStatus = 'open' | 'investigating' | 'resolved' | 'closed' | 'verified'
export type AttachmentType = 'photo' | 'document' | 'video'

// ITP Template (Blueprint)
export interface ITPTemplate {
  id: string
  organization_id: string
  name: string
  code?: string // e.g., "CONC-001"
  description?: string
  category?: string // "Concrete", "Asphalt", etc.
  version: string
  is_active: boolean
  is_custom: boolean // Created via ITP builder
  created_by?: string
  created_at: string
  updated_at: string
}

// ITP Template Item
export interface ITPTemplateItem {
  id: string
  template_id: string
  item_code?: string // e.g., "TEMP-01"
  description: string
  inspection_type: InspectionType
  
  // Validation rules
  min_value?: number
  max_value?: number
  unit?: string // "°C", "mm", "%"
  choices?: Array<{ value: string; label: string }> // For multi_choice
  
  // Requirements
  acceptance_criteria?: string
  inspection_method?: string
  reference_standard?: string // "AS 2870", "ASTM C143"
  
  // Control points
  is_mandatory: boolean
  is_witness_point: boolean // Requires supervisor approval
  is_hold_point: boolean // Work cannot proceed without approval
  
  sort_order: number
  created_at: string
  updated_at: string
}

// Lot ITP Assignment
export interface LotITPAssignment {
  id: string
  lot_id: string
  template_id: string
  
  // Instance details
  instance_name?: string // e.g., "Concrete Pour - Level 2"
  sequence_number: number // Order of execution
  
  // Status tracking
  status: AssignmentStatus
  started_at?: string
  completed_at?: string
  approved_at?: string
  approved_by?: string
  
  // Assignment
  assigned_to?: string
  assigned_by?: string
  assigned_at: string
  
  created_at: string
  updated_at: string
}

// ITP Inspection Record
export interface ITPInspectionRecord {
  id: string
  assignment_id: string
  template_item_id: string
  
  // Results based on inspection_type
  result_boolean?: boolean
  result_numeric?: number
  result_text?: string
  result_choice?: string
  
  // Common fields
  status: InspectionStatus
  comments?: string
  
  // Inspection details
  inspected_by?: string
  inspected_at?: string
  
  // Witness/Hold point approvals
  witnessed_by?: string
  witnessed_at?: string
  
  // Non-conformance
  is_non_conforming: boolean
  nc_reference?: string // NC number
  
  // Attachments
  attachment_count: number
  has_photos: boolean
  
  created_at: string
  updated_at: string
}

// Non-Conformance
export interface NonConformance {
  id: string
  nc_number: string // Auto-generated "NC-2024-001"
  
  // Source
  inspection_record_id?: string
  lot_id: string
  project_id: string
  
  // Details
  title: string
  description: string
  severity: NonConformanceSeverity
  category?: string // 'workmanship', 'material', 'documentation'
  
  // Resolution
  root_cause?: string
  corrective_action?: string
  preventive_action?: string
  
  // Status
  status: NonConformanceStatus
  
  // People
  raised_by: string
  assigned_to?: string
  verified_by?: string
  
  // Dates
  raised_at: string
  due_date?: string
  resolved_at?: string
  closed_at?: string
  verified_at?: string
  
  // Attachments
  attachment_count: number
  
  created_at: string
  updated_at: string
}

// Extended types with relationships
export interface ITPTemplateWithItems extends ITPTemplate {
  items: ITPTemplateItem[]
}

export interface LotITPAssignmentWithDetails extends LotITPAssignment {
  template: ITPTemplate
  inspection_records: ITPInspectionRecord[]
  progress?: {
    total_items: number
    completed_items: number
    passed_items: number
    failed_items: number
    na_items: number
    deferred_items: number
    progress_percentage: number
  }
}

export interface ITPInspectionRecordWithDetails extends ITPInspectionRecord {
  template_item: ITPTemplateItem
  non_conformance?: NonConformance
}

// Form types
export interface CreateITPTemplateRequest {
  name: string
  code?: string
  description?: string
  category?: string
  items: CreateITPTemplateItemRequest[]
}

export interface CreateITPTemplateItemRequest {
  item_code?: string
  description: string
  inspection_type: InspectionType
  min_value?: number
  max_value?: number
  unit?: string
  choices?: Array<{ value: string; label: string }>
  acceptance_criteria?: string
  inspection_method?: string
  reference_standard?: string
  is_mandatory?: boolean
  is_witness_point?: boolean
  is_hold_point?: boolean
  sort_order: number
}

export interface AssignITPToLotRequest {
  lot_id: string
  template_id: string
  instance_name?: string
  assigned_to?: string
}

export interface UpdateInspectionRecordRequest {
  status?: InspectionStatus
  result_boolean?: boolean
  result_numeric?: number
  result_text?: string
  result_choice?: string
  comments?: string
  is_non_conforming?: boolean
}

export interface CreateNonConformanceRequest {
  inspection_record_id?: string
  lot_id: string
  project_id: string
  title: string
  description: string
  severity: NonConformanceSeverity
  category?: string
  assigned_to?: string
  due_date?: string
}

// Progress calculation result
export interface ITPProgress {
  total_items: number
  completed_items: number
  passed_items: number
  failed_items: number
  na_items: number
  deferred_items: number
  pending_items: number
  progress_percentage: number
  has_non_conformances: boolean
}

// Attachment types
export interface ITPInspectionAttachment {
  id: string
  inspection_record_id: string
  
  // File details
  filename: string
  original_filename: string
  mime_type: string
  file_size: number // in bytes
  storage_path: string
  
  // Metadata
  attachment_type: AttachmentType
  description?: string
  
  // Location data (for field photos)
  latitude?: number
  longitude?: number
  altitude?: number
  accuracy?: number // GPS accuracy in meters
  
  // Device info
  device_info?: {
    device: string
    os: string
    app_version: string
  }
  
  // URLs
  url?: string
  thumbnail_url?: string
  
  // Upload details
  uploaded_by: string
  uploaded_at: string
  created_at: string
}

export interface NCAttachment {
  id: string
  non_conformance_id: string
  
  // File details
  filename: string
  original_filename: string
  mime_type: string
  file_size: number
  storage_path: string
  
  // Metadata
  attachment_type: AttachmentType
  description?: string
  
  // URLs
  url?: string
  
  // Upload details
  uploaded_by: string
  uploaded_at: string
  created_at: string
}

// Upload request types
export interface UploadAttachmentRequest {
  file: File
  attachment_type: AttachmentType
  description?: string
  location?: {
    latitude: number
    longitude: number
    altitude?: number
    accuracy?: number
  }
}