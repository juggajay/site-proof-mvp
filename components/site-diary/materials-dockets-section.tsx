'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { Package, Plus, DollarSign, FileText } from 'lucide-react'
import { DailyMaterials, CreateDailyMaterialsRequest } from '@/types/database'
import { createDailyMaterialsAction } from '@/lib/actions'

interface MaterialsDocketsSectionProps {
  lotId: string
  date: Date
  materialsRecords: DailyMaterials[]
  onUpdate: () => void
}

export function MaterialsDocketsSection({ lotId, date, materialsRecords, onUpdate }: MaterialsDocketsSectionProps) {
  const [showForm, setShowForm] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    material_type: '',
    supplier: '',
    quantity: '',
    unit_measure: '',
    unit_cost: '',
    total_cost: '',
    delivery_docket: '',
    quality_notes: '',
    received_by: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      const materialsData: CreateDailyMaterialsRequest = {
        lot_id: parseInt(lotId),
        delivery_date: format(date, 'yyyy-MM-dd'),
        material_type: formData.material_type,
        supplier: formData.supplier || undefined,
        quantity: parseFloat(formData.quantity),
        unit_measure: formData.unit_measure || undefined,
        unit_cost: formData.unit_cost ? parseFloat(formData.unit_cost) : undefined,
        total_cost: formData.total_cost ? parseFloat(formData.total_cost) : undefined,
        delivery_docket: formData.delivery_docket || undefined,
        quality_notes: formData.quality_notes || undefined,
        received_by: formData.received_by || undefined,
      }

      const result = await createDailyMaterialsAction(materialsData)
      
      if (result.success) {
        setShowForm(false)
        setFormData({
          material_type: '',
          supplier: '',
          quantity: '',
          unit_measure: '',
          unit_cost: '',
          total_cost: '',
          delivery_docket: '',
          quality_notes: '',
          received_by: '',
        })
        onUpdate()
      } else {
        setError(result.error || 'Failed to create materials record')
      }
    } catch (error) {
      console.error('Error creating materials record:', error)
      setError('An unexpected error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => {
      const updated = { ...prev, [name]: value }
      
      // Auto-calculate total cost
      if ((name === 'quantity' || name === 'unit_cost') && updated.quantity && updated.unit_cost) {
        updated.total_cost = (parseFloat(updated.quantity) * parseFloat(updated.unit_cost)).toFixed(2)
      }
      
      return updated
    })
  }

  const getTotalQuantity = (materialType: string) => {
    return materialsRecords
      .filter(record => record.material_type === materialType)
      .reduce((total, record) => total + (record.quantity || 0), 0)
  }

  const getTotalCost = () => {
    return materialsRecords.reduce((total, record) => total + (record.total_cost || 0), 0)
  }

  const getMaterialTypes = () => {
    const types = new Set(materialsRecords.map(r => r.material_type))
    return Array.from(types)
  }

  return (
    <div>
      {showForm ? (
        <form onSubmit={handleSubmit} className="space-y-4 mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-md font-medium text-gray-900">Add Materials Docket</h4>
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
              <label htmlFor="material_type" className="block text-sm font-medium text-gray-700">
                Material Type *
              </label>
              <select
                id="material_type"
                name="material_type"
                value={formData.material_type}
                onChange={handleChange}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              >
                <option value="">Select material</option>
                <option value="concrete">Concrete</option>
                <option value="steel">Steel</option>
                <option value="aggregate">Aggregate</option>
                <option value="sand">Sand</option>
                <option value="cement">Cement</option>
                <option value="bricks">Bricks</option>
                <option value="timber">Timber</option>
                <option value="pipes">Pipes</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label htmlFor="supplier" className="block text-sm font-medium text-gray-700">
                Supplier
              </label>
              <input
                type="text"
                id="supplier"
                name="supplier"
                value={formData.supplier}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>

            <div>
              <label htmlFor="quantity" className="block text-sm font-medium text-gray-700">
                Quantity *
              </label>
              <input
                type="number"
                id="quantity"
                name="quantity"
                value={formData.quantity}
                onChange={handleChange}
                required
                step="0.001"
                min="0"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>

            <div>
              <label htmlFor="unit_measure" className="block text-sm font-medium text-gray-700">
                Unit of Measure
              </label>
              <select
                id="unit_measure"
                name="unit_measure"
                value={formData.unit_measure}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              >
                <option value="">Select unit</option>
                <option value="m3">m³</option>
                <option value="tonnes">tonnes</option>
                <option value="kg">kg</option>
                <option value="pieces">pieces</option>
                <option value="litres">litres</option>
                <option value="meters">meters</option>
              </select>
            </div>

            <div>
              <label htmlFor="unit_cost" className="block text-sm font-medium text-gray-700">
                Unit Cost ($)
              </label>
              <input
                type="number"
                id="unit_cost"
                name="unit_cost"
                value={formData.unit_cost}
                onChange={handleChange}
                step="0.01"
                min="0"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>

            <div>
              <label htmlFor="total_cost" className="block text-sm font-medium text-gray-700">
                Total Cost ($)
              </label>
              <input
                type="number"
                id="total_cost"
                name="total_cost"
                value={formData.total_cost}
                onChange={handleChange}
                step="0.01"
                min="0"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>

            <div>
              <label htmlFor="delivery_docket" className="block text-sm font-medium text-gray-700">
                Delivery Docket #
              </label>
              <input
                type="text"
                id="delivery_docket"
                name="delivery_docket"
                value={formData.delivery_docket}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                placeholder="e.g., DOC-12345"
              />
            </div>

            <div>
              <label htmlFor="received_by" className="block text-sm font-medium text-gray-700">
                Received By
              </label>
              <input
                type="text"
                id="received_by"
                name="received_by"
                value={formData.received_by}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>
          </div>

          <div>
            <label htmlFor="quality_notes" className="block text-sm font-medium text-gray-700">
              Quality Notes
            </label>
            <textarea
              id="quality_notes"
              name="quality_notes"
              rows={2}
              value={formData.quality_notes}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              placeholder="Any quality checks or issues..."
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
            Add Materials Docket
          </button>
          
          {materialsRecords.length > 0 && (
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <span className="flex items-center">
                <DollarSign className="h-4 w-4 mr-1" />
                Total Cost: ${getTotalCost().toFixed(2)}
              </span>
            </div>
          )}
        </div>
      )}

      {materialsRecords.length === 0 ? (
        <div className="text-center py-12">
          <Package className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-sm font-medium text-gray-900">No Materials Records</h3>
          <p className="mt-2 text-sm text-gray-500">
            No materials delivered on {format(date, 'MMMM d, yyyy')}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Summary by material type */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            {getMaterialTypes().map(type => (
              <div key={type} className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500 uppercase">{type}</p>
                <p className="text-lg font-semibold text-gray-900">
                  {getTotalQuantity(type).toFixed(3)}
                </p>
              </div>
            ))}
          </div>

          {/* Detailed records */}
          <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
            <table className="min-w-full divide-y divide-gray-300">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Material
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Supplier
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quantity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Unit Cost
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Docket #
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Received By
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Notes
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {materialsRecords.map((record) => (
                  <tr key={record.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {record.material_type}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {record.supplier || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {record.quantity} {record.unit_measure || ''}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {record.unit_cost ? `$${record.unit_cost}` : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {record.total_cost ? `$${record.total_cost.toFixed(2)}` : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {record.delivery_docket ? (
                        <span className="inline-flex items-center">
                          <FileText className="h-3 w-3 mr-1" />
                          {record.delivery_docket}
                        </span>
                      ) : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {record.received_by || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {record.quality_notes ? (
                        <span className="truncate max-w-xs block" title={record.quality_notes}>
                          {record.quality_notes}
                        </span>
                      ) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}