'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '../../../../../../../lib/supabase/client'
import { itpService } from '../../../../../../../lib/services/itp-service'
import { AssignITPButton } from '../../../../../../../components/assign-itp-button'
import { assignITPToLot } from '../../../../../../actions/assign-itp'
import { FileText, AlertCircle } from 'lucide-react'
import { Button } from '../../../../../../../components/ui/button'
import type { CreateITPAssignment, Lot, ITP, TeamMember, ITPAssignment } from '../../../../../../../types'
// PHASE 2: Add ITP imports to QA component
import ITPSelectionModal from '../../../../../../../components/itps/ITPSelectionModal'
import { getITPsByProject } from '../../../../../../../lib/supabase/itps'
import type { ITP as EnhancedITP } from '../../../../../../../types/database'

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
  
  // PHASE 3: Add ITP state management
  const [showITPModal, setShowITPModal] = useState(false)
  const [enhancedITPs, setEnhancedITPs] = useState<EnhancedITP[]>([])
  const [isLoadingITPs, setIsLoadingITPs] = useState(false)

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
    try {
      console.log('📝 Form data being submitted:', assignmentData)
      
      // Add default UUIDs if missing
      const completeAssignment = {
        ...assignmentData,
        lot_id: lot?.id || '550e8400-e29b-41d4-a716-446655440002',
        project_id: lot?.project_id || '550e8400-e29b-41d4-a716-446655440001',
        organization_id: '550e8400-e29b-41d4-a716-446655440000'
      }
      
      console.log('📤 Complete assignment data:', completeAssignment)
      
      const result = await assignITPToLot(completeAssignment)
      
      if (!result.success) {
        throw new Error(result.error)
      }
      
      console.log('🎉 Assignment completed successfully!')
      await loadData()
    } catch (error) {
      console.error('💥 Assignment failed:', error)
      throw error
    }
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
    return (
      <div className="space-y-6">
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <FileText className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-green-800">Active ITP Assignment</h3>
              <p className="text-green-600">Status: {currentAssignment.status}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-700">ITP ID:</span>
              <span className="ml-2 text-gray-600">{currentAssignment.itp_id}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Assigned To:</span>
              <span className="ml-2 text-gray-600">{currentAssignment.assigned_to}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Priority:</span>
              <span className="ml-2 text-gray-600">{currentAssignment.priority}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Scheduled:</span>
              <span className="ml-2 text-gray-600">
                {currentAssignment.scheduled_date ? new Date(currentAssignment.scheduled_date).toLocaleDateString() : 'Not scheduled'}
              </span>
            </div>
          </div>
          
          {currentAssignment.notes && (
            <div className="mt-4 pt-4 border-t border-green-200">
              <span className="font-medium text-gray-700">Notes:</span>
              <p className="mt-1 text-gray-600">{currentAssignment.notes}</p>
            </div>
          )}
        </div>
        
        <div className="text-center py-6 border-t">
          <h4 className="text-lg font-medium mb-4">Assign Additional ITP</h4>
          <AssignITPButton
            lot={lot}
            availableITPs={availableITPs}
            teamMembers={teamMembers}
            onAssign={handleAssignment}
          />
        </div>
      </div>
    )
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