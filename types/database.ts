// Site Proof MVP - Database Types

// Existing authentication types
export interface User {
  id: number;
  email: string;
  password_hash: string;
  email_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: number;
  user_id: number;
  first_name?: string;
  last_name?: string;
  avatar_url?: string;
  phone?: string;
  timezone: string;
  created_at: string;
  updated_at: string;
}

export interface Organization {
  id: number;
  name: string;
  slug: string;
  description?: string;
  website_url?: string;
  logo_url?: string;
  created_by: number;
  created_at: string;
  updated_at: string;
}

export interface UserOrganization {
  id: number;
  user_id: number;
  organization_id: number;
  role: 'owner' | 'admin' | 'member';
  status: 'active' | 'invited' | 'suspended';
  invited_by?: number;
  joined_at: string;
}

export interface Session {
  id: number;
  user_id: number;
  session_token: string;
  expires_at: string;
  created_at: string;
}

// New Site Proof types
export interface Project {
  id: number | string;
  name: string;
  project_number?: string;
  description?: string;
  location?: string;
  start_date?: string;
  end_date?: string;
  status: 'active' | 'completed' | 'on_hold' | 'cancelled';
  organization_id: number;
  created_by: number;
  project_manager_id?: number;
  created_at: string;
  updated_at: string;
}

export interface ProjectMember {
  id: number;
  project_id: number | string;
  user_id: number;
  role: 'manager' | 'inspector' | 'viewer';
  added_by: number;
  added_at: string;
}

export interface ITPTemplate {
  id: number | string;
  name: string;
  description?: string;
  category?: string;
  version: string;
  is_active: boolean;
  organization_id: number;
  created_by: number;
  created_at: string;
  updated_at: string;
}

export interface ITPItem {
  id: number | string;
  itp_template_id: number | string;
  item_number?: string;
  description: string;
  specification_reference?: string;
  inspection_method?: 'visual' | 'measurement' | 'test' | 'document_review' | 'PASS_FAIL' | 'NUMERIC' | 'TEXT_INPUT';
  acceptance_criteria?: string;
  item_type: 'pass_fail' | 'numeric' | 'text' | 'text_input' | 'photo_required';
  is_mandatory: boolean;
  order_index: number;
  created_at: string;
}

export interface Lot {
  id: number | string;
  project_id: number | string;
  lot_number: string;
  description?: string;
  location_description?: string;
  itp_template_id?: number | string;
  status: 'pending' | 'in_progress' | 'completed' | 'approved' | 'rejected';
  start_date?: string;
  target_completion_date?: string;
  actual_completion_date?: string;
  assigned_inspector_id?: number;
  created_by: number;
  created_at: string;
  updated_at: string;
}

export interface ConformanceRecord {
  id: number;
  lot_id: number | string;
  itp_item_id: number | string;
  result_pass_fail?: 'PASS' | 'FAIL' | 'N/A';
  result_numeric?: number;
  result_text?: string;
  comments?: string;
  is_non_conformance: boolean;
  corrective_action?: string;
  inspector_id?: number;
  inspection_date?: string;
  approved_by?: number;
  approval_date?: string;
  created_at: string;
  updated_at: string;
}

export interface Attachment {
  id: number;
  conformance_record_id: number;
  filename: string;
  original_filename: string;
  file_size?: number;
  mime_type?: string;
  file_path?: string;
  storage_url?: string;
  description?: string;
  is_primary: boolean;
  uploaded_by: number;
  uploaded_at: string;
}

export interface InspectionReport {
  id: number;
  lot_id: number;
  report_type: 'inspection' | 'non_conformance' | 'completion';
  title: string;
  summary?: string;
  total_items: number;
  passed_items: number;
  failed_items: number;
  pending_items: number;
  completion_percentage: number;
  generated_by: number;
  generated_at: string;
  report_data?: any;
  file_path?: string;
  is_final: boolean;
}

