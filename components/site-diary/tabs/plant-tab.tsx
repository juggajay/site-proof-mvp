'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { Plus, Clock, Truck, Building, Save, Trash2, Fuel } from 'lucide-react'
import { ProjectWithDetails, Company, PlantProfile } from '@/types/database'
import { getCompaniesAction, getPlantProfilesAction, saveDailyPlantAction } from '@/lib/actions'
import toast from 'react-hot-toast'

interface PlantTabProps {
  project: ProjectWithDetails
  selectedDate: Date
}

interface PlantEntry {
  id: string
  company_id: string
  company_name: string
  plant_profile_id?: string
  machine_name: string
  machine_type?: string
  registration?: string
  hours_used: number
  idle_hours: number
  fuel_used: number
  notes: string
  is_one_off: boolean
}

export function PlantTab({ project, selectedDate }: PlantTabProps) {
  const [companies, setCompanies] = useState<Company[]>([])
  const [plantProfiles, setPlantProfiles] = useState<PlantProfile[]>([])
  const [plantEntries, setPlantEntries] = useState<PlantEntry[]>([])
  const [selectedCompany, setSelectedCompany] = useState<string>('')
  const [showOneOffPlant, setShowOneOffPlant] = useState(false)
  const [oneOffCompanyName, setOneOffCompanyName] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isLoadingProfiles, setIsLoadingProfiles] = useState(false)

  useEffect(() => {
    loadCompanies()
  }, [])

  const loadCompanies = async () => {
    try {
      const result = await getCompaniesAction('plant_supplier')
      if (result.success && result.data) {
        setCompanies(result.data)
      }
    } catch (error) {
      console.error('Error loading companies:', error)
      toast.error('Failed to load companies')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddCompany = async () => {
    if (selectedCompany === 'one-off') {
      setShowOneOffPlant(true)
      return
    }

    const company = companies.find(c => c.id === selectedCompany)
    if (!company) return

    setIsLoadingProfiles(true)
    try {
      // Fetch all plant profiles and filter by company
      const result = await getPlantProfilesAction()
      if (result.success && result.data) {
        const companyProfiles = result.data.filter(profile => 
          profile.company_id === company.id || profile.supplier === company.company_name
        )
        
        if (companyProfiles.length === 0) {
          toast.error('No equipment found for this company')
          return
        }

        // Add all equipment from the selected company
        const newEntries = companyProfiles.map(profile => ({
          id: `${Date.now()}-${profile.id}`,
          company_id: company.id,
          company_name: company.company_name,
          plant_profile_id: profile.id,
          machine_name: profile.machine_name,
          machine_type: profile.machine_type || '',
          registration: profile.registration || '',
          hours_used: 0,
          idle_hours: 0,
          fuel_used: 0,
          notes: '',
          is_one_off: false
        }))

        setPlantEntries([...plantEntries, ...newEntries])
        setSelectedCompany('')
        toast.success(`Added ${companyProfiles.length} equipment from ${company.company_name}`)
      } else {
        toast.error(result.error || 'Failed to fetch equipment')
      }
    } catch (error) {
      console.error('Error fetching equipment:', error)
      toast.error('Failed to fetch equipment')
    } finally {
      setIsLoadingProfiles(false)
    }
  }

  const handleAddOneOffPlant = () => {
    if (!oneOffCompanyName.trim()) {
      toast.error('Please enter company name')
      return
    }

    const newEntry: PlantEntry = {
      id: `one-off-${Date.now()}`,
      company_id: 'one-off',
      company_name: oneOffCompanyName,
      machine_name: '',
      machine_type: '',
      registration: '',
      hours_used: 0,
      idle_hours: 0,
      fuel_used: 0,
      notes: '',
      is_one_off: true
    }

    setPlantEntries([...plantEntries, newEntry])
    setOneOffCompanyName('')
    setShowOneOffPlant(false)
    toast.success('Added one-off equipment entry')
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

  const groupedEntries = plantEntries.reduce((acc, entry) => {
    const key = entry.company_name
    if (!acc[key]) {
      acc[key] = []
    }
    acc[key].push(entry)
    return acc
  }, {} as Record<string, PlantEntry[]>)

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading companies...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Add Company Section */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Add Equipment</h3>
        
        <div className="flex items-center space-x-4">
          <select
            value={selectedCompany}
            onChange={(e) => setSelectedCompany(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Select a plant supplier...</option>
            {companies.map(company => (
              <option key={company.id} value={company.id}>
                {company.company_name}
              </option>
            ))}
            <option value="one-off">--- Add One-Off Equipment ---</option>
          </select>
          
          <button
            onClick={handleAddCompany}
            disabled={!selectedCompany || isLoadingProfiles}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoadingProfiles ? (
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

        {/* One-Off Plant Input */}
        {showOneOffPlant && (
          <div className="mt-4 p-4 bg-white rounded-lg border border-gray-200">
            <h4 className="text-sm font-medium text-gray-900 mb-2">One-Off Equipment</h4>
            <div className="flex items-center space-x-4">
              <input
                type="text"
                value={oneOffCompanyName}
                onChange={(e) => setOneOffCompanyName(e.target.value)}
                placeholder="Company/Supplier name"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
              <button
                onClick={handleAddOneOffPlant}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Add
              </button>
              <button
                onClick={() => {
                  setShowOneOffPlant(false)
                  setOneOffCompanyName('')
                }}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Plant Entries */}
      {Object.entries(groupedEntries).length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Truck className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-sm font-medium text-gray-900">No Equipment Added</h3>
          <p className="mt-2 text-sm text-gray-500">
            Select a plant supplier above to add equipment for {format(selectedDate, 'MMMM d, yyyy')}
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
                            value={entry.machine_name}
                            onChange={(e) => handleUpdateEntry(entry.id, 'machine_name', e.target.value)}
                            placeholder="Machine name"
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                          />
                          <input
                            type="text"
                            value={entry.machine_type}
                            onChange={(e) => handleUpdateEntry(entry.id, 'machine_type', e.target.value)}
                            placeholder="Type (e.g., Excavator)"
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                          />
                          <input
                            type="text"
                            value={entry.registration}
                            onChange={(e) => handleUpdateEntry(entry.id, 'registration', e.target.value)}
                            placeholder="Registration"
                            className="w-32 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                          />
                        </>
                      ) : (
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{entry.machine_name}</p>
                          <p className="text-xs text-gray-500">
                            {entry.machine_type} {entry.registration && `• ${entry.registration}`}
                          </p>
                        </div>
                      )}
                      
                      <button
                        onClick={() => handleRemoveEntry(entry.id)}
                        className="text-red-600 hover:text-red-700 p-1"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4">
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
                        <span className="text-sm text-gray-500">hrs used</span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-gray-400" />
                        <input
                          type="number"
                          value={entry.idle_hours}
                          onChange={(e) => handleUpdateEntry(entry.id, 'idle_hours', parseFloat(e.target.value) || 0)}
                          placeholder="0"
                          step="0.5"
                          className="w-20 px-2 py-1 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        />
                        <span className="text-sm text-gray-500">hrs idle</span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Fuel className="h-4 w-4 text-gray-400" />
                        <input
                          type="number"
                          value={entry.fuel_used}
                          onChange={(e) => handleUpdateEntry(entry.id, 'fuel_used', parseFloat(e.target.value) || 0)}
                          placeholder="0"
                          step="1"
                          className="w-20 px-2 py-1 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        />
                        <span className="text-sm text-gray-500">L fuel</span>
                      </div>
                    </div>
                    
                    <input
                      type="text"
                      value={entry.notes}
                      onChange={(e) => handleUpdateEntry(entry.id, 'notes', e.target.value)}
                      placeholder="Notes (maintenance, issues, etc.)..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    />
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
              {isSaving ? 'Saving...' : 'Save Plant Entries'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}