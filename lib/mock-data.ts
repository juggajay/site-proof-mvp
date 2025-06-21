import { 
  User, Profile, Organization, Project, Lot, ITPTemplate, ITPItem, 
  ConformanceRecord, Attachment, InspectionReport, NonConformance,
  DailyReport, DailyEvent, DailyLabour, DailyPlant, DailyMaterials
} from '@/types/database'

// Create a global singleton for mock data to ensure consistency across Server Actions and API routes
declare global {
  var mockDatabase: {
    users: any[]
    profiles: Profile[]
    organizations: Organization[]
    projects: Project[]
    lots: Lot[]
    lotITPTemplates: any[]
    itpTemplates: ITPTemplate[]
    itpItems: ITPItem[]
    conformanceRecords: ConformanceRecord[]
    attachments: Attachment[]
    reports: InspectionReport[]
    nonConformances: NonConformance[]
    dailyReports: DailyReport[]
    dailyEvents: DailyEvent[]
    dailyLabour: DailyLabour[]
    dailyPlant: DailyPlant[]
    dailyMaterials: DailyMaterials[]
  } | undefined
  var mockDatabaseInitialized: boolean | undefined
}

// Initialize global mock database if it doesn't exist
console.log('=== MOCK DATA INITIALIZATION ===')
console.log('mock-data.ts: Checking if globalThis.mockDatabase exists:', !!globalThis.mockDatabase)
console.log('mock-data.ts: Checking if globalThis.mockDatabaseInitialized exists:', !!globalThis.mockDatabaseInitialized)
console.log('mock-data.ts: Current timestamp:', new Date().toISOString())

// For serverless environments like Vercel, we need to handle data persistence differently
// Check if we're in a serverless environment
const isServerless = process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME

if (isServerless) {
  console.log('mock-data.ts: Running in serverless environment - using fresh database each time')
  // In serverless, always start fresh but try to preserve created projects in a different way
}

