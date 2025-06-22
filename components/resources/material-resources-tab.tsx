'use client'

import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, Package, DollarSign, FileText } from 'lucide-react'
import { 
  getMaterialProfilesAction, 
  createMaterialProfileAction, 
  updateMaterialProfileAction,
  deleteMaterialProfileAction
} from '@/lib/actions'
import { MaterialProfile } from '@/types/database'

export function MaterialResourcesTab() {
  const [materialProfiles, setMaterialProfiles] = useState<MaterialProfile[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingProfile, setEditingProfile] = useState<MaterialProfile | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    material_name: '',
    material_category: '',
    supplier: '',
    default_unit_rate: '',
    default_unit: '',
    specification: ''
  })

  useEffect(() => {
    loadMaterialProfiles()
  }, [])

  const loadMaterialProfiles = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const result = await getMaterialProfilesAction()
      if (result.success && result.data) {
        setMaterialProfiles(result.data)
      } else {
        setError(result.error || 'Failed to load material profiles')
      }
    } catch (error) {
      console.error('Error loading material profiles:', error)
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
        default_unit_rate: parseFloat(formData.default_unit_rate)
      }

      if (editingProfile) {
        const result = await updateMaterialProfileAction(editingProfile.id, profileData)
        if (!result.success) {
          setError(result.error || 'Failed to update material profile')
          return
        }
      } else {
        const result = await createMaterialProfileAction(profileData)
        if (!result.success) {
          setError(result.error || 'Failed to create material profile')
          return
        }
      }

      setShowAddForm(false)
      setEditingProfile(null)
      setFormData({
        material_name: '',
        material_category: '',
        supplier: '',
        default_unit_rate: '',
        default_unit: '',
        specification: ''
      })
      loadMaterialProfiles()
    } catch (error) {
      console.error('Error submitting material profile:', error)
      setError('An unexpected error occurred')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this material profile?')) {
      return
    }

    try {
      const result = await deleteMaterialProfileAction(id)
      if (result.success) {
        loadMaterialProfiles()
      } else {
        setError(result.error || 'Failed to delete material profile')
      }
    } catch (error) {
      console.error('Error deleting material profile:', error)
      setError('An unexpected error occurred')
    }
  }

  const handleEdit = (profile: MaterialProfile) => {
    setEditingProfile(profile)
    setFormData({
      material_name: profile.material_name,
      material_category: profile.material_category || '',
      supplier: profile.supplier || '',
      default_unit_rate: profile.default_unit_rate.toString(),
      default_unit: profile.default_unit,
      specification: profile.specification || ''
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
        <h2 className="text-lg font-medium text-gray-900">Material Profiles</h2>
        <button
          onClick={() => {
            setEditingProfile(null)
            setFormData({
              material_name: '',
              material_category: '',
              supplier: '',
              default_unit_rate: '',
              default_unit: '',
              specification: ''
            })
            setShowAddForm(true)
          }}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Material Profile
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
            {editingProfile ? 'Edit Material Profile' : 'Add New Material Profile'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="material_name" className="block text-sm font-medium text-gray-700">
                  Material Name *
                </label>
                <input
                  type="text"
                  id="material_name"
                  required
                  value={formData.material_name}
                  onChange={(e) => setFormData({ ...formData, material_name: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  placeholder="e.g., Concrete 32 MPa"
                />
              </div>
              <div>
                <label htmlFor="material_category" className="block text-sm font-medium text-gray-700">
                  Category
                </label>
                <select
                  id="material_category"
                  value={formData.material_category}
                  onChange={(e) => setFormData({ ...formData, material_category: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                >
                  <option value="">Select category</option>
                  <option value="Concrete">Concrete</option>
                  <option value="Steel">Steel</option>
                  <option value="Aggregate">Aggregate</option>
                  <option value="Asphalt">Asphalt</option>
                  <option value="Timber">Timber</option>
                  <option value="Sand">Sand</option>
                  <option value="Cement">Cement</option>
                  <option value="Pipes">Pipes</option>
                  <option value="Electrical">Electrical</option>
                  <option value="Plumbing">Plumbing</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label htmlFor="supplier" className="block text-sm font-medium text-gray-700">
                  Default Supplier
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
                <label htmlFor="specification" className="block text-sm font-medium text-gray-700">
                  Specification
                </label>
                <input
                  type="text"
                  id="specification"
                  value={formData.specification}
                  onChange={(e) => setFormData({ ...formData, specification: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  placeholder="e.g., AS 3600 compliant"
                />
              </div>
              <div>
                <label htmlFor="default_unit" className="block text-sm font-medium text-gray-700">
                  Default Unit *
                </label>
                <select
                  id="default_unit"
                  required
                  value={formData.default_unit}
                  onChange={(e) => setFormData({ ...formData, default_unit: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                >
                  <option value="">Select unit</option>
                  <option value="m3">m³ (Cubic Meters)</option>
                  <option value="m2">m² (Square Meters)</option>
                  <option value="m">m (Linear Meters)</option>
                  <option value="kg">kg (Kilograms)</option>
                  <option value="tonnes">Tonnes</option>
                  <option value="litres">Litres</option>
                  <option value="units">Units</option>
                  <option value="bags">Bags</option>
                  <option value="pallets">Pallets</option>
                  <option value="rolls">Rolls</option>
                  <option value="sheets">Sheets</option>
                </select>
              </div>
              <div>
                <label htmlFor="default_unit_rate" className="block text-sm font-medium text-gray-700">
                  Default Rate per Unit ($) *
                </label>
                <input
                  type="number"
                  id="default_unit_rate"
                  required
                  step="0.01"
                  min="0"
                  value={formData.default_unit_rate}
                  onChange={(e) => setFormData({ ...formData, default_unit_rate: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
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
        {materialProfiles.length === 0 ? (
          <div className="col-span-full text-center py-12 bg-gray-50 rounded-lg">
            <Package className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-sm font-medium text-gray-900">No material profiles</h3>
            <p className="mt-2 text-sm text-gray-500">Get started by adding your first material profile.</p>
          </div>
        ) : (
          materialProfiles.map((profile) => (
            <div key={profile.id} className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center">
                  <Package className="h-5 w-5 text-gray-500 mr-2" />
                  <h3 className="text-lg font-medium text-gray-900">{profile.material_name}</h3>
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
                {profile.material_category && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Category:</span>
                    <span className="text-gray-900">{profile.material_category}</span>
                  </div>
                )}
                {profile.supplier && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Supplier:</span>
                    <span className="text-gray-900">{profile.supplier}</span>
                  </div>
                )}
                {profile.specification && (
                  <div className="flex justify-between">
                    <span className="text-gray-500 flex items-center">
                      <FileText className="h-3 w-3 mr-1" />
                      Spec:
                    </span>
                    <span className="text-gray-900 text-right">{profile.specification}</span>
                  </div>
                )}
                <div className="pt-2 border-t border-gray-100">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Unit:</span>
                    <span className="text-gray-900 font-medium">{profile.default_unit}</span>
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-gray-500 flex items-center">
                      <DollarSign className="h-3 w-3" />
                      Rate:
                    </span>
                    <span className="text-green-600 font-medium">
                      ${profile.default_unit_rate}/{profile.default_unit}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}