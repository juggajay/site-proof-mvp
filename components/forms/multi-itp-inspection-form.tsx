'use client'

import { useState, useEffect } from 'react'
import { LotWithDetails, ITPTemplate, ITPItem } from '@/types/database'
import { ClipboardList, Plus, AlertCircle, X } from 'lucide-react'
import { InteractiveInspectionForm } from './interactive-inspection-form'
import { CollapsibleInspectionForm } from './collapsible-inspection-form'
import { SimplifiedInspectionForm } from './simplified-inspection-form'
import { AssignITPModal } from '@/components/modals/assign-itp-modal'
import { DeleteConfirmationDialog } from '@/components/ui/delete-confirmation-dialog'
import { removeITPAssignmentAction } from '@/lib/actions'
import toast from 'react-hot-toast'

interface MultiITPInspectionFormProps {
  lot: LotWithDetails
  onInspectionSaved: () => void
}

export function MultiITPInspectionForm({ lot, onInspectionSaved }: MultiITPInspectionFormProps) {
  
  const [activeTemplateId, setActiveTemplateId] = useState<string | number | null>(null)
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false)
  const [optimisticTemplates, setOptimisticTemplates] = useState<ITPTemplate[]>([])
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean
    templateId: string | number | null
    templateName: string
  }>({
    isOpen: false,
    templateId: null,
    templateName: ''
  })
  const [isDeleting, setIsDeleting] = useState(false)
  

  // Get assignments from the new system
  const assignments = lot.lot_itp_assignments || lot.lot_itp_templates || []
  const templates = lot.itp_templates || []
  
  // Map assignments to templates with their inspection data
  const templatesWithAssignments = assignments.map((assignment: any) => {
    const template = templates.find((t: any) => t.id === assignment.template_id || t.id === assignment.itp_template_id)
    if (!template) {
      return null
    }
    return template ? {
      ...template,
      assignment,
      assignmentId: assignment.id
    } : null
  }).filter((item): item is NonNullable<typeof item> => item !== null)
  
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
    // Immediately refresh data without delay - optimistic update already shows the change
    onInspectionSaved()
  }

  const handleDeleteClick = (template: any) => {
    const templateIdToDelete = template.id || template.template_id
    setDeleteDialog({
      isOpen: true,
      templateId: templateIdToDelete,
      templateName: template.name
    })
  }

  const handleDeleteConfirm = async () => {
    if (!deleteDialog.templateId) return

    setIsDeleting(true)
    try {
      const result = await removeITPAssignmentAction(lot.id, deleteDialog.templateId)
      
      if (result.success) {
        toast.success('ITP assignment removed successfully')
        setDeleteDialog({ isOpen: false, templateId: null, templateName: '' })
        onInspectionSaved()
      } else {
        toast.error(result.error || 'Failed to remove ITP assignment')
      }
    } catch (error) {
      toast.error('Failed to remove ITP assignment')
    } finally {
      setIsDeleting(false)
    }
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
                onClick={() => handleDeleteClick(templateData)}
                className="inline-flex items-center px-3 py-2 border border-red-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-white hover:bg-red-50 min-h-[44px] touch-manipulation"
                title="Remove ITP assignment"
                type="button"
              >
                <X className="h-4 w-4 mr-1" />
                <span className="text-xs">Remove</span>
              </button>
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
        
        <DeleteConfirmationDialog
          isOpen={deleteDialog.isOpen}
          onClose={() => setDeleteDialog({ isOpen: false, templateId: null, templateName: '' })}
          onConfirm={handleDeleteConfirm}
          title="Remove ITP Assignment"
          message="Are you sure you want to remove this ITP template from the lot? All inspection data for this template will be removed."
          itemName={deleteDialog.templateName}
          isDeleting={isDeleting}
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
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteClick(template)
                      }}
                      className="ml-2 text-gray-400 hover:text-red-600 transition-colors"
                      title="Remove ITP assignment"
                    >
                      <X className="h-4 w-4" />
                    </button>
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
      
      <DeleteConfirmationDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false, templateId: null, templateName: '' })}
        onConfirm={handleDeleteConfirm}
        title="Remove ITP Assignment"
        message="Are you sure you want to remove this ITP template from the lot? All inspection data for this template will be removed."
        itemName={deleteDialog.templateName}
        isDeleting={isDeleting}
      />
    </div>
  )
}