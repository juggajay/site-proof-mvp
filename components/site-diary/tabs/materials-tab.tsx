'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { Plus, Package, Save, Trash2 } from 'lucide-react'
import { ProjectWithDetails } from '@/types/database'
import { getMaterialsAction, saveDailyMaterialsAction } from '@/lib/actions'
import toast from 'react-hot-toast'

interface MaterialsTabProps {
  project: ProjectWithDetails
  selectedDate: Date
}

interface Material {
  id: string
  name: string
  category: string
  unit: string
  supplier?: string
}

interface MaterialEntry {
  id: string
  material_id: string
  material_name: string
  quantity: number
  unit: string
  supplier: string
  docket_number: string
  notes: string
}

export function MaterialsTab({ project, selectedDate }: MaterialsTabProps) {
  const [materials, setMaterials] = useState<Material[]>([])
  const [materialEntries, setMaterialEntries] = useState<MaterialEntry[]>([])
  const [selectedMaterial, setSelectedMaterial] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    loadMaterials()
  }, [])

  const loadMaterials = async () => {
    try {
      const result = await getMaterialsAction()
      if (result.success && result.data) {
        setMaterials(result.data)
      }
    } catch (error) {
      console.error('Error loading materials:', error)
      toast.error('Failed to load materials')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddMaterial = () => {
    const selected = materials.find(m => m.id === selectedMaterial)
    if (!selected) return

    const newEntry: MaterialEntry = {
      id: `${Date.now()}-${selected.id}`,
      material_id: selected.id,
      material_name: selected.name,
      quantity: 0,
      unit: selected.unit,
      supplier: selected.supplier || '',
      docket_number: '',
      notes: ''
    }

    setMaterialEntries([...materialEntries, newEntry])
    setSelectedMaterial('')
  }

  const handleUpdateEntry = (entryId: string, field: keyof MaterialEntry, value: any) => {
    setMaterialEntries(entries =>
      entries.map(entry =>
        entry.id === entryId ? { ...entry, [field]: value } : entry
      )
    )
  }

  const handleRemoveEntry = (entryId: string) => {
    setMaterialEntries(entries => entries.filter(entry => entry.id !== entryId))
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd')
      const result = await saveDailyMaterialsAction(project.id.toString(), dateStr, materialEntries)
      
      if (result.success) {
        toast.success('Material entries saved successfully')
        setMaterialEntries([]) // Clear entries after saving
      } else {
        toast.error(result.error || 'Failed to save material entries')
      }
    } catch (error) {
      console.error('Error saving material entries:', error)
      toast.error('Failed to save material entries')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading materials...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Add Material Section */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Add Material Delivery</h3>
        
        <div className="flex items-center space-x-4">
          <select
            value={selectedMaterial}
            onChange={(e) => setSelectedMaterial(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Select material...</option>
            {materials.map(material => (
              <option key={material.id} value={material.id}>
                {material.name} ({material.category})
              </option>
            ))}
          </select>
          
          <button
            onClick={handleAddMaterial}
            disabled={!selectedMaterial}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add
          </button>
        </div>
      </div>

      {/* Material Entries */}
      {materialEntries.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Package className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-sm font-medium text-gray-900">No Materials Added</h3>
          <p className="mt-2 text-sm text-gray-500">
            Add material deliveries for {format(selectedDate, 'MMMM d, yyyy')}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
              <h4 className="text-sm font-medium text-gray-900">Material Deliveries</h4>
            </div>
            
            <div className="p-4 space-y-4">
              {materialEntries.map((entry) => (
                <div key={entry.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <h5 className="text-sm font-medium text-gray-900">{entry.material_name}</h5>
                    <button
                      onClick={() => handleRemoveEntry(entry.id)}
                      className="text-red-600 hover:text-red-700 p-1"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        value={entry.quantity}
                        onChange={(e) => handleUpdateEntry(entry.id, 'quantity', parseFloat(e.target.value) || 0)}
                        placeholder="Quantity"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      />
                      <span className="text-sm text-gray-500">{entry.unit}</span>
                    </div>
                    
                    <input
                      type="text"
                      value={entry.docket_number}
                      onChange={(e) => handleUpdateEntry(entry.id, 'docket_number', e.target.value)}
                      placeholder="Docket number"
                      className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                    
                    <input
                      type="text"
                      value={entry.supplier}
                      onChange={(e) => handleUpdateEntry(entry.id, 'supplier', e.target.value)}
                      placeholder="Supplier"
                      className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                    
                    <input
                      type="text"
                      value={entry.notes}
                      onChange={(e) => handleUpdateEntry(entry.id, 'notes', e.target.value)}
                      placeholder="Notes..."
                      className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
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
              {isSaving ? 'Saving...' : 'Save Material Entries'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}