if (!globalThis.mockDatabase || !globalThis.mockDatabaseInitialized) {
  console.log('mock-data.ts: Creating new mockDatabase instance')
  globalThis.mockDatabase = {
    users: [
      {
        id: 1,
        email: 'admin@siteproof.com',
        password_hash: '$2a$10$dummy.hash.for.testing',
        email_verified: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 2,
        email: 'manager@siteproof.com',
        password_hash: '$2a$10$dummy.hash.for.testing',
        email_verified: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 3,
        email: 'test@example.com',
        password_hash: '$2a$10$PhKVNwsWUE2QLWsnQWPS2etjrPr3cCBsbSilAyieFC0s1mqbZ//qW',
        email_verified: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ],
    profiles: [
      {
        id: 1,
        user_id: 1,
        first_name: 'John',
        last_name: 'Anderson',
        avatar_url: undefined,
        phone: '+1-555-0123',
        timezone: 'UTC',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 2,
        user_id: 2,
        first_name: 'Sarah',
        last_name: 'Mitchell',
        avatar_url: undefined,
        phone: '+1-555-0124',
        timezone: 'UTC',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 3,
        user_id: 3,
        first_name: 'Test',
        last_name: 'User',
        avatar_url: undefined,
        phone: '+1-555-0125',
        timezone: 'UTC',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ],
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
      },
      // Projects from Supabase lots data
      {
        id: 'e262b3bc-2f16-4056-847a-fc26285d01b0',
        name: "Construction Site Alpha",
        project_number: "CSA-2025",
        description: "Multi-phase construction project with foundation, steel reinforcement, and paving works",
        location: "Construction Site Alpha",
        status: 'active',
        organization_id: 1,
        created_by: 1,
        project_manager_id: 1,
        created_at: '2025-06-11T13:30:03.601300Z',
        updated_at: '2025-06-11T13:30:03.601300Z'
      },
      {
        id: 'c43e47b6-6870-47ce-8ceb-6bcd73602c83',
        name: "Test Development Project",
        project_number: "TDP-2025",
        description: "Development project for testing and validation purposes",
        location: "Test Site Beta",
        status: 'active',
        organization_id: 1,
        created_by: 1,
        project_manager_id: 1,
        created_at: '2025-06-13T07:57:24.265438Z',
        updated_at: '2025-06-13T07:57:24.265438Z'
      },
      {
        id: '53b104fe-9d29-4aad-9df1-bef68f5d1d82',
        name: "Infrastructure Upgrade",
        project_number: "IUP-2025",
        description: "Infrastructure upgrade project including conduit installation",
        location: "Infrastructure Zone",
        status: 'active',
        organization_id: 1,
        created_by: 1,
        project_manager_id: 1,
        created_at: '2025-06-15T01:40:16.852564Z',
        updated_at: '2025-06-15T01:40:16.852564Z'
      }
    ],
    lots: [
      // Lots from Supabase data
      {
        id: '12498d1e-97a3-4122-9b26-cfb90d2aee84',
        lot_number: '1',
        description: 'pave',
        project_id: 'e262b3bc-2f16-4056-847a-fc26285d01b0',
        itp_id: '6102a2f5-5aa2-40a2-8262-2c6e344e0176',
        status: 'in_progress',
        created_by: 1,
        created_at: '2025-06-13T04:22:54.706365Z',
        updated_at: '2025-06-13T04:22:54.706365Z'
      },
      {
        id: '156f47f9-66d4-4973-8a0d-05765fa43387',
        lot_number: '1',
        description: 'test',
        project_id: 'c43e47b6-6870-47ce-8ceb-6bcd73602c83',
        itp_id: '6102a2f5-5aa2-40a2-8262-2c6e344e0176',
        status: 'in_progress',
        created_by: 1,
        created_at: '2025-06-13T07:57:24.265438Z',
        updated_at: '2025-06-13T07:57:24.265438Z'
      },
      {
        id: '1607f1cf-cb05-4e27-809c-3d2e6f370470',
        lot_number: 'LOT-002',
        description: 'Steel Reinforcement - Section A',
        project_id: 'e262b3bc-2f16-4056-847a-fc26285d01b0',
        itp_id: 'de9df5cf-60de-4e5a-874a-26577bd396b5',
        status: 'in_progress',
        created_by: 1,
        created_at: '2025-06-11T13:30:03.601300Z',
        updated_at: '2025-06-11T13:30:03.601300Z'
      },
      {
        id: '2b5a5edf-d938-46ef-aa43-18db24290422',
        lot_number: '33',
        description: 'efe',
        project_id: 'e262b3bc-2f16-4056-847a-fc26285d01b0',
        itp_id: '8b5c78e1-9fe5-4c25-bb10-278e11d28c27',
        status: 'in_progress',
        created_by: 1,
        created_at: '2025-06-13T05:43:35.806823Z',
        updated_at: '2025-06-13T05:43:35.806823Z'
      },
      {
        id: '91a94342-5028-4bf9-adcf-d42d7a5575ef',
        lot_number: '6',
        description: 'test',
        project_id: 'e262b3bc-2f16-4056-847a-fc26285d01b0',
        itp_id: 'de9df5cf-60de-4e5a-874a-26577bd396b5',
        status: 'in_progress',
        created_by: 1,
        created_at: '2025-06-13T05:27:06.229475Z',
        updated_at: '2025-06-13T05:27:06.229475Z'
      },
      {
        id: '995e61bc-a882-46f2-b0fd-b57684b313d1',
        lot_number: 'LOT-003',
        description: 'Foundation Pour - Section B',
        project_id: 'e262b3bc-2f16-4056-847a-fc26285d01b0',
        itp_id: '6102a2f5-5aa2-40a2-8262-2c6e344e0176',
        status: 'completed',
        created_by: 1,
        created_at: '2025-06-11T13:30:03.601300Z',
        updated_at: '2025-06-11T13:30:03.601300Z'
      },
      {
        id: 'ccb46536-0e8a-4a02-b293-f5a0d0669b68',
        lot_number: 'LOT-001',
        description: 'Foundation Pour - Section A',
        project_id: 'e262b3bc-2f16-4056-847a-fc26285d01b0',
        itp_id: '6102a2f5-5aa2-40a2-8262-2c6e344e0176',
        status: 'in_progress',
        created_by: 1,
        created_at: '2025-06-11T13:30:03.601300Z',
        updated_at: '2025-06-11T13:30:03.601300Z'
      },
      {
        id: 'eb9bb12d-d66b-49c9-8704-6a8a948dcfb4',
        lot_number: '3',
        description: 'test',
        project_id: '53b104fe-9d29-4aad-9df1-bef68f5d1d82',
        itp_id: '920c39b7-9f4e-485d-aac2-f2ccbaa34404',
        status: 'in_progress',
        created_by: 1,
        created_at: '2025-06-15T01:40:16.852564Z',
        updated_at: '2025-06-15T01:40:16.852564Z'
      }
    ],
    lotITPTemplates: [],
    itpTemplates: [],
    itpItems: [],
    conformanceRecords: [],
    attachments: [],
    reports: [],
    nonConformances: [],
    dailyReports: [],
    dailyEvents: [],
    dailyLabour: [],
    dailyPlant: [],
    dailyMaterials: []
  }
  globalThis.mockDatabaseInitialized = true
  console.log('mock-data.ts: Database initialized with', globalThis.mockDatabase.projects.length, 'default projects')
} else {
  console.log('mock-data.ts: Using existing mockDatabase instance with', globalThis.mockDatabase.projects.length, 'projects')
  console.log('mock-data.ts: Existing project IDs:', globalThis.mockDatabase.projects.map(p => ({ id: p.id, name: p.name })))
}

