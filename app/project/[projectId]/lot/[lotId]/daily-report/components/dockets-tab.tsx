'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '../../../../../../../lib/supabase/client'

interface DocketsTabProps {
  lot: any
  dailyReport: any
  onUpdate: () => void
}

interface LabourDocket {
  id?: string
  person_name: string
  company: string
  trade: string
  hours_worked: number
  hourly_rate?: number
  notes?: string
  total_cost?: number
}

interface PlantDocket {
  id?: string
  equipment_name: string
  equipment_type: string
  docket_number: string
  operator_name: string
  hours_worked: number
  hourly_rate?: number
  fuel_consumption?: number
  notes?: string
  total_cost?: number
}

interface MaterialDocket {
  id?: string
  material_name: string
  supplier: string
  docket_number: string
  quantity: number
  unit: string
  unit_rate?: number
  delivery_time?: string
  truck_rego?: string
  notes?: string
  total_cost?: number
}

export function DocketsTab({ lot, dailyReport, onUpdate }: DocketsTabProps) {
  const [activeSection, setActiveSection] = useState<'labour' | 'plant' | 'materials'>('labour')
  const [labourDockets, setLabourDockets] = useState<LabourDocket[]>([])
  const [plantDockets, setPlantDockets] = useState<PlantDocket[]>([])
  const [materialDockets, setMaterialDocket] = useState<MaterialDocket[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const supabase = createClient()

  // Load all dockets on mount
  const loadAllDockets = useCallback(async () => {
    setIsLoading(true)
    try {
      const [labourData, plantData, materialData] = await Promise.all([
        supabase.from('labour_dockets').select('*').eq('daily_report_id', dailyReport.id),
        supabase.from('plant_dockets').select('*').eq('daily_report_id', dailyReport.id),
        supabase.from('material_dockets').select('*').eq('daily_report_id', dailyReport.id)
      ])

      setLabourDockets(labourData.data || [])
      setPlantDockets(plantData.data || [])
      setMaterialDocket(materialData.data || [])
    } catch (error) {
      console.error('Error loading dockets:', error)
    } finally {
      setIsLoading(false)
    }
  }, [dailyReport?.id, supabase])

  useEffect(() => {
    if (dailyReport?.id) {
      loadAllDockets()
    }
  }, [dailyReport?.id, loadAllDockets])

  // Labour docket functions
  const addLabourDocket = async (docket: LabourDocket) => {
    try {
      const { error } = await supabase
        .from('labour_dockets')
        .insert([{ ...docket, daily_report_id: dailyReport.id }])

      if (error) throw error
      await loadAllDockets()
    } catch (error) {
      console.error('Error adding labour docket:', error)
      alert('Failed to add labour record')
    }
  }

  const addPlantDocket = async (docket: PlantDocket) => {
    try {
      const { error } = await supabase
        .from('plant_dockets')
        .insert([{ ...docket, daily_report_id: dailyReport.id }])

      if (error) throw error
      await loadAllDockets()
    } catch (error) {
      console.error('Error adding plant docket:', error)
      alert('Failed to add plant record')
    }
  }

  const addMaterialDocket = async (docket: MaterialDocket) => {
    try {
      const { error } = await supabase
        .from('material_dockets')
        .insert([{ ...docket, daily_report_id: dailyReport.id }])

      if (error) throw error
      await loadAllDockets()
    } catch (error) {
      console.error('Error adding material docket:', error)
      alert('Failed to add material record')
    }
  }

  const deleteDocket = async (type: 'labour' | 'plant' | 'materials', id: string) => {
    try {
      const table = type === 'labour' ? 'labour_dockets' : 
                   type === 'plant' ? 'plant_dockets' : 'material_dockets'
      
      const { error } = await supabase.from(table).delete().eq('id', id)
      if (error) throw error
      await loadAllDockets()
    } catch (error) {
      console.error('Error deleting docket:', error)
      alert('Failed to delete record')
    }
  }

  const calculateTotals = () => {
    const labourTotal = labourDockets.reduce((sum, d) => sum + (d.total_cost || 0), 0)
    const plantTotal = plantDockets.reduce((sum, d) => sum + (d.total_cost || 0), 0)
    const materialTotal = materialDockets.reduce((sum, d) => sum + (d.total_cost || 0), 0)
    
    return {
      labour: labourTotal,
      plant: plantTotal,
      materials: materialTotal,
      total: labourTotal + plantTotal + materialTotal
    }
  }

  const totals = calculateTotals()

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="text-sm font-medium text-blue-600 dark:text-blue-400">Labour</div>
          <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
            ${totals.labour.toLocaleString()}
          </div>
          <div className="text-xs text-blue-600 dark:text-blue-400">
            {labourDockets.length} entries
          </div>
        </div>
        
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <div className="text-sm font-medium text-green-600 dark:text-green-400">Plant</div>
          <div className="text-2xl font-bold text-green-900 dark:text-green-100">
            ${totals.plant.toLocaleString()}
          </div>
          <div className="text-xs text-green-600 dark:text-green-400">
            {plantDockets.length} entries
          </div>
        </div>
        
        <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
          <div className="text-sm font-medium text-orange-600 dark:text-orange-400">Materials</div>
          <div className="text-2xl font-bold text-orange-900 dark:text-orange-100">
            ${totals.materials.toLocaleString()}
          </div>
          <div className="text-xs text-orange-600 dark:text-orange-400">
            {materialDockets.length} entries
          </div>
        </div>
        
        <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
          <div className="text-sm font-medium text-purple-600 dark:text-purple-400">Total Today</div>
          <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">
            ${totals.total.toLocaleString()}
          </div>
          <div className="text-xs text-purple-600 dark:text-purple-400">
            All categories
          </div>
        </div>
      </div>

      {/* Section Navigation */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-8 px-6">
            {[
              { key: 'labour', label: '👷 Labour', count: labourDockets.length },
              { key: 'plant', label: '🚜 Plant & Equipment', count: plantDockets.length },
              { key: 'materials', label: '🧱 Materials', count: materialDockets.length }
            ].map(({ key, label, count }) => (
              <button
                key={key}
                onClick={() => setActiveSection(key as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeSection === key
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
                }`}
              >
                {label} ({count})
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* Labour Section */}
          {activeSection === 'labour' && (
            <LabourSection 
              dockets={labourDockets}
              onAdd={addLabourDocket}
              onDelete={(id) => deleteDocket('labour', id)}
              isLoading={isLoading}
            />
          )}

          {/* Plant Section */}
          {activeSection === 'plant' && (
            <PlantSection 
              dockets={plantDockets}
              onAdd={addPlantDocket}
              onDelete={(id) => deleteDocket('plant', id)}
              isLoading={isLoading}
            />
          )}

          {/* Materials Section */}
          {activeSection === 'materials' && (
            <MaterialsSection 
              dockets={materialDockets}
              onAdd={addMaterialDocket}
              onDelete={(id) => deleteDocket('materials', id)}
              isLoading={isLoading}
            />
          )}
        </div>
      </div>
    </div>
  )
}

// Labour Section Component
function LabourSection({ dockets, onAdd, onDelete, isLoading }: {
  dockets: LabourDocket[]
  onAdd: (docket: LabourDocket) => void
  onDelete: (id: string) => void
  isLoading: boolean
}) {
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState<LabourDocket>({
    person_name: '',
    company: '',
    trade: '',
    hours_worked: 0,
    hourly_rate: 0,
    notes: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.person_name || !formData.hours_worked) {
      alert('Please fill in required fields')
      return
    }
    
    await onAdd(formData)
    setFormData({
      person_name: '',
      company: '',
      trade: '',
      hours_worked: 0,
      hourly_rate: 0,
      notes: ''
    })
    setShowForm(false)
  }

  const commonTrades = [
    'General Labourer', 'Plant Operator', 'Truck Driver', 'Concrete Finisher',
    'Steel Fixer', 'Carpenter', 'Electrician', 'Plumber', 'Supervisor', 'Foreman'
  ]

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Labour Records</h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Labour
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Person Name *</label>
              <input
                type="text"
                value={formData.person_name}
                onChange={(e) => setFormData({...formData, person_name: e.target.value})}
                className="w-full px-3 py-2 border rounded-md dark:bg-gray-600 dark:border-gray-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Company</label>
              <input
                type="text"
                value={formData.company}
                onChange={(e) => setFormData({...formData, company: e.target.value})}
                className="w-full px-3 py-2 border rounded-md dark:bg-gray-600 dark:border-gray-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Trade</label>
              <select
                value={formData.trade}
                onChange={(e) => setFormData({...formData, trade: e.target.value})}
                className="w-full px-3 py-2 border rounded-md dark:bg-gray-600 dark:border-gray-500"
              >
                <option value="">Select trade...</option>
                {commonTrades.map(trade => (
                  <option key={trade} value={trade}>{trade}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Hours Worked *</label>
              <input
                type="number"
                step="0.25"
                min="0"
                value={formData.hours_worked || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  hours_worked: e.target.value ? parseFloat(e.target.value) : 0
                })}
                className="w-full px-3 py-2 border rounded-md dark:bg-gray-600 dark:border-gray-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Hourly Rate ($)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.hourly_rate || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  hourly_rate: e.target.value ? parseFloat(e.target.value) : 0
                })}
                className="w-full px-3 py-2 border rounded-md dark:bg-gray-600 dark:border-gray-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Notes</label>
              <input
                type="text"
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                className="w-full px-3 py-2 border rounded-md dark:bg-gray-600 dark:border-gray-500"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              Add Record
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Labour Records List */}
      <div className="space-y-2">
        {dockets.map((docket) => (
          <div key={docket.id} className="border rounded-lg p-3 bg-white dark:bg-gray-800">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-medium">{docket.person_name}</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {docket.company} • {docket.trade} • {docket.hours_worked}h
                  {docket.hourly_rate && ` @ $${docket.hourly_rate}/h = $${(docket.total_cost || 0).toFixed(2)}`}
                </p>
                {docket.notes && (
                  <p className="text-sm text-gray-500 mt-1">{docket.notes}</p>
                )}
              </div>
              <button
                onClick={() => onDelete(docket.id!)}
                className="text-red-500 hover:text-red-700"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        ))}
        {dockets.length === 0 && (
          <p className="text-center text-gray-500 py-4">No labour records for today</p>
        )}
      </div>
    </div>
  )
}

// Plant Section Component
function PlantSection({ dockets, onAdd, onDelete, isLoading }: {
  dockets: PlantDocket[]
  onAdd: (docket: PlantDocket) => void
  onDelete: (id: string) => void
  isLoading: boolean
}) {
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState<PlantDocket>({
    equipment_name: '',
    equipment_type: '',
    docket_number: '',
    operator_name: '',
    hours_worked: 0,
    hourly_rate: 0,
    fuel_consumption: 0,
    notes: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.equipment_name || !formData.hours_worked) {
      alert('Please fill in required fields')
      return
    }
    
    await onAdd(formData)
    setFormData({
      equipment_name: '',
      equipment_type: '',
      docket_number: '',
      operator_name: '',
      hours_worked: 0,
      hourly_rate: 0,
      fuel_consumption: 0,
      notes: ''
    })
    setShowForm(false)
  }

  const equipmentTypes = [
    'Excavator', 'Bulldozer', 'Grader', 'Compactor', 'Truck', 'Crane', 
    'Loader', 'Scraper', 'Paver', 'Roller', 'Generator', 'Pump'
  ]

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Plant & Equipment Records</h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Plant
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Equipment Name *</label>
              <input
                type="text"
                value={formData.equipment_name}
                onChange={(e) => setFormData({...formData, equipment_name: e.target.value})}
                className="w-full px-3 py-2 border rounded-md dark:bg-gray-600 dark:border-gray-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Equipment Type</label>
              <select
                value={formData.equipment_type}
                onChange={(e) => setFormData({...formData, equipment_type: e.target.value})}
                className="w-full px-3 py-2 border rounded-md dark:bg-gray-600 dark:border-gray-500"
              >
                <option value="">Select type...</option>
                {equipmentTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Docket Number</label>
              <input
                type="text"
                value={formData.docket_number}
                onChange={(e) => setFormData({...formData, docket_number: e.target.value})}
                className="w-full px-3 py-2 border rounded-md dark:bg-gray-600 dark:border-gray-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Operator Name</label>
              <input
                type="text"
                value={formData.operator_name}
                onChange={(e) => setFormData({...formData, operator_name: e.target.value})}
                className="w-full px-3 py-2 border rounded-md dark:bg-gray-600 dark:border-gray-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Hours Worked *</label>
              <input
                type="number"
                step="0.25"
                min="0"
                value={formData.hours_worked || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  hours_worked: e.target.value ? parseFloat(e.target.value) : 0
                })}
                className="w-full px-3 py-2 border rounded-md dark:bg-gray-600 dark:border-gray-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Hourly Rate ($)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.hourly_rate || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  hourly_rate: e.target.value ? parseFloat(e.target.value) : 0
                })}
                className="w-full px-3 py-2 border rounded-md dark:bg-gray-600 dark:border-gray-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Fuel Consumption (L)</label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={formData.fuel_consumption || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  fuel_consumption: e.target.value ? parseFloat(e.target.value) : 0
                })}
                className="w-full px-3 py-2 border rounded-md dark:bg-gray-600 dark:border-gray-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Notes</label>
              <input
                type="text"
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                className="w-full px-3 py-2 border rounded-md dark:bg-gray-600 dark:border-gray-500"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              Add Record
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Plant Records List */}
      <div className="space-y-2">
        {dockets.map((docket) => (
          <div key={docket.id} className="border rounded-lg p-3 bg-white dark:bg-gray-800">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-medium">{docket.equipment_name}</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {docket.equipment_type} • {docket.operator_name} • {docket.hours_worked}h
                  {docket.hourly_rate && ` @ $${docket.hourly_rate}/h = $${(docket.total_cost || 0).toFixed(2)}`}
                </p>
                {docket.docket_number && (
                  <p className="text-sm text-gray-500">Docket: {docket.docket_number}</p>
                )}
                {docket.fuel_consumption && (
                  <p className="text-sm text-gray-500">Fuel: {docket.fuel_consumption}L</p>
                )}
                {docket.notes && (
                  <p className="text-sm text-gray-500 mt-1">{docket.notes}</p>
                )}
              </div>
              <button
                onClick={() => onDelete(docket.id!)}
                className="text-red-500 hover:text-red-700"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        ))}
        {dockets.length === 0 && (
          <p className="text-center text-gray-500 py-4">No plant records for today</p>
        )}
      </div>
    </div>
  )
}

// Materials Section Component
function MaterialsSection({ dockets, onAdd, onDelete, isLoading }: {
  dockets: MaterialDocket[]
  onAdd: (docket: MaterialDocket) => void
  onDelete: (id: string) => void
  isLoading: boolean
}) {
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState<MaterialDocket>({
    material_name: '',
    supplier: '',
    docket_number: '',
    quantity: 0,
    unit: '',
    unit_rate: 0,
    delivery_time: '',
    truck_rego: '',
    notes: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.material_name || !formData.quantity || !formData.unit) {
      alert('Please fill in required fields')
      return
    }
    
    await onAdd(formData)
    setFormData({
      material_name: '',
      supplier: '',
      docket_number: '',
      quantity: 0,
      unit: '',
      unit_rate: 0,
      delivery_time: '',
      truck_rego: '',
      notes: ''
    })
    setShowForm(false)
  }

  const commonMaterials = [
    'Concrete', 'Aggregate', 'Sand', 'Gravel', 'Asphalt', 'Steel', 
    'Timber', 'Pipe', 'Cement', 'Bitumen', 'Fuel', 'Water'
  ]

  const commonUnits = [
    'm³', 'tonnes', 'litres', 'metres', 'each', 'kg', 'loads'
  ]

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Materials Records</h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Material
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Material Name *</label>
              <select
                value={formData.material_name}
                onChange={(e) => setFormData({...formData, material_name: e.target.value})}
                className="w-full px-3 py-2 border rounded-md dark:bg-gray-600 dark:border-gray-500"
                required
              >
                <option value="">Select material...</option>
                {commonMaterials.map(material => (
                  <option key={material} value={material}>{material}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Supplier</label>
              <input
                type="text"
                value={formData.supplier}
                onChange={(e) => setFormData({...formData, supplier: e.target.value})}
                className="w-full px-3 py-2 border rounded-md dark:bg-gray-600 dark:border-gray-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Docket Number</label>
              <input
                type="text"
                value={formData.docket_number}
                onChange={(e) => setFormData({...formData, docket_number: e.target.value})}
                className="w-full px-3 py-2 border rounded-md dark:bg-gray-600 dark:border-gray-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Quantity *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.quantity || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  quantity: e.target.value ? parseFloat(e.target.value) : 0
                })}
                className="w-full px-3 py-2 border rounded-md dark:bg-gray-600 dark:border-gray-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Unit *</label>
              <select
                value={formData.unit}
                onChange={(e) => setFormData({...formData, unit: e.target.value})}
                className="w-full px-3 py-2 border rounded-md dark:bg-gray-600 dark:border-gray-500"
                required
              >
                <option value="">Select unit...</option>
                {commonUnits.map(unit => (
                  <option key={unit} value={unit}>{unit}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Unit Rate ($)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.unit_rate || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  unit_rate: e.target.value ? parseFloat(e.target.value) : 0
                })}
                className="w-full px-3 py-2 border rounded-md dark:bg-gray-600 dark:border-gray-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Delivery Time</label>
              <input
                type="time"
                value={formData.delivery_time}
                onChange={(e) => setFormData({...formData, delivery_time: e.target.value})}
                className="w-full px-3 py-2 border rounded-md dark:bg-gray-600 dark:border-gray-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Truck Rego</label>
              <input
                type="text"
                value={formData.truck_rego}
                onChange={(e) => setFormData({...formData, truck_rego: e.target.value})}
                className="w-full px-3 py-2 border rounded-md dark:bg-gray-600 dark:border-gray-500"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Notes</label>
              <input
                type="text"
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                className="w-full px-3 py-2 border rounded-md dark:bg-gray-600 dark:border-gray-500"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              Add Record
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Materials Records List */}
      <div className="space-y-2">
        {dockets.map((docket) => (
          <div key={docket.id} className="border rounded-lg p-3 bg-white dark:bg-gray-800">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-medium">{docket.material_name}</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {docket.supplier} • {docket.quantity} {docket.unit}
                  {docket.unit_rate && ` @ $${docket.unit_rate}/${docket.unit} = $${(docket.total_cost || 0).toFixed(2)}`}
                </p>
                {docket.docket_number && (
                  <p className="text-sm text-gray-500">Docket: {docket.docket_number}</p>
                )}
                {docket.delivery_time && (
                  <p className="text-sm text-gray-500">Delivered: {docket.delivery_time}</p>
                )}
                {docket.truck_rego && (
                  <p className="text-sm text-gray-500">Truck: {docket.truck_rego}</p>
                )}
                {docket.notes && (
                  <p className="text-sm text-gray-500 mt-1">{docket.notes}</p>
                )}
              </div>
              <button
                onClick={() => onDelete(docket.id!)}
                className="text-red-500 hover:text-red-700"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        ))}
        {dockets.length === 0 && (
          <p className="text-center text-gray-500 py-4">No material records for today</p>
        )}
      </div>
    </div>
  )
}