'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '../../../../../lib/supabase/client'
import { AssignItpModal } from '../../../../../components/modals/assign-itp-modal'
import { Button } from '../../../../../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../../../components/ui/card'
import { Badge } from '../../../../../components/ui/badge'
import { Loader2, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import LotInspectionClientPage from './lot-inspection-client-page'
// Local interfaces that match our database schema
interface Lot {
  id: string
  lot_number: string
  description: string | null
  location: string | null
  priority: 'low' | 'medium' | 'high'
  project_id: string
  created_at: string
  updated_at: string
}

interface Assignment {
  id: string
  lot_id: string
  project_id: string
  itp_id: string
  assigned_to: string
  assigned_by: string
  status: string
  scheduled_date: string
  completed_date: string | null
  priority: string
  notes: string | null
  organization_id: string
  created_at: string
  updated_at: string
}

interface ITP {
  id: string
  title: string
  description: string | null
  category: string
  estimated_duration: string
  complexity: 'simple' | 'moderate' | 'complex'
  required_certifications: string[] | null
  organization_id: string
  created_at: string
  updated_at: string
}

interface ItpItem {
  id: string
  itp_id: string
  item_number: string
  description: string
  inspection_type: string
  acceptance_criteria: string
  reference_standard: string | null
  required_documentation: string | null
  hold_point: boolean
  witness_point: boolean
  created_at: string
  updated_at: string
}

interface LotPageProps {
  params: {
    projectId: string
    lotId: string
  }
}

export default function LotPage({ params }: LotPageProps) {
  const [lot, setLot] = useState<Lot | null>(null)
  const [assignment, setAssignment] = useState<Assignment | null>(null)
  const [itp, setItp] = useState<ITP | null>(null)
  const [itpItems, setItpItems] = useState<ItpItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false)
  const router = useRouter()

  const loadLotData = useCallback(async () => {
    try {
      setIsLoading(true)
      const supabase = createClient()

      // Load lot data with ITP information via JOIN
      const { data: lotData, error: lotError } = await supabase
        .from('lots')
        .select(`
          id,
          lot_number,
          description,
          location,
          priority,
          project_id,
          itp_id,
          created_at,
          updated_at,
          itps:itp_id (
            id,
            title,
            description,
            category,
            complexity,
            estimated_duration,
            required_certifications,
            organization_id,
            created_at,
            updated_at,
            itp_items(*)
          )
        `)
        .eq('id', params.lotId)
        .single()

      if (lotError) {
        console.error('Error loading lot:', lotError)
        toast.error('Failed to load lot data')
        return
      }

      console.log('=== LOT DATA DEBUG ===')
      console.log('Full lot data:', lotData)
      console.log('Lot ID:', lotData.id)
      console.log('Has itp_id:', !!lotData.itp_id)
      console.log('ITP data from JOIN:', lotData.itps)
      
      setLot(lotData)
      
      // Set ITP data from the JOIN if available
      if (lotData.itps && Array.isArray(lotData.itps) && lotData.itps.length > 0) {
        const itpData = lotData.itps[0] as ITP // Take the first (and should be only) ITP
        console.log('✅ ITP data loaded from JOIN:', itpData)
        setItp(itpData)
        if ((itpData as any).itp_items && Array.isArray((itpData as any).itp_items)) {
          setItpItems((itpData as any).itp_items)
        }
      } else if (lotData.itps && !Array.isArray(lotData.itps)) {
        // Handle case where it's a single object (not array)
        console.log('✅ ITP data loaded from JOIN (single object):', lotData.itps)
        setItp(lotData.itps as ITP)
        if ((lotData.itps as any).itp_items) {
          setItpItems((lotData.itps as any).itp_items)
        }
      } else {
        console.log('📭 No ITP data in JOIN result')
        setItp(null)
        setItpItems([])
      }

      // Check for existing ITP assignments - get ALL active assignments
      const { data: assignmentData, error: assignmentError } = await supabase
        .from('itp_assignments')
        .select(`
          id,
          lot_id,
          project_id,
          itp_id,
          assigned_to,
          assigned_by,
          status,
          scheduled_date,
          completed_date,
          priority,
          notes,
          organization_id,
          created_at,
          updated_at
        `)
        .eq('lot_id', params.lotId)
        .eq('status', 'assigned')
        .order('created_at', { ascending: false })

      console.log('🔍 Assignment query result:', { assignmentData, assignmentError })
      
      if (assignmentError) {
        console.warn('❌ Error loading assignment:', assignmentError)
      } else if (assignmentData && assignmentData.length > 0) {
        console.log('✅ Assignments found:', assignmentData.length, assignmentData)
        // Use the most recent assignment for now (first in the ordered array)
        const mostRecentAssignment = assignmentData[0]
        if (mostRecentAssignment) {
          console.log('📋 Using most recent assignment:', mostRecentAssignment)
          console.log('📋 Assignment ITP ID:', mostRecentAssignment.itp_id)
          setAssignment(mostRecentAssignment)
        } else {
          setAssignment(null)
        }
        // No need to load ITP data separately - we got it from the JOIN above
      } else {
        console.log('📭 No assignment found for lot:', params.lotId)
        console.log('📭 Assignment data:', assignmentData)
        setAssignment(null)
      }

    } catch (error) {
      console.error('Error loading lot data:', error)
      toast.error('Failed to load lot data')
    } finally {
      setIsLoading(false)
    }
  }, [params.lotId])

  useEffect(() => {
    loadLotData()
  }, [loadLotData])

  const handleModalClose = (open: boolean) => {
    if (!open) {
      // When the modal closes after successful assignment, refresh the page data
      console.log('🔄 Modal closed - triggering router refresh to update data');
      router.refresh();
    }
    setIsAssignModalOpen(open);
  }

  const handleBackToProject = () => {
    router.push(`/project/${params.projectId}`)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading lot data...</span>
        </div>
      </div>
    )
  }

  if (!lot) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Lot Not Found</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-4">The requested lot could not be found.</p>
          <Button onClick={handleBackToProject}>Back to Project</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Breadcrumb Navigation */}
        <nav className="mb-6">
          <button
            onClick={handleBackToProject}
            className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Project
          </button>
        </nav>

        {/* Lot Header */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl">Lot {lot.lot_number}</CardTitle>
                <CardDescription>{lot.description || 'No description provided'}</CardDescription>
              </div>
              <Badge variant={lot.priority === 'high' ? 'destructive' : lot.priority === 'medium' ? 'default' : 'secondary'}>
                {lot.priority} priority
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Location
                </label>
                <p className="text-gray-900 dark:text-gray-100">
                  {lot.location || 'Not specified'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Lot ID
                </label>
                <p className="text-gray-900 dark:text-gray-100 font-mono text-sm">
                  {lot.id}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Created
                </label>
                <p className="text-gray-900 dark:text-gray-100 text-sm">
                  {new Date(lot.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ITP Assignment Status */}
        {(() => {
          const hasAssignment = !!assignment;
          const hasItp = !!itp;
          const hasItpData = hasAssignment && hasItp;
          
          console.log('=== CONDITIONAL RENDERING DEBUG ===');
          console.log('Assignment object:', assignment);
          console.log('ITP object:', itp);
          console.log('Has assignment:', hasAssignment);
          console.log('Has ITP data:', hasItp);
          console.log('Has complete ITP data:', hasItpData);
          console.log('Assignment status:', assignment?.status);
          console.log('ITP title:', itp?.title);
          console.log('Rendering decision - show ITP:', hasItpData);
          
          return !hasItpData;
        })() ? (
          <Card>
            <CardHeader>
              <CardTitle>Inspection & Test Plan</CardTitle>
              <CardDescription>
                No ITP has been assigned to this lot yet. Assign an ITP to begin inspections.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => setIsAssignModalOpen(true)}>
                Assign ITP
              </Button>
            </CardContent>
          </Card>
        ) : (
          <LotInspectionClientPage lotData={{
            id: lot.id,
            lot_number: lot.lot_number,
            description: lot.description,
            location: lot.location,
            priority: lot.priority,
            project_id: lot.project_id,
            created_at: lot.created_at,
            updated_at: lot.updated_at,
            projects: {
              name: 'Highway 101 Expansion', // You may want to fetch this from the project data
              project_number: 'Project #'
            },
            status: assignment?.status || 'IN_PROGRESS',
            itps: itp ? {
              id: itp.id,
              title: itp.title,
              description: itp.description,
              category: itp.category,
              complexity: itp.complexity,
              estimated_duration: itp.estimated_duration,
              required_certifications: itp.required_certifications,
              organization_id: itp.organization_id,
              created_at: itp.created_at,
              updated_at: itp.updated_at,
              itp_items: itpItems.map(item => ({
                ...item,
                conformance_records: [] // Add conformance records if available
              }))
            } : null
          } as any} />
        )}

        {/* Assign ITP Modal */}
        <AssignItpModal
          open={isAssignModalOpen}
          onOpenChange={handleModalClose}
          lot={lot as any}
        />
      </div>
    </div>
  )
}