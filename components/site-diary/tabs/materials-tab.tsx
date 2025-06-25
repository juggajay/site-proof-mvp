'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { Plus, Package, Building, Save, Trash2, FileText } from 'lucide-react'
import { ProjectWithDetails, Company, MaterialProfile } from '@/types/database'
import { getCompaniesAction, getMaterialProfilesAction, saveDailyMaterialsAction } from '@/lib/actions'
import toast from 'react-hot-toast'

interface MaterialsTabProps {
  project: ProjectWithDetails
  selectedDate: Date
}

interface MaterialEntry {
  id: string
  company_id: string
  company_name: string
  material_profile_id?: string
  material_name: string
  material_category?: string
  quantity: number
  unit: string
  docket_number: string
  notes: string
  is_one_off: boolean
}

export function MaterialsTab({ project, selectedDate }: MaterialsTabProps) {
  const [companies, setCompanies] = useState<Company[]>([])
  const [materialProfiles, setMaterialProfiles] = useState<MaterialProfile[]>([])
  const [materialEntries, setMaterialEntries] = useState<MaterialEntry[]>([])
  const [selectedCompany, setSelectedCompany] = useState<string>('')
  const [showOneOffMaterial, setShowOneOffMaterial] = useState(false)
  const [oneOffSupplierName, setOneOffSupplierName] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isLoadingMaterials, setIsLoadingMaterials] = useState(false)

  useEffect(() => {
    loadCompanies()
  }, [])

  const loadCompanies = async () => {
    try {
      // Get all companies that might be material suppliers
      const result = await getCompaniesAction('both')
      if (result.success && result.data) {
        setCompanies(result.data)
      }
    } catch (error) {
      console.error('Error loading companies:', error)
      toast.error('Failed to load suppliers')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddCompany = async () => {
    if (selectedCompany === 'one-off') {
      setShowOneOffMaterial(true)
      return
    }

    const company = companies.find(c => c.id === selectedCompany)
    if (!company) return

    setIsLoadingMaterials(true)
    try {
      // Fetch all material profiles and filter by supplier
      const result = await getMaterialProfilesAction()
      if (result.success && result.data) {
        const companyMaterials = result.data.filter(profile => 
          profile.supplier === company.company_name
        )
        
        if (companyMaterials.length === 0) {
          // If no specific materials found, create a generic entry for this supplier
          const newEntry: MaterialEntry = {
            id: `generic-${Date.now()}-${company.id}`,
            company_id: company.id,
            company_name: company.company_name,
            material_name: '',
            material_category: '',
            quantity: 0,
            unit: '',
            docket_number: '',
            notes: '',
            is_one_off: true // Allow editing since no preset materials
          }
          setMaterialEntries([...materialEntries, newEntry])
          setSelectedCompany('')
          toast.success(`Added entry for ${company.company_name}`)
        } else {
          // Add all materials from the selected supplier
          const newEntries = companyMaterials.map(profile => ({
            id: `${Date.now()}-${profile.id}`,
            company_id: company.id,
            company_name: company.company_name,
            material_profile_id: profile.id,
            material_name: profile.material_name,
            material_category: profile.material_category || '',
            quantity: 0,
            unit: profile.default_unit,
            docket_number: '',
            notes: '',
            is_one_off: false
          }))

          setMaterialEntries([...materialEntries, ...newEntries])
          setSelectedCompany('')
          toast.success(`Added ${companyMaterials.length} materials from ${company.company_name}`)
        }
      } else {
        toast.error(result.error || 'Failed to fetch materials')
      }
    } catch (error) {
      console.error('Error fetching materials:', error)
      toast.error('Failed to fetch materials')
    } finally {
      setIsLoadingMaterials(false)
    }
  }

  const handleAddOneOffMaterial = () => {
    if (!oneOffSupplierName.trim()) {
      toast.error('Please enter supplier name')
      return
    }

    const newEntry: MaterialEntry = {
      id: `one-off-${Date.now()}`,
      company_id: 'one-off',
      company_name: oneOffSupplierName,
      material_name: '',
      material_category: '',
      quantity: 0,
      unit: '',
      docket_number: '',
      notes: '',
      is_one_off: true
    }

    setMaterialEntries([...materialEntries, newEntry])
    setOneOffSupplierName('')
    setShowOneOffMaterial(false)
    toast.success('Added one-off material entry')
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

  const groupedEntries = materialEntries.reduce((acc, entry) => {
    const key = entry.company_name
    if (!acc[key]) {
      acc[key] = []
    }
    acc[key].push(entry)
    return acc
  }, {} as Record<string, MaterialEntry[]>)

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading suppliers...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Add Supplier Section */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Add Material Delivery</h3>
        
        <div className="flex items-center space-x-4">
          <select
            value={selectedCompany}
            onChange={(e) => setSelectedCompany(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Select a supplier...</option>
            {companies.map(company => (
              <option key={company.id} value={company.id}>
                {company.company_name}
              </option>
            ))}
            <option value="one-off">--- Add One-Off Supplier ---</option>
          </select>
          
          <button
            onClick={handleAddCompany}
            disabled={!selectedCompany || isLoadingMaterials}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoadingMaterials ? (
              <>
                <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full" />
                Loading...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Add
              </>
            )}
          </button>
        </div>

        {/* One-Off Supplier Input */}
        {showOneOffMaterial && (
          <div className="mt-4 p-4 bg-white rounded-lg border border-gray-200">
            <h4 className="text-sm font-medium text-gray-900 mb-2">One-Off Supplier</h4>
            <div className="flex items-center space-x-4">
              <input
                type="text"
                value={oneOffSupplierName}
                onChange={(e) => setOneOffSupplierName(e.target.value)}
                placeholder="Supplier name"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
              <button
                onClick={handleAddOneOffMaterial}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Add
              </button>
              <button
                onClick={() => {
                  setShowOneOffMaterial(false)
                  setOneOffSupplierName('')
                }}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Material Entries */}
      {Object.entries(groupedEntries).length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Package className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-sm font-medium text-gray-900">No Materials Added</h3>
          <p className="mt-2 text-sm text-gray-500">
            Select a supplier above to add material deliveries for {format(selectedDate, 'MMMM d, yyyy')}
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
                  <div key={entry.id} className="space-y-3 p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-start space-x-4">
                      {entry.is_one_off ? (
                        <>
                          <input
                            type="text"
                            value={entry.material_name}
                            onChange={(e) => handleUpdateEntry(entry.id, 'material_name', e.target.value)}
                            placeholder="Material name"
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                          />
                          <input
                            type="text"
                            value={entry.material_category}
                            onChange={(e) => handleUpdateEntry(entry.id, 'material_category', e.target.value)}
                            placeholder="Category (e.g., Concrete)"
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                          />
                        </>
                      ) : (
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{entry.material_name}</p>
                          {entry.material_category && (
                            <p className="text-xs text-gray-500">{entry.material_category}</p>
                          )}
                        </div>
                      )}
                      
                      <button
                        onClick={() => handleRemoveEntry(entry.id)}
                        className="text-red-600 hover:text-red-700 p-1"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="flex items-center space-x-2">
                        <input
                          type="number"
                          value={entry.quantity}
                          onChange={(e) => handleUpdateEntry(entry.id, 'quantity', parseFloat(e.target.value) || 0)}
                          placeholder="Quantity"
                          step="0.1"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        />
                        {entry.is_one_off ? (
                          <input
                            type="text"
                            value={entry.unit}
                            onChange={(e) => handleUpdateEntry(entry.id, 'unit', e.target.value)}
                            placeholder="Unit"
                            className="w-20 px-2 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                          />
                        ) : (
                          <span className="text-sm text-gray-500 min-w-[50px]">{entry.unit}</span>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <FileText className="h-4 w-4 text-gray-400" />
                        <input
                          type="text"
                          value={entry.docket_number}
                          onChange={(e) => handleUpdateEntry(entry.id, 'docket_number', e.target.value)}
                          placeholder="Docket number"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      
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
          ))}
          
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