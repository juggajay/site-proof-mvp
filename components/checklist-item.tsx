'use client'

import { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Textarea } from './ui/textarea'
import { Card, CardContent } from './ui/card'
import { Badge } from './ui/badge'
import { Camera, MessageSquare } from 'lucide-react'
import type { ItpItem, ConformanceRecordWithAttachments } from '../types'

interface ChecklistItemProps {
  item: ItpItem & { conformance_records: ConformanceRecordWithAttachments[] }
  onUpdate: (itemId: string, data: Partial<ConformanceRecordWithAttachments>) => void
  disabled?: boolean
}

export default function ChecklistItem({ item, onUpdate, disabled = false }: ChecklistItemProps) {
  const existingRecord = item.conformance_records?.[0]
  
  const [passFailValue, setPassFailValue] = useState<'PASS' | 'FAIL' | 'N/A' | null>(
    existingRecord?.pass_fail_value || null
  )
  const [textValue, setTextValue] = useState(existingRecord?.text_value || '')
  const [numericValue, setNumericValue] = useState(existingRecord?.numeric_value?.toString() || '')
  const [comment, setComment] = useState(existingRecord?.comment || '')
  const [showComment, setShowComment] = useState(false)

  // Auto-save functionality
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!disabled) {
        const updateData: Partial<ConformanceRecordWithAttachments> = {}
        
        if (item.item_type === 'PASS_FAIL' && passFailValue) {
          updateData.pass_fail_value = passFailValue
        }
        if (item.item_type === 'TEXT_INPUT' && textValue.trim()) {
          updateData.text_value = textValue.trim()
        }
        if (item.item_type === 'NUMERIC' && numericValue.trim()) {
          updateData.numeric_value = parseFloat(numericValue)
        }
        if (comment.trim()) {
          updateData.comment = comment.trim()
        }

        // Only update if there's actual data to save
        if (Object.keys(updateData).length > 0) {
          onUpdate(item.id, updateData)
        }
      }
    }, 1500) // Auto-save after 1.5 seconds of inactivity

    return () => clearTimeout(timer)
  }, [passFailValue, textValue, numericValue, comment, item.id, item.item_type, onUpdate, disabled])

  const handlePassFailClick = (value: 'PASS' | 'FAIL' | 'N/A') => {
    if (!disabled) {
      setPassFailValue(value)
    }
  }

  const getPassFailButtonVariant = (value: 'PASS' | 'FAIL' | 'N/A') => {
    if (passFailValue === value) {
      switch (value) {
        case 'PASS': return 'default'
        case 'FAIL': return 'destructive'
        case 'N/A': return 'secondary'
      }
    }
    return 'outline'
  }

  const getStatusBadge = () => {
    const hasValue = 
      (item.item_type === 'PASS_FAIL' && passFailValue) ||
      (item.item_type === 'TEXT_INPUT' && textValue.trim()) ||
      (item.item_type === 'NUMERIC' && numericValue.trim())

    if (hasValue) {
      return <Badge variant="secondary" className="bg-green-100 text-green-800">Completed</Badge>
    }
    return <Badge variant="outline">Pending</Badge>
  }

  return (
    <Card className="mb-4">
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1">
            <p className="font-medium text-sm mb-2">{item.item_description}</p>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {item.item_type.replace('_', ' ')}
              </Badge>
              {getStatusBadge()}
            </div>
          </div>
        </div>

        {/* Input based on item type */}
        <div className="space-y-3">
          {item.item_type === 'PASS_FAIL' && (
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={getPassFailButtonVariant('PASS')}
                onClick={() => handlePassFailClick('PASS')}
                disabled={disabled}
                className="min-w-[60px]"
              >
                PASS
              </Button>
              <Button
                size="sm"
                variant={getPassFailButtonVariant('FAIL')}
                onClick={() => handlePassFailClick('FAIL')}
                disabled={disabled}
                className="min-w-[60px]"
              >
                FAIL
              </Button>
              <Button
                size="sm"
                variant={getPassFailButtonVariant('N/A')}
                onClick={() => handlePassFailClick('N/A')}
                disabled={disabled}
                className="min-w-[60px]"
              >
                N/A
              </Button>
            </div>
          )}

          {item.item_type === 'TEXT_INPUT' && (
            <Textarea
              placeholder="Enter your observations..."
              value={textValue}
              onChange={(e) => setTextValue(e.target.value)}
              disabled={disabled}
              rows={3}
            />
          )}

          {item.item_type === 'NUMERIC' && (
            <Input
              type="number"
              placeholder="Enter numeric value..."
              value={numericValue}
              onChange={(e) => setNumericValue(e.target.value)}
              disabled={disabled}
            />
          )}

          {/* Comment section */}
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowComment(!showComment)}
              disabled={disabled}
            >
              <MessageSquare className="h-4 w-4 mr-1" />
              Comment
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={disabled}
            >
              <Camera className="h-4 w-4 mr-1" />
              Photo
            </Button>
          </div>

          {showComment && (
            <Textarea
              placeholder="Add a comment..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              disabled={disabled}
              rows={2}
            />
          )}
        </div>
      </CardContent>
    </Card>
  )
}