'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { Truck, Plus, Clock, DollarSign, Gauge } from 'lucide-react'
import { DailyPlant, CreateDailyPlantRequest, PlantProfile, Company } from '@/types/database'
import { createDailyPlantAction, getPlantProfilesAction, getCompaniesAction } from '@/lib/actions'

interface PlantDocketsSectionProps {
  lotId: string
  date: Date
  plantRecords: DailyPlant[]
  onUpdate: () => void
}

export function PlantDocketsSection({ lotId, date, plantRecords, onUpdate }: PlantDocketsSectionProps) {
  const [showForm, setShowForm] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [plantProfiles, setPlantProfiles] = useState<PlantProfile[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [selectedPlantProfile, setSelectedPlantProfile] = useState<PlantProfile | null>(null)
  const [isLoadingProfiles, setIsLoadingProfiles] = useState(false)
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('')
  const [enterManually, setEnterManually] = useState(false)
  
  const [formData, setFormData] = useState({
    equipment_type: '',
    equipment_id: '',
    operator_name: '',
    hours_used: '',
    hourly_rate: '',
    fuel_consumed: '',
    maintenance_notes: '',
    task_description: '',
    plant_profile_id: ''
  })

  useEffect(() => {
    if (showForm) {
      loadResources()
    }
  }, [showForm])

  const loadResources = async () => {
    setIsLoadingProfiles(true)
    try {
      const [plantsResult, companiesResult] = await Promise.all([
        getPlantProfilesAction(),
        getCompaniesAction('plant_supplier')
      ])
      
      if (plantsResult.success && plantsResult.data) {
        setPlantProfiles(plantsResult.data)
      }
      if (companiesResult.success && companiesResult.data) {
        setCompanies(companiesResult.data)
      }
    } catch (error) {
      console.error('Error loading resources:', error)
    } finally {
      setIsLoadingProfiles(false)
    }
  }

  const handleCompanySelect = (companyId: string) => {
    setSelectedCompanyId(companyId)
    // Reset plant selection when company changes
    setSelectedPlantProfile(null)
    setFormData({
      equipment_type: '',
      equipment_id: '',
      operator_name: '',
      hours_used: '',
      hourly_rate: '',
      fuel_consumed: '',
      maintenance_notes: '',
      task_description: '',
      plant_profile_id: ''
    })
    setEnterManually(false)
  }

  const handlePlantSelect = (profileId: string) => {
    if (profileId === 'manual') {
      setEnterManually(true)
      setSelectedPlantProfile(null)
      setFormData({
        ...formData,
        equipment_type: '',
        equipment_id: '',
        hourly_rate: '',
        plant_profile_id: ''
      })
    } else {
      const profile = plantProfiles.find(p => p.id === profileId)
      if (profile) {
        setSelectedPlantProfile(profile)
        setEnterManually(false)
        setFormData({
          ...formData,
          equipment_type: profile.machine_type?.toLowerCase().replace(/\s+/g, '_') || 'other',
          equipment_id: profile.registration || '',
          hourly_rate: profile.default_hourly_rate.toString(),
          plant_profile_id: profile.id
        })
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      const plantData: CreateDailyPlantRequest = {
        lot_id: lotId,
        work_date: format(date, 'yyyy-MM-dd'),
        equipment_type: formData.equipment_type,
        equipment_id: formData.equipment_id || undefined,
        operator_name: formData.operator_name || undefined,
        hours_used: parseFloat(formData.hours_used),
        hourly_rate: formData.hourly_rate ? parseFloat(formData.hourly_rate) : undefined,
        fuel_consumed: formData.fuel_consumed ? parseFloat(formData.fuel_consumed) : undefined,
        maintenance_notes: formData.maintenance_notes || undefined,
        task_description: formData.task_description || undefined,
        rate_at_time_of_entry: formData.hourly_rate ? parseFloat(formData.hourly_rate) : undefined,
        plant_profile_id: formData.plant_profile_id || undefined
      }

      const result = await createDailyPlantAction(plantData)
      
      if (result.success) {
        setShowForm(false)
        setFormData({
          equipment_type: '',
          equipment_id: '',
          operator_name: '',
          hours_used: '',
          hourly_rate: '',
          fuel_consumed: '',
          maintenance_notes: '',
          task_description: '',
          plant_profile_id: ''
        })
        setSelectedPlantProfile(null)
        setSelectedCompanyId('')
        setEnterManually(false)
        onUpdate()
      } else {
        setError(result.error || 'Failed to create plant record')
      }
    } catch (error) {
      console.error('Error creating plant record:', error)
      setError('An unexpected error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const calculateTotal = (record: DailyPlant) => {
    return (record.hours_used || 0) * (record.hourly_rate || 0)
  }

  const getTotalHours = () => {
    return plantRecords.reduce((total, record) => total + (record.hours_used || 0), 0)
  }

  const getTotalCost = () => {
    return plantRecords.reduce((total, record) => total + calculateTotal(record), 0)
  }

  const getTotalFuel = () => {
    return plantRecords.reduce((total, record) => total + (record.fuel_consumed || 0), 0)
  }

  return (
    <div>
      {showForm ? (
        <form onSubmit={handleSubmit} className="space-y-4 mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-md font-medium text-gray-900">Add Plant/Equipment Docket</h4>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="text-gray-400 hover:text-gray-500"
            >
              ×
            </button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="company_select" className="block text-sm font-medium text-gray-700">
                Select Company *
              </label>
              {isLoadingProfiles ? (
                <div className="mt-1 text-sm text-gray-500">Loading companies...</div>
              ) : (
                <select
                  id="company_select"
                  value={selectedCompanyId}
                  onChange={(e) => handleCompanySelect(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  required
                >
                  <option value="">Select a company</option>
                  {companies.map((company) => (
                    <option key={company.id} value={company.id}>
                      {company.company_name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label htmlFor="plant_select" className="block text-sm font-medium text-gray-700">
                Select Equipment
              </label>
              <select
                id="plant_select"
                value={enterManually ? 'manual' : formData.plant_profile_id}
                onChange={(e) => handlePlantSelect(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                disabled={!selectedCompanyId}
              >
                <option value="">Select equipment</option>
                <option value="manual">Enter manually</option>
                {selectedCompanyId && plantProfiles
                  .filter(plant => plant.company_id === selectedCompanyId)
                  .map((profile) => (
                    <option key={profile.id} value={profile.id}>
                      {profile.machine_name}
                      {profile.machine_type && ` - ${profile.machine_type}`}
                      {profile.registration && ` (${profile.registration})`}
                      {` - $${profile.default_hourly_rate}/hr`}
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label htmlFor="equipment_type" className="block text-sm font-medium text-gray-700">
                Equipment Type *
              </label>
              <select
                id="equipment_type"
                name="equipment_type"
                value={formData.equipment_type}
                onChange={handleChange}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                disabled={!enterManually && selectedPlantProfile !== null}
              >
                <option value="">Select equipment</option>
                <option value="excavator">Excavator</option>
                <option value="bulldozer">Bulldozer</option>
                <option value="crane">Crane</option>
                <option value="concrete_mixer">Concrete Mixer</option>
                <option value="dump_truck">Dump Truck</option>
                <option value="compactor">Compactor</option>
                <option value="generator">Generator</option>
                <option value="pump">Pump</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label htmlFor="equipment_id" className="block text-sm font-medium text-gray-700">
                Equipment ID/Number
              </label>
              <input
                type="text"
                id="equipment_id"
                name="equipment_id"
                value={formData.equipment_id}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                placeholder={selectedPlantProfile ? "Auto-filled from selection" : "e.g., EX-123"}
                disabled={!enterManually && selectedPlantProfile !== null}
              />
            </div>

            <div>
              <label htmlFor="operator_name" className="block text-sm font-medium text-gray-700">
                Operator Name
              </label>
              <input
                type="text"
                id="operator_name"
                name="operator_name"
                value={formData.operator_name}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>

            <div>
              <label htmlFor="hours_used" className="block text-sm font-medium text-gray-700">
                Hours Used *
              </label>
              <input
                type="number"
                id="hours_used"
                name="hours_used"
                value={formData.hours_used}
                onChange={handleChange}
                required
                step="0.5"
                min="0"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>

            <div>
              <label htmlFor="hourly_rate" className="block text-sm font-medium text-gray-700">
                Hourly Rate ($)
              </label>
              <input
                type="number"
                id="hourly_rate"
                name="hourly_rate"
                value={formData.hourly_rate}
                onChange={handleChange}
                step="0.01"
                min="0"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>

            <div>
              <label htmlFor="fuel_consumed" className="block text-sm font-medium text-gray-700">
                Fuel Consumed (L)
              </label>
              <input
                type="number"
                id="fuel_consumed"
                name="fuel_consumed"
                value={formData.fuel_consumed}
                onChange={handleChange}
                step="0.1"
                min="0"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>
          </div>

          <div>
            <label htmlFor="task_description" className="block text-sm font-medium text-gray-700">
              Task Description
            </label>
            <textarea
              id="task_description"
              name="task_description"
              rows={2}
              value={formData.task_description}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              placeholder="Describe the work performed..."
            />
          </div>

          <div>
            <label htmlFor="maintenance_notes" className="block text-sm font-medium text-gray-700">
              Maintenance Notes
            </label>
            <textarea
              id="maintenance_notes"
              name="maintenance_notes"
              rows={2}
              value={formData.maintenance_notes}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              placeholder="Any maintenance issues or requirements..."
            />
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
            >
              {isSubmitting ? 'Creating...' : 'Create Docket'}
            </button>
          </div>
        </form>
      ) : (
        <div className="mb-4 flex justify-between items-center">
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Plant Docket
          </button>
          
          {plantRecords.length > 0 && (
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <span className="flex items-center">
                <Clock className="h-4 w-4 mr-1" />
                Total Hours: {getTotalHours().toFixed(1)}
              </span>
              <span className="flex items-center">
                <DollarSign className="h-4 w-4 mr-1" />
                Total Cost: ${getTotalCost().toFixed(2)}
              </span>
              <span className="flex items-center">
                <Gauge className="h-4 w-4 mr-1" />
                Total Fuel: {getTotalFuel().toFixed(1)}L
              </span>
            </div>
          )}
        </div>
      )}

      {plantRecords.length === 0 ? (
        <div className="text-center py-12">
          <Truck className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-sm font-medium text-gray-900">No Plant/Equipment Records</h3>
          <p className="mt-2 text-sm text-gray-500">
            No plant or equipment recorded for {format(date, 'MMMM d, yyyy')}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
          <table className="min-w-full divide-y divide-gray-300">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Equipment
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Operator
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hours
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rate
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fuel
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Notes
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {plantRecords.map((record) => (
                <tr key={record.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {record.equipment_type.replace(/_/g, ' ')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {record.equipment_id || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {record.operator_name || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {record.hours_used}h
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {record.hourly_rate ? `$${record.hourly_rate}/h` : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {record.fuel_consumed ? `${record.fuel_consumed}L` : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    ${calculateTotal(record).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    <div className="max-w-xs">
                      {record.task_description && (
                        <p className="truncate" title={record.task_description}>
                          {record.task_description}
                        </p>
                      )}
                      {record.maintenance_notes && (
                        <p className="truncate text-orange-600" title={record.maintenance_notes}>
                          ⚠️ {record.maintenance_notes}
                        </p>
                      )}
                      {!record.task_description && !record.maintenance_notes && '-'}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}