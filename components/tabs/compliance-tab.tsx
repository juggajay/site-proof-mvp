'use client'

import { useState, useCallback, useRef } from 'react'
import { Button } from '../ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import ChecklistItem from '../checklist-item'
import { Save, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '../../lib/supabase/client'
import { saveInspectionAnswersAction } from '../../actions'
import type { FullLotData, ConformanceRecordWithAttachments } from '../../types'

interface ComplianceTabProps {
  lotData: FullLotData
}

export default function ComplianceTab({ lotData }: ComplianceTabProps) {
  const [isSaving, setIsSaving] = useState(false)
  const [isManualSaving, setIsManualSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [currentAnswers, setCurrentAnswers] = useState<Map<string, any>>(new Map())
  const supabase = createClient()

  const handleItemUpdate = useCallback(async (itemId: string, data: Partial<ConformanceRecordWithAttachments>) => {
    try {
      setIsSaving(true)
      
      // Update current answers state for manual save
      setCurrentAnswers(prev => {
        const newAnswers = new Map(prev)
        newAnswers.set(itemId, data)
        return newAnswers
      })
      
      // Check if a conformance record already exists for this item
      const existingRecord = lotData.itps.itp_items
        .find(item => item.id === itemId)
        ?.conformance_records?.[0]

      if (existingRecord) {
        // Update existing record
        const { error } = await supabase
          .from('conformance_records')
          .update({
            ...data,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingRecord.id)

        if (error) throw error
      } else {
        // Create new record
        const { error } = await supabase
          .from('conformance_records')
          .insert({
            lot_id: lotData.id,
            itp_item_id: itemId,
            ...data,
            completed_by: (await supabase.auth.getUser()).data.user?.id
          })

        if (error) throw error
      }

      setLastSaved(new Date())
    } catch (error) {
      console.error('Error saving conformance record:', error)
      toast.error('Failed to save inspection data')
    } finally {
      setIsSaving(false)
    }
  }, [lotData.id, lotData.itps.itp_items, supabase])

  const handleManualSave = async () => {
    try {
      setIsManualSaving(true)
      
      // Collect all current form data from the checklist items
      const answers = lotData.itps.itp_items.map(item => {
        const existingRecord = item.conformance_records?.[0]
        const currentAnswer = currentAnswers.get(item.id)
        
        return {
          itp_item_id: item.id,
          pass_fail_value: currentAnswer?.pass_fail_value || existingRecord?.pass_fail_value || undefined,
          text_value: currentAnswer?.text_value || existingRecord?.text_value || undefined,
          numeric_value: currentAnswer?.numeric_value || existingRecord?.numeric_value || undefined,
          comment: currentAnswer?.notes || existingRecord?.notes || undefined,
        }
      }).filter(answer =>
        answer.pass_fail_value ||
        answer.text_value?.trim() ||
        answer.numeric_value !== undefined ||
        answer.comment?.trim()
      )

      if (answers.length === 0) {
        toast.error('No inspection data to save')
        return
      }

      // Create FormData for server action
      const formData = new FormData()
      formData.append('lot_id', lotData.id)
      formData.append('answers', JSON.stringify(answers))

      // Call server action
      const result = await saveInspectionAnswersAction(formData)

      if (result.success) {
        toast.success(result.message || 'Progress saved successfully', {
          description: `Saved ${result.saved_count} inspection items`
        })
        setLastSaved(new Date())
      } else {
        toast.error(result.error || 'Failed to save progress')
      }
    } catch (error) {
      console.error('Manual save error:', error)
      toast.error('Failed to save inspection progress')
    } finally {
      setIsManualSaving(false)
    }
  }

  const getCompletionStats = () => {
    const totalItems = lotData.itps.itp_items.length
    const completedItems = lotData.itps.itp_items.filter(item => {
      const record = item.conformance_records?.[0]
      return record && (
        record.pass_fail_value ||
        record.text_value ||
        record.numeric_value !== null
      )
    }).length

    return { completed: completedItems, total: totalItems }
  }

  const stats = getCompletionStats()
  const completionPercentage = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'IN_PROGRESS':
        return 'bg-yellow-100 text-yellow-800'
      case 'COMPLETED':
        return 'bg-blue-100 text-blue-800'
      case 'APPROVED':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatStatus = (status: string) => {
    return status.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())
  }

  return (
    <div className="space-y-6">
      {/* Save Status */}
      <div className="flex items-center justify-end gap-2">
        {isSaving && (
          <div className="flex items-center text-sm text-muted-foreground">
            <Save className="h-4 w-4 mr-1 animate-spin" />
            Saving...
          </div>
        )}
        {lastSaved && !isSaving && (
          <div className="flex items-center text-sm text-muted-foreground">
            <CheckCircle className="h-4 w-4 mr-1 text-green-600" />
            Saved {lastSaved.toLocaleTimeString()}
          </div>
        )}
      </div>

      {/* QA Progress Card */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>QA & Environmental Compliance</CardTitle>
              <CardDescription>
                {lotData.itps.title} • {lotData.description}
              </CardDescription>
            </div>
            <Badge className={getStatusColor(lotData.status)}>
              {formatStatus(lotData.status)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Progress</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${completionPercentage}%` }}
                  />
                </div>
                <span className="text-sm font-medium">{completionPercentage}%</span>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Completed Items</p>
              <p className="text-lg">{stats.completed} of {stats.total}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Created</p>
              <p className="text-lg">{new Date(lotData.created_at).toLocaleDateString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Inspection Checklist */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold">Inspection Checklist</h3>
          <p className="text-muted-foreground">
            {lotData.itps.title}
          </p>
        </div>

        {lotData.itps.itp_items.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="text-center">
                <h4 className="text-lg font-medium mb-2">No checklist items</h4>
                <p className="text-muted-foreground">
                  This ITP template doesn&apos;t have any checklist items defined.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {lotData.itps.itp_items
              .sort((a, b) => a.order - b.order)
              .map((item) => (
                <ChecklistItem
                  key={item.id}
                  item={item}
                  onUpdate={handleItemUpdate}
                  disabled={isSaving}
                />
              ))}
          </div>
        )}
      </div>

      {/* Save Progress Section */}
      <div className="mt-8 space-y-4">
        {/* Save Progress Button */}
        <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg border">
          <div className="flex items-center space-x-3">
            <div>
              <p className="text-sm font-medium text-neutral-900">Manual Save Progress</p>
              <p className="text-xs text-neutral-600">
                Save all current inspection answers at once
              </p>
            </div>
          </div>
          <Button
            onClick={handleManualSave}
            disabled={isManualSaving || isSaving}
            className="px-6"
          >
            {isManualSaving ? (
              <>
                <Save className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Progress
              </>
            )}
          </Button>
        </div>

        {/* Auto-save notice */}
        <div className="p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            <CheckCircle className="h-4 w-4 inline mr-1" />
            Your progress is automatically saved as you work. Use "Save Progress" for manual backup.
          </p>
        </div>
      </div>
    </div>
  )
}