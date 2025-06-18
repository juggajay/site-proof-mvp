import { 
  User, Profile, Organization, Project, Lot, ITPTemplate, ITPItem, 
  ConformanceRecord, Attachment, InspectionReport, NonConformance
} from '@/types/database'

// Create a global singleton for mock data to ensure consistency across Server Actions and API routes
declare global {
  var mockDatabase: {
    users: any[]
    profiles: Profile[]
    organizations: Organization[]
    projects: Project[]
    lots: Lot[]
    itpTemplates: ITPTemplate[]
    itpItems: ITPItem[]
    conformanceRecords: ConformanceRecord[]
    attachments: Attachment[]
    reports: InspectionReport[]
    nonConformances: NonConformance[]
  } | undefined
}

// Initialize global mock database if it doesn't exist
if (!globalThis.mockDatabase) {
  globalThis.mockDatabase = {
    users: [],
    profiles: [],
    organizations: [
      {
        id: 1,
        name: "Default Organization",
        slug: "default-org",
        description: "Default organization for testing",
        created_by: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ],
    projects: [
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
    ],
    lots: [],
    itpTemplates: [],
    itpItems: [],
    conformanceRecords: [],
    attachments: [],
    reports: [],
    nonConformances: []
  }
}

// Export references to the global database
export const mockUsers = globalThis.mockDatabase.users
export const mockProfiles = globalThis.mockDatabase.profiles
export const mockOrganizations = globalThis.mockDatabase.organizations
export const mockProjects = globalThis.mockDatabase.projects
export const mockLots = globalThis.mockDatabase.lots
export const mockITPTemplates = globalThis.mockDatabase.itpTemplates
export const mockITPItems = globalThis.mockDatabase.itpItems
export const mockConformanceRecords = globalThis.mockDatabase.conformanceRecords
export const mockAttachments = globalThis.mockDatabase.attachments
export const mockReports = globalThis.mockDatabase.reports
export const mockNonConformances = globalThis.mockDatabase.nonConformances

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