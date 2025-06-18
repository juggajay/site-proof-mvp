'use client'

import { useState, useEffect } from 'react'
import { getITPTemplatesAction, assignITPToLotAction } from '@/lib/actions'
import { ITPTemplate } from '@/types/database'
import { X, ClipboardList, CheckCircle2 } from 'lucide-react'

interface AssignITPModalProps {
  isOpen: boolean
  onClose: () => void
  onITPAssigned: () => void
  lotId: number
  currentITPTemplateId?: number
}

export function AssignITPModal({ isOpen, onClose, onITPAssigned, lotId, currentITPTemplateId }: AssignITPModalProps) {
  const [templates, setTemplates] = useState<ITPTemplate[]>([])
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(currentITPTemplateId || null)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      loadTemplates()
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

  const handleAssign = async () => {
    if (!selectedTemplateId) {
      setError('Please select an ITP template')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const result = await assignITPToLotAction(lotId, selectedTemplateId)
      if (result.success) {
        onITPAssigned()
      } else {
        setError(result.error || 'Failed to assign ITP template')
      }
    } catch (error) {
      setError('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
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
                Select an Inspection Test Plan (ITP) template to assign to this lot. This will define the quality checklist items for inspection.
              </p>
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
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {templates.map((template) => (
                  <div
                    key={template.id}
                    className={`relative cursor-pointer rounded-lg border p-4 hover:bg-gray-50 ${
                      selectedTemplateId === template.id
                        ? 'border-blue-600 bg-blue-50 ring-1 ring-blue-600'
                        : 'border-gray-300'
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
                          {currentITPTemplateId === template.id && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Current
                            </span>
                          )}
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
              onClick={handleAssign}
              disabled={isLoading || !selectedTemplateId || templates.length === 0}
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Assigning...' : 'Assign Template'}
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