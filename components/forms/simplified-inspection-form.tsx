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
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [hasChanges, setHasChanges] = useState(false)
  const [isSavingAll, setIsSavingAll] = useState(false)

  const items = useMemo(() => {
    const templateItems = lot.itp_template?.itp_items || []
    console.log('📋 SimplifiedInspectionForm - Loading items:', {
      templateId: lot.itp_template?.id,
      templateName: lot.itp_template?.name,
      itemCount: templateItems.length,
      items: templateItems.map(item => ({
        id: item.id,
        description: item.description,
        item_number: item.item_number
      }))
    })
    return templateItems
  }, [lot.itp_template?.itp_items])

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

  const handleQuickAction = (item: ITPItem, result: 'PASS' | 'FAIL' | 'N/A') => {
    setStatusMap(prev => {
      const newMap = new Map(prev)
      newMap.set(item.id, {
        itemId: item.id,
        status: result === 'PASS' ? 'passed' : result === 'FAIL' ? 'failed' : 'na',
        comments: prev.get(item.id)?.comments || ''
      })
      return newMap
    })
    setHasChanges(true)
    setError(null)
    setSuccessMessage(null)
  }

  const saveAllChanges = async () => {
    setIsSavingAll(true)
    setError(null)

    try {
      console.log('Starting save all changes...')
      console.log('Lot ID:', lot.id)
      console.log('Items to save:', items.length)
      console.log('Status map:', Array.from(statusMap.entries()))
      
      // Log the actual item IDs being used
      console.log('🔍 Item IDs debug:', items.map(item => ({
        id: item.id,
        type: typeof item.id,
        isUUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(item.id)),
        description: item.description
      })))
      
      // Get all items that have been changed
      console.log('🔍 Building save promises for items:', {
        totalItems: items.length,
        statusMapSize: statusMap.size,
        statusMapEntries: Array.from(statusMap.entries())
      })
      
      const promises = items.map(async (item) => {
        const status = statusMap.get(item.id)
        console.log(`Item ${item.id} status:`, status)
        
        if (status && status.status !== 'pending') {
          const result = status.status === 'passed' ? 'PASS' : 
                        status.status === 'failed' ? 'FAIL' : 'N/A'
          
          const data: UpdateConformanceRequest = {
            result_pass_fail: result,
            comments: status.comments || ''
          }
          
          console.log('Saving item:', { 
            lotId: lot.id, 
            itemId: item.id,
            itemIdType: typeof item.id,
            data,
            itemTableSource: 'itp_template_items' // These items come from template definitions
          })

          return saveConformanceRecordAction(lot.id, item.id, data)
        }
        return null
      }).filter(Boolean)

      const results = await Promise.all(promises)
      console.log('Save results:', results)
      
      // Log detailed error information
      results.forEach((result, index) => {
        if (result && !result.success) {
          console.error(`❌ Save failed for item ${index}:`, {
            error: result.error,
            fullResult: result
          })
        }
      })
      
      // Check if all saves were successful
      const allSuccessful = results.every(r => r && r.success)
      const failedResults = results.filter(r => r && !r.success)
      
      if (allSuccessful) {
        setHasChanges(false)
        const savedCount = results.filter(r => r && r.success).length
        setSuccessMessage(`Successfully saved ${savedCount} inspection${savedCount > 1 ? 's' : ''}!`)
        console.log(`✅ All ${savedCount} inspections saved successfully`)
      } else {
        const failedCount = failedResults.length
        const errorMessages = failedResults.map(r => r?.error).filter(Boolean).join(', ')
        setError(`Failed to save ${failedCount} inspection${failedCount > 1 ? 's' : ''}${errorMessages ? ': ' + errorMessages : ''}`)
        console.error('Failed saves:', failedResults)
      }
      
      // Clear messages after 3 seconds
      if (allSuccessful) {
        setTimeout(() => setSuccessMessage(null), 3000)
      } else {
        setTimeout(() => setError(null), 5000)
      }
      
      // Don't call onInspectionSaved here as it will reload the page
      // The UI will update from the current state
    } catch (error) {
      console.error('Error saving inspections:', error)
      setError('Failed to save inspections: ' + (error instanceof Error ? error.message : 'Unknown error'))
      setTimeout(() => setError(null), 5000)
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
            
            {/* Success Message */}
            {successMessage && (
              <div className="m-4 bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <p className="text-sm text-green-800">{successMessage}</p>
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
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
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
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          onClick={() => handleQuickAction(item, 'PASS')}
                          disabled={isSaving || isSavingAll}
                          className={`
                            px-6 py-3 rounded-lg transition-all font-semibold text-base
                            flex items-center justify-center gap-2 min-w-[100px]
                            ${status === 'passed' 
                              ? 'bg-green-600 text-white hover:bg-green-700 shadow-md' 
                              : 'bg-white text-green-700 hover:bg-green-50 border-2 border-green-500'
                            }
                            ${(isSaving || isSavingAll) ? 'opacity-50 cursor-not-allowed' : ''}
                          `}
                        >
                          <CheckCircle2 className="h-5 w-5" />
                          PASS
                        </button>
                        
                        <button
                          onClick={() => handleQuickAction(item, 'FAIL')}
                          disabled={isSaving || isSavingAll}
                          className={`
                            px-6 py-3 rounded-lg transition-all font-semibold text-base
                            flex items-center justify-center gap-2 min-w-[100px]
                            ${status === 'failed' 
                              ? 'bg-red-600 text-white hover:bg-red-700 shadow-md' 
                              : 'bg-white text-red-700 hover:bg-red-50 border-2 border-red-500'
                            }
                            ${(isSaving || isSavingAll) ? 'opacity-50 cursor-not-allowed' : ''}
                          `}
                        >
                          <XCircle className="h-5 w-5" />
                          FAIL
                        </button>
                        
                        <button
                          onClick={() => handleQuickAction(item, 'N/A')}
                          disabled={isSaving || isSavingAll}
                          className={`
                            px-6 py-3 rounded-lg transition-all font-semibold text-base
                            flex items-center justify-center gap-2 min-w-[100px]
                            ${status === 'na' 
                              ? 'bg-gray-600 text-white hover:bg-gray-700 shadow-md' 
                              : 'bg-white text-gray-700 hover:bg-gray-50 border-2 border-gray-500'
                            }
                            ${(isSaving || isSavingAll) ? 'opacity-50 cursor-not-allowed' : ''}
                          `}
                        >
                          <MinusCircle className="h-5 w-5" />
                          N/A
                        </button>
                        
                        {/* Photo button - visible on mobile */}
                        <button
                          className="px-6 py-3 bg-blue-500 text-white hover:bg-blue-600 rounded-lg transition-all font-semibold text-base flex items-center justify-center gap-2 min-w-[100px] shadow-md lg:hidden"
                        >
                          <Camera className="h-5 w-5" />
                          PHOTO
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
                    w-full flex items-center justify-center gap-3 px-8 py-4 
                    bg-blue-600 text-white rounded-lg font-semibold text-lg
                    hover:bg-blue-700 transition-all shadow-lg
                    ${isSavingAll ? 'opacity-50 cursor-not-allowed' : ''}
                  `}
                >
                  <Save className="h-6 w-6" />
                  {isSavingAll ? 'Saving Changes...' : 'SAVE ALL CHANGES'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}