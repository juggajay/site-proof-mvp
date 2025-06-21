'use client'

import { useState } from 'react'
import { LotWithDetails } from '@/types/database'
import { ClipboardList, Plus, AlertCircle } from 'lucide-react'
import { InteractiveInspectionForm } from './interactive-inspection-form'
import { CollapsibleInspectionForm } from './collapsible-inspection-form'
import { AssignITPModal } from '@/components/modals/assign-itp-modal'

interface MultiITPInspectionFormProps {
  lot: LotWithDetails
  onInspectionSaved: () => void
}

export function MultiITPInspectionForm({ lot, onInspectionSaved }: MultiITPInspectionFormProps) {
  const [activeTemplateId, setActiveTemplateId] = useState<string | number | null>(null)
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false)

  // For now, use the single template until we implement multiple templates
  const templates = lot.itp_template ? [lot.itp_template] : []
  
  console.log('🎨 MultiITPInspectionForm - lot data:', {
    lotId: lot.id,
    hasTemplate: !!lot.itp_template,
    templateName: lot.itp_template?.name,
    templateItems: lot.itp_template?.itp_items,
    itemsLength: lot.itp_template?.itp_items?.length
  })
  
  console.log('📊 MultiITPInspectionForm - Initial data:', {
    lotId: lot.id,
    hasTemplate: !!lot.itp_template,
    templateId: lot.itp_template?.id,
    itpItemsCount: lot.itp_template?.itp_items?.length,
    templatesCount: templates.length
  })
  
  // Set active template on mount
  if (!activeTemplateId && templates.length > 0) {
    setActiveTemplateId(templates[0].id)
  }

  const activeTemplate = templates.find(t => t.id === activeTemplateId)

  const getTemplateStats = (templateId: string | number) => {
    const template = templates.find(t => t.id === templateId)
    if (!template || !template.itp_items) return { total: 0, completed: 0, passed: 0, failed: 0 }
    
    const relevantRecords = lot.conformance_records.filter(r => 
      template.itp_items.some(item => item.id === r.itp_item_id)
    )
    
    const total = template.itp_items.length
    const completed = relevantRecords.length
    const passed = relevantRecords.filter(r => r.result_pass_fail === 'PASS').length
    const failed = relevantRecords.filter(r => r.result_pass_fail === 'FAIL').length
    
    return { total, completed, passed, failed }
  }

  const handleITPAssigned = () => {
    setIsAssignModalOpen(false)
    onInspectionSaved() // This will reload the lot data
  }

  if (templates.length === 0) {
    return (
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">ITP Templates</h3>
        </div>
        <div className="text-center py-12">
          <ClipboardList className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-sm font-medium text-gray-900">No ITP Templates Assigned</h3>
          <p className="mt-2 text-sm text-gray-500">
            Assign ITP templates to begin quality inspections for this lot.
          </p>
          <div className="mt-6">
            <button
              onClick={() => setIsAssignModalOpen(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Assign ITP Template
            </button>
          </div>
        </div>
        
        <AssignITPModal
          isOpen={isAssignModalOpen}
          onClose={() => setIsAssignModalOpen(false)}
          onITPAssigned={handleITPAssigned}
          lotId={lot.id}
        />
      </div>
    )
  }

  // Single template - show without tabs
  if (templates.length === 1) {
    console.log('🎨 Single template mode:', {
      templateId: templates[0].id,
      templateName: templates[0].name,
      hasItems: !!templates[0].itp_items,
      itemsLength: templates[0].itp_items?.length,
      items: templates[0].itp_items
    })
    
    const stats = getTemplateStats(templates[0].id)
    const completionPercentage = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0

    return (
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Quality Inspection Checklist</h3>
              <p className="text-sm text-gray-500">{templates[0].name}</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{completionPercentage}% Complete</p>
                <p className="text-xs text-gray-500">
                  {stats.completed} of {stats.total} items
                </p>
              </div>
              <button
                onClick={() => setIsAssignModalOpen(true)}
                className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Template
              </button>
            </div>
          </div>
        </div>
        
        <div className="p-6">
          {(() => {
            const transformedLot = {
              ...lot,
              itp_template: templates[0],
              conformance_records: lot.conformance_records.filter(r => 
                templates[0].itp_items.some(item => item.id === r.itp_item_id)
              )
            }
            console.log('🔄 Passing transformed lot to InteractiveInspectionForm:', {
              lotId: transformedLot.id,
              templateId: transformedLot.itp_template?.id,
              itemsCount: transformedLot.itp_template?.itp_items?.length,
              conformanceRecordsCount: transformedLot.conformance_records?.length
            })
            return (
              <CollapsibleInspectionForm
                lot={transformedLot}
                onInspectionSaved={onInspectionSaved}
              />
            )
          })()}
        </div>
        
        <AssignITPModal
          isOpen={isAssignModalOpen}
          onClose={() => setIsAssignModalOpen(false)}
          onITPAssigned={handleITPAssigned}
          lotId={lot.id}
          currentITPTemplateId={templates[0].id}
        />
      </div>
    )
  }

  // Multiple templates - show with tabs
  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">Quality Inspection Checklists</h3>
          <button
            onClick={() => setIsAssignModalOpen(true)}
            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Template
          </button>
        </div>
      </div>
      
      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex overflow-x-auto">
          {templates.map((template) => {
            const stats = getTemplateStats(template.id)
            const isActive = template.id === activeTemplateId
            const completionPercentage = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0
            
            return (
              <button
                key={template.id}
                onClick={() => setActiveTemplateId(template.id)}
                className={`
                  py-3 px-6 border-b-2 font-medium text-sm whitespace-nowrap
                  ${isActive 
                    ? 'border-blue-500 text-blue-600' 
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                <div className="flex items-center gap-3">
                  <span>{template.name}</span>
                  <div className="flex items-center gap-2">
                    {stats.failed > 0 && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        {stats.failed} Failed
                      </span>
                    )}
                    <span className={`
                      inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium
                      ${completionPercentage === 100 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}
                    `}>
                      {completionPercentage}%
                    </span>
                  </div>
                </div>
              </button>
            )
          })}
        </nav>
      </div>
      
      {/* Active Template Content */}
      {activeTemplate && (
        <div className="p-6">
          <CollapsibleInspectionForm
            lot={{
              ...lot,
              itp_template: activeTemplate,
              conformance_records: lot.conformance_records.filter(r => 
                activeTemplate.itp_items.some(item => item.id === r.itp_item_id)
              )
            }}
            onInspectionSaved={onInspectionSaved}
          />
        </div>
      )}
      
      <AssignITPModal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        onITPAssigned={handleITPAssigned}
        lotId={lot.id}
      />
    </div>
  )
}