'use client'

import { useState } from 'react'
import { saveConformanceRecordAction } from '@/lib/actions'
import { LotWithDetails, ITPItem, ConformanceRecord, UpdateConformanceRequest } from '@/types/database'
import { CheckCircle2, XCircle, AlertTriangle, Save, Camera, FileText } from 'lucide-react'

interface InspectionChecklistFormProps {
  lot: LotWithDetails
  onInspectionSaved: () => void
}

interface InspectionFormData {
  [itemId: string]: {
    result_pass_fail?: 'PASS' | 'FAIL' | 'N/A'
    result_numeric?: string
    result_text?: string
    comments?: string
    corrective_action?: string
  }
}

export function InspectionChecklistForm({ lot, onInspectionSaved }: InspectionChecklistFormProps) {
  const [formData, setFormData] = useState<InspectionFormData>({})
  const [savingItems, setSavingItems] = useState<Set<string | number>>(new Set())
  const [errors, setErrors] = useState<{[itemId: string]: string}>({})

  if (!lot.itp_template?.itp_items) {
    return null
  }

  const getExistingRecord = (itemId: string | number): ConformanceRecord | undefined => {
    return lot.conformance_records.find(r => r.itp_item_id === itemId)
  }

  const getItemValue = (itemId: string | number, field: keyof InspectionFormData[string]) => {
    const existingRecord = getExistingRecord(itemId)
    const formValue = formData[String(itemId)]?.[field]
    
    if (formValue !== undefined) return formValue
    if (existingRecord) {
      switch (field) {
        case 'result_pass_fail': return existingRecord.result_pass_fail
        case 'result_numeric': return existingRecord.result_numeric?.toString()
        case 'result_text': return existingRecord.result_text
        case 'comments': return existingRecord.comments
        case 'corrective_action': return existingRecord.corrective_action
      }
    }
    return ''
  }

  const updateFormData = (itemId: string | number, field: keyof InspectionFormData[string], value: string) => {
    setFormData(prev => ({
      ...prev,
      [String(itemId)]: {
        ...prev[String(itemId)],
        [field]: value
      }
    }))
    
    // Clear any existing error for this item
    if (errors[String(itemId)]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[String(itemId)]
        return newErrors
      })
    }
  }

  const saveInspectionItem = async (item: ITPItem) => {
    const itemData = formData[String(item.id)]
    if (!itemData) return

    setSavingItems(prev => new Set(prev).add(item.id))
    setErrors(prev => {
      const newErrors = { ...prev }
      delete newErrors[String(item.id)]
      return newErrors
    })

    try {
      const requestData: UpdateConformanceRequest = {
        result_pass_fail: itemData.result_pass_fail,
        result_numeric: itemData.result_numeric ? parseFloat(itemData.result_numeric) : undefined,
        result_text: itemData.result_text,
        comments: itemData.comments,
        corrective_action: itemData.corrective_action
      }

      const result = await saveConformanceRecordAction(lot.id, item.id, requestData)
      
      if (result.success) {
        // Clear form data for this item since it's now saved
        setFormData(prev => {
          const newData = { ...prev }
          delete newData[String(item.id)]
          return newData
        })
        onInspectionSaved()
      } else {
        setErrors(prev => ({
          ...prev,
          [String(item.id)]: result.error || 'Failed to save inspection'
        }))
      }
    } catch (error) {
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

  const getItemStatus = (item: ITPItem) => {
    const existingRecord = getExistingRecord(item.id)
    const hasFormChanges = formData[String(item.id)] && Object.values(formData[String(item.id)]).some(v => v !== '' && v !== undefined)
    
    if (hasFormChanges) return 'modified'
    if (existingRecord) {
      if (existingRecord.result_pass_fail === 'PASS') return 'passed'
      if (existingRecord.result_pass_fail === 'FAIL') return 'failed'
      return 'completed'
    }
    return 'pending'
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed': return <CheckCircle2 className="h-5 w-5 text-green-600" />
      case 'failed': return <XCircle className="h-5 w-5 text-red-600" />
      case 'modified': return <AlertTriangle className="h-5 w-5 text-yellow-600" />
      case 'completed': return <CheckCircle2 className="h-5 w-5 text-blue-600" />
      default: return <div className="h-5 w-5 border-2 border-gray-300 rounded-full" />
    }
  }

  const hasUnsavedChanges = (itemId: string | number) => {
    return formData[String(itemId)] && Object.values(formData[String(itemId)]).some(v => v !== '' && v !== undefined)
  }

  return (
    <div className="divide-y divide-gray-200">
      {lot.itp_template.itp_items.map((item) => {
        const status = getItemStatus(item)
        const existingRecord = getExistingRecord(item.id)
        const isModified = hasUnsavedChanges(item.id)
        const isSaving = savingItems.has(item.id)
        const error = errors[String(item.id)]

        return (
          <div key={item.id} className="p-6 hover:bg-gray-50 transition-colors">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 mt-1">
                {getStatusIcon(status)}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      {item.item_number && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          {item.item_number}
                        </span>
                      )}
                      {item.is_mandatory && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          Required
                        </span>
                      )}
                    </div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2">{item.description}</h4>
                    
                    {/* Visual hint for interaction */}
                    {!getExistingRecord(item.id) && !hasUnsavedChanges(item.id) && (
                      <p className="text-xs text-blue-600 mb-2 animate-pulse">
                        👇 Select a result below to inspect this item
                      </p>
                    )}
                    
                    {item.specification_reference && (
                      <p className="text-xs text-gray-500 mb-2">
                        <span className="font-medium">Reference:</span> {item.specification_reference}
                      </p>
                    )}
                    
                    {item.acceptance_criteria && (
                      <p className="text-xs text-gray-500 mb-4">
                        <span className="font-medium">Acceptance Criteria:</span> {item.acceptance_criteria}
                      </p>
                    )}
                  </div>
                  
                  {(isModified || existingRecord) && (
                    <button
                      onClick={() => saveInspectionItem(item)}
                      disabled={!isModified || isSaving}
                      className="ml-4 inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSaving ? (
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1" />
                      ) : (
                        <Save className="h-3 w-3 mr-1" />
                      )}
                      {isSaving ? 'Saving...' : 'Save'}
                    </button>
                  )}
                </div>

                {error && (
                  <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">
                    {error}
                  </div>
                )}

                {/* Inspection Input Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Pass/Fail Result */}
                  {(item.item_number === 'PASS_FAIL' || item.item_number === 'PASS_FAIL') && (
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Result *
                      </label>
                      <select
                        value={getItemValue(item.id, 'result_pass_fail') || ''}
                        onChange={(e) => {
                          updateFormData(item.id, 'result_pass_fail', e.target.value as 'PASS' | 'FAIL' | 'N/A')
                          // Auto-save after 1 second delay
                          setTimeout(() => {
                            if (e.target.value) {
                              saveInspectionItem(item)
                            }
                          }, 1000)
                        }}
                        className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm cursor-pointer hover:border-blue-400 transition-colors"
                      >
                        <option value="">Select result</option>
                        <option value="PASS">PASS</option>
                        <option value="FAIL">FAIL</option>
                        <option value="N/A">N/A</option>
                      </select>
                    </div>
                  )}

                  {/* Numeric Result */}
                  {item.item_number === 'NUMERIC' && (
                    <>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Measured Value
                        </label>
                        <input
                          type="number"
                          step="0.001"
                          value={getItemValue(item.id, 'result_numeric') || ''}
                          onChange={(e) => updateFormData(item.id, 'result_numeric', e.target.value)}
                          className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                          placeholder="Enter measurement"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Pass/Fail *
                        </label>
                        <select
                          value={getItemValue(item.id, 'result_pass_fail') || ''}
                          onChange={(e) => {
                            updateFormData(item.id, 'result_pass_fail', e.target.value as 'PASS' | 'FAIL' | 'N/A')
                            // Auto-save after 1 second delay
                            setTimeout(() => {
                              if (e.target.value) {
                                saveInspectionItem(item)
                              }
                            }, 1000)
                          }}
                          className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm cursor-pointer hover:border-blue-400 transition-colors"
                        >
                          <option value="">Select result</option>
                          <option value="PASS">PASS</option>
                          <option value="FAIL">FAIL</option>
                          <option value="N/A">N/A</option>
                        </select>
                      </div>
                    </>
                  )}

                  {/* Text Result */}
                  {item.item_number === 'TEXT_INPUT' && (
                    <div className="md:col-span-2">
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Inspection Notes
                      </label>
                      <textarea
                        rows={3}
                        value={getItemValue(item.id, 'result_text') || ''}
                        onChange={(e) => updateFormData(item.id, 'result_text', e.target.value)}
                        className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                        placeholder="Enter detailed inspection notes..."
                      />
                    </div>
                  )}
                </div>

                {/* Comments */}
                <div className="mt-4">
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Comments
                  </label>
                  <textarea
                    rows={2}
                    value={getItemValue(item.id, 'comments') || ''}
                    onChange={(e) => updateFormData(item.id, 'comments', e.target.value)}
                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                    placeholder="Additional comments or observations..."
                  />
                </div>

                {/* Corrective Action (shown when failed) */}
                {getItemValue(item.id, 'result_pass_fail') === 'FAIL' && (
                  <div className="mt-4">
                    <label className="block text-xs font-medium text-red-700 mb-1">
                      Corrective Action Required *
                    </label>
                    <textarea
                      rows={2}
                      value={getItemValue(item.id, 'corrective_action') || ''}
                      onChange={(e) => updateFormData(item.id, 'corrective_action', e.target.value)}
                      className="block w-full border-red-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 text-sm"
                      placeholder="Describe corrective action to be taken..."
                    />
                  </div>
                )}

                {/* Photo Upload Placeholder */}
                {item.item_number === 'PASS_FAIL' && (
                  <div className="mt-4 p-4 border-2 border-dashed border-gray-300 rounded-md">
                    <div className="text-center">
                      <Camera className="mx-auto h-8 w-8 text-gray-400" />
                      <p className="mt-2 text-sm text-gray-500">
                        Photo upload functionality will be implemented
                      </p>
                      <p className="text-xs text-gray-400">
                        Drag and drop photos or click to browse
                      </p>
                    </div>
                  </div>
                )}

                {/* Existing Record Info */}
                {existingRecord && !isModified && (
                  <div className="mt-4 bg-gray-50 rounded-md p-3">
                    <div className="flex items-center justify-between text-xs text-gray-600">
                      <span>
                        Inspected on {new Date(existingRecord.inspection_date || existingRecord.created_at).toLocaleString()}
                      </span>
                      {existingRecord.is_non_conformance && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-red-700 bg-red-100">
                          Non-conformance
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}