'use client'

import { useState } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Textarea } from './ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import type { CreateComplianceCheckForm } from '../types'

interface ComplianceFormProps {
  lotId: string
  projectId: string
  organizationId: string
  onSubmit: (data: CreateComplianceCheckForm) => Promise<void>
}

export function ComplianceForm({ 
  lotId, 
  projectId, 
  organizationId, 
  onSubmit 
}: ComplianceFormProps) {
  const [formData, setFormData] = useState<CreateComplianceCheckForm>({
    lot_id: lotId,
    project_id: projectId,
    organization_id: organizationId,
    check_type: '',
    status: 'pending',
    notes: '',
    checked_by: '',
    checked_at: new Date().toISOString(),
    photo: null
  })

  const [isSubmitting, setIsSubmitting] = useState(false)

  const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null
    setFormData(prev => ({ ...prev, photo: file }))
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setIsSubmitting(true)
    
    try {
      await onSubmit(formData)
      // Reset form after successful submission
      setFormData({
        lot_id: lotId,
        project_id: projectId,
        organization_id: organizationId,
        check_type: '',
        status: 'pending',
        notes: '',
        checked_by: '',
        checked_at: new Date().toISOString(),
        photo: null
      })
    } catch (error) {
      console.error('Error submitting compliance check:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="check_type">Check Type</Label>
          <Select
            value={formData.check_type}
            onValueChange={(value) => setFormData(prev => ({ ...prev, check_type: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select check type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="environmental">Environmental</SelectItem>
              <SelectItem value="safety">Safety</SelectItem>
              <SelectItem value="quality">Quality</SelectItem>
              <SelectItem value="regulatory">Regulatory</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select
            value={formData.status}
            onValueChange={(value: 'compliant' | 'non_compliant' | 'pending') => 
              setFormData(prev => ({ ...prev, status: value }))
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="compliant">Compliant</SelectItem>
              <SelectItem value="non_compliant">Non-Compliant</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="checked_by">Checked By</Label>
        <Input
          id="checked_by"
          type="text"
          value={formData.checked_by}
          onChange={(e) => setFormData(prev => ({ ...prev, checked_by: e.target.value }))}
          placeholder="Inspector name"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="checked_at">Check Date & Time</Label>
        <Input
          id="checked_at"
          type="datetime-local"
          value={formData.checked_at.slice(0, 16)} // Format for datetime-local input
          onChange={(e) => setFormData(prev => ({ ...prev, checked_at: new Date(e.target.value).toISOString() }))}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          value={formData.notes || ''}
          onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
          placeholder="Additional notes or observations..."
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="photo">Photo Evidence</Label>
        <Input
          id="photo"
          type="file"
          accept="image/*"
          onChange={handlePhotoChange}
          className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
        {formData.photo && (
          <p className="text-sm text-gray-600">
            Selected: {formData.photo.name}
          </p>
        )}
      </div>

      <Button
        type="submit"
        disabled={isSubmitting || !formData.check_type || !formData.checked_by}
        className="w-full"
      >
        {isSubmitting ? 'Creating...' : 'Create Compliance Check'}
      </Button>
    </form>
  )
}