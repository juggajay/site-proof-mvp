'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { getLotByIdAction, getITPTemplatesAction, assignITPToLotAction, saveConformanceRecordAction } from '@/lib/actions'
import { debugLotITPTemplates } from '@/lib/debug-actions'
import { LotWithDetails, ITPTemplate, ConformanceRecord, UpdateConformanceRequest } from '@/types/database'
import Link from 'next/link'
import { ArrowLeft, ClipboardList, FileText, CheckCircle2, XCircle, AlertTriangle, Settings, MapPin, BookOpen, Calendar } from 'lucide-react'
import { InspectionChecklistForm } from '@/components/forms/inspection-checklist-form'
import { InteractiveInspectionForm } from '@/components/forms/interactive-inspection-form'
import { MultiITPInspectionForm } from '@/components/forms/multi-itp-inspection-form'
import { SiteDiaryTab } from '@/components/site-diary/site-diary-tab'

interface PageProps {
  params: {
    projectId: string
    lotId: string
  }
}

export default function LotDetailPage({ params }: PageProps) {
  const { user, loading } = useAuth()
  const [lot, setLot] = useState<LotWithDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'inspections' | 'site-diary'>('inspections')

  const projectId = params.projectId
  const lotId = params.lotId

  const loadLotData = useCallback(async (forceRefresh = false) => {
    try {
      console.log('LotDetailPage: Loading lot with ID:', lotId, 'Force refresh:', forceRefresh)
      
      // Add timestamp to force cache bypass
      const timestamp = Date.now()
      console.log('Cache bust timestamp:', timestamp)
      
      // Debug query
      const debugResult = await debugLotITPTemplates(lotId)
      console.log('🔍 DEBUG: ITP Templates Query Results:', debugResult)
      
      // Get lot data
      const result = await getLotByIdAction(lotId)
      console.log('LotDetailPage: getLotByIdAction result:', result)
      if (result.success && result.data) {
        console.log('LotDetailPage: Lot data:', {
          lotId: result.data.id,
          itpTemplatesCount: result.data.itp_templates?.length || 0,
          lotItpTemplatesCount: result.data.lot_itp_templates?.length || 0,
          lotItpAssignmentsExists: 'lot_itp_assignments' in result.data,
          lotItpAssignmentsCount: result.data.lot_itp_assignments?.length || 0,
          lotItpAssignments: result.data.lot_itp_assignments,
          itpTemplates: result.data.itp_templates,
          lotItpTemplates: result.data.lot_itp_templates
        })
        
        // Set the lot data
        setLot(result.data || null)
      } else {
        setError(result.error || 'Failed to load lot')
      }
    } catch (error) {
      console.error('Error loading lot:', error)
      setError('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }, [lotId])

  useEffect(() => {
    if (user && lotId) {
      loadLotData()
    }
  }, [user, lotId, loadLotData])


  const handleInspectionSaved = () => {
    loadLotData()
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-gray-100 text-gray-800'
      case 'in_progress': return 'bg-blue-100 text-blue-800'
      case 'completed': return 'bg-green-100 text-green-800'
      case 'approved': return 'bg-emerald-100 text-emerald-800'
      case 'rejected': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getCompletionStats = () => {
    if (!lot) return { total: 0, completed: 0, passed: 0, failed: 0 }
    
    // Support both legacy single ITP and new multiple ITPs
    let total = 0
    
    // Count items from multiple ITPs if available
    if (lot.itp_templates && lot.itp_templates.length > 0) {
      total = lot.itp_templates.reduce((sum, template) => 
        sum + (template.itp_items?.length || 0), 0
      )
    } 
    // Fall back to legacy single ITP if no multiple ITPs
    else if (lot.itp_template?.itp_items) {
      total = lot.itp_template.itp_items.length
    }
    
    const completed = lot.conformance_records.length
    const passed = lot.conformance_records.filter(r => r.result_pass_fail === 'PASS').length
    const failed = lot.conformance_records.filter(r => r.result_pass_fail === 'FAIL').length
    
    return { total, completed, passed, failed }
  }

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading lot details...</p>
        </div>
      </div>
    )
  }

  if (error || !lot) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-600 mx-auto mb-4" />
          <p className="text-gray-600">{error || 'Lot not found'}</p>
          <div className="mt-4 space-y-2">
            <Link href={`/project/${projectId}`} className="block">
              <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Project
              </button>
            </Link>
            <button
              onClick={async () => {
                console.log('🔍 Debug: Testing lot API...')
                try {
                  const response = await fetch(`/api/test-lot?id=${lotId}`)
                  const data = await response.json()
                  console.log('🔍 Test lot API response:', data)
                  alert('Check console for API response')
                } catch (err) {
                  console.error('🔍 Test lot API error:', err)
                }
              }}
              className="block w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Test Lot API
            </button>
            <div className="mt-4 text-left bg-gray-100 p-4 rounded">
              <p className="text-xs font-mono">Lot ID: {lotId}</p>
              <p className="text-xs font-mono">Project ID: {projectId}</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const stats = getCompletionStats()
  const completionPercentage = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center">
              <Link href={`/project/${projectId}`} className="mr-4 text-gray-400 hover:text-gray-600">
                <ArrowLeft className="h-6 w-6" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Lot {lot.lot_number}</h1>
                <p className="text-sm text-gray-500">{lot.project.name}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(lot.status)}`}>
                {lot.status?.replace('_', ' ') || 'pending'}
              </span>
              <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Lot Info and Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2">
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Lot Information</h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {lot.description && (
                    <div className="md:col-span-2">
                      <dt className="text-sm font-medium text-gray-500">Description</dt>
                      <dd className="mt-1 text-sm text-gray-900">{lot.description}</dd>
                    </div>
                  )}
                  
                  {lot.location_description && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500 flex items-center">
                        <MapPin className="h-4 w-4 mr-1" />
                        Location
                      </dt>
                      <dd className="mt-1 text-sm text-gray-900">{lot.location_description}</dd>
                    </div>
                  )}

                  <div>
                    <dt className="text-sm font-medium text-gray-500">Created</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {new Date(lot.created_at).toLocaleDateString()}
                    </dd>
                  </div>

                  {lot.target_completion_date && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Target Completion</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {new Date(lot.target_completion_date).toLocaleDateString()}
                      </dd>
                    </div>
                  )}

                  {lot.assigned_inspector && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Assigned Inspector</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {lot.assigned_inspector.first_name && lot.assigned_inspector.last_name
                          ? `${lot.assigned_inspector.first_name} ${lot.assigned_inspector.last_name}`
                          : 'Not assigned'}
                      </dd>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div>
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Inspection Progress</h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>Overall Progress</span>
                      <span>{completionPercentage}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${completionPercentage}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Total Items</span>
                      <span className="text-sm font-medium text-gray-900">{stats.total}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500 flex items-center">
                        <CheckCircle2 className="h-4 w-4 mr-1 text-green-500" />
                        Passed
                      </span>
                      <span className="text-sm font-medium text-green-600">{stats.passed}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500 flex items-center">
                        <XCircle className="h-4 w-4 mr-1 text-red-500" />
                        Failed
                      </span>
                      <span className="text-sm font-medium text-red-600">{stats.failed}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Remaining</span>
                      <span className="text-sm font-medium text-gray-900">{stats.total - stats.completed}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white shadow rounded-lg mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex">
              <button
                onClick={() => setActiveTab('inspections')}
                className={`py-2 px-6 border-b-2 font-medium text-sm focus:outline-none ${
                  activeTab === 'inspections'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center">
                  <ClipboardList className="h-4 w-4 mr-2" />
                  Inspections
                </div>
              </button>
              <button
                onClick={() => setActiveTab('site-diary')}
                className={`py-2 px-6 border-b-2 font-medium text-sm focus:outline-none ${
                  activeTab === 'site-diary'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center">
                  <BookOpen className="h-4 w-4 mr-2" />
                  Site Diary
                </div>
              </button>
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'inspections' ? (
          <MultiITPInspectionForm
            lot={lot}
            onInspectionSaved={handleInspectionSaved}
          />
        ) : (
          <SiteDiaryTab lotId={lotId} />
        )}
      </div>

    </div>
  )
}