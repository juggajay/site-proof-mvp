'use client'

import { useState } from 'react'
import { LotWithDetails, ITPTemplate, ITPItem } from '@/types/database'
import { ClipboardList, Plus, AlertCircle } from 'lucide-react'
import { InteractiveInspectionForm } from './interactive-inspection-form'
import { CollapsibleInspectionForm } from './collapsible-inspection-form'
import { SimplifiedInspectionForm } from './simplified-inspection-form'
import { AssignITPModal } from '@/components/modals/assign-itp-modal'

interface MultiITPInspectionFormProps {
  lot: LotWithDetails
  onInspectionSaved: () => void
}

export function MultiITPInspectionForm({ lot, onInspectionSaved }: MultiITPInspectionFormProps) {
  const [activeTemplateId, setActiveTemplateId] = useState<string | number | null>(null)
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false)

  // Get assignments from the new system
  const assignments = lot.lot_itp_assignments || lot.lot_itp_templates || []
  const templates = lot.itp_templates || []
  
  // Map assignments to templates with their inspection data
  const templatesWithAssignments = assignments.map((assignment: any) => {
    const template = templates.find((t: any) => t.id === assignment.template_id || t.id === assignment.itp_template_id)
    return {
      ...template,
      assignment,
      assignmentId: assignment.id
    }
  }).filter(Boolean)
    
  console.log('📊 Templates analysis:', {
    hasITPTemplates: !!lot.itp_templates,
    itpTemplatesLength: lot.itp_templates?.length || 0,
    hasITPTemplate: !!lot.itp_template,
    finalTemplatesCount: templates.length,
    templates: templatesWithAssignments.map((t: any) => ({ 
      id: t?.id, 
      name: t?.name,
      assignmentId: t?.assignmentId,
      status: t?.assignment?.status,
      itemsCount: t?.itp_items?.length || 0,
      items: t?.itp_items?.map((item: any) => ({
        id: item.id,
        description: item.description
      }))
    })),
    assignments: assignments.length
  })
  
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
  if (!activeTemplateId && templatesWithAssignments.length > 0) {
    setActiveTemplateId(templatesWithAssignments[0].assignmentId)
  }

  const activeTemplateData = templatesWithAssignments.find((t: any) => t.assignmentId === activeTemplateId)

  const getTemplateStats = (assignmentId: string | number) => {
    const templateData = templatesWithAssignments.find((t: any) => t.assignmentId === assignmentId)
    if (!templateData || !templateData.itp_items) return { total: 0, completed: 0, passed: 0, failed: 0 }
    
    const items = templateData.itp_items || []
    const relevantRecords = lot.conformance_records.filter((r: any) => 
      items.some((item: any) => item.id === r.itp_item_id)
    )
    
    const total = items.length
    // Only count records with actual results (not pending)
    const completed = relevantRecords.filter((r: any) => 
      r.result_pass_fail === 'PASS' || 
      r.result_pass_fail === 'FAIL' || 
      r.result_pass_fail === 'N/A'
    ).length
    const passed = relevantRecords.filter((r: any) => r.result_pass_fail === 'PASS').length
    const failed = relevantRecords.filter((r: any) => r.result_pass_fail === 'FAIL').length
    
    return { total, completed, passed, failed }
  }

  const handleITPAssigned = () => {
    setIsAssignModalOpen(false)
    onInspectionSaved() // This will reload the lot data
  }

  if (templatesWithAssignments.length === 0) {
    return (
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">ITP Templates</h3>
        </div>
        <div className="text-center py-12">
          <ClipboardList className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-sm font-medium text-gray-900">No ITP Templates Assigned</h3>
          <p className="mt-2 text-sm text-gray-500">
            Assign an ITP template to begin quality inspections for this lot.
          </p>
          <div className="mt-6">
            <button
              onClick={() => setIsAssignModalOpen(true)}
              className="inline-flex items-center px-6 py-3 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 min-h-[44px] touch-manipulation"
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
          assignedTemplateIds={templatesWithAssignments.map((t: any) => t.id)}
        />
      </div>
    )
  }

  // Single template - show without tabs
  if (templatesWithAssignments.length === 1) {
    const templateData = templatesWithAssignments[0]
    console.log('🎨 Single template mode:', {
      templateId: templateData.id,
      assignmentId: templateData.assignmentId,
      templateName: templateData.name,
      status: templateData.assignment?.status,
      hasItems: !!templateData.itp_items,
      itemsLength: templateData.itp_items?.length,
      items: templateData.itp_items
    })
    
    const stats = getTemplateStats(templateData.assignmentId)
    const completionPercentage = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0

    return (
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Quality Inspection Checklist</h3>
              <p className="text-sm text-gray-500">{templateData.name}</p>
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
                className="inline-flex items-center px-4 py-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 min-h-[44px] touch-manipulation"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Template
              </button>
            </div>
          </div>
        </div>
        
        <div className="p-6">
          {(() => {
            // Extract only the ITPTemplate properties, excluding assignment data
            const { assignment, assignmentId, ...templateOnly } = templateData
            
            const transformedLot = {
              ...lot,
              itp_template: {
                ...templateOnly,
                itp_items: templateOnly.itp_items || []
              } as ITPTemplate & { itp_items: ITPItem[] },
              conformance_records: lot.conformance_records.filter((r: any) => 
                templateData.itp_items?.some((item: any) => item.id === r.itp_item_id) || false
              ),
              currentAssignment: assignment
            }
            console.log('🔄 Passing transformed lot to InteractiveInspectionForm:', {
              lotId: transformedLot.id,
              templateId: transformedLot.itp_template?.id,
              itemsCount: transformedLot.itp_template?.itp_items?.length,
              conformanceRecordsCount: transformedLot.conformance_records?.length
            })
            return (
              <SimplifiedInspectionForm
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
          assignedTemplateIds={templatesWithAssignments.map((t: any) => t.id)}
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
            className="inline-flex items-center px-4 py-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 min-h-[44px] touch-manipulation"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Template
          </button>
        </div>
      </div>
      
      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex overflow-x-auto">
          {templatesWithAssignments.map((template: any) => {
            const stats = getTemplateStats(template.assignmentId)
            const isActive = template.assignmentId === activeTemplateId
            const completionPercentage = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0
            
            return (
              <button
                key={template.assignmentId}
                onClick={() => setActiveTemplateId(template.assignmentId)}
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
      {activeTemplateData && (
        <div className="p-6">
          {(() => {
            // Extract only the ITPTemplate properties, excluding assignment data
            const { assignment, assignmentId, ...templateOnly } = activeTemplateData
            
            const transformedLot = {
              ...lot,
              itp_template: {
                ...templateOnly,
                itp_items: templateOnly.itp_items || []
              } as ITPTemplate & { itp_items: ITPItem[] },
              conformance_records: lot.conformance_records.filter((r: any) => 
                activeTemplateData.itp_items?.some((item: any) => item.id === r.itp_item_id) || false
              ),
              currentAssignment: assignment
            }
            
            return (
              <SimplifiedInspectionForm
                lot={transformedLot}
                onInspectionSaved={onInspectionSaved}
              />
            )
          })()}
        </div>
      )}
      
      <AssignITPModal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        onITPAssigned={handleITPAssigned}
        lotId={lot.id}
        assignedTemplateIds={templates.map(t => t.id)}
      />
    </div>
  )
}