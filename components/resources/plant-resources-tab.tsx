'use client'

import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, Building2, Truck, DollarSign, Fuel, ChevronRight, ChevronDown } from 'lucide-react'
import { 
  getCompaniesAction,
  createCompanyAction,
  updateCompanyAction,
  deleteCompanyAction,
  getPlantProfilesAction, 
  createPlantProfileAction, 
  updatePlantProfileAction,
  deletePlantProfileAction
} from '@/lib/actions'
import { Company, PlantProfile } from '@/types/database'

interface CompanyWithPlants {
  company: Company
  plants: PlantProfile[]
  isExpanded: boolean
}

export function PlantResourcesTab() {
  const [companiesWithPlants, setCompaniesWithPlants] = useState<CompanyWithPlants[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showAddCompany, setShowAddCompany] = useState(false)
  const [showAddPlant, setShowAddPlant] = useState<string | null>(null)
  const [editingCompany, setEditingCompany] = useState<Company | null>(null)
  const [editingPlant, setEditingPlant] = useState<PlantProfile | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Company form state
  const [companyForm, setCompanyForm] = useState({
    company_name: '',
    contact_person: '',
    phone: '',
    email: '',
    address: '',
    abn: ''
  })

  // Plant form state
  const [plantForm, setPlantForm] = useState({
    machine_name: '',
    machine_type: '',
    model: '',
    registration: '',
    default_hourly_rate: '',
    default_idle_rate: '',
    fuel_type: ''
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setIsLoading(true)
    setError(null)
    try {
      // Load companies and plants
      const [companiesResult, plantsResult] = await Promise.all([
        getCompaniesAction('plant_supplier'),
        getPlantProfilesAction()
      ])

      if (companiesResult.success && companiesResult.data && plantsResult.success && plantsResult.data) {
        // Group plants by company
        const companiesMap = new Map<string, CompanyWithPlants>()
        
        // Initialize companies
        companiesResult.data.forEach(company => {
          companiesMap.set(company.id, {
            company,
            plants: [],
            isExpanded: false
          })
        })

        // Assign plants to companies
        plantsResult.data.forEach(plant => {
          if (plant.company_id && companiesMap.has(plant.company_id)) {
            companiesMap.get(plant.company_id)!.plants.push(plant)
          }
        })

        setCompaniesWithPlants(Array.from(companiesMap.values()))
      } else {
        setError(companiesResult.error || plantsResult.error || 'Failed to load data')
      }
    } catch (error) {
      console.error('Error loading data:', error)
      setError('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmitCompany = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    try {
      const companyData = {
        ...companyForm,
        company_type: 'plant_supplier' as const
      }

      if (editingCompany) {
        const result = await updateCompanyAction(editingCompany.id, companyData)
        if (!result.success) {
          setError(result.error || 'Failed to update company')
          return
        }
      } else {
        console.log('Creating company with data:', companyData)
        const result = await createCompanyAction(companyData)
        console.log('Create company result:', result)
        if (!result.success) {
          console.error('Create company failed:', result.error)
          setError(result.error || 'Failed to create company')
          return
        }
      }

      setShowAddCompany(false)
      setEditingCompany(null)
      setCompanyForm({
        company_name: '',
        contact_person: '',
        phone: '',
        email: '',
        address: '',
        abn: ''
      })
      loadData()
    } catch (error) {
      console.error('Error submitting company:', error)
      setError('An unexpected error occurred')
    }
  }

  const handleSubmitPlant = async (e: React.FormEvent, companyId: string) => {
    e.preventDefault()
    setError(null)

    try {
      const plantData = {
        ...plantForm,
        company_id: companyId,
        default_hourly_rate: parseFloat(plantForm.default_hourly_rate),
        default_idle_rate: plantForm.default_idle_rate ? parseFloat(plantForm.default_idle_rate) : undefined
      }

      if (editingPlant) {
        const result = await updatePlantProfileAction(editingPlant.id, plantData)
        if (!result.success) {
          setError(result.error || 'Failed to update plant')
          return
        }
      } else {
        const result = await createPlantProfileAction(plantData)
        if (!result.success) {
          setError(result.error || 'Failed to create plant')
          return
        }
      }

      setShowAddPlant(null)
      setEditingPlant(null)
      setPlantForm({
        machine_name: '',
        machine_type: '',
        model: '',
        registration: '',
        default_hourly_rate: '',
        default_idle_rate: '',
        fuel_type: ''
      })
      loadData()
    } catch (error) {
      console.error('Error submitting plant:', error)
      setError('An unexpected error occurred')
    }
  }

  const handleDeleteCompany = async (id: string) => {
    if (!confirm('Are you sure you want to delete this company? All associated plant profiles will be removed.')) {
      return
    }

    try {
      const result = await deleteCompanyAction(id)
      if (result.success) {
        loadData()
      } else {
        setError(result.error || 'Failed to delete company')
      }
    } catch (error) {
      console.error('Error deleting company:', error)
      setError('An unexpected error occurred')
    }
  }

  const handleDeletePlant = async (id: string) => {
    if (!confirm('Are you sure you want to delete this plant profile?')) {
      return
    }

    try {
      const result = await deletePlantProfileAction(id)
      if (result.success) {
        loadData()
      } else {
        setError(result.error || 'Failed to delete plant profile')
      }
    } catch (error) {
      console.error('Error deleting plant:', error)
      setError('An unexpected error occurred')
    }
  }

  const handleEditCompany = (company: Company) => {
    setEditingCompany(company)
    setCompanyForm({
      company_name: company.company_name,
      contact_person: company.contact_person || '',
      phone: company.phone || '',
      email: company.email || '',
      address: company.address || '',
      abn: company.abn || ''
    })
    setShowAddCompany(true)
  }

  const handleEditPlant = (plant: PlantProfile) => {
    setEditingPlant(plant)
    setPlantForm({
      machine_name: plant.machine_name,
      machine_type: plant.machine_type || '',
      model: plant.model || '',
      registration: plant.registration || '',
      default_hourly_rate: plant.default_hourly_rate.toString(),
      default_idle_rate: plant.default_idle_rate?.toString() || '',
      fuel_type: plant.fuel_type || ''
    })
    setShowAddPlant(plant.company_id || '')
  }

  const toggleCompanyExpansion = (companyId: string) => {
    setCompaniesWithPlants(prev => prev.map(cwp => 
      cwp.company.id === companyId 
        ? { ...cwp, isExpanded: !cwp.isExpanded }
        : cwp
    ))
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-medium text-gray-900">Plant & Equipment Companies</h2>
        <button
          onClick={() => {
            setEditingCompany(null)
            setCompanyForm({
              company_name: '',
              contact_person: '',
              phone: '',
              email: '',
              address: '',
              abn: ''
            })
            setShowAddCompany(true)
          }}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Company
        </button>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
          {error}
        </div>
      )}

      {showAddCompany && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-md font-medium text-gray-900 mb-4">
            {editingCompany ? 'Edit Company' : 'Add New Plant Company'}
          </h3>
          <form onSubmit={handleSubmitCompany} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="company_name" className="block text-sm font-medium text-gray-700">
                  Company Name *
                </label>
                <input
                  type="text"
                  id="company_name"
                  required
                  value={companyForm.company_name}
                  onChange={(e) => setCompanyForm({ ...companyForm, company_name: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>
              <div>
                <label htmlFor="contact_person" className="block text-sm font-medium text-gray-700">
                  Contact Person
                </label>
                <input
                  type="text"
                  id="contact_person"
                  value={companyForm.contact_person}
                  onChange={(e) => setCompanyForm({ ...companyForm, contact_person: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                  Phone
                </label>
                <input
                  type="tel"
                  id="phone"
                  value={companyForm.phone}
                  onChange={(e) => setCompanyForm({ ...companyForm, phone: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  value={companyForm.email}
                  onChange={(e) => setCompanyForm({ ...companyForm, email: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>
              <div>
                <label htmlFor="abn" className="block text-sm font-medium text-gray-700">
                  ABN
                </label>
                <input
                  type="text"
                  id="abn"
                  value={companyForm.abn}
                  onChange={(e) => setCompanyForm({ ...companyForm, abn: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>
              <div>
                <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                  Address
                </label>
                <input
                  type="text"
                  id="address"
                  value={companyForm.address}
                  onChange={(e) => setCompanyForm({ ...companyForm, address: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                  setShowAddCompany(false)
                  setEditingCompany(null)
                }}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                {editingCompany ? 'Update' : 'Create'} Company
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-4">
        {companiesWithPlants.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <Building2 className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-sm font-medium text-gray-900">No plant companies</h3>
            <p className="mt-2 text-sm text-gray-500">Get started by adding a plant company.</p>
          </div>
        ) : (
          companiesWithPlants.map(({ company, plants, isExpanded }) => (
            <div key={company.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="px-6 py-4 bg-gray-50">
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <button
                      onClick={() => toggleCompanyExpansion(company.id)}
                      className="mr-2 text-gray-500 hover:text-gray-700"
                    >
                      {isExpanded ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                    </button>
                    <Building2 className="h-5 w-5 text-gray-500 mr-2" />
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">{company.company_name}</h3>
                      <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                        {company.contact_person && <span>{company.contact_person}</span>}
                        {company.phone && <span>{company.phone}</span>}
                        {company.email && <span>{company.email}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleEditCompany(company)}
                      className="p-2 text-gray-400 hover:text-gray-600"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteCompany(company.id)}
                      className="p-2 text-gray-400 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>

              {isExpanded && (
                <div className="px-6 py-4">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-sm font-medium text-gray-700">Plant & Equipment</h4>
                    <button
                      onClick={() => {
                        setEditingPlant(null)
                        setPlantForm({
                          machine_name: '',
                          machine_type: '',
                          model: '',
                          registration: '',
                          default_hourly_rate: '',
                          default_idle_rate: '',
                          fuel_type: ''
                        })
                        setShowAddPlant(company.id)
                      }}
                      className="text-sm text-blue-600 hover:text-blue-700"
                    >
                      <Plus className="h-4 w-4 inline mr-1" />
                      Add Equipment
                    </button>
                  </div>

                  {showAddPlant === company.id && (
                    <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                      <h5 className="text-sm font-medium text-gray-900 mb-3">
                        {editingPlant ? 'Edit Equipment' : 'Add New Equipment'}
                      </h5>
                      <form onSubmit={(e) => handleSubmitPlant(e, company.id)} className="space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700">
                              Machine Name *
                            </label>
                            <input
                              type="text"
                              required
                              value={plantForm.machine_name}
                              onChange={(e) => setPlantForm({ ...plantForm, machine_name: e.target.value })}
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                              placeholder="e.g., CAT 320 Excavator"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">
                              Machine Type
                            </label>
                            <select
                              value={plantForm.machine_type}
                              onChange={(e) => setPlantForm({ ...plantForm, machine_type: e.target.value })}
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                            >
                              <option value="">Select type</option>
                              <option value="Excavator">Excavator</option>
                              <option value="Loader">Loader</option>
                              <option value="Dozer">Dozer</option>
                              <option value="Grader">Grader</option>
                              <option value="Truck">Truck</option>
                              <option value="Crane">Crane</option>
                              <option value="Compactor">Compactor</option>
                              <option value="Generator">Generator</option>
                              <option value="Other">Other</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">
                              Model
                            </label>
                            <input
                              type="text"
                              value={plantForm.model}
                              onChange={(e) => setPlantForm({ ...plantForm, model: e.target.value })}
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">
                              Registration/Serial No.
                            </label>
                            <input
                              type="text"
                              value={plantForm.registration}
                              onChange={(e) => setPlantForm({ ...plantForm, registration: e.target.value })}
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">
                              Fuel Type
                            </label>
                            <select
                              value={plantForm.fuel_type}
                              onChange={(e) => setPlantForm({ ...plantForm, fuel_type: e.target.value })}
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                            >
                              <option value="">Select fuel type</option>
                              <option value="Diesel">Diesel</option>
                              <option value="Petrol">Petrol</option>
                              <option value="Electric">Electric</option>
                              <option value="Hybrid">Hybrid</option>
                              <option value="LPG">LPG</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">
                              Default Hourly Rate ($) *
                            </label>
                            <input
                              type="number"
                              required
                              step="0.01"
                              min="0"
                              value={plantForm.default_hourly_rate}
                              onChange={(e) => setPlantForm({ ...plantForm, default_hourly_rate: e.target.value })}
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">
                              Default Idle Rate ($/hr)
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={plantForm.default_idle_rate}
                              onChange={(e) => setPlantForm({ ...plantForm, default_idle_rate: e.target.value })}
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                              placeholder="Rate when equipment is idle"
                            />
                          </div>
                        </div>
                        <div className="flex justify-end space-x-3">
                          <button
                            type="button"
                            onClick={() => {
                              setShowAddPlant(null)
                              setEditingPlant(null)
                            }}
                            className="px-3 py-1.5 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            className="px-3 py-1.5 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                          >
                            {editingPlant ? 'Update' : 'Add'} Equipment
                          </button>
                        </div>
                      </form>
                    </div>
                  )}

                  {plants.length === 0 ? (
                    <p className="text-sm text-gray-500">No equipment added yet.</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {plants.map((plant) => (
                        <div key={plant.id} className="border border-gray-200 rounded-lg p-3">
                          <div className="flex justify-between items-start">
                            <div className="flex items-center">
                              <Truck className="h-5 w-5 text-gray-500 mr-2" />
                              <div>
                                <h5 className="font-medium text-gray-900">{plant.machine_name}</h5>
                                <div className="text-sm text-gray-500 space-y-1 mt-1">
                                  {plant.machine_type && <div>Type: {plant.machine_type}</div>}
                                  {plant.registration && <div>Reg: {plant.registration}</div>}
                                  {plant.fuel_type && (
                                    <div className="flex items-center">
                                      <Fuel className="h-3 w-3 mr-1" />
                                      {plant.fuel_type}
                                    </div>
                                  )}
                                  <div className="flex items-center text-green-600 font-medium">
                                    <DollarSign className="h-3 w-3" />
                                    {plant.default_hourly_rate}/hr
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-1">
                              <button
                                onClick={() => handleEditPlant(plant)}
                                className="p-1 text-gray-400 hover:text-gray-600"
                              >
                                <Edit2 className="h-3 w-3" />
                              </button>
                              <button
                                onClick={() => handleDeletePlant(plant.id)}
                                className="p-1 text-gray-400 hover:text-red-600"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}