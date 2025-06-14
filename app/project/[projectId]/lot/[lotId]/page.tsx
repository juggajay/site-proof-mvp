'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '../../../../../lib/supabase/client'
import { AssignItpModal } from '../../../../../components/modals/assign-itp-modal'
import { Button } from '../../../../../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../../../components/ui/card'
import { Badge } from '../../../../../components/ui/badge'
import { Loader2, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
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

  useEffect(() => {
    loadLotData()
  }, [params.lotId])

  const loadLotData = async () => {
    try {
      setIsLoading(true)
      const supabase = createClient()

      // Load lot data with ITP information
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
          updated_at
        `)
        .eq('id', params.lotId)
        .single()

      if (lotError) {
        console.error('Error loading lot:', lotError)
        toast.error('Failed to load lot data')
        return
      }

      console.log('🔍 Lot data loaded:', lotData)
      console.log('📋 Has ITP ID:', !!lotData.itp_id, 'ITP ID:', lotData.itp_id)
      
      setLot(lotData)

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
        setAssignment(mostRecentAssignment)
        await loadItpData(mostRecentAssignment.itp_id)
      } else {
        console.log('📭 No assignment found for lot:', params.lotId)
      }

    } catch (error) {
      console.error('Error loading lot data:', error)
      toast.error('Failed to load lot data')
    } finally {
      setIsLoading(false)
    }
  }

  const loadItpData = async (itpId: string) => {
    try {
      const supabase = createClient()

      // Load ITP details
      const { data: itpData, error: itpError } = await supabase
        .from('itps')
        .select(`
          id,
          title,
          description,
          category,
          estimated_duration,
          complexity,
          required_certifications,
          organization_id,
          created_at,
          updated_at
        `)
        .eq('id', itpId)
        .single()

      if (itpError) {
        console.error('Error loading ITP:', itpError)
        return
      }

      setItp(itpData)

      // Load ITP items (checklist items)
      const { data: itemsData, error: itemsError } = await supabase
        .from('itp_items')
        .select(`
          id,
          itp_id,
          item_number,
          description,
          inspection_type,
          acceptance_criteria,
          reference_standard,
          required_documentation,
          hold_point,
          witness_point,
          created_at,
          updated_at
        `)
        .eq('itp_id', itpId)
        .order('item_number')

      if (itemsError) {
        console.error('Error loading ITP items:', itemsError)
      } else {
        setItpItems(itemsData || [])
      }

    } catch (error) {
      console.error('Error loading ITP data:', error)
    }
  }

  const handleAssignmentComplete = () => {
    console.log('Assignment success callback triggered');
    
    // Close modal first
    setIsAssignModalOpen(false);
    
    // Add a small delay then force reload to ensure assignment is visible
    setTimeout(() => {
      window.location.reload();
    }, 500);
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
          console.log('🎯 Conditional rendering check:', {
            assignment: assignment?.id,
            itp: itp?.id,
            hasAssignment: !!assignment,
            hasItp: !!itp,
            assignmentStatus: assignment?.status
          });
          return !assignment;
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
          <div className="space-y-6">
            {/* ITP Details */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{itp?.title}</CardTitle>
                    <CardDescription>{itp?.description}</CardDescription>
                  </div>
                  <Badge variant="outline">
                    {assignment?.status || 'assigned'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                      Category
                    </label>
                    <p className="text-gray-900 dark:text-gray-100">
                      {itp?.category}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                      Complexity
                    </label>
                    <Badge variant={itp?.complexity === 'complex' ? 'destructive' : itp?.complexity === 'moderate' ? 'default' : 'secondary'}>
                      {itp?.complexity}
                    </Badge>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                      Estimated Duration
                    </label>
                    <p className="text-gray-900 dark:text-gray-100">
                      {itp?.estimated_duration}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* ITP Checklist */}
            <Card>
              <CardHeader>
                <CardTitle>Inspection Checklist</CardTitle>
                <CardDescription>
                  Complete all inspection items below. Items marked with 🔴 are hold points.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {itpItems.length === 0 ? (
                  <div className="text-center py-8">
                    <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No checklist items found for this ITP.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {itpItems.map((item) => (
                      <Card key={item.id} className="border-l-4 border-l-blue-500">
                        <CardContent className="pt-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="font-mono text-sm bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                                  {item.item_number}
                                </span>
                                {item.hold_point && (
                                  <Badge variant="destructive" className="text-xs">
                                    🔴 Hold Point
                                  </Badge>
                                )}
                                {item.witness_point && (
                                  <Badge variant="outline" className="text-xs">
                                    👁️ Witness Point
                                  </Badge>
                                )}
                              </div>
                              <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                                {item.description}
                              </h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                <div>
                                  <span className="font-medium text-gray-500">Inspection Type:</span>
                                  <p className="text-gray-900 dark:text-gray-100">{item.inspection_type}</p>
                                </div>
                                <div>
                                  <span className="font-medium text-gray-500">Acceptance Criteria:</span>
                                  <p className="text-gray-900 dark:text-gray-100">{item.acceptance_criteria}</p>
                                </div>
                                {item.reference_standard && (
                                  <div>
                                    <span className="font-medium text-gray-500">Reference Standard:</span>
                                    <p className="text-gray-900 dark:text-gray-100">{item.reference_standard}</p>
                                  </div>
                                )}
                                {item.required_documentation && (
                                  <div>
                                    <span className="font-medium text-gray-500">Required Documentation:</span>
                                    <p className="text-gray-900 dark:text-gray-100">{item.required_documentation}</p>
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2 ml-4">
                              <Button variant="outline" size="sm">
                                <Clock className="h-4 w-4 mr-1" />
                                Pending
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Assign ITP Modal */}
        <AssignItpModal
          open={isAssignModalOpen}
          onOpenChange={setIsAssignModalOpen}
          lot={lot as any}
          onSuccess={handleAssignmentComplete}
        />
      </div>
    </div>
  )
}