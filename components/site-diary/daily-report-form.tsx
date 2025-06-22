'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { saveDailyReportAction } from '@/lib/actions'
import { DailyReport, CreateDailyReportRequest } from '@/types/database'
import { X } from 'lucide-react'
import { useDebounce } from '@/hooks/useDebounce'
import { AutoSaveStatus } from '@/components/ui/auto-save-status'

interface DailyReportFormProps {
  lotId: string
  date: Date
  existingReport?: DailyReport | null
  onSave: () => void
  onCancel: () => void
}

export function DailyReportForm({ lotId, date, existingReport, onSave, onCancel }: DailyReportFormProps) {
  const [error, setError] = useState<string | null>(null)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [hasChanges, setHasChanges] = useState(false)
  
  const [formData, setFormData] = useState({
    weather_condition: existingReport?.weather_condition || '',
    temperature_high: existingReport?.temperature_high?.toString() || '',
    temperature_low: existingReport?.temperature_low?.toString() || '',
    work_summary: existingReport?.work_summary || '',
    issues_encountered: existingReport?.issues_encountered || '',
    safety_notes: existingReport?.safety_notes || '',
    visitors: existingReport?.visitors || '',
    equipment_status: existingReport?.equipment_status || '',
    progress_notes: existingReport?.progress_notes || '',
  })

  // Auto-save function
  const saveReport = async () => {
    setError(null)
    
    try {
      const reportData: CreateDailyReportRequest = {
        lot_id: parseInt(lotId),
        report_date: format(date, 'yyyy-MM-dd'),
        weather_condition: formData.weather_condition || undefined,
        temperature_high: formData.temperature_high ? parseInt(formData.temperature_high) : undefined,
        temperature_low: formData.temperature_low ? parseInt(formData.temperature_low) : undefined,
        work_summary: formData.work_summary || undefined,
        issues_encountered: formData.issues_encountered || undefined,
        safety_notes: formData.safety_notes || undefined,
        visitors: formData.visitors || undefined,
        equipment_status: formData.equipment_status || undefined,
        progress_notes: formData.progress_notes || undefined,
      }

      const result = await saveDailyReportAction(reportData)
      
      if (result.success) {
        setLastSaved(new Date())
        setHasChanges(false)
        onSave()
      } else {
        setError(result.error || 'Failed to save daily report')
      }
    } catch (error) {
      console.error('Error saving daily report:', error)
      setError('An unexpected error occurred')
    }
  }

  // Debounced auto-save
  const [debouncedSave, isSaving] = useDebounce(saveReport, 2000)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    setHasChanges(true)
  }

  // Trigger auto-save when form data changes
  useEffect(() => {
    if (hasChanges) {
      debouncedSave()
    }
  }, [formData, hasChanges, debouncedSave])

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-4">
          <h3 className="text-lg font-medium text-gray-900">
            {existingReport ? 'Edit' : 'Create'} Daily Report - {format(date, 'MMMM d, yyyy')}
          </h3>
          <AutoSaveStatus isSaving={isSaving} lastSaved={lastSaved} error={error} />
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="text-gray-400 hover:text-gray-500"
        >
          <X className="h-6 w-6" />
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label htmlFor="weather_condition" className="block text-sm font-medium text-gray-700">
            Weather Condition
          </label>
          <select
            id="weather_condition"
            name="weather_condition"
            value={formData.weather_condition}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          >
            <option value="">Select weather</option>
            <option value="sunny">Sunny</option>
            <option value="cloudy">Cloudy</option>
            <option value="rainy">Rainy</option>
            <option value="windy">Windy</option>
            <option value="stormy">Stormy</option>
          </select>
        </div>

        <div>
          <label htmlFor="temperature_low" className="block text-sm font-medium text-gray-700">
            Temperature Low (°C)
          </label>
          <input
            type="number"
            id="temperature_low"
            name="temperature_low"
            value={formData.temperature_low}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
        </div>

        <div>
          <label htmlFor="temperature_high" className="block text-sm font-medium text-gray-700">
            Temperature High (°C)
          </label>
          <input
            type="number"
            id="temperature_high"
            name="temperature_high"
            value={formData.temperature_high}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
        </div>
      </div>

      <div>
        <label htmlFor="work_summary" className="block text-sm font-medium text-gray-700">
          Work Summary
        </label>
        <textarea
          id="work_summary"
          name="work_summary"
          rows={3}
          value={formData.work_summary}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          placeholder="Describe the work completed today..."
        />
      </div>

      <div>
        <label htmlFor="issues_encountered" className="block text-sm font-medium text-gray-700">
          Issues Encountered
        </label>
        <textarea
          id="issues_encountered"
          name="issues_encountered"
          rows={3}
          value={formData.issues_encountered}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          placeholder="Describe any issues or challenges..."
        />
      </div>

      <div>
        <label htmlFor="safety_notes" className="block text-sm font-medium text-gray-700">
          Safety Notes
        </label>
        <textarea
          id="safety_notes"
          name="safety_notes"
          rows={2}
          value={formData.safety_notes}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          placeholder="Any safety incidents or observations..."
        />
      </div>

      <div>
        <label htmlFor="visitors" className="block text-sm font-medium text-gray-700">
          Visitors
        </label>
        <textarea
          id="visitors"
          name="visitors"
          rows={2}
          value={formData.visitors}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          placeholder="List any visitors to the site..."
        />
      </div>

      <div>
        <label htmlFor="equipment_status" className="block text-sm font-medium text-gray-700">
          Equipment Status
        </label>
        <textarea
          id="equipment_status"
          name="equipment_status"
          rows={2}
          value={formData.equipment_status}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          placeholder="Status of equipment and machinery..."
        />
      </div>

      <div>
        <label htmlFor="progress_notes" className="block text-sm font-medium text-gray-700">
          Progress Notes
        </label>
        <textarea
          id="progress_notes"
          name="progress_notes"
          rows={3}
          value={formData.progress_notes}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          placeholder="Additional notes on project progress..."
        />
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
        >
          Close
        </button>
      </div>
    </div>
  )
}