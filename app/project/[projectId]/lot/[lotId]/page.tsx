'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { getLotByIdAction, getITPTemplatesAction, assignITPToLotAction, saveConformanceRecordAction } from '@/lib/actions'
import { LotWithDetails, ITPTemplate, ConformanceRecord, UpdateConformanceRequest } from '@/types/database'
import Link from 'next/link'
import { ArrowLeft, ClipboardList, FileText, CheckCircle2, XCircle, AlertTriangle, Settings, MapPin, BookOpen, Calendar } from 'lucide-react'
import { AssignITPModal } from '@/components/modals/assign-itp-modal'
import { InspectionChecklistForm } from '@/components/forms/inspection-checklist-form'
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
  const [isAssignITPModalOpen, setIsAssignITPModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'inspections' | 'site-diary'>('inspections')

  const projectId = params.projectId
  const lotId = params.lotId

  const loadLotData = useCallback(async () => {
    try {
      const result = await getLotByIdAction(lotId)
      if (result.success) {
        setLot(result.data!)
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

  const handleITPAssigned = () => {
    setIsAssignITPModalOpen(false)
    loadLotData()
  }

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
    if (!lot?.itp_template?.itp_items) return { total: 0, completed: 0, passed: 0, failed: 0 }
    
    const total = lot.itp_template.itp_items.length
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
          <Link href={`/project/${projectId}`} className="mt-4 inline-flex items-center text-blue-600 hover:text-blue-700">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Project
          </Link>
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
          !lot.itp_template ? (
            <div className="bg-white shadow rounded-lg mb-8">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">ITP Template Assignment</h3>
              </div>
              <div className="text-center py-12">
                <ClipboardList className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-4 text-sm font-medium text-gray-900">No ITP Template Assigned</h3>
                <p className="mt-2 text-sm text-gray-500">
                  Assign an Inspection Test Plan (ITP) template to begin quality inspections for this lot.
                </p>
                <div className="mt-6">
                  <button
                    onClick={() => setIsAssignITPModalOpen(true)}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <ClipboardList className="h-4 w-4 mr-2" />
                    Assign ITP Template
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">Quality Inspection Checklist</h3>
                    <p className="text-sm text-gray-500">{lot.itp_template.name}</p>
                  </div>
                  <button
                    onClick={() => setIsAssignITPModalOpen(true)}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <ClipboardList className="h-4 w-4 mr-2" />
                    Change Template
                  </button>
                </div>
              </div>
              
              <InspectionChecklistForm
                lot={lot}
                onInspectionSaved={handleInspectionSaved}
              />
            </div>
          )
        ) : (
          <SiteDiaryTab lotId={lotId} />
        )}
      </div>

      {/* Assign ITP Modal */}
      <AssignITPModal
        isOpen={isAssignITPModalOpen}
        onClose={() => setIsAssignITPModalOpen(false)}
        onITPAssigned={handleITPAssigned}
        lotId={lotId}
        currentITPTemplateId={lot.itp_template_id}
      />
    </div>
  )
}