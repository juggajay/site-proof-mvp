import { createClient } from '../supabase/client'
import { v4 as uuidv4 } from 'uuid'
import type { ITP, TeamMember } from '../../types'

export class ITPService {
  private supabase = createClient()

  // Mock data methods
  private getMockITPs(): ITP[] {
    return [
      {
        id: 'b9a3a71d-18a2-4189-a569-4cafd7fea190', // Real ID from your database
        title: 'Highway Concrete Pour Inspection',
        description: 'Quality inspection for concrete pouring activities',
        category: 'Structural',
        estimated_duration: '2 days',
        complexity: 'moderate',
        required_certifications: ['Concrete Testing', 'Highway Construction'],
        organization_id: '00000000-0000-0000-0000-000000000000',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: '8b5c78e1-9fe5-4c25-bb10-278e11d28c27', // Real ID from your database
        title: 'Asphalt Layer Quality Check',
        description: 'Inspection of asphalt layer thickness and compaction',
        category: 'Roadwork',
        estimated_duration: '1 day',
        complexity: 'simple',
        required_certifications: ['Asphalt Testing'],
        organization_id: '00000000-0000-0000-0000-000000000000',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ]
  }

  private getMockTeamMembers(): TeamMember[] {
    return [
      {
        id: uuidv4(),
        name: 'Jack Gammell',
        email: 'jack@company.com',
        role: 'Senior Inspector',
        certifications: ['Concrete Testing', 'Highway Construction'],
        current_workload: 65,
        organization_id: 'mock-org'
      },
      {
        id: uuidv4(),
        name: 'Kenny Gammell',
        email: 'kenny@company.com',
        role: 'Quality Engineer',
        certifications: ['Asphalt Testing', 'Quality Control'],
        current_workload: 40,
        organization_id: 'mock-org'
      }
    ]
  }

  async getAvailableITPs(organizationId: string): Promise<ITP[]> {
    try {
      const { data, error } = await this.supabase
        .from('itps')
        .select('*')
        .eq('organization_id', organizationId)
        .order('title')

      if (error) {
        console.warn('Using mock ITPs:', error.message)
        return this.getMockITPs()
      }

      return data && data.length > 0 ? data : this.getMockITPs()
    } catch (error) {
      console.warn('Failed to fetch ITPs, using mock data:', error)
      return this.getMockITPs()
    }
  }

  async getTeamMembers(organizationId: string): Promise<TeamMember[]> {
    try {
      const { data, error } = await this.supabase
        .from('profiles')
        .select(`
          id,
          name,
          email,
          role
        `)
        .eq('organization_id', organizationId)
        .order('name')

      if (error || !data || data.length === 0) {
        console.warn('Using mock team members')
        return this.getMockTeamMembers()
      }

      // Enhance real data with mock certifications/workload
      return data.map(profile => ({
        ...profile,
        certifications: ['Asphalt Testing', 'Materials Testing'],
        current_workload: Math.floor(Math.random() * 80) + 20,
        organization_id: organizationId
      }))
    } catch (error) {
      console.warn('Failed to fetch team members, using mock data')
      return this.getMockTeamMembers()
    }
  }

  async getCurrentAssignment(lotId: string) {
    try {
      const { data, error } = await this.supabase
        .from('itp_assignments')
        .select('*')
        .eq('lot_id', lotId)
        .eq('status', 'assigned')
        .single()

      if (error) {
        return null
      }

      return data
    } catch (error) {
      console.warn('Failed to fetch current assignment:', error)
      return null
    }
  }
}

// Export singleton instance
export const itpService = new ITPService()