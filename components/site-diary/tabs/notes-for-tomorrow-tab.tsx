'use client'

import { useState } from 'react'
import { format, addDays, isWeekend, nextMonday } from 'date-fns'
import { Calendar, Save, StickyNote } from 'lucide-react'
import { ProjectWithDetails } from '@/types/database'
import { saveTomorrowNoteAction } from '@/lib/actions'
import toast from 'react-hot-toast'

interface NotesForTomorrowTabProps {
  project: ProjectWithDetails
  defaultDate: Date
}

export function NotesForTomorrowTab({ project, defaultDate }: NotesForTomorrowTabProps) {
  const [noteContent, setNoteContent] = useState('')
  const [targetDate, setTargetDate] = useState(() => {
    // If tomorrow is weekend, default to next Monday
    let date = defaultDate
    if (isWeekend(date)) {
      date = nextMonday(date)
    }
    return date
  })
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
    if (!noteContent.trim()) {
      toast.error('Please enter a note')
      return
    }

    setIsSaving(true)
    try {
      const result = await saveTomorrowNoteAction(
        project.id.toString(),
        noteContent,
        format(targetDate, 'yyyy-MM-dd')
      )
      
      if (result.success) {
        toast.success('Note saved successfully')
        setNoteContent('')
        // Reset to next working day
        let nextDate = addDays(new Date(), 1)
        if (isWeekend(nextDate)) {
          nextDate = nextMonday(nextDate)
        }
        setTargetDate(nextDate)
      } else {
        toast.error(result.error || 'Failed to save note')
      }
    } catch (error) {
      console.error('Error saving note:', error)
      toast.error('Failed to save note')
    } finally {
      setIsSaving(false)
    }
  }

  const getQuickDateOptions = () => {
    const today = new Date()
    const tomorrow = addDays(today, 1)
    const dayAfter = addDays(today, 2)
    
    const options = []
    
    // Tomorrow (skip if weekend)
    if (!isWeekend(tomorrow)) {
      options.push({
        label: 'Tomorrow',
        date: tomorrow
      })
    }
    
    // Day after tomorrow (skip if weekend)
    if (!isWeekend(dayAfter)) {
      options.push({
        label: format(dayAfter, 'EEEE'),
        date: dayAfter
      })
    }
    
    // Next Monday
    const monday = nextMonday(today)
    options.push({
      label: 'Next Monday',
      date: monday
    })
    
    return options
  }

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-lg">
        <div className="flex items-start">
          <StickyNote className="h-5 w-5 text-blue-400 mt-0.5" />
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">Notes for Tomorrow</h3>
            <p className="mt-1 text-sm text-blue-700">
              Add notes that will appear at the top of the Daily Diary on the selected date.
              Perfect for reminders about materials arriving, special tasks, or important information.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        {/* Note Content */}
        <div className="mb-6">
          <label htmlFor="note" className="block text-sm font-medium text-gray-700 mb-2">
            Note Content
          </label>
          <textarea
            id="note"
            rows={4}
            value={noteContent}
            onChange={(e) => setNoteContent(e.target.value)}
            placeholder="Enter notes for tomorrow... (e.g., Concrete delivery at 8am, Safety inspector visiting, etc.)"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Date Selection */}
        <div className="mb-6">
          <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
            Display Date
          </label>
          
          {/* Quick Date Options */}
          <div className="flex flex-wrap gap-2 mb-3">
            {getQuickDateOptions().map((option) => (
              <button
                key={option.date.toISOString()}
                onClick={() => setTargetDate(option.date)}
                className={`px-3 py-1 text-sm rounded-md ${
                  format(targetDate, 'yyyy-MM-dd') === format(option.date, 'yyyy-MM-dd')
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>

          {/* Custom Date Input */}
          <div className="flex items-center space-x-3">
            <Calendar className="h-5 w-5 text-gray-400" />
            <input
              type="date"
              id="date"
              value={format(targetDate, 'yyyy-MM-dd')}
              onChange={(e) => setTargetDate(new Date(e.target.value))}
              min={format(addDays(new Date(), 1), 'yyyy-MM-dd')}
              className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
            <span className="text-sm text-gray-500">
              {format(targetDate, 'EEEE, MMMM d, yyyy')}
            </span>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={isSaving || !noteContent.trim()}
            className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? 'Saving...' : 'Save Note'}
          </button>
        </div>
      </div>
    </div>
  )
}