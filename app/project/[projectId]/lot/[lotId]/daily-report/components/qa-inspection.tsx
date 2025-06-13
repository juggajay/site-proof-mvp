'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '../../../../../../../lib/supabase/client'
import { itpService } from '../../../../../../../lib/services/itp-service'
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

      let organizationId = 'demo-org'
      
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
      } else if (lotData) {
        setLot(lotData)
        organizationId = lotData.project_id
      }

      // Use ITP service to load data with fallbacks
      const [itps, members, assignment] = await Promise.all([
        itpService.getAvailableITPs(organizationId),
        itpService.getTeamMembers(organizationId),
        itpService.getCurrentAssignment(lotId)
      ])

      setAvailableITPs(itps)
      setTeamMembers(members)
      setCurrentAssignment(assignment)
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