import { 
  User, Profile, Organization, Project, Lot, ITPTemplate, ITPItem, 
  ConformanceRecord, Attachment, InspectionReport, NonConformance
} from '@/types/database'

// Shared mock database storage
export const mockUsers: any[] = []
export const mockProfiles: Profile[] = []
export const mockOrganizations: Organization[] = [
  {
    id: 1,
    name: "Default Organization",
    slug: "default-org",
    description: "Default organization for testing",
    created_by: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
]
export const mockProjects: Project[] = [
  {
    id: 1,
    name: "Sample Project",
    project_number: "PRJ-001",
    description: "This is a test project to verify the system works",
    location: "Test Location",
    status: 'active',
    organization_id: 1,
    created_by: 1,
    project_manager_id: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
]
export const mockLots: Lot[] = []
export const mockITPTemplates: ITPTemplate[] = []
export const mockITPItems: ITPItem[] = []
export const mockConformanceRecords: ConformanceRecord[] = []
export const mockAttachments: Attachment[] = []
export const mockReports: InspectionReport[] = []
export const mockNonConformances: NonConformance[] = []

// Initialize default ITP templates
if (mockITPTemplates.length === 0) {
  // Concrete Foundation ITP
  const concreteITP: ITPTemplate = {
    id: 1,
    name: 'Concrete Foundation ITP',
    description: 'Inspection Test Plan for concrete foundation work',
    category: 'structural',
    version: '1.0',
    is_active: true,
    organization_id: 1,
    created_by: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
  mockITPTemplates.push(concreteITP)

  // Sample ITP items
  const sampleItems: ITPItem[] = [
    {
      id: 1,
      itp_template_id: 1,
      item_number: '1.1',
      description: 'Excavation depth and dimensions',
      inspection_method: 'measurement',
      acceptance_criteria: 'As per approved drawings ±25mm',
      item_type: 'numeric',
      is_mandatory: true,
      order_index: 1,
      created_at: new Date().toISOString()
    },
    {
      id: 2,
      itp_template_id: 1,
      item_number: '1.2',
      description: 'Base preparation and compaction',
      inspection_method: 'visual',
      acceptance_criteria: 'Uniform, well compacted, no soft spots',
      item_type: 'pass_fail',
      is_mandatory: true,
      order_index: 2,
      created_at: new Date().toISOString()
    },
    {
      id: 3,
      itp_template_id: 1,
      item_number: '1.3',
      description: 'Photographic evidence',
      inspection_method: 'visual',
      acceptance_criteria: 'Before, during, and after photos required',
      item_type: 'photo_required',
      is_mandatory: true,
      order_index: 3,
      created_at: new Date().toISOString()
    }
  ]
  mockITPItems.push(...sampleItems)
}