export interface NonConformance {
  id: number;
  conformance_record_id: number;
  lot_id: number;
  nc_number: string;
  severity: 'critical' | 'major' | 'minor';
  description: string;
  root_cause?: string;
  corrective_action?: string;
  preventive_action?: string;
  status: 'open' | 'in_progress' | 'closed' | 'verified';
  raised_by: number;
  assigned_to?: number;
  target_closure_date?: string;
  actual_closure_date?: string;
  verified_by?: number;
  verification_date?: string;
  created_at: string;
  updated_at: string;
}

export interface AuditLog {
  id: number;
  table_name: string;
  record_id: number;
  action: 'INSERT' | 'UPDATE' | 'DELETE';
  old_values?: any;
  new_values?: any;
  changed_by: number;
  changed_at: string;
  ip_address?: string;
  user_agent?: string;
}

// Extended types with relationships
export interface ProjectWithDetails extends Project {
  organization: Organization;
  created_by_user: Profile;
  project_manager: Profile;
  members: (ProjectMember & { user: Profile })[];
  lots: Lot[];
}

export interface LotWithDetails extends Lot {
  project: Project;
  itp_template?: ITPTemplate & { itp_items: ITPItem[] };
  assigned_inspector?: Profile;
  conformance_records: (ConformanceRecord & { 
    itp_item: ITPItem;
    attachments: Attachment[];
  })[];
}

export interface ITPTemplateWithItems extends ITPTemplate {
  itp_items: ITPItem[];
  organization: Organization;
}

export interface ConformanceRecordWithDetails extends ConformanceRecord {
  lot: Lot;
  itp_item: ITPItem;
  inspector?: Profile;
  attachments: Attachment[];
  approved_by_user?: Profile;
}

// Form types for creating/updating records
export interface CreateProjectRequest {
  name: string;
  project_number?: string;
  description?: string;
  location?: string;
  start_date?: string;
  end_date?: string;
  project_manager_id?: number;
}

export interface CreateLotRequest {
  project_id: number;
  lot_number: string;
  description?: string;
  location_description?: string;
  target_completion_date?: string;
  assigned_inspector_id?: number;
}

export interface CreateITPTemplateRequest {
  name: string;
  description?: string;
  category?: string;
  itp_items: CreateITPItemRequest[];
}

export interface CreateITPItemRequest {
  item_number?: string;
  description: string;
  specification_reference?: string;
  inspection_method?: string;
  acceptance_criteria?: string;
  item_type: 'pass_fail' | 'numeric' | 'text' | 'text_input' | 'photo_required';
  is_mandatory?: boolean;
  order_index?: number;
}

export interface UpdateConformanceRequest {
  result_pass_fail?: 'PASS' | 'FAIL' | 'N/A';
  result_numeric?: number;
  result_text?: string;
  comments?: string;
  corrective_action?: string;
}

export interface CreateAttachmentRequest {
  conformance_record_id: number;
  filename: string;
  original_filename: string;
  file_size: number;
  mime_type: string;
  description?: string;
  is_primary?: boolean;
}

// API Response types
export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Dashboard statistics types
export interface ProjectStats {
  total_projects: number;
  active_projects: number;
  completed_projects: number;
  total_lots: number;
  pending_inspections: number;
  completed_inspections: number;
  non_conformances: number;
}

export interface InspectionSummary {
  lot_id: number;
  lot_number: string;
  total_items: number;
  completed_items: number;
  passed_items: number;
  failed_items: number;
  completion_percentage: number;
  last_inspection_date?: string;
}

// Filter and search types
export interface ProjectFilters {
  status?: Project['status'];
  organization_id?: number;
  project_manager_id?: number;
  search?: string;
}

export interface LotFilters {
  project_id?: number;
  status?: Lot['status'];
  assigned_inspector_id?: number;
  itp_template_id?: number | string;
  search?: string;
}

export interface ConformanceFilters {
  lot_id?: number;
  inspector_id?: number;
  result_pass_fail?: ConformanceRecord['result_pass_fail'];
  is_non_conformance?: boolean;
  date_from?: string;
  date_to?: string;
}