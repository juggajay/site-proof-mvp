import {
  User,
  Project,
  Lot,
  ITPTemplate,
  ITPItem,
  ConformanceRecord,
  ProjectStats,
} from '@/types/database'

// Mock Users
export const mockUsers: User[] = [
  {
    id: 1,
    email: 'admin@example.com',
    password_hash: '$2a$12$hashedpassword1',
    email_verified: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 2,
    email: 'inspector@example.com',
    password_hash: '$2a$12$hashedpassword2',
    email_verified: true,
    created_at: '2024-01-02T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z',
  },
  {
    id: 3,
    email: 'viewer@example.com',
    password_hash: '$2a$12$hashedpassword3',
    email_verified: false,
    created_at: '2024-01-03T00:00:00Z',
    updated_at: '2024-01-03T00:00:00Z',
  },
]

// Mock Projects
export const mockProjects: Project[] = [
  {
    id: 1,
    name: 'Test Construction Project',
    project_number: 'TCP-001',
    description: 'A test construction project for unit testing',
    location: 'Test City, Test State',
    start_date: '2024-01-01',
    end_date: '2024-12-31',
    status: 'active',
    organization_id: 1,
    created_by: 1,
    project_manager_id: 1,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 2,
    name: 'Completed Project',
    project_number: 'CP-001',
    description: 'A completed project for testing',
    location: 'Another City',
    start_date: '2023-01-01',
    end_date: '2023-12-31',
    status: 'completed',
    organization_id: 1,
    created_by: 1,
    project_manager_id: 2,
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-12-31T00:00:00Z',
  },
]

// Mock ITP Templates
export const mockITPTemplates: ITPTemplate[] = [
  {
    id: 1,
    name: 'Concrete Foundation ITP',
    description: 'Standard concrete foundation inspection checklist',
    category: 'structural',
    version: '1.0',
    is_active: true,
    organization_id: 1,
    created_by: 1,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 2,
    name: 'Electrical Installation ITP',
    description: 'Standard electrical installation checklist',
    category: 'electrical',
    version: '1.0',
    is_active: true,
    organization_id: 1,
    created_by: 1,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
]

// Mock ITP Items
export const mockITPItems: ITPItem[] = [
  {
    id: 1,
    itp_id: 1,
    item_number: '1.1',
    description: 'Excavation depth verification',
    specification_reference: 'Drawing A-101',
    inspection_method: 'measurement',
    acceptance_criteria: 'As per approved drawings ±25mm',
    item_type: 'numeric',
    is_mandatory: true,
    order_index: 1,
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 2,
    itp_id: 1,
    item_number: '1.2',
    description: 'Base preparation quality',
    specification_reference: 'Spec Section 03-01',
    inspection_method: 'visual',
    acceptance_criteria: 'Uniform, well compacted, no soft spots',
    item_type: 'pass_fail',
    is_mandatory: true,
    order_index: 2,
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 3,
    itp_id: 1,
    item_number: '1.3',
    description: 'Photo documentation',
    specification_reference: 'QA Requirements',
    inspection_method: 'visual',
    acceptance_criteria: 'Before, during, and after photos required',
    item_type: 'photo_required',
    is_mandatory: true,
    order_index: 3,
    created_at: '2024-01-01T00:00:00Z',
  },
]

// Mock Lots
export const mockLots: Lot[] = [
  {
    id: 1,
    project_id: 1,
    lot_number: 'LOT-001',
    description: 'Foundation work for Building A',
    location_description: 'Grid A1-A5',
    itp_id: 1,
    status: 'in_progress',
    start_date: '2024-01-15',
    target_completion_date: '2024-02-15',
    assigned_inspector_id: 2,
    created_by: 1,
    created_at: '2024-01-15T00:00:00Z',
    updated_at: '2024-01-15T00:00:00Z',
  },
  {
    id: 2,
    project_id: 1,
    lot_number: 'LOT-002',
    description: 'Foundation work for Building B',
    location_description: 'Grid B1-B5',
    itp_id: 1,
    status: 'pending',
    start_date: '2024-02-01',
    target_completion_date: '2024-03-01',
    assigned_inspector_id: 2,
    created_by: 1,
    created_at: '2024-01-20T00:00:00Z',
    updated_at: '2024-01-20T00:00:00Z',
  },
]

// Mock Conformance Records
export const mockConformanceRecords: ConformanceRecord[] = [
  {
    id: 1,
    lot_id: 1,
    itp_item_id: 1,
    result_pass_fail: 'PASS',
    result_numeric: 2450.5,
    result_text: null,
    comments: 'Measurement within tolerance',
    is_non_conformance: false,
    corrective_action: null,
    inspector_id: 2,
    inspection_date: '2024-01-16T10:00:00Z',
    approved_by: null,
    approval_date: null,
    created_at: '2024-01-16T10:00:00Z',
    updated_at: '2024-01-16T10:00:00Z',
  },
  {
    id: 2,
    lot_id: 1,
    itp_item_id: 2,
    result_pass_fail: 'FAIL',
    result_numeric: null,
    result_text: null,
    comments: 'Soft spots found in northeast corner',
    is_non_conformance: true,
    corrective_action: 'Re-compact affected area and re-inspect',
    inspector_id: 2,
    inspection_date: '2024-01-16T11:00:00Z',
    approved_by: null,
    approval_date: null,
    created_at: '2024-01-16T11:00:00Z',
    updated_at: '2024-01-16T11:00:00Z',
  },
]

// Mock Dashboard Stats
export const mockDashboardStats: ProjectStats = {
  total_projects: 2,
  active_projects: 1,
  completed_projects: 1,
  total_lots: 2,
  pending_inspections: 5,
  completed_inspections: 2,
  non_conformances: 1,
}

// Mock API Response Templates
export const mockApiResponse = {
  success: <T>(data: T) => ({
    success: true,
    data,
    message: 'Success',
  }),
  error: (error: string) => ({
    success: false,
    error,
    message: 'Error occurred',
  }),
}

// Form validation test data
export const testFormData = {
  validProject: {
    name: 'Test Project',
    projectNumber: 'TEST-001',
    description: 'A test project description',
    location: 'Test Location',
    startDate: '2024-01-01',
    endDate: '2024-12-31',
  },
  invalidProject: {
    name: '', // Required field missing
    projectNumber: 'TEST-002',
    description: 'Invalid project',
    location: 'Test Location',
  },
  validLot: {
    lotNumber: 'LOT-TEST-001',
    description: 'Test lot description',
    locationDescription: 'Test grid location',
    targetCompletionDate: '2024-06-01',
  },
  invalidLot: {
    lotNumber: '', // Required field missing
    description: 'Invalid lot',
  },
  validUser: {
    email: 'newuser@example.com',
    password: 'SecurePassword123!',
    firstName: 'Test',
    lastName: 'User',
  },
  invalidUser: {
    email: 'invalid-email', // Invalid format
    password: '123', // Too short
    firstName: '',
    lastName: '',
  },
}

// Error message constants for testing
export const errorMessages = {
  required: 'This field is required',
  invalidEmail: 'Please enter a valid email address',
  passwordTooShort: 'Password must be at least 8 characters',
  loginFailed: 'Invalid email or password',
  networkError: 'Network error. Please try again.',
  unauthorized: 'Please log in to continue',
  serverError: 'An unexpected error occurred',
}

// Success message constants
export const successMessages = {
  projectCreated: 'Project created successfully',
  lotCreated: 'Lot created successfully',
  inspectionSaved: 'Inspection saved successfully',
  loginSuccess: 'Login successful',
  signupSuccess: 'Account created successfully',
}