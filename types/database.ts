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
  organization_id?: number; // Optional for Supabase compatibility
  created_by?: number; // Optional for Supabase compatibility
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
  organization_id: number | string;
  created_by: number | string;
  created_at: string;
  updated_at: string;
}

export interface ITP {
  id: number | string;
  name: string;
  description?: string;
  template_id?: number | string;
  project_id?: number | string;
  lot_id?: number | string;
  status: 'draft' | 'active' | 'in progress' | 'completed' | 'archived';
  category?: string;
  complexity?: 'Low' | 'Medium' | 'High';
  estimated_duration?: string;
  required_certifications?: string[];
  organization_id: number | string;
  created_by?: number | string;
  created_at: string;
  updated_at: string;
}

export interface ITPTemplateItem {
  id: number | string;
  template_id: number | string;
  item_number?: string;
  description: string;
  acceptance_criteria?: string;
  inspection_method?: string;
  is_mandatory: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface ITPItem {
  id: number | string;
  itp_id: number | string; // Changed from itp_template_id to match new schema
  template_item_id?: number | string; // Reference to template item
  item_number?: string;
  description: string;
  specification_reference?: string;
  inspection_method?: string;
  acceptance_criteria?: string;
  is_mandatory: boolean;
  sort_order: number;
  status: 'Pending' | 'Pass' | 'Fail' | 'N/A' | 'In Progress';
  inspected_by?: number | string;
  inspected_date?: string;
  inspection_notes?: string;
  created_at: string;
  updated_at?: string;
}

export interface ITPAssignment {
  id: number | string;
  itp_id: number | string;
  assigned_to: number | string;
  assigned_by: number | string;
  role: 'Inspector' | 'Reviewer' | 'Approver' | 'Observer';
  scheduled_date?: string;
  notes?: string;
  created_at: string;
  updated_at?: string;
  completed_date?: string;
}

export interface Lot {
  id: number | string;
  project_id: number | string;
  lot_number: string;
  description?: string;
  location_description?: string;
  itp_template_id?: number | string; // Current field name in database
  itp_id?: number | string; // Legacy - for backward compatibility
  status: 'pending' | 'in_progress' | 'completed' | 'approved' | 'rejected';
  start_date?: string;
  target_completion_date?: string;
  actual_completion_date?: string;
  assigned_inspector_id?: number;
  created_by: number;
  created_at: string;
  updated_at: string;
}

export interface LotITPTemplate {
  id: number | string;
  lot_id: number | string;
  itp_template_id: number | string;
  assigned_at: string;
  assigned_by: number;
  is_active: boolean;
  completion_percentage?: number;
  completed_at?: string;
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

// Views from database
export interface VITPOverview {
  id: number | string;
  itp_name: string;
  template_name?: string;
  project_name?: string;
  lot_name?: string;
  status: string;
  created_at: string;
  total_items: number;
  passed_items: number;
  failed_items: number;
  pending_items: number;
  completion_percentage: number;
}

export interface VITPAssignments {
  id: number | string;
  itp_id: number | string;
  assigned_to: number | string;
  assigned_by: number | string;
  itp_name: string;
  itp_status: string;
  project_name?: string;
  lot_name?: string;
  assigned_to_email?: string;
  assigned_by_email?: string;
  assignment_status: 'Completed' | 'Overdue' | 'Due Today' | 'Scheduled';
  role: string;
  scheduled_date?: string;
  completed_date?: string;
  notes?: string;
  created_at: string;
  updated_at?: string;
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
  itp_template?: ITPTemplate & { itp_items: ITPItem[] }; // Legacy - single template
  itp_templates?: (ITPTemplate & { itp_items: ITPItem[] })[]; // New - multiple templates
  lot_itp_templates?: LotITPTemplate[]; // Old junction table records
  lot_itp_assignments?: any[]; // New junction table records
  assigned_inspector?: Profile;
  conformance_records: (ConformanceRecord & { 
    itp_item: ITPItem;
    attachments: Attachment[];
  })[];
}

export interface ITPWithDetails extends ITP {
  template?: ITPTemplate;
  project?: Project;
  lot?: Lot;
  items: ITPItem[];
  assignments: ITPAssignment[];
}

export interface ITPTemplateWithItems extends ITPTemplate {
  template_items: ITPTemplateItem[];
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
  version?: string;
  template_items?: CreateITPTemplateItemRequest[];
}

export interface CreateITPTemplateItemRequest {
  item_number?: string;
  description: string;
  acceptance_criteria?: string;
  inspection_method?: string;
  is_mandatory?: boolean;
  sort_order?: number;
}

export interface CreateITPFromTemplateRequest {
  template_id: number | string;
  project_id?: number | string;
  lot_id?: number | string;
  name?: string;
}

export interface CreateITPAssignmentRequest {
  itp_id: number | string;
  assigned_to: number | string;
  role?: 'Inspector' | 'Reviewer' | 'Approver' | 'Observer';
  scheduled_date?: string;
  notes?: string;
}

export interface UpdateITPItemRequest {
  status?: 'Pending' | 'Pass' | 'Fail' | 'N/A' | 'In Progress';
  inspection_notes?: string;
  inspected_by?: number | string;
  inspected_date?: string;
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

// Site Diary and Daily Report types
export interface DailyReport {
  id: number;
  lot_id: number | string;
  report_date: string; // YYYY-MM-DD format
  weather_condition?: string;
  temperature_high?: number;
  temperature_low?: number;
  work_summary?: string;
  issues_encountered?: string;
  safety_notes?: string;
  visitors?: string;
  equipment_status?: string;
  progress_notes?: string;
  created_by: number;
  created_at: string;
  updated_at: string;
}

export interface DailyEvent {
  id: number;
  lot_id: number | string;
  event_date: string; // YYYY-MM-DD format
  event_time?: string; // HH:MM format
  event_type: 'note' | 'incident' | 'inspection' | 'delivery' | 'meeting' | 'delay' | 'other';
  title: string;
  description?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  assigned_to?: number;
  delay_cause?: string;
  delay_duration?: number;
  created_by: number;
  created_at: string;
  updated_at: string;
}

export interface DailyLabour {
  id: number;
  lot_id: number | string;
  work_date: string; // YYYY-MM-DD format
  worker_name: string;
  trade?: string;
  hours_worked: number;
  hourly_rate?: number;
  overtime_hours?: number;
  overtime_rate?: number;
  task_description?: string;
  rate_at_time_of_entry?: number;
  cost_code?: string;
  subcontractor_employee_id?: string;
  subcontractor_id?: string;
  total_cost?: number;
  created_by: number;
  created_at: string;
  updated_at: string;
}

export interface DailyPlant {
  id: number;
  lot_id: number | string;
  work_date: string; // YYYY-MM-DD format
  equipment_type: string;
  equipment_id?: string;
  operator_name?: string;
  hours_used: number;
  hourly_rate?: number;
  fuel_consumed?: number;
  maintenance_notes?: string;
  task_description?: string;
  rate_at_time_of_entry?: number;
  cost_code?: string;
  plant_profile_id?: string;
  idle_hours?: number;
  idle_rate?: number;
  total_cost?: number;
  created_by: number;
  created_at: string;
  updated_at: string;
}

export interface DailyMaterials {
  id: number;
  lot_id: number | string;
  delivery_date: string; // YYYY-MM-DD format
  material_type: string;
  supplier?: string;
  quantity: number;
  unit_measure?: string;
  unit_cost?: number;
  total_cost?: number;
  delivery_docket?: string;
  quality_notes?: string;
  received_by?: string;
  rate_at_time_of_entry?: number;
  cost_code?: string;
  material_profile_id?: string;
  calculated_total_cost?: number;
  created_by: number;
  created_at: string;
  updated_at: string;
}

// Job Costing Resource Types
export interface Company {
  id: string;
  organization_id: string;
  company_name: string;
  company_type: 'subcontractor' | 'plant_supplier' | 'both';
  contact_person?: string;
  phone?: string;
  email?: string;
  address?: string;
  abn?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Subcontractor {
  id: string;
  organization_id: string;
  company_name: string;
  company_id?: string;
  contact_person?: string;
  phone?: string;
  email?: string;
  address?: string;
  abn?: string;
  created_at: string;
  updated_at: string;
}

export interface SubcontractorEmployee {
  id: string;
  subcontractor_id: string;
  employee_name: string;
  role?: string;
  hourly_rate: number;
  phone?: string;
  email?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PlantProfile {
  id: string;
  organization_id: string;
  company_id?: string;
  machine_name: string;
  machine_type?: string;
  supplier?: string;
  model?: string;
  registration?: string;
  default_hourly_rate: number;
  default_idle_rate?: number;
  fuel_type?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface MaterialProfile {
  id: string;
  organization_id: string;
  material_name: string;
  material_category?: string;
  supplier?: string;
  default_unit_rate: number;
  default_unit: string;
  specification?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Request types for creating site diary entries
export interface CreateDailyReportRequest {
  lot_id: number | string;
  report_date: string;
  weather_condition?: string;
  temperature_high?: number;
  temperature_low?: number;
  work_summary?: string;
  issues_encountered?: string;
  safety_notes?: string;
  visitors?: string;
  equipment_status?: string;
  progress_notes?: string;
}

export interface CreateDailyEventRequest {
  lot_id: number | string;
  event_date: string;
  event_time?: string;
  event_type: DailyEvent['event_type'];
  title: string;
  description?: string;
  severity?: DailyEvent['severity'];
  assigned_to?: number;
  delay_cause?: string;
  delay_duration?: number;
}

export interface CreateDailyLabourRequest {
  lot_id: number | string;
  work_date: string;
  worker_name: string;
  trade?: string;
  hours_worked: number;
  hourly_rate?: number;
  overtime_hours?: number;
  overtime_rate?: number;
  task_description?: string;
  rate_at_time_of_entry?: number;
  cost_code?: string;
  subcontractor_employee_id?: string;
  subcontractor_id?: string;
}

export interface CreateDailyPlantRequest {
  lot_id: number | string;
  work_date: string;
  equipment_type: string;
  equipment_id?: string;
  operator_name?: string;
  hours_used: number;
  hourly_rate?: number;
  fuel_consumed?: number;
  maintenance_notes?: string;
  task_description?: string;
  rate_at_time_of_entry?: number;
  cost_code?: string;
  plant_profile_id?: string;
  idle_hours?: number;
  idle_rate?: number;
}

export interface CreateDailyMaterialsRequest {
  lot_id: number | string;
  delivery_date: string;
  material_type: string;
  supplier?: string;
  quantity: number;
  unit_measure?: string;
  unit_cost?: number;
  total_cost?: number;
  delivery_docket?: string;
  quality_notes?: string;
  received_by?: string;
  rate_at_time_of_entry?: number;
  cost_code?: string;
  material_profile_id?: string;
}

// Resource creation request types
export interface CreateCompanyRequest {
  company_name: string;
  company_type: 'subcontractor' | 'plant_supplier' | 'both';
  contact_person?: string;
  phone?: string;
  email?: string;
  address?: string;
  abn?: string;
  is_active?: boolean;
}

export interface CreateSubcontractorRequest {
  company_name: string;
  company_id?: string;
  contact_person?: string;
  phone?: string;
  email?: string;
  address?: string;
  abn?: string;
}

export interface CreateSubcontractorEmployeeRequest {
  subcontractor_id: string;
  employee_name: string;
  role?: string;
  hourly_rate: number;
  phone?: string;
  email?: string;
  is_active?: boolean;
}

export interface CreatePlantProfileRequest {
  company_id?: string;
  machine_name: string;
  machine_type?: string;
  supplier?: string;
  model?: string;
  registration?: string;
  default_hourly_rate: number;
  default_idle_rate?: number;
  fuel_type?: string;
  is_active?: boolean;
}

export interface CreateMaterialProfileRequest {
  material_name: string;
  material_category?: string;
  supplier?: string;
  default_unit_rate: number;
  default_unit: string;
  specification?: string;
  is_active?: boolean;
}

// Extended types with relationships
export interface CompanyWithPlants extends Company {
  plant_profiles: PlantProfile[];
}

export interface SubcontractorWithEmployees extends Subcontractor {
  employees: SubcontractorEmployee[];
  company?: Company;
}

export interface PlantProfileWithCompany extends PlantProfile {
  company?: Company;
}

export interface DailyLabourWithDetails extends DailyLabour {
  subcontractor?: Subcontractor;
  employee?: SubcontractorEmployee;
}

export interface DailyPlantWithDetails extends DailyPlant {
  plant_profile?: PlantProfile;
}

export interface DailyMaterialsWithDetails extends DailyMaterials {
  material_profile?: MaterialProfile;
}

// Cost report types
export interface ProjectCostSummary {
  project_id: string;
  start_date: string;
  end_date: string;
  total_cost: number;
  labour: {
    total_cost: number;
    days_worked: number;
    entries: number;
    details: LabourCostDetail[];
  };
  plant: {
    total_cost: number;
    days_used: number;
    entries: number;
    details: PlantCostDetail[];
  };
  materials: {
    total_cost: number;
    delivery_days: number;
    entries: number;
    details: MaterialCostDetail[];
  };
}

export interface LabourCostDetail {
  date: string;
  worker: string;
  subcontractor?: string;
  hours: number;
  overtime_hours?: number;
  rate: number;
  cost: number;
  lot: string;
  description?: string;
}

export interface PlantCostDetail {
  date: string;
  equipment: string;
  supplier?: string;
  hours: number;
  idle_hours?: number;
  rate: number;
  cost: number;
  lot: string;
  description?: string;
}

export interface MaterialCostDetail {
  date: string;
  material: string;
  supplier?: string;
  quantity: number;
  unit: string;
  rate: number;
  cost: number;
  lot: string;
  docket?: string;
}