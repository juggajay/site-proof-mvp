'use client'

import { useState } from 'react'
import { saveConformanceRecordAction } from '@/lib/actions'
import { LotWithDetails, ITPItem, ConformanceRecord, UpdateConformanceRequest } from '@/types/database'
import { CheckCircle2, XCircle, AlertTriangle, Camera, Loader2 } from 'lucide-react'

interface InteractiveInspectionFormProps {
  lot: LotWithDetails
  onInspectionSaved: () => void
}

export function InteractiveInspectionForm({ lot, onInspectionSaved }: InteractiveInspectionFormProps) {
  const [savingItems, setSavingItems] = useState<Set<string | number>>(new Set())
  const [expandedItems, setExpandedItems] = useState<Set<string | number>>(new Set())
  const [errors, setErrors] = useState<{[itemId: string]: string}>({})

  console.log('🔍 InteractiveInspectionForm rendered with:', {
    lotId: lot.id,
    templateId: lot.itp_template?.id,
    itemsCount: lot.itp_template?.itp_items?.length,
    conformanceRecordsCount: lot.conformance_records?.length
  })

  if (!lot.itp_template?.itp_items) {
    console.warn('⚠️ No ITP template or items found')
    return null
  }

  const getExistingRecord = (itemId: string | number): ConformanceRecord | undefined => {
    return lot.conformance_records.find(r => r.itp_item_id === itemId)
  }

  const handleQuickPass = async (item: ITPItem) => {
    console.log('🟢 handleQuickPass clicked for item:', item.id, item.description)
    await saveInspection(item, 'PASS')
  }

  const handleQuickFail = async (item: ITPItem) => {
    console.log('🔴 handleQuickFail clicked for item:', item.id, item.description)
    await saveInspection(item, 'FAIL')
  }

  const handleQuickNA = async (item: ITPItem) => {
    console.log('⚪ handleQuickNA clicked for item:', item.id, item.description)
    await saveInspection(item, 'N/A')
  }

  const saveInspection = async (item: ITPItem, result: 'PASS' | 'FAIL' | 'N/A', additionalData?: Partial<UpdateConformanceRequest>) => {
    console.log('📝 saveInspection called with:', {
      itemId: item.id,
      lotId: lot.id,
      result,
      additionalData
    })
    
    setSavingItems(prev => new Set(prev).add(item.id))
    setErrors(prev => {
      const newErrors = { ...prev }
      delete newErrors[String(item.id)]
      return newErrors
    })

    try {
      const requestData: UpdateConformanceRequest = {
        result_pass_fail: result,
        ...additionalData
      }
      
      console.log('📤 Calling saveConformanceRecordAction with:', {
        lotId: lot.id,
        itemId: item.id,
        requestData
      })

      const apiResult = await saveConformanceRecordAction(lot.id, item.id, requestData)
      
      console.log('📥 saveConformanceRecordAction result:', apiResult)
      
      if (apiResult.success) {
        console.log('✅ Inspection saved successfully, calling onInspectionSaved')
        onInspectionSaved()
      } else {
        console.error('❌ Failed to save inspection:', apiResult.error)
        setErrors(prev => ({
          ...prev,
          [String(item.id)]: apiResult.error || 'Failed to save inspection'
        }))
      }
    } catch (error) {
      console.error('💥 Unexpected error in saveInspection:', error)
      setErrors(prev => ({
        ...prev,
        [String(item.id)]: 'An unexpected error occurred'
      }))
    } finally {
      setSavingItems(prev => {
        const newSet = new Set(prev)
        newSet.delete(item.id)
        return newSet
      })
    }
  }

  const toggleExpanded = (itemId: string | number) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev)
      if (newSet.has(itemId)) {
        newSet.delete(itemId)
      } else {
        newSet.add(itemId)
      }
      return newSet
    })
  }

  const getItemStatus = (item: ITPItem) => {
    const existingRecord = getExistingRecord(item.id)
    if (!existingRecord) return 'pending'
    
    if (existingRecord.result_pass_fail === 'PASS') return 'passed'
    if (existingRecord.result_pass_fail === 'FAIL') return 'failed'
    if (existingRecord.result_pass_fail === 'N/A') return 'na'
    return 'pending'
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed': return <CheckCircle2 className="h-6 w-6 text-green-600" />
      case 'failed': return <XCircle className="h-6 w-6 text-red-600" />
      case 'na': return <div className="h-6 w-6 border-2 border-gray-400 rounded-full flex items-center justify-center text-xs text-gray-500">N/A</div>
      default: return <div className="h-6 w-6 border-2 border-gray-300 rounded-full" />
    }
  }

  console.log('🏗️ About to render items. Total items:', lot.itp_template.itp_items.length)
  console.log('🏗️ Items array:', lot.itp_template.itp_items)
  
  return (
    <div className="space-y-2">
      {lot.itp_template.itp_items.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">No inspection items found in this template.</p>
        </div>
      ) : (
        lot.itp_template.itp_items.map((item) => {
        const status = getItemStatus(item)
        const existingRecord = getExistingRecord(item.id)
        const isSaving = savingItems.has(item.id)
        const isExpanded = expandedItems.has(item.id)
        const error = errors[String(item.id)]
        
        console.log('🔧 Rendering item:', {
          itemId: item.id,
          description: item.description,
          status,
          isSaving,
          hasExistingRecord: !!existingRecord
        })

        return (
          <div 
            key={item.id} 
            className={`
              border rounded-lg transition-all duration-200
              ${status === 'pending' ? 'border-gray-300 hover:border-blue-400' : ''}
              ${status === 'passed' ? 'border-green-500 bg-green-50' : ''}
              ${status === 'failed' ? 'border-red-500 bg-red-50' : ''}
              ${status === 'na' ? 'border-gray-400 bg-gray-50' : ''}
            `}
          >
            <div className="p-4">
              <div className="flex items-start gap-4">
                {/* Status Icon */}
                <div className="flex-shrink-0 mt-1">
                  {isSaving ? (
                    <Loader2 className="h-6 w-6 text-blue-600 animate-spin" />
                  ) : (
                    getStatusIcon(status)
                  )}
                </div>
                
                {/* Main Content */}
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {item.item_number && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                            {item.item_number}
                          </span>
                        )}
                        {item.is_mandatory && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                            Required
                          </span>
                        )}
                      </div>
                      
                      <h4 
                        className="text-sm font-medium text-gray-900 cursor-pointer hover:text-blue-600"
                        onClick={(e) => {
                          e.stopPropagation()
                          console.log('📃 Item description clicked:', item.id)
                          toggleExpanded(item.id)
                        }}
                      >
                        {item.description}
                      </h4>
                      
                      {item.specification_reference && (
                        <p className="text-xs text-gray-500 mt-1">
                          <span className="font-medium">Reference:</span> {item.specification_reference}
                        </p>
                      )}
                    </div>
                    
                    {/* Quick Action Buttons */}
                    {(() => {
                      console.log('🎯 Button visibility check:', {
                        itemId: item.id,
                        status,
                        isPending: status === 'pending',
                        isSaving,
                        shouldShowButtons: status === 'pending' && !isSaving
                      })
                      return null
                    })()}
                    {status === 'pending' && !isSaving && (
                      <div className="flex items-center gap-2 ml-4">
                        <button
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            console.log('✅ Pass button clicked for item:', item.id)
                            handleQuickPass(item)
                          }}
                          className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors"
                          title="Pass"
                          type="button"
                        >
                          <CheckCircle2 className="h-5 w-5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            console.log('❌ Fail button clicked for item:', item.id)
                            handleQuickFail(item)
                          }}
                          className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                          title="Fail"
                          type="button"
                        >
                          <XCircle className="h-5 w-5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            console.log('⭕ N/A button clicked for item:', item.id)
                            handleQuickNA(item)
                          }}
                          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Not Applicable"
                          type="button"
                        >
                          <div className="h-5 w-5 border-2 border-current rounded-full flex items-center justify-center text-xs">
                            N/A
                          </div>
                        </button>
                      </div>
                    )}
                    
                    {/* Status Badge for Completed Items */}
                    {status !== 'pending' && !isSaving && (
                      <div className="flex items-center gap-2 ml-4">
                        <span className={`
                          inline-flex items-center px-3 py-1 rounded-full text-xs font-medium
                          ${status === 'passed' ? 'bg-green-100 text-green-800' : ''}
                          ${status === 'failed' ? 'bg-red-100 text-red-800' : ''}
                          ${status === 'na' ? 'bg-gray-100 text-gray-800' : ''}
                        `}>
                          {status === 'passed' && 'Passed'}
                          {status === 'failed' && 'Failed'}
                          {status === 'na' && 'N/A'}
                        </span>
                        <button
                          onClick={() => toggleExpanded(item.id)}
                          className="text-sm text-blue-600 hover:text-blue-700"
                        >
                          Edit
                        </button>
                      </div>
                    )}
                  </div>
                  
                  {/* Error Message */}
                  {error && (
                    <div className="mt-2 text-sm text-red-600">
                      {error}
                    </div>
                  )}
                  
                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="mt-4 space-y-3 border-t pt-3">
                      {item.acceptance_criteria && (
                        <div>
                          <p className="text-xs font-medium text-gray-700">Acceptance Criteria:</p>
                          <p className="text-sm text-gray-600 mt-1">{item.acceptance_criteria}</p>
                        </div>
                      )}
                      
                      {/* Comments Input */}
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Comments
                        </label>
                        <textarea
                          rows={2}
                          defaultValue={existingRecord?.comments || ''}
                          className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                          placeholder="Add any additional comments..."
                          onBlur={(e) => {
                            if (existingRecord && e.target.value !== existingRecord.comments) {
                              saveInspection(item, existingRecord.result_pass_fail || 'PASS', {
                                comments: e.target.value
                              })
                            }
                          }}
                        />
                      </div>
                      
                      {/* Photo Upload for Photo Required Items */}
                      {item.item_type === 'photo_required' && (
                        <div className="p-3 border-2 border-dashed border-gray-300 rounded-md">
                          <div className="text-center">
                            <Camera className="mx-auto h-8 w-8 text-gray-400" />
                            <p className="mt-2 text-sm text-gray-500">
                              Photo upload required
                            </p>
                            <button className="mt-2 text-sm text-blue-600 hover:text-blue-700">
                              Upload Photo
                            </button>
                          </div>
                        </div>
                      )}
                      
                      {/* Update Result Buttons */}
                      {existingRecord && (
                        <div className="flex items-center gap-2 pt-2">
                          <span className="text-xs text-gray-500">Change result:</span>
                          <button
                            onClick={() => saveInspection(item, 'PASS')}
                            disabled={isSaving || existingRecord.result_pass_fail === 'PASS'}
                            className={`px-3 py-1 text-xs rounded-md transition-colors ${
                              existingRecord.result_pass_fail === 'PASS'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-600 hover:bg-green-100 hover:text-green-800'
                            }`}
                          >
                            Pass
                          </button>
                          <button
                            onClick={() => saveInspection(item, 'FAIL')}
                            disabled={isSaving || existingRecord.result_pass_fail === 'FAIL'}
                            className={`px-3 py-1 text-xs rounded-md transition-colors ${
                              existingRecord.result_pass_fail === 'FAIL'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-gray-100 text-gray-600 hover:bg-red-100 hover:text-red-800'
                            }`}
                          >
                            Fail
                          </button>
                          <button
                            onClick={() => saveInspection(item, 'N/A')}
                            disabled={isSaving || existingRecord.result_pass_fail === 'N/A'}
                            className={`px-3 py-1 text-xs rounded-md transition-colors ${
                              existingRecord.result_pass_fail === 'N/A'
                                ? 'bg-gray-200 text-gray-800'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-800'
                            }`}
                          >
                            N/A
                          </button>
                        </div>
                      )}
                      
                      {/* Last Inspection Info */}
                      {existingRecord && (
                        <div className="text-xs text-gray-500 pt-2 border-t">
                          Inspected on {new Date(existingRecord.inspection_date || existingRecord.created_at).toLocaleString()}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )
      })
      )}
    </div>
  )
}