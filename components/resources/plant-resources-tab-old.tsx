'use client'

import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, Truck, DollarSign, Fuel } from 'lucide-react'
import { 
  getPlantProfilesAction, 
  createPlantProfileAction, 
  updatePlantProfileAction,
  deletePlantProfileAction
} from '@/lib/actions'
import { PlantProfile } from '@/types/database'

export function PlantResourcesTab() {
  const [plantProfiles, setPlantProfiles] = useState<PlantProfile[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingProfile, setEditingProfile] = useState<PlantProfile | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    machine_name: '',
    machine_type: '',
    supplier: '',
    model: '',
    registration: '',
    default_hourly_rate: '',
    default_idle_rate: '',
    fuel_type: ''
  })

  useEffect(() => {
    loadPlantProfiles()
  }, [])

  const loadPlantProfiles = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const result = await getPlantProfilesAction()
      if (result.success && result.data) {
        setPlantProfiles(result.data)
      } else {
        setError(result.error || 'Failed to load plant profiles')
      }
    } catch (error) {
      console.error('Error loading plant profiles:', error)
      setError('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    try {
      const profileData = {
        ...formData,
        default_hourly_rate: parseFloat(formData.default_hourly_rate),
        default_idle_rate: formData.default_idle_rate ? parseFloat(formData.default_idle_rate) : undefined
      }

      if (editingProfile) {
        const result = await updatePlantProfileAction(editingProfile.id, profileData)
        if (!result.success) {
          setError(result.error || 'Failed to update plant profile')
          return
        }
      } else {
        const result = await createPlantProfileAction(profileData)
        if (!result.success) {
          setError(result.error || 'Failed to create plant profile')
          return
        }
      }

      setShowAddForm(false)
      setEditingProfile(null)
      setFormData({
        machine_name: '',
        machine_type: '',
        supplier: '',
        model: '',
        registration: '',
        default_hourly_rate: '',
        default_idle_rate: '',
        fuel_type: ''
      })
      loadPlantProfiles()
    } catch (error) {
      console.error('Error submitting plant profile:', error)
      setError('An unexpected error occurred')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this plant profile?')) {
      return
    }

    try {
      const result = await deletePlantProfileAction(id)
      if (result.success) {
        loadPlantProfiles()
      } else {
        setError(result.error || 'Failed to delete plant profile')
      }
    } catch (error) {
      console.error('Error deleting plant profile:', error)
      setError('An unexpected error occurred')
    }
  }

  const handleEdit = (profile: PlantProfile) => {
    setEditingProfile(profile)
    setFormData({
      machine_name: profile.machine_name,
      machine_type: profile.machine_type || '',
      supplier: profile.supplier || '',
      model: profile.model || '',
      registration: profile.registration || '',
      default_hourly_rate: profile.default_hourly_rate.toString(),
      default_idle_rate: profile.default_idle_rate?.toString() || '',
      fuel_type: profile.fuel_type || ''
    })
    setShowAddForm(true)
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
        <h2 className="text-lg font-medium text-gray-900">Plant & Equipment Profiles</h2>
        <button
          onClick={() => {
            setEditingProfile(null)
            setFormData({
              machine_name: '',
              machine_type: '',
              supplier: '',
              model: '',
              registration: '',
              default_hourly_rate: '',
              default_idle_rate: '',
              fuel_type: ''
            })
            setShowAddForm(true)
          }}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Plant Profile
        </button>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
          {error}
        </div>
      )}

      {showAddForm && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-md font-medium text-gray-900 mb-4">
            {editingProfile ? 'Edit Plant Profile' : 'Add New Plant Profile'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="machine_name" className="block text-sm font-medium text-gray-700">
                  Machine Name *
                </label>
                <input
                  type="text"
                  id="machine_name"
                  required
                  value={formData.machine_name}
                  onChange={(e) => setFormData({ ...formData, machine_name: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  placeholder="e.g., CAT 320 Excavator"
                />
              </div>
              <div>
                <label htmlFor="machine_type" className="block text-sm font-medium text-gray-700">
                  Machine Type
                </label>
                <select
                  id="machine_type"
                  value={formData.machine_type}
                  onChange={(e) => setFormData({ ...formData, machine_type: e.target.value })}
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
                <label htmlFor="supplier" className="block text-sm font-medium text-gray-700">
                  Supplier/Owner
                </label>
                <input
                  type="text"
                  id="supplier"
                  value={formData.supplier}
                  onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>
              <div>
                <label htmlFor="model" className="block text-sm font-medium text-gray-700">
                  Model
                </label>
                <input
                  type="text"
                  id="model"
                  value={formData.model}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>
              <div>
                <label htmlFor="registration" className="block text-sm font-medium text-gray-700">
                  Registration/Serial No.
                </label>
                <input
                  type="text"
                  id="registration"
                  value={formData.registration}
                  onChange={(e) => setFormData({ ...formData, registration: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>
              <div>
                <label htmlFor="fuel_type" className="block text-sm font-medium text-gray-700">
                  Fuel Type
                </label>
                <select
                  id="fuel_type"
                  value={formData.fuel_type}
                  onChange={(e) => setFormData({ ...formData, fuel_type: e.target.value })}
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
                <label htmlFor="default_hourly_rate" className="block text-sm font-medium text-gray-700">
                  Default Hourly Rate ($) *
                </label>
                <input
                  type="number"
                  id="default_hourly_rate"
                  required
                  step="0.01"
                  min="0"
                  value={formData.default_hourly_rate}
                  onChange={(e) => setFormData({ ...formData, default_hourly_rate: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>
              <div>
                <label htmlFor="default_idle_rate" className="block text-sm font-medium text-gray-700">
                  Default Idle Rate ($/hr)
                </label>
                <input
                  type="number"
                  id="default_idle_rate"
                  step="0.01"
                  min="0"
                  value={formData.default_idle_rate}
                  onChange={(e) => setFormData({ ...formData, default_idle_rate: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  placeholder="Rate when equipment is idle"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false)
                  setEditingProfile(null)
                }}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                {editingProfile ? 'Update' : 'Create'} Profile
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {plantProfiles.length === 0 ? (
          <div className="col-span-full text-center py-12 bg-gray-50 rounded-lg">
            <Truck className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-sm font-medium text-gray-900">No plant profiles</h3>
            <p className="mt-2 text-sm text-gray-500">Get started by adding your first plant profile.</p>
          </div>
        ) : (
          plantProfiles.map((profile) => (
            <div key={profile.id} className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center">
                  <Truck className="h-5 w-5 text-gray-500 mr-2" />
                  <h3 className="text-lg font-medium text-gray-900">{profile.machine_name}</h3>
                </div>
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => handleEdit(profile)}
                    className="p-1 text-gray-400 hover:text-gray-600"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(profile.id)}
                    className="p-1 text-gray-400 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              
              <div className="space-y-2 text-sm">
                {profile.machine_type && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Type:</span>
                    <span className="text-gray-900">{profile.machine_type}</span>
                  </div>
                )}
                {profile.supplier && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Supplier:</span>
                    <span className="text-gray-900">{profile.supplier}</span>
                  </div>
                )}
                {profile.model && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Model:</span>
                    <span className="text-gray-900">{profile.model}</span>
                  </div>
                )}
                {profile.registration && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Registration:</span>
                    <span className="text-gray-900">{profile.registration}</span>
                  </div>
                )}
                {profile.fuel_type && (
                  <div className="flex justify-between">
                    <span className="text-gray-500 flex items-center">
                      <Fuel className="h-3 w-3 mr-1" />
                      Fuel:
                    </span>
                    <span className="text-gray-900">{profile.fuel_type}</span>
                  </div>
                )}
                <div className="pt-2 border-t border-gray-100">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 flex items-center">
                      <DollarSign className="h-3 w-3" />
                      Hourly Rate:
                    </span>
                    <span className="text-green-600 font-medium">${profile.default_hourly_rate}/hr</span>
                  </div>
                  {profile.default_idle_rate && (
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-gray-500 flex items-center">
                        <DollarSign className="h-3 w-3" />
                        Idle Rate:
                      </span>
                      <span className="text-yellow-600 font-medium">${profile.default_idle_rate}/hr</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}