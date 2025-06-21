'use client'

import { useState, useEffect, useMemo } from 'react'
import { LotWithDetails, ITPItem, UpdateConformanceRequest } from '@/types/database'
import { saveConformanceRecordAction } from '@/lib/actions'
import { 
  CheckCircle2, 
  XCircle, 
  ChevronDown, 
  ChevronRight,
  Clock,
  CheckCircle,
  XOctagon,
  MinusCircle,
  AlertCircle,
  Camera,
  Save
} from 'lucide-react'

interface SimplifiedInspectionFormProps {
  lot: LotWithDetails
  onInspectionSaved?: () => void
}

interface InspectionStatus {
  itemId: string | number
  status: 'pending' | 'passed' | 'failed' | 'na'
  comments?: string
}

export function SimplifiedInspectionForm({ lot, onInspectionSaved }: SimplifiedInspectionFormProps) {
  const [isMainSectionExpanded, setIsMainSectionExpanded] = useState(true)
  const [savingItems, setSavingItems] = useState<Set<string | number>>(new Set())
  const [statusMap, setStatusMap] = useState<Map<string | number, InspectionStatus>>(new Map())
  const [error, setError] = useState<string | null>(null)
  const [hasChanges, setHasChanges] = useState(false)
  const [isSavingAll, setIsSavingAll] = useState(false)

  const items = useMemo(() => lot.itp_template?.itp_items || [], [lot.itp_template?.itp_items])

  useEffect(() => {
    // Initialize status map from existing conformance records
    const map = new Map<string | number, InspectionStatus>()
    
    items.forEach(item => {
      const record = lot.conformance_records?.find(r => r.itp_item_id === item.id)
      if (record) {
        map.set(item.id, {
          itemId: item.id,
          status: record.result_pass_fail === 'PASS' ? 'passed' : 
                  record.result_pass_fail === 'FAIL' ? 'failed' : 
                  record.result_pass_fail === 'N/A' ? 'na' : 'pending',
          comments: record.comments || undefined
        })
      } else {
        map.set(item.id, { itemId: item.id, status: 'pending' })
      }
    })
    
    setStatusMap(map)
  }, [items, lot.conformance_records])

  const handleQuickAction = async (item: ITPItem, result: 'PASS' | 'FAIL' | 'N/A') => {
    setStatusMap(prev => {
      const newMap = new Map(prev)
      newMap.set(item.id, {
        itemId: item.id,
        status: result === 'PASS' ? 'passed' : result === 'FAIL' ? 'failed' : 'na'
      })
      return newMap
    })
    setHasChanges(true)
  }

  const saveAllChanges = async () => {
    setIsSavingAll(true)
    setError(null)

    try {
      // Get all items that have been changed
      const promises = items.map(async (item) => {
        const status = statusMap.get(item.id)
        if (status && status.status !== 'pending') {
          const result = status.status === 'passed' ? 'PASS' : 
                        status.status === 'failed' ? 'FAIL' : 'N/A'
          
          const data: UpdateConformanceRequest = {
            result_pass_fail: result,
            comments: status.comments || ''
          }

          return saveConformanceRecordAction(lot.id, item.id, data)
        }
        return null
      }).filter(Boolean)

      await Promise.all(promises)
      setHasChanges(false)
      onInspectionSaved?.()
    } catch (error) {
      setError('Failed to save some inspections')
    } finally {
      setIsSavingAll(false)
    }
  }

  const getProgressStats = () => {
    const total = items.length
    const completed = Array.from(statusMap.values()).filter(s => s.status !== 'pending').length
    const passed = Array.from(statusMap.values()).filter(s => s.status === 'passed').length
    const failed = Array.from(statusMap.values()).filter(s => s.status === 'failed').length
    const na = Array.from(statusMap.values()).filter(s => s.status === 'na').length
    
    return { total, completed, passed, failed, na, pending: total - completed }
  }

  const stats = getProgressStats()
  const completionPercentage = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0

  return (
    <div className="space-y-4">
      {/* Main ITP Section - Collapsible */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
        {/* ITP Header - Always Visible */}
        <div 
          className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
          onClick={() => setIsMainSectionExpanded(!isMainSectionExpanded)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isMainSectionExpanded ? (
                <ChevronDown className="h-6 w-6 text-gray-400" />
              ) : (
                <ChevronRight className="h-6 w-6 text-gray-400" />
              )}
              <div>
                <h3 className="text-lg font-medium text-gray-900">
                  {lot.itp_template?.name || 'Inspection Template'}
                </h3>
                {lot.itp_template?.description && (
                  <p className="text-sm text-gray-500 mt-1">{lot.itp_template.description}</p>
                )}
              </div>
            </div>
            
            {/* Progress Summary - Always Visible */}
            <div className="flex items-center gap-6">
              <div className="text-right">
                <span className="text-2xl font-bold text-gray-900">{completionPercentage}%</span>
                <p className="text-xs text-gray-500">Complete</p>
              </div>
              
              {/* Mini Status Summary */}
              <div className="flex items-center gap-2">
                {stats.pending > 0 && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {stats.pending} Pending
                  </span>
                )}
                {stats.failed > 0 && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    {stats.failed} Failed
                  </span>
                )}
                {stats.completed === stats.total && stats.total > 0 && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Complete
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Collapsible Content */}
        {isMainSectionExpanded && (
          <div className="border-t border-gray-200">
            {/* Detailed Progress Summary */}
            <div className="p-4 bg-gray-50">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium text-gray-700">Inspection Progress</h4>
                <span className="text-sm text-gray-500">{stats.completed} of {stats.total} items completed</span>
              </div>
              
              {/* Progress Bar */}
              <div className="w-full bg-gray-200 rounded-full h-3 mb-4 overflow-hidden">
                <div className="h-full flex">
                  {stats.passed > 0 && (
                    <div 
                      className="bg-green-500 h-full transition-all duration-300"
                      style={{ width: `${(stats.passed / stats.total) * 100}%` }}
                    />
                  )}
                  {stats.failed > 0 && (
                    <div 
                      className="bg-red-500 h-full transition-all duration-300"
                      style={{ width: `${(stats.failed / stats.total) * 100}%` }}
                    />
                  )}
                  {stats.na > 0 && (
                    <div 
                      className="bg-gray-400 h-full transition-all duration-300"
                      style={{ width: `${(stats.na / stats.total) * 100}%` }}
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <div className="m-4 bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              </div>
            )}

            {/* Inspection Items */}
            <div className="p-4 space-y-3">
              {items.map((item) => {
                const status = statusMap.get(item.id)?.status || 'pending'
                const isSaving = savingItems.has(item.id)
                
                return (
                  <div
                    key={item.id}
                    className={`
                      bg-white border rounded-lg p-4 transition-all duration-200
                      ${status === 'pending' ? 'border-blue-200' : ''}
                      ${status === 'passed' ? 'border-green-200 bg-green-50' : ''}
                      ${status === 'failed' ? 'border-red-200 bg-red-50' : ''}
                      ${status === 'na' ? 'border-gray-200 bg-gray-50' : ''}
                    `}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 pr-4">
                        <h4 className="text-sm font-medium text-gray-900">
                          {item.item_number}. {item.description}
                        </h4>
                        {item.specification_reference && (
                          <p className="text-xs text-gray-500 mt-1">
                            Reference: {item.specification_reference}
                          </p>
                        )}
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleQuickAction(item, 'PASS')}
                          disabled={isSaving || isSavingAll}
                          className={`
                            p-2 rounded-lg transition-colors
                            ${status === 'passed' 
                              ? 'bg-green-600 text-white' 
                              : 'text-green-600 hover:bg-green-100'
                            }
                            ${(isSaving || isSavingAll) ? 'opacity-50 cursor-not-allowed' : ''}
                          `}
                          title="Pass"
                        >
                          <CheckCircle2 className="h-5 w-5" />
                        </button>
                        
                        <button
                          onClick={() => handleQuickAction(item, 'FAIL')}
                          disabled={isSaving || isSavingAll}
                          className={`
                            p-2 rounded-lg transition-colors
                            ${status === 'failed' 
                              ? 'bg-red-600 text-white' 
                              : 'text-red-600 hover:bg-red-100'
                            }
                            ${(isSaving || isSavingAll) ? 'opacity-50 cursor-not-allowed' : ''}
                          `}
                          title="Fail"
                        >
                          <XCircle className="h-5 w-5" />
                        </button>
                        
                        <button
                          onClick={() => handleQuickAction(item, 'N/A')}
                          disabled={isSaving || isSavingAll}
                          className={`
                            p-2 rounded-lg transition-colors
                            ${status === 'na' 
                              ? 'bg-gray-600 text-white' 
                              : 'text-gray-600 hover:bg-gray-100'
                            }
                            ${(isSaving || isSavingAll) ? 'opacity-50 cursor-not-allowed' : ''}
                          `}
                          title="Not Applicable"
                        >
                          <MinusCircle className="h-5 w-5" />
                        </button>
                        
                        {/* Photo button - visible on mobile */}
                        <button
                          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors lg:hidden"
                          title="Add Photo"
                        >
                          <Camera className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
            
            {/* Save Changes Button */}
            {hasChanges && (
              <div className="p-4 border-t border-gray-200 bg-gray-50">
                <button
                  onClick={saveAllChanges}
                  disabled={isSavingAll}
                  className={`
                    w-full flex items-center justify-center gap-2 px-6 py-3 
                    bg-blue-600 text-white rounded-lg font-medium
                    hover:bg-blue-700 transition-colors
                    ${isSavingAll ? 'opacity-50 cursor-not-allowed' : ''}
                  `}
                >
                  <Save className="h-5 w-5" />
                  {isSavingAll ? 'Saving...' : 'Save All Changes'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}