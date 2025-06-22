'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { Users, Plus, Clock, DollarSign } from 'lucide-react'
import { DailyLabour, CreateDailyLabourRequest, SubcontractorEmployee, Subcontractor } from '@/types/database'
import { createDailyLabourAction, getSubcontractorEmployeesAction, getSubcontractorsAction } from '@/lib/actions'

interface LabourDocketsSectionProps {
  lotId: string
  date: Date
  labourRecords: DailyLabour[]
  onUpdate: () => void
}

export function LabourDocketsSection({ lotId, date, labourRecords, onUpdate }: LabourDocketsSectionProps) {
  const [showForm, setShowForm] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [employees, setEmployees] = useState<SubcontractorEmployee[]>([])
  const [subcontractors, setSubcontractors] = useState<Subcontractor[]>([])
  const [selectedEmployee, setSelectedEmployee] = useState<SubcontractorEmployee | null>(null)
  const [isLoadingResources, setIsLoadingResources] = useState(false)
  
  const [formData, setFormData] = useState({
    worker_name: '',
    trade: '',
    hours_worked: '',
    hourly_rate: '',
    overtime_hours: '0',
    overtime_rate: '',
    task_description: '',
    subcontractor_employee_id: '',
    subcontractor_id: ''
  })

  useEffect(() => {
    if (showForm) {
      loadResources()
    }
  }, [showForm])

  const loadResources = async () => {
    setIsLoadingResources(true)
    try {
      const [employeesResult, subcontractorsResult] = await Promise.all([
        getSubcontractorEmployeesAction(),
        getSubcontractorsAction()
      ])
      
      if (employeesResult.success && employeesResult.data) {
        setEmployees(employeesResult.data)
      }
      if (subcontractorsResult.success && subcontractorsResult.data) {
        setSubcontractors(subcontractorsResult.data)
      }
    } catch (error) {
      console.error('Error loading resources:', error)
    } finally {
      setIsLoadingResources(false)
    }
  }

  const handleEmployeeSelect = (employeeId: string) => {
    const employee = employees.find(e => e.id === employeeId)
    if (employee) {
      const subcontractor = subcontractors.find(s => s.id === employee.subcontractor_id)
      setSelectedEmployee(employee)
      setFormData({
        ...formData,
        worker_name: employee.employee_name,
        trade: employee.role || '',
        hourly_rate: employee.hourly_rate.toString(),
        subcontractor_employee_id: employee.id,
        subcontractor_id: employee.subcontractor_id
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      const labourData: CreateDailyLabourRequest = {
        lot_id: parseInt(lotId),
        work_date: format(date, 'yyyy-MM-dd'),
        worker_name: formData.worker_name,
        trade: formData.trade || undefined,
        hours_worked: parseFloat(formData.hours_worked),
        hourly_rate: formData.hourly_rate ? parseFloat(formData.hourly_rate) : undefined,
        overtime_hours: formData.overtime_hours ? parseFloat(formData.overtime_hours) : 0,
        overtime_rate: formData.overtime_rate ? parseFloat(formData.overtime_rate) : undefined,
        task_description: formData.task_description || undefined,
        rate_at_time_of_entry: formData.hourly_rate ? parseFloat(formData.hourly_rate) : undefined,
        subcontractor_employee_id: formData.subcontractor_employee_id || undefined,
        subcontractor_id: formData.subcontractor_id || undefined
      }

      const result = await createDailyLabourAction(labourData)
      
      if (result.success) {
        setShowForm(false)
        setFormData({
          worker_name: '',
          trade: '',
          hours_worked: '',
          hourly_rate: '',
          overtime_hours: '0',
          overtime_rate: '',
          task_description: '',
          subcontractor_employee_id: '',
          subcontractor_id: ''
        })
        setSelectedEmployee(null)
        onUpdate()
      } else {
        setError(result.error || 'Failed to create labour record')
      }
    } catch (error) {
      console.error('Error creating labour record:', error)
      setError('An unexpected error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const calculateTotal = (record: DailyLabour) => {
    const regularPay = (record.hours_worked || 0) * (record.hourly_rate || 0)
    const overtimePay = (record.overtime_hours || 0) * (record.overtime_rate || 0)
    return regularPay + overtimePay
  }

  const getTotalHours = () => {
    return labourRecords.reduce((total, record) => total + (record.hours_worked || 0) + (record.overtime_hours || 0), 0)
  }

  const getTotalCost = () => {
    return labourRecords.reduce((total, record) => total + calculateTotal(record), 0)
  }

  return (
    <div>
      {showForm ? (
        <form onSubmit={handleSubmit} className="space-y-4 mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-md font-medium text-gray-900">Add Labour Docket</h4>
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
            <div className="md:col-span-2">
              <label htmlFor="employee_select" className="block text-sm font-medium text-gray-700">
                Select Employee
              </label>
              {isLoadingResources ? (
                <div className="mt-1 text-sm text-gray-500">Loading employees...</div>
              ) : (
                <select
                  id="employee_select"
                  value={formData.subcontractor_employee_id}
                  onChange={(e) => handleEmployeeSelect(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                >
                  <option value="">Select from resource library or enter manually</option>
                  {employees.map((employee) => {
                    const subcontractor = subcontractors.find(s => s.id === employee.subcontractor_id)
                    return (
                      <option key={employee.id} value={employee.id}>
                        {employee.employee_name} - {subcontractor?.company_name || 'Unknown Company'} 
                        {employee.role && ` (${employee.role})`} - ${employee.hourly_rate}/hr
                      </option>
                    )
                  })}
                </select>
              )}
            </div>

            <div>
              <label htmlFor="worker_name" className="block text-sm font-medium text-gray-700">
                Worker Name *
              </label>
              <input
                type="text"
                id="worker_name"
                name="worker_name"
                value={formData.worker_name}
                onChange={handleChange}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                placeholder={selectedEmployee ? "Auto-filled from selection" : "Enter manually"}
              />
            </div>

            <div>
              <label htmlFor="trade" className="block text-sm font-medium text-gray-700">
                Trade
              </label>
              <select
                id="trade"
                name="trade"
                value={formData.trade}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              >
                <option value="">Select trade</option>
                <option value="electrician">Electrician</option>
                <option value="plumber">Plumber</option>
                <option value="carpenter">Carpenter</option>
                <option value="laborer">Laborer</option>
                <option value="foreman">Foreman</option>
                <option value="operator">Operator</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label htmlFor="hours_worked" className="block text-sm font-medium text-gray-700">
                Regular Hours *
              </label>
              <input
                type="number"
                id="hours_worked"
                name="hours_worked"
                value={formData.hours_worked}
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
              <label htmlFor="overtime_hours" className="block text-sm font-medium text-gray-700">
                Overtime Hours
              </label>
              <input
                type="number"
                id="overtime_hours"
                name="overtime_hours"
                value={formData.overtime_hours}
                onChange={handleChange}
                step="0.5"
                min="0"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>

            <div>
              <label htmlFor="overtime_rate" className="block text-sm font-medium text-gray-700">
                Overtime Rate ($)
              </label>
              <input
                type="number"
                id="overtime_rate"
                name="overtime_rate"
                value={formData.overtime_rate}
                onChange={handleChange}
                step="0.01"
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
              rows={3}
              value={formData.task_description}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              placeholder="Describe the work performed..."
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
            Add Labour Docket
          </button>
          
          {labourRecords.length > 0 && (
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <span className="flex items-center">
                <Clock className="h-4 w-4 mr-1" />
                Total Hours: {getTotalHours().toFixed(1)}
              </span>
              <span className="flex items-center">
                <DollarSign className="h-4 w-4 mr-1" />
                Total Cost: ${getTotalCost().toFixed(2)}
              </span>
            </div>
          )}
        </div>
      )}

      {labourRecords.length === 0 ? (
        <div className="text-center py-12">
          <Users className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-sm font-medium text-gray-900">No Labour Records</h3>
          <p className="mt-2 text-sm text-gray-500">
            No labour recorded for {format(date, 'MMMM d, yyyy')}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
          <table className="min-w-full divide-y divide-gray-300">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Worker
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trade
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hours
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rate
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Task
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {labourRecords.map((record) => (
                <tr key={record.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {record.worker_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {record.trade || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {record.hours_worked}h
                    {(record.overtime_hours || 0) > 0 && (
                      <span className="text-orange-600 ml-1">
                        +{record.overtime_hours}h OT
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {record.hourly_rate ? `$${record.hourly_rate}/h` : '-'}
                    {record.overtime_rate && (
                      <span className="text-orange-600 ml-1">
                        (OT: ${record.overtime_rate}/h)
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    ${calculateTotal(record).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {record.task_description || '-'}
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