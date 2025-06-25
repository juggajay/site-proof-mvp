'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { Plus, Clock, Truck, Save, Trash2 } from 'lucide-react'
import { ProjectWithDetails } from '@/types/database'
import { getPlantEquipmentAction, saveDailyPlantAction } from '@/lib/actions'
import toast from 'react-hot-toast'

interface PlantTabProps {
  project: ProjectWithDetails
  selectedDate: Date
}

interface PlantEquipment {
  id: string
  name: string
  type: string
  rate_per_hour: number
  supplier: string
}

interface PlantEntry {
  id: string
  equipment_id: string
  equipment_name: string
  equipment_type: string
  hours_used: number
  notes: string
}

export function PlantTab({ project, selectedDate }: PlantTabProps) {
  const [equipment, setEquipment] = useState<PlantEquipment[]>([])
  const [plantEntries, setPlantEntries] = useState<PlantEntry[]>([])
  const [selectedEquipment, setSelectedEquipment] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    loadEquipment()
  }, [])

  const loadEquipment = async () => {
    try {
      const result = await getPlantEquipmentAction()
      if (result.success && result.data) {
        setEquipment(result.data)
      }
    } catch (error) {
      console.error('Error loading equipment:', error)
      toast.error('Failed to load equipment')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddEquipment = () => {
    const selected = equipment.find(e => e.id === selectedEquipment)
    if (!selected) return

    // Check if equipment already added
    if (plantEntries.some(entry => entry.equipment_id === selected.id)) {
      toast.error('Equipment already added')
      return
    }

    const newEntry: PlantEntry = {
      id: `${Date.now()}-${selected.id}`,
      equipment_id: selected.id,
      equipment_name: selected.name,
      equipment_type: selected.type,
      hours_used: 0,
      notes: ''
    }

    setPlantEntries([...plantEntries, newEntry])
    setSelectedEquipment('')
  }

  const handleUpdateEntry = (entryId: string, field: keyof PlantEntry, value: any) => {
    setPlantEntries(entries =>
      entries.map(entry =>
        entry.id === entryId ? { ...entry, [field]: value } : entry
      )
    )
  }

  const handleRemoveEntry = (entryId: string) => {
    setPlantEntries(entries => entries.filter(entry => entry.id !== entryId))
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd')
      const result = await saveDailyPlantAction(project.id.toString(), dateStr, plantEntries)
      
      if (result.success) {
        toast.success('Plant entries saved successfully')
      } else {
        toast.error(result.error || 'Failed to save plant entries')
      }
    } catch (error) {
      console.error('Error saving plant entries:', error)
      toast.error('Failed to save plant entries')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading equipment...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Add Equipment Section */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Add Equipment</h3>
        
        <div className="flex items-center space-x-4">
          <select
            value={selectedEquipment}
            onChange={(e) => setSelectedEquipment(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Select equipment...</option>
            {equipment.map(equip => (
              <option key={equip.id} value={equip.id}>
                {equip.name} - {equip.type} ({equip.supplier})
              </option>
            ))}
          </select>
          
          <button
            onClick={handleAddEquipment}
            disabled={!selectedEquipment}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add
          </button>
        </div>
      </div>

      {/* Plant Entries */}
      {plantEntries.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Truck className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-sm font-medium text-gray-900">No Equipment Added</h3>
          <p className="mt-2 text-sm text-gray-500">
            Select equipment above to add for {format(selectedDate, 'MMMM d, yyyy')}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
              <h4 className="text-sm font-medium text-gray-900">Equipment for Today</h4>
            </div>
            
            <div className="p-4 space-y-3">
              {plantEntries.map((entry) => (
                <div key={entry.id} className="flex items-start space-x-4 p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{entry.equipment_name}</p>
                    <p className="text-xs text-gray-500">{entry.equipment_type}</p>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <input
                      type="number"
                      value={entry.hours_used}
                      onChange={(e) => handleUpdateEntry(entry.id, 'hours_used', parseFloat(e.target.value) || 0)}
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
                    placeholder="Notes (maintenance, issues, etc.)..."
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
          
          {/* Save Button */}
          <div className="flex justify-end">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? 'Saving...' : 'Save Plant Entries'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}