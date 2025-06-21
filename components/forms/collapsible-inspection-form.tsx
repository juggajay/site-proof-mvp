'use client'

import { useState, useEffect, useMemo } from 'react'
import { LotWithDetails, ITPItem, UpdateConformanceRequest } from '@/types/database'
import { saveConformanceRecordAction } from '@/lib/actions'
import { 
  CheckCircle2, 
  XCircle, 
  ChevronDown, 
  ChevronRight,
  FileText,
  Camera,
  AlertCircle,
  Clock,
  CheckCircle,
  XOctagon,
  MinusCircle
} from 'lucide-react'

interface CollapsibleInspectionFormProps {
  lot: LotWithDetails
  onInspectionSaved?: () => void
}

interface InspectionStatus {
  itemId: string | number
  status: 'pending' | 'passed' | 'failed' | 'na'
  comments?: string
  result?: string | number
}

export function CollapsibleInspectionForm({ lot, onInspectionSaved }: CollapsibleInspectionFormProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string | number>>(new Set())
  const [savingItems, setSavingItems] = useState<Set<string | number>>(new Set())
  const [statusMap, setStatusMap] = useState<Map<string | number, InspectionStatus>>(new Map())
  const [error, setError] = useState<string | null>(null)

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
          comments: record.comments || undefined,
          result: record.result_numeric || record.result_text || undefined
        })
      } else {
        map.set(item.id, { itemId: item.id, status: 'pending' })
      }
    })
    
    setStatusMap(map)
  }, [items, lot.conformance_records])

  const toggleSection = (itemId: string | number) => {
    const newExpanded = new Set(expandedSections)
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId)
    } else {
      newExpanded.add(itemId)
    }
    setExpandedSections(newExpanded)
  }

  const saveInspection = async (item: ITPItem, result: 'PASS' | 'FAIL' | 'N/A', comments?: string) => {
    setSavingItems(prev => new Set(prev).add(item.id))
    setError(null)

    try {
      const data: UpdateConformanceRequest = {
        result_pass_fail: result,
        comments: comments || ''
      }

      const response = await saveConformanceRecordAction(lot.id, item.id, data)
      
      if (response.success) {
        // Update local status
        setStatusMap(prev => {
          const newMap = new Map(prev)
          newMap.set(item.id, {
            itemId: item.id,
            status: result === 'PASS' ? 'passed' : result === 'FAIL' ? 'failed' : 'na',
            comments
          })
          return newMap
        })
        
        // Collapse the section after saving
        setExpandedSections(prev => {
          const newSet = new Set(prev)
          newSet.delete(item.id)
          return newSet
        })
        
        onInspectionSaved?.()
      } else {
        setError(response.error || 'Failed to save inspection')
      }
    } catch (error) {
      setError('An unexpected error occurred')
    } finally {
      setSavingItems(prev => {
        const newSet = new Set(prev)
        newSet.delete(item.id)
        return newSet
      })
    }
  }

  const handleQuickAction = async (item: ITPItem, result: 'PASS' | 'FAIL' | 'N/A') => {
    await saveInspection(item, result)
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
      {/* Overall Progress Summary */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-medium text-gray-900">Inspection Progress</h3>
          <span className="text-2xl font-bold text-gray-900">{completionPercentage}%</span>
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
        
        {/* Status Summary */}
        <div className="grid grid-cols-4 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-blue-500" />
            <span className="text-gray-600">Pending:</span>
            <span className="font-medium">{stats.pending}</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span className="text-gray-600">Passed:</span>
            <span className="font-medium text-green-600">{stats.passed}</span>
          </div>
          <div className="flex items-center gap-2">
            <XOctagon className="h-4 w-4 text-red-500" />
            <span className="text-gray-600">Failed:</span>
            <span className="font-medium text-red-600">{stats.failed}</span>
          </div>
          <div className="flex items-center gap-2">
            <MinusCircle className="h-4 w-4 text-gray-500" />
            <span className="text-gray-600">N/A:</span>
            <span className="font-medium text-gray-600">{stats.na}</span>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        </div>
      )}

      {/* Inspection Items */}
      <div className="space-y-3">
        {items.map((item) => {
          const status = statusMap.get(item.id)?.status || 'pending'
          const isExpanded = expandedSections.has(item.id)
          const isSaving = savingItems.has(item.id)
          
          return (
            <div
              key={item.id}
              className={`
                bg-white border rounded-lg transition-all duration-200
                ${status === 'pending' ? 'border-blue-200' : ''}
                ${status === 'passed' ? 'border-green-200' : ''}
                ${status === 'failed' ? 'border-red-200' : ''}
                ${status === 'na' ? 'border-gray-200' : ''}
                ${isExpanded ? 'shadow-md' : 'shadow-sm hover:shadow-md'}
              `}
            >
              {/* Header - Always Visible */}
              <div
                className="p-4 cursor-pointer"
                onClick={() => toggleSection(item.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    {/* Expand/Collapse Icon */}
                    <div className="mt-0.5">
                      {isExpanded ? (
                        <ChevronDown className="h-5 w-5 text-gray-400" />
                      ) : (
                        <ChevronRight className="h-5 w-5 text-gray-400" />
                      )}
                    </div>
                    
                    {/* Item Details */}
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-gray-900">
                        {item.item_number}. {item.description}
                      </h4>
                      
                      {/* Show status and reference when collapsed */}
                      {!isExpanded && (
                        <div className="mt-1 flex items-center gap-4 text-xs">
                          {item.specification_reference && (
                            <span className="text-gray-500">
                              Ref: {item.specification_reference}
                            </span>
                          )}
                          <span className={`
                            inline-flex items-center px-2 py-0.5 rounded-full font-medium
                            ${status === 'pending' ? 'bg-blue-100 text-blue-800' : ''}
                            ${status === 'passed' ? 'bg-green-100 text-green-800' : ''}
                            ${status === 'failed' ? 'bg-red-100 text-red-800' : ''}
                            ${status === 'na' ? 'bg-gray-100 text-gray-800' : ''}
                          `}>
                            {status === 'pending' && 'Pending'}
                            {status === 'passed' && '✓ Passed'}
                            {status === 'failed' && '✗ Failed'}
                            {status === 'na' && 'N/A'}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    {/* Quick Actions - Only for Pending Items */}
                    {status === 'pending' && !isExpanded && !isSaving && (
                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleQuickAction(item, 'PASS')}
                          className="p-1.5 text-green-600 hover:bg-green-100 rounded transition-colors"
                          title="Pass"
                        >
                          <CheckCircle2 className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleQuickAction(item, 'FAIL')}
                          className="p-1.5 text-red-600 hover:bg-red-100 rounded transition-colors"
                          title="Fail"
                        >
                          <XCircle className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleQuickAction(item, 'N/A')}
                          className="p-1.5 text-gray-600 hover:bg-gray-100 rounded transition-colors"
                          title="Not Applicable"
                        >
                          <MinusCircle className="h-5 w-5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Expanded Content */}
              {isExpanded && (
                <div className="px-4 pb-4 border-t border-gray-100">
                  <div className="pt-4 space-y-4">
                    {/* Item Details */}
                    <div className="space-y-2">
                      {item.specification_reference && (
                        <div className="flex items-start gap-2">
                          <FileText className="h-4 w-4 text-gray-400 mt-0.5" />
                          <div>
                            <p className="text-xs font-medium text-gray-500">Specification Reference</p>
                            <p className="text-sm text-gray-900">{item.specification_reference}</p>
                          </div>
                        </div>
                      )}
                      
                      {item.inspection_method && (
                        <div className="flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 text-gray-400 mt-0.5" />
                          <div>
                            <p className="text-xs font-medium text-gray-500">Inspection Method</p>
                            <p className="text-sm text-gray-900">{item.inspection_method}</p>
                          </div>
                        </div>
                      )}
                      
                      {item.acceptance_criteria && (
                        <div className="flex items-start gap-2">
                          <AlertCircle className="h-4 w-4 text-gray-400 mt-0.5" />
                          <div>
                            <p className="text-xs font-medium text-gray-500">Acceptance Criteria</p>
                            <p className="text-sm text-gray-900">{item.acceptance_criteria}</p>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 pt-2">
                      <button
                        onClick={() => handleQuickAction(item, 'PASS')}
                        disabled={isSaving}
                        className={`
                          flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors
                          ${status === 'passed' 
                            ? 'bg-green-600 text-white' 
                            : 'bg-white border border-green-600 text-green-600 hover:bg-green-50'
                          }
                          ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}
                        `}
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        Pass
                      </button>
                      
                      <button
                        onClick={() => handleQuickAction(item, 'FAIL')}
                        disabled={isSaving}
                        className={`
                          flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors
                          ${status === 'failed' 
                            ? 'bg-red-600 text-white' 
                            : 'bg-white border border-red-600 text-red-600 hover:bg-red-50'
                          }
                          ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}
                        `}
                      >
                        <XCircle className="h-4 w-4" />
                        Fail
                      </button>
                      
                      <button
                        onClick={() => handleQuickAction(item, 'N/A')}
                        disabled={isSaving}
                        className={`
                          flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors
                          ${status === 'na' 
                            ? 'bg-gray-600 text-white' 
                            : 'bg-white border border-gray-600 text-gray-600 hover:bg-gray-50'
                          }
                          ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}
                        `}
                      >
                        <MinusCircle className="h-4 w-4" />
                        N/A
                      </button>
                      
                      <button
                        className="ml-auto flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        <Camera className="h-4 w-4" />
                        Add Photo
                      </button>
                    </div>
                    
                    {/* Comments Section */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Comments
                      </label>
                      <textarea
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        rows={3}
                        placeholder="Add any comments or observations..."
                        defaultValue={statusMap.get(item.id)?.comments || ''}
                      />
                    </div>
                    
                    {/* Save/Cancel Buttons */}
                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        onClick={() => toggleSection(item.id)}
                        className="px-4 py-2 text-gray-700 hover:text-gray-900"
                      >
                        Cancel
                      </button>
                      <button
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Save Changes
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}