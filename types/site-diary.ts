// types/site-diary.ts - Phase 1 TypeScript Types

export type EventCategory = 
  | 'DELAY' 
  | 'INSTRUCTION' 
  | 'SAFETY' 
  | 'WEATHER' 
  | 'INSPECTION' 
  | 'QUALITY_ISSUE'
  | 'VISITOR'
  | 'MEETING'
  | 'OTHER';

export type ImpactLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

// =====================================================
// CORE SITE DIARY TYPES
// =====================================================

export interface SiteDiaryEntry {
  id: string;
  project_id: string;
  date: string; // ISO date string
  weather_conditions?: string;
  temperature_celsius?: number;
  site_supervisor?: string;
  safety_briefing_conducted: boolean;
  general_notes?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  
  // Related data (populated via joins)
  manpower_entries?: ManpowerEntry[];
  equipment_entries?: EquipmentEntry[];
  delivery_entries?: DeliveryEntry[];
  event_entries?: EventEntry[];
  attachments?: SiteDiaryAttachment[];
}

export interface ManpowerEntry {
  id: string;
  diary_entry_id: string;
  trade: string;
  workers_count: number;
  hours_worked: number;
  supervisor?: string;
  notes?: string;
  weather_impact: boolean;
  overtime_hours: number;
  created_at: string;
  updated_at: string;
}

export interface EquipmentEntry {
  id: string;
  diary_entry_id: string;
  equipment_type: string;
  equipment_id?: string;
  hours_used: number;
  operator?: string;
  maintenance_issues?: string;
  downtime_reason?: string;
  downtime_hours: number;
  fuel_usage?: number;
  created_at: string;
  updated_at: string;
}

export interface DeliveryEntry {
  id: string;
  diary_entry_id: string;
  delivery_time: string; // Time string HH:MM
  supplier: string;
  material_type: string;
  quantity: number;
  unit: string;
  delivery_docket?: string;
  received_by: string;
  quality_issues?: string;
  rejection_reason?: string;
  photos_attached: boolean;
  created_at: string;
  updated_at: string;
}

export interface EventEntry {
  id: string;
  diary_entry_id: string;
  event_time: string; // Time string HH:MM
  category: EventCategory;
  title: string;
  description: string;
  impact_level: ImpactLevel;
  responsible_party?: string;
  follow_up_required: boolean;
  follow_up_date?: string; // ISO date string
  photos_attached: boolean;
  cost_impact?: number;
  time_impact_hours?: number;
  created_at: string;
  updated_at: string;
}

export interface SiteDiaryAttachment {
  id: string;
  diary_entry_id?: string;
  manpower_entry_id?: string;
  equipment_entry_id?: string;
  delivery_entry_id?: string;
  event_entry_id?: string;
  original_filename: string;
  watermarked_filename: string;
  file_size: number;
  mime_type: string;
  watermark_data?: WatermarkData;
  gps_latitude?: number;
  gps_longitude?: number;
  original_path: string;
  watermarked_path: string;
  uploaded_by: string;
  created_at: string;
}

export interface WatermarkData {
  project_name: string;
  date: string;
  time: string;
  gps_coordinates?: string;
  user_name: string;
  organization_name?: string;
}

// =====================================================
// FORM TYPES FOR UI COMPONENTS
// =====================================================

export interface SiteDiaryFormData {
  date: string;
  weather_conditions?: string;
  temperature_celsius?: number;
  site_supervisor?: string;
  safety_briefing_conducted: boolean;
  general_notes?: string;
}

export interface ManpowerFormData {
  trade: string;
  workers_count: number;
  hours_worked: number;
  supervisor?: string;
  notes?: string;
  weather_impact: boolean;
  overtime_hours?: number;
}

export interface EquipmentFormData {
  equipment_type: string;
  equipment_id?: string;
  hours_used: number;
  operator?: string;
  maintenance_issues?: string;
  downtime_reason?: string;
  downtime_hours?: number;
  fuel_usage?: number;
}

export interface DeliveryFormData {
  delivery_time: string;
  supplier: string;
  material_type: string;
  quantity: number;
  unit: string;
  delivery_docket?: string;
  received_by: string;
  quality_issues?: string;
  rejection_reason?: string;
}

export interface EventFormData {
  event_time: string;
  category: EventCategory;
  title: string;
  description: string;
  impact_level: ImpactLevel;
  responsible_party?: string;
  follow_up_required: boolean;
  follow_up_date?: string;
  cost_impact?: number;
  time_impact_hours?: number;
}

// =====================================================
// UTILITY TYPES
// =====================================================

export interface SiteDiarySummary {
  date: string;
  total_workers: number;
  total_worker_hours: number;
  total_equipment_hours: number;
  total_deliveries: number;
  total_events: number;
  high_impact_events: number;
  safety_issues: number;
  weather_delays: boolean;
}

export interface CommonTrades {
  id: string;
  name: string;
  category: string;
}

export interface CommonEquipment {
  id: string;
  name: string;
  category: string;
}

