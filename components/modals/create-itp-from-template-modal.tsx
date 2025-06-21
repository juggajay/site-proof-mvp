'use client'

import { useState, useEffect } from 'react'
import { getITPTemplatesAction, createITPFromTemplateAction } from '@/lib/actions'
import { ITPTemplate } from '@/types/database'
import { X, ClipboardList, CheckCircle2 } from 'lucide-react'

interface CreateITPFromTemplateModalProps {
  isOpen: boolean
  onClose: () => void
  onITPCreated: () => void
  projectId?: number | string
  lotId?: number | string
}

export function CreateITPFromTemplateModal({ 
  isOpen, 
  onClose, 
  onITPCreated, 
  projectId,
  lotId 
}: CreateITPFromTemplateModalProps) {
  const [templates, setTemplates] = useState<ITPTemplate[]>([])
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | string | null>(null)
  const [itpName, setItpName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      loadTemplates()
      setItpName('')
      setSelectedTemplateId(null)
      setError(null)
    }
  }, [isOpen])

  const loadTemplates = async () => {
    setIsLoadingTemplates(true)
    try {
      const result = await getITPTemplatesAction()
      if (result.success) {
        setTemplates(result.data || [])
      } else {
        setError(result.error || 'Failed to load ITP templates')
      }
    } catch (error) {
      setError('An unexpected error occurred')
    } finally {
      setIsLoadingTemplates(false)
    }
  }

  const handleCreate = async () => {
    if (!selectedTemplateId) {
      setError('Please select an ITP template')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      console.log('Creating ITP from template:', selectedTemplateId)
      const result = await createITPFromTemplateAction({
        template_id: selectedTemplateId,
        project_id: projectId,
        lot_id: lotId,
        name: itpName || undefined
      })
      
      if (result.success) {
        console.log('✅ ITP created successfully')
        onITPCreated()
        onClose()
      } else {
        console.error('❌ Failed to create ITP:', result.error)
        setError(result.error || 'Failed to create ITP')
      }
    } catch (error) {
      console.error('Unexpected error creating ITP:', error)
      setError('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  const selectedTemplate = templates.find(t => t.id === selectedTemplateId)

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
              <h3 className="text-lg font-medium text-gray-900">Create ITP from Template</h3>
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
                Select a template to create a new Inspection Test Plan (ITP) for this {lotId ? 'lot' : 'project'}.
              </p>
            </div>

            {/* ITP Name Input */}
            <div className="mb-4">
              <label htmlFor="itp-name" className="block text-sm font-medium text-gray-700 mb-1">
                ITP Name (Optional)
              </label>
              <input
                type="text"
                id="itp-name"
                value={itpName}
                onChange={(e) => setItpName(e.target.value)}
                placeholder={selectedTemplate ? `${selectedTemplate.name} - ${new Date().toLocaleDateString()}` : 'Enter a custom name or leave blank for auto-generated'}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Template Selection */}
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
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {templates.map((template) => (
                  <div
                    key={template.id}
                    className={`relative rounded-lg border p-4 cursor-pointer transition-colors ${
                      selectedTemplateId === template.id
                        ? 'border-blue-600 bg-blue-50 ring-1 ring-blue-600'
                        : 'border-gray-300 hover:bg-gray-50'
                    }`}
                    onClick={() => setSelectedTemplateId(template.id)}
                  >
                    <div className="flex items-start">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-medium text-gray-900">{template.name}</h4>
                          {selectedTemplateId === template.id && (
                            <CheckCircle2 className="h-5 w-5 text-blue-600" />
                          )}
                        </div>
                        {template.description && (
                          <p className="mt-1 text-sm text-gray-500">{template.description}</p>
                        )}
                        <div className="mt-2 flex items-center space-x-4">
                          {template.category && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              {template.category}
                            </span>
                          )}
                          <span className="text-xs text-gray-500">v{template.version}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              onClick={handleCreate}
              disabled={isLoading || !selectedTemplateId || templates.length === 0}
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Creating...' : 'Create ITP'}
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