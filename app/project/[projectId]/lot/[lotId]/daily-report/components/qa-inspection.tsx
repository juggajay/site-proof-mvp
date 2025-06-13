'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '../../../../../../../lib/supabase/client'
import { AssignITPButton } from '../../../../../../../components/assign-itp-button'
import { assignITPToLot } from '../../../../../../actions/assign-itp'
import { FileText, AlertCircle } from 'lucide-react'
import { Button } from '../../../../../../../components/ui/button'
import type { CreateITPAssignment, Lot, ITP, TeamMember, ITPAssignment } from '../../../../../../../types'

interface QAInspectionProps {
  dailyReportId: string
  lotId: string
}

export default function QAInspection({ dailyReportId, lotId }: QAInspectionProps): JSX.Element {
  const [lot, setLot] = useState<Lot | null>(null)
  const [availableITPs, setAvailableITPs] = useState<ITP[]>([])
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [currentAssignment, setCurrentAssignment] = useState<ITPAssignment | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  const loadData = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      // Load lot data
      const { data: lotData, error: lotError } = await supabase
        .from('lots')
        .select('*')
        .eq('id', lotId)
        .single()

      if (lotError) {
        console.warn('Using mock lot data:', lotError.message)
        // Create mock lot data for demonstration
        const mockLot: Lot = {
          id: lotId,
          name: 'Demo Lot A1',
          description: 'Highway construction lot A1',
          location: 'Highway Section 1',
          priority: 'medium',
          project_id: 'demo-project',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
        setLot(mockLot)
        
        // Use mock organization ID for sample data
        const organizationId = 'demo-org'
        
        // Load available ITPs - with fallback sample data
        const sampleITPs: ITP[] = [
          {
            id: '1',
            title: 'Highway Concrete Pour Inspection',
            description: 'Quality inspection for concrete pouring activities',
            category: 'Structural',
            estimated_duration: '2 days',
            complexity: 'moderate',
            required_certifications: ['Concrete Testing'],
            is_active: true,
            organization_id: organizationId,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: '2',
            title: 'Asphalt Layer Quality Check',
            description: 'Inspection of asphalt layer thickness and compaction',
            category: 'Roadwork',
            estimated_duration: '1 day',
            complexity: 'simple',
            required_certifications: ['Asphalt Testing'],
            is_active: true,
            organization_id: organizationId,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ]

        setAvailableITPs(sampleITPs)

        // Use sample team members
        const sampleTeamMembers: TeamMember[] = [
          {
            id: '1',
            name: 'John Rodriguez',
            email: 'john@company.com',
            role: 'Senior Inspector',
            certifications: ['Concrete Testing', 'Highway Construction'],
            current_workload: 65,
            organization_id: organizationId
          },
          {
            id: '2',
            name: 'Sarah Chen',
            email: 'sarah@company.com',
            role: 'Quality Engineer',
            certifications: ['Asphalt Testing', 'Quality Control'],
            current_workload: 40,
            organization_id: organizationId
          }
        ]

        setTeamMembers(sampleTeamMembers)
        return
      }

      if (lotData) {
        setLot(lotData)

        // Load available ITPs - with fallback sample data
        const { data: itpsData, error: itpsError } = await supabase
          .from('itps')
          .select('*')
          .eq('is_active', true)
          .eq('organization_id', lotData.project_id)

        // Use sample data if no ITPs found or error
        const sampleITPs: ITP[] = [
          {
            id: '1',
            title: 'Highway Concrete Pour Inspection',
            description: 'Quality inspection for concrete pouring activities',
            category: 'Structural',
            estimated_duration: '2 days',
            complexity: 'moderate',
            required_certifications: ['Concrete Testing'],
            is_active: true,
            organization_id: lotData.project_id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: '2',
            title: 'Asphalt Layer Quality Check',
            description: 'Inspection of asphalt layer thickness and compaction',
            category: 'Roadwork',
            estimated_duration: '1 day',
            complexity: 'simple',
            required_certifications: ['Asphalt Testing'],
            is_active: true,
            organization_id: lotData.project_id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ]

        if (itpsError) {
          console.warn('Using mock ITPs:', itpsError.message)
        }
        setAvailableITPs(itpsData && itpsData.length > 0 ? itpsData : sampleITPs)

        // Load team members - with fallback sample data
        const { data: membersData, error: membersError } = await supabase
          .from('profiles')
          .select(`
            id,
            name,
            email,
            role,
            certifications,
            current_workload,
            organization_id
          `)
          .eq('organization_id', lotData.project_id)

        // Use sample data if no team members found or error
        const sampleTeamMembers: TeamMember[] = [
            {
              id: '1',
              name: 'John Rodriguez',
              email: 'john@company.com',
              role: 'Senior Inspector',
              certifications: ['Concrete Testing', 'Highway Construction'],
              current_workload: 65,
              organization_id: lotData.project_id
            },
            {
              id: '2',
              name: 'Sarah Chen',
              email: 'sarah@company.com',
              role: 'Quality Engineer',
              certifications: ['Asphalt Testing', 'Materials Testing'],
              current_workload: 45,
              organization_id: lotData.project_id
            },
            {
              id: '3',
              name: 'Mike Thompson',
              email: 'mike@company.com',
              role: 'Structural Engineer',
              certifications: ['Structural Engineering', 'Bridge Inspection', 'Concrete Testing'],
              current_workload: 80,
              organization_id: lotData.project_id
            },
            {
              id: '4',
              name: 'Lisa Wang',
              email: 'lisa@company.com',
              role: 'Junior Inspector',
              certifications: ['Basic Inspection'],
              current_workload: 30,
              organization_id: lotData.project_id
            }
          ]

        if (membersError) {
          console.warn('Using mock team members:', membersError.message)
        }
        setTeamMembers(membersData && membersData.length > 0 ? membersData : sampleTeamMembers)

        // Check for existing assignment
        const { data: assignmentData } = await supabase
          .from('itp_assignments')
          .select('*')
          .eq('lot_id', lotId)
          .eq('status', 'assigned')
          .single()

        setCurrentAssignment(assignmentData)
      }
    } catch (error) {
      console.error('Error loading QA inspection data:', error)
      setError('Failed to load inspection data. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }, [lotId, supabase])

  useEffect(() => {
    if (dailyReportId && lotId) {
      loadData()
    }
  }, [dailyReportId, lotId, loadData])

  const handleAssignment = async (assignmentData: CreateITPAssignment) => {
    const result = await assignITPToLot(assignmentData)
    
    if (!result.success) {
      throw new Error(result.error)
    }

    // Reload assignment data
    const { data: newAssignment } = await supabase
      .from('itp_assignments')
      .select('*')
      .eq('lot_id', lotId)
      .eq('status', 'assigned')
      .single()

    setCurrentAssignment(newAssignment)
  }

  if (isLoading) {
    return <div className="text-center py-12">Loading...</div>
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">
          <AlertCircle className="w-8 h-8 mx-auto mb-2" />
          <p>{error}</p>
        </div>
        <Button variant="outline" onClick={loadData}>
          Retry
        </Button>
      </div>
    )
  }

  if (!lot) {
    return <div className="text-center py-12">Lot not found</div>
  }

  if (currentAssignment) {
    return <div className="text-center py-12">Current assignment display...</div>
  }

  return (
    <div className="text-center py-12">
      <div className="w-16 h-16 mx-auto mb-4 text-muted-foreground">
        <FileText className="w-full h-full" />
      </div>
      <h3 className="text-xl font-semibold mb-2">No ITP Assigned</h3>
      <p className="text-muted-foreground mb-6">
        No Inspection & Test Plan has been assigned to this lot yet.
      </p>
      
      <AssignITPButton
        lot={lot}
        availableITPs={availableITPs}
        teamMembers={teamMembers}
        onAssign={handleAssignment}
      />
    </div>
  )
}