export interface CommonMaterials {
  id: string;
  name: string;
  unit: string;
  category: string;
}

export interface CommonSuppliers {
  id: string;
  name: string;
  contact: string;
  materials: string[];
}

// =====================================================
// API RESPONSE TYPES
// =====================================================

export interface SiteDiaryApiResponse {
  success: boolean;
  data?: SiteDiaryEntry;
  error?: string;
}

export interface SiteDiaryListResponse {
  success: boolean;
  data?: SiteDiaryEntry[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  error?: string;
}

export interface ManpowerApiResponse {
  success: boolean;
  data?: ManpowerEntry;
  error?: string;
}

export interface EquipmentApiResponse {
  success: boolean;
  data?: EquipmentEntry;
  error?: string;
}

export interface DeliveryApiResponse {
  success: boolean;
  data?: DeliveryEntry;
  error?: string;
}

export interface EventApiResponse {
  success: boolean;
  data?: EventEntry;
  error?: string;
}

// =====================================================
// PHOTO WATERMARKING TYPES
// =====================================================

export interface PhotoUploadRequest {
  file: File;
  entry_type: 'diary' | 'manpower' | 'equipment' | 'delivery' | 'event';
  entry_id: string;
  project_id: string;
}

export interface PhotoUploadResponse {
  success: boolean;
  data?: {
    attachment_id: string;
    original_url: string;
    watermarked_url: string;
    watermark_data: WatermarkData;
  };
  error?: string;
}

// =====================================================
// VOICE-TO-TEXT TYPES
// =====================================================

export interface SpeechRecognitionConfig {
  language: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
}

export interface VoiceInputState {
  isListening: boolean;
  isSupported: boolean;
  hasPermission: boolean;
  transcript: string;
  confidence: number;
  error?: string;
}

// =====================================================
// SEARCH AND FILTER TYPES
// =====================================================

export interface SiteDiaryFilters {
  project_id?: string;
  date_from?: string;
  date_to?: string;
  search_term?: string;
  trade?: string;
  equipment_type?: string;
  supplier?: string;
  event_category?: EventCategory;
  impact_level?: ImpactLevel;
  has_photos?: boolean;
  created_by?: string;
}

export interface SiteDiarySortOptions {
  field: 'date' | 'created_at' | 'updated_at';
  direction: 'asc' | 'desc';
}

// =====================================================
// CONSTANTS
// =====================================================

export const EVENT_CATEGORIES: { value: EventCategory; label: string; color: string }[] = [
  { value: 'DELAY', label: 'Delay', color: 'destructive' },
  { value: 'INSTRUCTION', label: 'Instruction', color: 'default' },
  { value: 'SAFETY', label: 'Safety', color: 'destructive' },
  { value: 'WEATHER', label: 'Weather', color: 'secondary' },
  { value: 'INSPECTION', label: 'Inspection', color: 'default' },
  { value: 'QUALITY_ISSUE', label: 'Quality Issue', color: 'destructive' },
  { value: 'VISITOR', label: 'Visitor', color: 'default' },
  { value: 'MEETING', label: 'Meeting', color: 'default' },
  { value: 'OTHER', label: 'Other', color: 'secondary' },
];

export const IMPACT_LEVELS: { value: ImpactLevel; label: string; color: string }[] = [
  { value: 'LOW', label: 'Low', color: 'default' },
  { value: 'MEDIUM', label: 'Medium', color: 'secondary' },
  { value: 'HIGH', label: 'High', color: 'destructive' },
  { value: 'CRITICAL', label: 'Critical', color: 'destructive' },
];

export const COMMON_TRADES = [
  'General Labour',
  'Carpenter',
  'Electrician',
  'Plumber',
  'Concreter',
  'Steel Fixer',
  'Crane Operator',
  'Excavator Operator',
  'Truck Driver',
  'Supervisor',
  'Safety Officer',
  'Quality Inspector',
];

export const COMMON_EQUIPMENT = [
  'Excavator',
  'Bulldozer',
  'Crane - Mobile',
  'Crane - Tower',
  'Concrete Pump',
  'Concrete Mixer',
  'Dump Truck',
  'Loader',
  'Compactor',
  'Generator',
  'Forklift',
  'Scaffolding',
];

export const COMMON_MATERIALS = [
  { name: 'Concrete', unit: 'm³' },
  { name: 'Steel Reinforcement', unit: 'tonnes' },
  { name: 'Formwork Timber', unit: 'm²' },
  { name: 'Aggregate', unit: 'tonnes' },
  { name: 'Sand', unit: 'tonnes' },
  { name: 'Cement', unit: 'bags' },
  { name: 'Bricks', unit: 'units' },
  { name: 'Steel Beams', unit: 'metres' },
  { name: 'Pipes', unit: 'metres' },
  { name: 'Electrical Cable', unit: 'metres' },
];

export const MATERIAL_UNITS = [
  'm³', 'tonnes', 'm²', 'metres', 'units', 'bags', 'litres', 'kg'
];