'use client'

import { useState, useEffect } from 'react'
import { getITPTemplatesAction, assignMultipleITPsToLotAction } from '@/lib/actions'
import { getITPTemplatesViaAPI } from '@/lib/actions-client-fix'
import { ITPTemplate } from '@/types/database'
import { X, ClipboardList } from 'lucide-react'
import { ITPTemplateCard } from '@/components/ui/itp-template-card'

interface AssignITPModalProps {
  isOpen: boolean
  onClose: () => void
  onITPAssigned: () => void
  lotId: number | string
  assignedTemplateIds?: (number | string)[]
}

export function AssignITPModal({ isOpen, onClose, onITPAssigned, lotId, assignedTemplateIds = [] }: AssignITPModalProps) {
  const [templates, setTemplates] = useState<ITPTemplate[]>([])
  const [selectedTemplateIds, setSelectedTemplateIds] = useState<(number | string)[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    console.log('🚀 AssignITPModal useEffect triggered, isOpen:', isOpen)
    if (isOpen) {
      console.log('📂 Modal is open, loading templates...')
      loadTemplates()
    }
  }, [isOpen])

  const loadTemplates = async () => {
    console.log('🔄 Starting to load ITP templates...')
    setIsLoadingTemplates(true)
    try {
      console.log('📡 Trying getITPTemplatesAction first...')
      let result = await getITPTemplatesAction()
      console.log('📊 getITPTemplatesAction result:', result)
      
      // If no templates found, try the API endpoint
      if (result.success && (!result.data || result.data.length === 0)) {
        console.log('🔄 No templates from action, trying API endpoint...')
        result = await getITPTemplatesViaAPI()
        console.log('🌐 API endpoint result:', result)
      }
      
      if (result.success) {
        const templateData = result.data || []
        console.log('✅ Templates loaded successfully:', templateData)
        console.log('📋 Template count:', templateData.length)
        console.log('🔍 First template:', templateData[0])
        console.log('📦 Full result object:', JSON.stringify(result, null, 2))
        setTemplates(templateData)
      } else {
        console.error('❌ Failed to load templates:', result.error)
        setError(result.error || 'Failed to load ITP templates')
      }
    } catch (error) {
      console.error('💥 Unexpected error loading templates:', error)
      setError('An unexpected error occurred')
    } finally {
      setIsLoadingTemplates(false)
    }
  }

  const handleAssign = async () => {
    if (selectedTemplateIds.length === 0) {
      setError('Please select at least one ITP template')
      return
    }

    setIsLoading(true)
    setError(null)

    // Optimistically update the UI immediately
    const selectedTemplates = templates.filter(t => selectedTemplateIds.includes(t.id))
    
    // Close modal and trigger UI update immediately (optimistic update)
    onITPAssigned()
    
    try {
      console.log('Assigning ITPs:', selectedTemplateIds, 'to lot:', lotId)
      const result = await assignMultipleITPsToLotAction(lotId, selectedTemplateIds)
      console.log('Assignment result:', result)
      
      if (!result.success) {
        // If assignment failed, we need to revert the optimistic update
        console.error('❌ Failed to assign ITPs:', result.error)
        const errorMessage = result.error || 'Failed to assign ITP templates - unknown error'
        
        // Reopen the modal with error message
        setError(errorMessage)
        setIsLoading(false)
        // Note: Parent component should handle reverting the optimistic update
      } else {
        console.log('✅ ITPs assigned successfully')
        // Success - optimistic update was correct
      }
    } catch (error) {
      console.error('Unexpected error assigning ITPs:', error)
      setError('An unexpected error occurred')
      setIsLoading(false)
      // Note: Parent component should handle reverting the optimistic update
    }
  }

  const toggleTemplateSelection = (templateId: number | string) => {
    setSelectedTemplateIds(prev => {
      if (prev.includes(templateId)) {
        return prev.filter(id => id !== templateId)
      } else {
        return [...prev, templateId]
      }
    })
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>

        {/* Center modal */}
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Assign ITP Template</h3>
              <button
                type="button"
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <div className="mb-4">
              <p className="text-sm text-gray-600">
                Select one or more Inspection Test Plan (ITP) templates to assign to this lot. You can select multiple templates.
              </p>
              {selectedTemplateIds.length > 0 && (
                <p className="text-sm text-blue-600 mt-2">
                  {selectedTemplateIds.length} template{selectedTemplateIds.length !== 1 ? 's' : ''} selected
                </p>
              )}
            </div>

            {isLoadingTemplates ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading templates...</p>
              </div>
            ) : templates.length === 0 ? (
              <div className="text-center py-8">
                <ClipboardList className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-4 text-sm font-medium text-gray-900">No ITP Templates Found</h3>
                <p className="mt-2 text-sm text-gray-500">
                  Contact your administrator to create ITP templates.
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
                {templates.map((template) => (
                  <ITPTemplateCard
                    key={template.id}
                    template={template}
                    isAssigned={assignedTemplateIds.includes(template.id)}
                    isSelected={selectedTemplateIds.includes(template.id)}
                    onClick={() => toggleTemplateSelection(template.id)}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              onClick={handleAssign}
              disabled={isLoading || selectedTemplateIds.length === 0 || templates.length === 0}
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Assigning...' : 
               selectedTemplateIds.length === 0 ? 'Select Templates' :
               `Assign ${selectedTemplateIds.length} Template${selectedTemplateIds.length !== 1 ? 's' : ''}`}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}