// Export references to the global database
export const mockUsers = globalThis.mockDatabase.users
export const mockProfiles = globalThis.mockDatabase.profiles
export const mockOrganizations = globalThis.mockDatabase.organizations
export const mockProjects = globalThis.mockDatabase.projects
export const mockLots = globalThis.mockDatabase.lots
export const mockLotITPTemplates = globalThis.mockDatabase.lotITPTemplates
export const mockITPTemplates = globalThis.mockDatabase.itpTemplates
export const mockITPItems = globalThis.mockDatabase.itpItems
export const mockConformanceRecords = globalThis.mockDatabase.conformanceRecords
export const mockAttachments = globalThis.mockDatabase.attachments
export const mockReports = globalThis.mockDatabase.reports
export const mockNonConformances = globalThis.mockDatabase.nonConformances
export const mockDailyReports = globalThis.mockDatabase.dailyReports
export const mockDailyEvents = globalThis.mockDatabase.dailyEvents
export const mockDailyLabour = globalThis.mockDatabase.dailyLabour
export const mockDailyPlant = globalThis.mockDatabase.dailyPlant
export const mockDailyMaterials = globalThis.mockDatabase.dailyMaterials

// Initialize default ITP templates and ensure they're loaded
function initializeITPData() {
  console.log('Initializing ITP templates and items...')
  console.log('Current ITP templates count:', mockITPTemplates.length)
  console.log('Current ITP items count:', mockITPItems.length)
  
  // Clear existing data first to avoid duplicates  
  mockITPTemplates.length = 0
  mockITPItems.length = 0
  // ITP Templates based on Supabase data
  const itpTemplates: ITPTemplate[] = [
    {
      id: '0fe09989-58f8-450d-aa85-2d387d99d2be',
      name: 'Rolling Operations ITP',
      description: 'Inspection Test Plan for rolling and compaction operations',
      category: 'earthworks',
      version: '1.0',
      is_active: true,
      organization_id: 1,
      created_by: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: '57de0413-13e1-4876-9e5f-5140b98e2ea8',
      name: 'Subgrade Preparation ITP',
      description: 'Inspection Test Plan for subgrade preparation and testing',
      category: 'earthworks',
      version: '1.0',
      is_active: true,
      organization_id: 1,
      created_by: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: '6102a2f5-5aa2-40a2-8262-2c6e344e0176',
      name: 'Concrete Works ITP',
      description: 'Inspection Test Plan for concrete placement and testing',
      category: 'structural',
      version: '1.0',
      is_active: true,
      organization_id: 1,
      created_by: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: '6f1c4c55-836e-4432-8c77-7a0eab24f56d',
      name: 'Landscaping & Seeding ITP',
      description: 'Inspection Test Plan for landscaping and seeding works',
      category: 'landscaping',
      version: '1.0',
      is_active: true,
      organization_id: 1,
      created_by: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: '90eaae06-b84f-4bb5-aa49-fd549e9ac2cb',
      name: 'Material Placement ITP',
      description: 'Inspection Test Plan for material delivery and placement',
      category: 'materials',
      version: '1.0',
      is_active: true,
      organization_id: 1,
      created_by: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: '920c39b7-9f4e-485d-aac2-f2ccbaa34404',
      name: 'Conduit Installation ITP',
      description: 'Inspection Test Plan for conduit installation works',
      category: 'utilities',
      version: '1.0',
      is_active: true,
      organization_id: 1,
      created_by: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'de9df5cf-60de-4e5a-874a-26577bd396b5',
      name: 'Reinforcement ITP',
      description: 'Inspection Test Plan for reinforcement steel works',
      category: 'structural',
      version: '1.0',
      is_active: true,
      organization_id: 1,
      created_by: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: '8b5c78e1-9fe5-4c25-bb10-278e11d28c27',
      name: 'Asphalt Layer Quality Check',
      description: 'Inspection Test Plan for asphalt layer placement and quality control',
      category: 'paving',
      version: '1.0',
      is_active: true,
      organization_id: 1,
      created_by: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ]
  
  console.log('Adding', itpTemplates.length, 'ITP templates...')
  mockITPTemplates.push(...itpTemplates)

  // ITP Items from Supabase data
  const supabaseItems: ITPItem[] = [
    {
      id: '015d2e3c-14bc-4ffa-9a05-ea0e1aeee7f4',
      itp_id: '920c39b7-9f4e-485d-aac2-f2ccbaa34404',
      item_number: '7',
      description: 'Pit installed to correct level and location?',
      inspection_method: 'PASS_FAIL',
      acceptance_criteria: 'As specified',
      is_mandatory: true,
      sort_order: 7,
      created_at: '2025-06-14T01:44:05.645591Z',
      status: 'Pending'
    },
    {
      id: '168aa60d-d798-4875-8fb5-909b1bd18dd6',
      itp_id: '57de0413-13e1-4876-9e5f-5140b98e2ea8',
      item_number: '6',
      description: 'Survey conformance report for levels received?',
      inspection_method: 'PASS_FAIL',
      acceptance_criteria: 'As specified',
      is_mandatory: true,
      sort_order: 6,
      created_at: '2025-06-14T01:44:05.645591Z',
      status: 'Pending'
    },
    {
      id: '1f149a22-ab97-40a7-b945-2d24372cb7fb',
      itp_id: '6102a2f5-5aa2-40a2-8262-2c6e344e0176',
      item_number: '2',
      description: 'Slump test result (mm)',
      inspection_method: 'NUMERIC',
      acceptance_criteria: '75mm ±tolerance',
      is_mandatory: true,
      sort_order: 2,
      created_at: '2025-06-11T13:30:03.601300Z',
      status: 'Pending'
    },
    {
      id: '22e6c63f-64a9-4419-ae81-82aed295e1e6',
      itp_id: 'de9df5cf-60de-4e5a-874a-26577bd396b5',
      item_number: '3',
      description: 'Spacing measurement (mm)',
      inspection_method: 'NUMERIC',
      acceptance_criteria: '200mm ±tolerance',
      is_mandatory: true,
      sort_order: 3,
      created_at: '2025-06-11T13:30:03.601300Z',
      status: 'Pending'
    },
    {
      id: '255adf64-1ff4-4fd8-b21a-0082c063df26',
      itp_id: '6f1c4c55-836e-4432-8c77-7a0eab24f56d',
      item_number: '5',
      description: 'Seed mix type and application rate as per spec?',
      inspection_method: 'TEXT_INPUT',
      acceptance_criteria: 'As specified',
      is_mandatory: true,
      sort_order: 5,
      created_at: '2025-06-14T01:44:05.645591Z',
      status: 'Pending'
    },
    {
      id: '31e05dbc-77df-4fe3-a11f-05920cb9b5ed',
      itp_id: '6102a2f5-5aa2-40a2-8262-2c6e344e0176',
      item_number: '3',
      description: 'Concrete temperature (°C)',
      inspection_method: 'NUMERIC',
      acceptance_criteria: '20°C ±tolerance',
      is_mandatory: true,
      sort_order: 3,
      created_at: '2025-06-11T13:30:03.601300Z',
      status: 'Pending'
    },
    {
      id: '374b115d-2477-4e69-859d-bbd17aea9316',
      itp_id: '6f1c4c55-836e-4432-8c77-7a0eab24f56d',
      item_number: '1',
      description: 'Finished earthwork levels conform to design?',
      inspection_method: 'PASS_FAIL',
      acceptance_criteria: 'As specified',
      is_mandatory: true,
      sort_order: 1,
      created_at: '2025-06-14T01:44:05.645591Z',
      status: 'Pending'
    },
    {
      id: '375b12d9-50cc-4a83-93c2-58c2c092fa17',
      itp_id: '920c39b7-9f4e-485d-aac2-f2ccbaa34404',
      item_number: '1',
      description: 'Trench depth and width conform to drawings?',
      inspection_method: 'PASS_FAIL',
      acceptance_criteria: 'As specified',
      is_mandatory: true,
      sort_order: 1,
      created_at: '2025-06-14T01:44:05.645591Z',
      status: 'Pending'
    },
    {
      id: '37e8ba8a-b1dd-4ffa-9d79-7a84bf859583',
      itp_id: '57de0413-13e1-4876-9e5f-5140b98e2ea8',
      item_number: '1',
      description: 'Area cleared of all vegetation and topsoil?',
      inspection_method: 'PASS_FAIL',
      acceptance_criteria: 'As specified',
      is_mandatory: true,
      sort_order: 1,
      created_at: '2025-06-14T01:44:05.645591Z',
      status: 'Pending'
    },
    {
      id: '3803d109-8d21-42dd-a8d3-39505062fab8',
      itp_id: '6f1c4c55-836e-4432-8c77-7a0eab24f56d',
      item_number: '4',
      description: 'Surface lightly tilled/scarified before seeding?',
      inspection_method: 'PASS_FAIL',
      acceptance_criteria: 'As specified',
      is_mandatory: true,
      sort_order: 4,
      created_at: '2025-06-14T01:44:05.645591Z',
      status: 'Pending'
    }
  ]
  
  // Add more comprehensive remaining items for better template coverage
  const remainingItems: ITPItem[] = [
    // Rolling Operations ITP items
    {
      id: 'rolling-1',
      itp_id: '0fe09989-58f8-450d-aa85-2d387d99d2be',
      item_number: '1',
      description: 'Compaction equipment calibrated and approved?',
      inspection_method: 'PASS_FAIL',
      acceptance_criteria: 'As specified',
      is_mandatory: true,
      sort_order: 1,
      created_at: '2025-06-14T01:44:05.645591Z',
      status: 'Pending'
    },
    {
      id: 'rolling-2',
      itp_id: '0fe09989-58f8-450d-aa85-2d387d99d2be',
      item_number: '2',
      description: 'Rolling pattern and frequency as per specification?',
      inspection_method: 'PASS_FAIL',
      acceptance_criteria: 'As specified',
      is_mandatory: true,
      sort_order: 2,
      created_at: '2025-06-14T01:44:05.645591Z',
      status: 'Pending'
    },
    // Material Placement ITP items (expand existing one)
    {
      id: 'material-1',
      itp_id: '90eaae06-b84f-4bb5-aa49-fd549e9ac2cb',
      item_number: '1',
      description: 'Material delivery certificates received?',
      inspection_method: 'PASS_FAIL',
      acceptance_criteria: 'As specified',
      is_mandatory: true,
      sort_order: 1,
      created_at: '2025-06-14T01:44:05.645591Z',
      status: 'Pending'
    },
    {
      id: 'material-2',
      itp_id: '90eaae06-b84f-4bb5-aa49-fd549e9ac2cb',
      item_number: '2',
      description: 'Material moisture content (%)',
      inspection_method: 'NUMERIC',
      acceptance_criteria: '6-8%',
      is_mandatory: true,
      sort_order: 2,
      created_at: '2025-06-14T01:44:05.645591Z',
      status: 'Pending'
    },
    {
      id: 'material-3',
      itp_id: '90eaae06-b84f-4bb5-aa49-fd549e9ac2cb',
      item_number: '3',
      description: 'Layer thickness measurement (mm)',
      inspection_method: 'NUMERIC',
      acceptance_criteria: '150mm ±tolerance',
      is_mandatory: true,
      sort_order: 3,
      created_at: '2025-06-14T01:44:05.645591Z',
      status: 'Pending'
    },
    {
      id: '481edd2b-62f2-482c-b348-d30529a894ca',
      itp_id: '90eaae06-b84f-4bb5-aa49-fd549e9ac2cb',
      item_number: '4',
      description: 'Compacted layer thickness within tolerance?',
      inspection_method: 'NUMERIC',
      acceptance_criteria: 'As specified',
      is_mandatory: true,
      sort_order: 4,
      created_at: '2025-06-14T01:44:05.645591Z',
      status: 'Pending'
    },
    {
      id: '682a2619-f1d7-4a02-807e-bc5911b8b255',
      itp_id: 'de9df5cf-60de-4e5a-874a-26577bd396b5',
      item_number: '1',
      description: 'Steel grade certification',
      inspection_method: 'PASS_FAIL',
      acceptance_criteria: 'PASS',
      is_mandatory: true,
      sort_order: 1,
      created_at: '2025-06-11T13:30:03.601300Z',
      status: 'Pending'
    },
    {
      id: '6e1a9bfe-f11c-49b3-bd56-b3047f901f19',
      itp_id: '6102a2f5-5aa2-40a2-8262-2c6e344e0176',
      item_number: '1',
      description: 'Concrete mix design approved',
      inspection_method: 'PASS_FAIL',
      acceptance_criteria: 'PASS',
      is_mandatory: true,
      sort_order: 1,
      created_at: '2025-06-11T13:30:03.601300Z',
      status: 'Pending'
    },
    {
      id: '7c563065-9c49-4029-ae6c-412969639d86',
      itp_id: '6102a2f5-5aa2-40a2-8262-2c6e344e0176',
      item_number: '4',
      description: 'Reinforcement inspection complete',
      inspection_method: 'PASS_FAIL',
      acceptance_criteria: 'PASS',
      is_mandatory: true,
      sort_order: 4,
      created_at: '2025-06-11T13:30:03.601300Z',
      status: 'Pending'
    },
    {
      id: 'e7296b84-3f4f-4aa5-ad48-ff5afd086f63',
      itp_id: 'de9df5cf-60de-4e5a-874a-26577bd396b5',
      item_number: '2',
      description: 'Bar diameter check (mm)',
      inspection_method: 'NUMERIC',
      acceptance_criteria: '16mm ±tolerance',
      is_mandatory: true,
      sort_order: 2,
      created_at: '2025-06-11T13:30:03.601300Z',
      status: 'Pending'
    },
    {
      id: 'f2ad8e78-cfe2-4c6f-b2d0-6682553f6024',
      itp_id: 'de9df5cf-60de-4e5a-874a-26577bd396b5',
      item_number: '4',
      description: 'Cover depth (mm)',
      inspection_method: 'NUMERIC',
      acceptance_criteria: '40mm ±tolerance',
      is_mandatory: true,
      sort_order: 4,
      created_at: '2025-06-11T13:30:03.601300Z',
      status: 'Pending'
    },
    // Asphalt Layer Quality Check items
    {
      id: 'asphalt-1',
      itp_id: '8b5c78e1-9fe5-4c25-bb10-278e11d28c27',
      item_number: '1',
      description: 'Subbase surface approved for paving',
      inspection_method: 'PASS_FAIL',
      acceptance_criteria: 'PASS',
      is_mandatory: true,
      sort_order: 1,
      created_at: '2025-06-13T05:43:35.806823Z',
      status: 'Pending'
    },
    {
      id: 'asphalt-2',
      itp_id: '8b5c78e1-9fe5-4c25-bb10-278e11d28c27',
      item_number: '2',
      description: 'Asphalt temperature at delivery (°C)',
      inspection_method: 'NUMERIC',
      acceptance_criteria: '140-160°C',
      is_mandatory: true,
      sort_order: 2,
      created_at: '2025-06-13T05:43:35.806823Z',
      status: 'Pending'
    },
    {
      id: 'asphalt-3',
      itp_id: '8b5c78e1-9fe5-4c25-bb10-278e11d28c27',
      item_number: '3',
      description: 'Layer thickness (mm)',
      inspection_method: 'NUMERIC',
      acceptance_criteria: '50mm ±5mm',
      is_mandatory: true,
      sort_order: 3,
      created_at: '2025-06-13T05:43:35.806823Z',
      status: 'Pending'
    },
    {
      id: 'asphalt-4',
      itp_id: '8b5c78e1-9fe5-4c25-bb10-278e11d28c27',
      item_number: '4',
      description: 'Compaction density test (%)',
      inspection_method: 'NUMERIC',
      acceptance_criteria: '≥95%',
      is_mandatory: true,
      sort_order: 4,
      created_at: '2025-06-13T05:43:35.806823Z',
      status: 'Pending'
    },
    {
      id: 'asphalt-5',
      itp_id: '8b5c78e1-9fe5-4c25-bb10-278e11d28c27',
      item_number: '5',
      description: 'Surface finish and levels conform to specification',
      inspection_method: 'PASS_FAIL',
      acceptance_criteria: 'PASS',
      is_mandatory: true,
      sort_order: 5,
      created_at: '2025-06-13T05:43:35.806823Z',
      status: 'Pending'
    },
    {
      id: 'asphalt-6',
      itp_id: '8b5c78e1-9fe5-4c25-bb10-278e11d28c27',
      item_number: '6',
      description: 'Joint construction as per specification',
      inspection_method: 'PASS_FAIL',
      acceptance_criteria: 'PASS',
      is_mandatory: true,
      sort_order: 6,
      created_at: '2025-06-13T05:43:35.806823Z',
      status: 'Pending'
    }
  ]
  
  console.log('Adding', supabaseItems.length + remainingItems.length, 'ITP items...')
  mockITPItems.push(...supabaseItems, ...remainingItems)
  
  console.log('ITP data initialization complete!')
  console.log('Final ITP templates count:', mockITPTemplates.length)
  console.log('Final ITP items count:', mockITPItems.length)
  
  // Log template-item relationships
  mockITPTemplates.forEach(template => {
    const itemCount = mockITPItems.filter(item => String(item.itp_id) === String(template.id)).length
    console.log(`Template "${template.name}" (ID: ${template.id}) has ${itemCount} items`)
  })
  
  // Specifically log Asphalt Layer Quality Check template
  const asphaltTemplate = mockITPTemplates.find(t => t.name === 'Asphalt Layer Quality Check')
  if (asphaltTemplate) {
    console.log('✅ Asphalt Layer Quality Check template found with ID:', asphaltTemplate.id)
    const asphaltItems = mockITPItems.filter(item => String(item.itp_id) === String(asphaltTemplate.id))
    console.log('✅ Asphalt Layer Quality Check has', asphaltItems.length, 'items')
  } else {
    console.log('❌ Asphalt Layer Quality Check template NOT FOUND!')
  }
}

// Always initialize ITP data
initializeITPData()