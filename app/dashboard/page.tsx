import { DashboardClientPage } from './client-page'
import { Project } from '../../types'

export default async function DashboardPage() {
  // Temporarily using mock data for testing without Supabase credentials
  const mockProjects: Project[] = [
    {
      id: '1',
      name: 'Residential Complex A',
      project_number: 'RC-2024-001',
      location: '123 Main Street, Sydney NSW',
      description: 'Multi-story residential complex with 50 units',
      organization_id: 'mock-org-id',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: '2',
      name: 'Commercial Building B',
      project_number: 'CB-2024-002',
      location: '456 Business Ave, Melbourne VIC',
      description: 'Modern office building with retail space',
      organization_id: 'mock-org-id',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ]

  return <DashboardClientPage projects={mockProjects} />
}