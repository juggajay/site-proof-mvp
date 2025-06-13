'use client'

import { useState, useEffect } from 'react'
import { createClient } from '../../../../../../../lib/supabase/client'
import { AssignITPButton } from '../../../../../../../components/assign-itp-button'
import { assignITPToLot } from '../../../../../../actions/assign-itp'
import { FileText } from 'lucide-react'
import type { CreateITPAssignment, Lot, ITP, TeamMember, ITPAssignment } from '../../../../../../../types'

interface QAInspectionProps {
  dailyReportId: string
  lotId: string
}

export default function QAInspection({ dailyReportId, lotId }: QAInspectionProps) {
  const [lot, setLot] = useState<Lot | null>(null)
  const [availableITPs, setAvailableITPs] = useState<ITP[]>([])
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [currentAssignment, setCurrentAssignment] = useState<ITPAssignment | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const supabase = createClient()

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load lot data
        const { data: lotData } = await supabase
          .from('lots')
          .select('*')
          .eq('id', lotId)
          .single()

        if (lotData) {
          setLot(lotData)

          // Load available ITPs
          const { data: itpsData } = await supabase
            .from('itps')
            .select('*')
            .eq('is_active', true)
            .eq('organization_id', lotData.project_id) // This should be organization_id

          setAvailableITPs(itpsData || [])

          // Load team members
          const { data: membersData } = await supabase
            .from('profiles')
            .select('*')
            .eq('organization_id', lotData.project_id) // This should be organization_id

          setTeamMembers(membersData || [])

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
      } finally {
        setIsLoading(false)
      }
    }

    if (dailyReportId && lotId) {
      loadData()
    }
  }, [dailyReportId, lotId, supabase])

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