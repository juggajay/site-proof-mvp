// Simplified mock data fallback for when Supabase is not configured
import { 
  Project, Lot, ITPTemplate, ITPItem, ConformanceRecord, Attachment, InspectionReport, NonConformance, 
  Profile, Organization, DailyReport, DailyEvent, DailyLabour, DailyPlant, DailyMaterials 
} from '@/types/database'

interface DatabaseState {
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
  dailyReports: DailyReport[]
  dailyEvents: DailyEvent[]
  dailyLabour: DailyLabour[]
  dailyPlant: DailyPlant[]
  dailyMaterials: DailyMaterials[]
}

// Simple in-memory storage with better serverless handling
let memoryDatabase: DatabaseState | null = null

export async function getCurrentDatabaseState(): Promise<DatabaseState> {
  if (!memoryDatabase) {
    console.log('🚀 Initializing fresh mock database state')
    memoryDatabase = getDefaultDatabaseState()
  }
  return memoryDatabase
}

export async function setDatabaseState(state: DatabaseState): Promise<void> {
  memoryDatabase = state
  console.log('💾 Updated mock database state')
}

function getDefaultDatabaseState(): DatabaseState {
  return {
    users: [
      {
        id: 1,
        email: 'admin@siteproof.com',
        password_hash: '$2a$10$dummy.hash.for.testing',
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
      }
    ],
    lots: [],
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
}