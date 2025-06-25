'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { Plus, Clock, Users, Building, Save, Trash2 } from 'lucide-react'
import { ProjectWithDetails } from '@/types/database'
import { getSubcontractorsAction, saveDailyLabourAction } from '@/lib/actions'
import toast from 'react-hot-toast'

interface LabourTabProps {
  project: ProjectWithDetails
  selectedDate: Date
}

interface Subcontractor {
  id: string
  name: string
  employees: Employee[]
}

interface Employee {
  id: string
  name: string
  trade: string
  hourly_rate: number
}

interface LabourEntry {
  id: string
  subcontractor_id: string
  subcontractor_name: string
  employee_id?: string
  employee_name: string
  trade?: string
  hours_worked: number
  notes: string
  is_one_day_company: boolean
}

export function LabourTab({ project, selectedDate }: LabourTabProps) {
  const [subcontractors, setSubcontractors] = useState<Subcontractor[]>([])
  const [labourEntries, setLabourEntries] = useState<LabourEntry[]>([])
  const [selectedSubcontractor, setSelectedSubcontractor] = useState<string>('')
  const [showOneDayCompany, setShowOneDayCompany] = useState(false)
  const [oneDayCompanyName, setOneDayCompanyName] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    loadSubcontractors()
  }, [])

  const loadSubcontractors = async () => {
    try {
      const result = await getSubcontractorsAction()
      if (result.success && result.data) {
        setSubcontractors(result.data)
      }
    } catch (error) {
      console.error('Error loading subcontractors:', error)
      toast.error('Failed to load subcontractors')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddCompany = () => {
    if (selectedSubcontractor === 'one-day') {
      setShowOneDayCompany(true)
      return
    }

    const subcontractor = subcontractors.find(s => s.id === selectedSubcontractor)
    if (!subcontractor) return

    // Add all employees from the selected subcontractor
    const newEntries = subcontractor.employees.map(employee => ({
      id: `${Date.now()}-${employee.id}`,
      subcontractor_id: subcontractor.id,
      subcontractor_name: subcontractor.name,
      employee_id: employee.id,
      employee_name: employee.name,
      trade: employee.trade,
      hours_worked: 0,
      notes: '',
      is_one_day_company: false
    }))

    setLabourEntries([...labourEntries, ...newEntries])
    setSelectedSubcontractor('')
  }

  const handleAddOneDayCompany = () => {
    if (!oneDayCompanyName.trim()) {
      toast.error('Please enter company name')
      return
    }

    const newEntry: LabourEntry = {
      id: `one-day-${Date.now()}`,
      subcontractor_id: 'one-day',
      subcontractor_name: oneDayCompanyName,
      employee_name: '',
      hours_worked: 0,
      notes: '',
      is_one_day_company: true
    }

    setLabourEntries([...labourEntries, newEntry])
    setOneDayCompanyName('')
    setShowOneDayCompany(false)
  }

  const handleUpdateEntry = (entryId: string, field: keyof LabourEntry, value: any) => {
    setLabourEntries(entries =>
      entries.map(entry =>
        entry.id === entryId ? { ...entry, [field]: value } : entry
      )
    )
  }

  const handleRemoveEntry = (entryId: string) => {
    setLabourEntries(entries => entries.filter(entry => entry.id !== entryId))
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd')
      const result = await saveDailyLabourAction(project.id.toString(), dateStr, labourEntries)
      
      if (result.success) {
        toast.success('Labour entries saved successfully')
      } else {
        toast.error(result.error || 'Failed to save labour entries')
      }
    } catch (error) {
      console.error('Error saving labour entries:', error)
      toast.error('Failed to save labour entries')
    } finally {
      setIsSaving(false)
    }
  }

  const groupedEntries = labourEntries.reduce((acc, entry) => {
    const key = entry.subcontractor_name
    if (!acc[key]) {
      acc[key] = []
    }
    acc[key].push(entry)
    return acc
  }, {} as Record<string, LabourEntry[]>)

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading subcontractors...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Add Company Section */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Add Company</h3>
        
        <div className="flex items-center space-x-4">
          <select
            value={selectedSubcontractor}
            onChange={(e) => setSelectedSubcontractor(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Select a company...</option>
            {subcontractors.map(sub => (
              <option key={sub.id} value={sub.id}>
                {sub.name} ({sub.employees.length} employees)
              </option>
            ))}
            <option value="one-day">--- Add One-Day Company ---</option>
          </select>
          
          <button
            onClick={handleAddCompany}
            disabled={!selectedSubcontractor}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add
          </button>
        </div>

        {/* One-Day Company Input */}
        {showOneDayCompany && (
          <div className="mt-4 p-4 bg-white rounded-lg border border-gray-200">
            <h4 className="text-sm font-medium text-gray-900 mb-2">One-Day Company</h4>
            <div className="flex items-center space-x-4">
              <input
                type="text"
                value={oneDayCompanyName}
                onChange={(e) => setOneDayCompanyName(e.target.value)}
                placeholder="Company name"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
              <button
                onClick={handleAddOneDayCompany}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Add
              </button>
              <button
                onClick={() => {
                  setShowOneDayCompany(false)
                  setOneDayCompanyName('')
                }}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Labour Entries */}
      {Object.entries(groupedEntries).length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Users className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-sm font-medium text-gray-900">No Labour Added</h3>
          <p className="mt-2 text-sm text-gray-500">
            Select a company above to add labour for {format(selectedDate, 'MMMM d, yyyy')}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedEntries).map(([companyName, entries]) => (
            <div key={companyName} className="bg-white rounded-lg border border-gray-200">
              <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                <h4 className="text-sm font-medium text-gray-900 flex items-center">
                  <Building className="h-4 w-4 mr-2" />
                  {companyName}
                </h4>
              </div>
              
              <div className="p-4 space-y-3">
                {entries.map((entry) => (
                  <div key={entry.id} className="flex items-start space-x-4">
                    {entry.is_one_day_company ? (
                      <input
                        type="text"
                        value={entry.employee_name}
                        onChange={(e) => handleUpdateEntry(entry.id, 'employee_name', e.target.value)}
                        placeholder="Employee name"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      />
                    ) : (
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{entry.employee_name}</p>
                        {entry.trade && (
                          <p className="text-xs text-gray-500">{entry.trade}</p>
                        )}
                      </div>
                    )}
                    
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <input
                        type="number"
                        value={entry.hours_worked}
                        onChange={(e) => handleUpdateEntry(entry.id, 'hours_worked', parseFloat(e.target.value) || 0)}
                        placeholder="0"
                        step="0.5"
                        className="w-20 px-2 py-1 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      />
                      <span className="text-sm text-gray-500">hrs</span>
                    </div>
                    
                    <input
                      type="text"
                      value={entry.notes}
                      onChange={(e) => handleUpdateEntry(entry.id, 'notes', e.target.value)}
                      placeholder="Notes..."
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                    
                    <button
                      onClick={() => handleRemoveEntry(entry.id)}
                      className="text-red-600 hover:text-red-700 p-1"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
          
          {/* Save Button */}
          <div className="flex justify-end">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? 'Saving...' : 'Save Labour Entries'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}