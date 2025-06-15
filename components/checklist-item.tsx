'use client'

import { useState } from 'react'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { Card, CardContent } from './ui/card'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Textarea } from './ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'

/* Site-Proof Professional B2B Checklist Item - Exact Landing Page Implementation */

interface ChecklistItemProps {
  item: {
    id: string
    item_description: string
    item_type: 'PASS_FAIL' | 'MEASUREMENT' | 'TEXT_INPUT' | 'PHOTO_REQUIRED'
    required: boolean
    acceptance_criteria?: string
  }
  value?: any
  onChange: (value: any) => void
  onSave?: () => void
}

export function ChecklistItem({ item, value, onChange, onSave }: ChecklistItemProps) {
  const [localValue, setLocalValue] = useState(value)
  const [notes, setNotes] = useState('')

  const handleValueChange = (newValue: any) => {
    setLocalValue(newValue)
    onChange(newValue)
  }

  const handleSave = () => {
    onSave?.()
  }

  const renderInput = () => {
    switch (item.item_type) {
      case 'PASS_FAIL':
        return (
          <Select value={localValue || ''} onValueChange={handleValueChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select result" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="PASS">
                <span className="text-[#28A745] font-medium">PASS</span>
              </SelectItem>
              <SelectItem value="FAIL">
                <span className="text-[#DC3545] font-medium">FAIL</span>
              </SelectItem>
              <SelectItem value="N/A">
                <span className="text-[#6C757D] font-medium">N/A</span>
              </SelectItem>
            </SelectContent>
          </Select>
        )

      case 'MEASUREMENT':
        return (
          <div className="flex gap-2">
            <Input
              type="number"
              step="0.01"
              placeholder="Enter measurement"
              value={localValue?.value || ''}
              onChange={(e) => handleValueChange({ 
                ...localValue, 
                value: e.target.value 
              })}
              className="flex-1"
            />
            <Input
              placeholder="Unit"
              value={localValue?.unit || ''}
              onChange={(e) => handleValueChange({ 
                ...localValue, 
                unit: e.target.value 
              })}
              className="w-20"
            />
          </div>
        )

      case 'TEXT_INPUT':
        return (
          <Textarea
            placeholder="Enter details..."
            value={localValue || ''}
            onChange={(e) => handleValueChange(e.target.value)}
            className="min-h-[80px]"
          />
        )

      case 'PHOTO_REQUIRED':
        return (
          <div className="space-y-2">
            <Input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) {
                  handleValueChange({ file, filename: file.name })
                }
              }}
              className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#F8F9FA] file:text-[#1B4F72] hover:file:bg-[#E9ECEF]"
            />
            {localValue?.filename && (
              <p className="text-sm text-[#6C757D] font-primary">
                Selected: {localValue.filename}
              </p>
            )}
          </div>
        )

      default:
        return null
    }
  }

  const getStatusBadge = () => {
    const hasValue = localValue !== null && localValue !== undefined && localValue !== ''
    
    if (hasValue) {
      return <Badge variant="success" className="bg-[#28A745] text-white">Completed</Badge>
    }
    
    return item.required ? 
      <Badge variant="warning" className="bg-[#FF6B35] text-white">Required</Badge> : 
      <Badge variant="muted" className="bg-[#6C757D] text-white">Optional</Badge>
  }

  return (
    <Card className="border-[#DEE2E6] hover:shadow-md transition-shadow duration-200">
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="font-medium text-sm mb-2 text-[#2C3E50] font-primary">{item.item_description}</p>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs border-[#1B4F72] text-[#1B4F72]">
                  {item.item_type.replace('_', ' ')}
                </Badge>
                {getStatusBadge()}
              </div>
            </div>
          </div>

          {item.acceptance_criteria && (
            <div className="p-3 bg-[#F8F9FA] rounded-md border border-[#DEE2E6]">
              <Label className="text-xs font-medium text-[#6C757D] font-primary">Acceptance Criteria</Label>
              <p className="text-sm text-[#2C3E50] mt-1 font-primary">{item.acceptance_criteria}</p>
            </div>
          )}

          <div className="space-y-2">
            <Label className="text-sm font-medium text-[#2C3E50] font-primary">Result</Label>
            {renderInput()}
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium text-[#2C3E50] font-primary">Notes (Optional)</Label>
            <Textarea
              placeholder="Add any additional notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-[60px]"
            />
          </div>

          {onSave && (
            <div className="flex justify-end pt-2">
              <Button 
                onClick={handleSave}
                variant="default"
                size="sm"
                className="font-primary"
              >
                Save Item
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}