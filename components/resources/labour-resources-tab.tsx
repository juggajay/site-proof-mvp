'use client'

import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, Building, Users, Phone, Mail, DollarSign } from 'lucide-react'
import { 
  getSubcontractorsAction, 
  createSubcontractorAction, 
  updateSubcontractorAction,
  deleteSubcontractorAction,
  getSubcontractorEmployeesAction,
  createSubcontractorEmployeeAction,
  updateSubcontractorEmployeeAction
} from '@/lib/actions'
import { Subcontractor, SubcontractorEmployee, SubcontractorWithEmployees } from '@/types/database'

export function LabourResourcesTab() {
  const [subcontractors, setSubcontractors] = useState<SubcontractorWithEmployees[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showAddSubcontractor, setShowAddSubcontractor] = useState(false)
  const [showAddEmployee, setShowAddEmployee] = useState<string | null>(null)
  const [editingSubcontractor, setEditingSubcontractor] = useState<Subcontractor | null>(null)
  const [editingEmployee, setEditingEmployee] = useState<SubcontractorEmployee | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Form states
  const [subcontractorForm, setSubcontractorForm] = useState({
    company_name: '',
    contact_person: '',
    phone: '',
    email: '',
    address: '',
    abn: ''
  })

  const [employeeForm, setEmployeeForm] = useState({
    employee_name: '',
    role: '',
    hourly_rate: '',
    phone: '',
    email: ''
  })

  useEffect(() => {
    loadSubcontractors()
  }, [])

  const loadSubcontractors = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const result = await getSubcontractorsAction()
      if (result.success && result.data) {
        // Load employees for each subcontractor
        const subcontractorsWithEmployees = await Promise.all(
          result.data.map(async (subcontractor) => {
            const employeesResult = await getSubcontractorEmployeesAction(subcontractor.id)
            return {
              ...subcontractor,
              employees: employeesResult.success ? employeesResult.data || [] : []
            } as SubcontractorWithEmployees
          })
        )
        setSubcontractors(subcontractorsWithEmployees)
      } else {
        setError(result.error || 'Failed to load subcontractors')
      }
    } catch (error) {
      console.error('Error loading subcontractors:', error)
      setError('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmitSubcontractor = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    try {
      if (editingSubcontractor) {
        const result = await updateSubcontractorAction(editingSubcontractor.id, subcontractorForm)
        if (!result.success) {
          setError(result.error || 'Failed to update subcontractor')
          return
        }
      } else {
        const result = await createSubcontractorAction(subcontractorForm)
        if (!result.success) {
          setError(result.error || 'Failed to create subcontractor')
          return
        }
      }

      setShowAddSubcontractor(false)
      setEditingSubcontractor(null)
      setSubcontractorForm({
        company_name: '',
        contact_person: '',
        phone: '',
        email: '',
        address: '',
        abn: ''
      })
      loadSubcontractors()
    } catch (error) {
      console.error('Error submitting subcontractor:', error)
      setError('An unexpected error occurred')
    }
  }

  const handleSubmitEmployee = async (e: React.FormEvent, subcontractorId: string) => {
    e.preventDefault()
    setError(null)

    try {
      const employeeData = {
        ...employeeForm,
        subcontractor_id: subcontractorId,
        hourly_rate: parseFloat(employeeForm.hourly_rate)
      }

      if (editingEmployee) {
        const result = await updateSubcontractorEmployeeAction(editingEmployee.id, employeeData)
        if (!result.success) {
          setError(result.error || 'Failed to update employee')
          return
        }
      } else {
        const result = await createSubcontractorEmployeeAction(employeeData)
        if (!result.success) {
          setError(result.error || 'Failed to create employee')
          return
        }
      }

      setShowAddEmployee(null)
      setEditingEmployee(null)
      setEmployeeForm({
        employee_name: '',
        role: '',
        hourly_rate: '',
        phone: '',
        email: ''
      })
      loadSubcontractors()
    } catch (error) {
      console.error('Error submitting employee:', error)
      setError('An unexpected error occurred')
    }
  }

  const handleDeleteSubcontractor = async (id: string) => {
    if (!confirm('Are you sure you want to delete this subcontractor? This will also delete all associated employees.')) {
      return
    }

    try {
      const result = await deleteSubcontractorAction(id)
      if (result.success) {
        loadSubcontractors()
      } else {
        setError(result.error || 'Failed to delete subcontractor')
      }
    } catch (error) {
      console.error('Error deleting subcontractor:', error)
      setError('An unexpected error occurred')
    }
  }

  const handleEditSubcontractor = (subcontractor: Subcontractor) => {
    setEditingSubcontractor(subcontractor)
    setSubcontractorForm({
      company_name: subcontractor.company_name,
      contact_person: subcontractor.contact_person || '',
      phone: subcontractor.phone || '',
      email: subcontractor.email || '',
      address: subcontractor.address || '',
      abn: subcontractor.abn || ''
    })
    setShowAddSubcontractor(true)
  }

  const handleEditEmployee = (employee: SubcontractorEmployee) => {
    setEditingEmployee(employee)
    setEmployeeForm({
      employee_name: employee.employee_name,
      role: employee.role || '',
      hourly_rate: employee.hourly_rate.toString(),
      phone: employee.phone || '',
      email: employee.email || ''
    })
    setShowAddEmployee(employee.subcontractor_id)
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
        <h2 className="text-lg font-medium text-gray-900">Labour Subcontractors & Employees</h2>
        <button
          onClick={() => {
            setEditingSubcontractor(null)
            setSubcontractorForm({
              company_name: '',
              contact_person: '',
              phone: '',
              email: '',
              address: '',
              abn: ''
            })
            setShowAddSubcontractor(true)
          }}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Subcontractor
        </button>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
          {error}
        </div>
      )}

      {showAddSubcontractor && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-md font-medium text-gray-900 mb-4">
            {editingSubcontractor ? 'Edit Subcontractor' : 'Add New Subcontractor'}
          </h3>
          <form onSubmit={handleSubmitSubcontractor} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="company_name" className="block text-sm font-medium text-gray-700">
                  Company Name *
                </label>
                <input
                  type="text"
                  id="company_name"
                  required
                  value={subcontractorForm.company_name}
                  onChange={(e) => setSubcontractorForm({ ...subcontractorForm, company_name: e.target.value })}
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
                  value={subcontractorForm.contact_person}
                  onChange={(e) => setSubcontractorForm({ ...subcontractorForm, contact_person: e.target.value })}
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
                  value={subcontractorForm.phone}
                  onChange={(e) => setSubcontractorForm({ ...subcontractorForm, phone: e.target.value })}
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
                  value={subcontractorForm.email}
                  onChange={(e) => setSubcontractorForm({ ...subcontractorForm, email: e.target.value })}
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
                  value={subcontractorForm.abn}
                  onChange={(e) => setSubcontractorForm({ ...subcontractorForm, abn: e.target.value })}
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
                  value={subcontractorForm.address}
                  onChange={(e) => setSubcontractorForm({ ...subcontractorForm, address: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                  setShowAddSubcontractor(false)
                  setEditingSubcontractor(null)
                }}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                {editingSubcontractor ? 'Update' : 'Create'} Subcontractor
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-6">
        {subcontractors.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <Building className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-sm font-medium text-gray-900">No subcontractors</h3>
            <p className="mt-2 text-sm text-gray-500">Get started by adding your first subcontractor.</p>
          </div>
        ) : (
          subcontractors.map((subcontractor) => (
            <div key={subcontractor.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="px-6 py-4 bg-gray-50 flex justify-between items-center">
                <div className="flex items-center space-x-4">
                  <Building className="h-5 w-5 text-gray-500" />
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">{subcontractor.company_name}</h3>
                    <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                      {subcontractor.contact_person && (
                        <span className="flex items-center">
                          <Users className="h-3 w-3 mr-1" />
                          {subcontractor.contact_person}
                        </span>
                      )}
                      {subcontractor.phone && (
                        <span className="flex items-center">
                          <Phone className="h-3 w-3 mr-1" />
                          {subcontractor.phone}
                        </span>
                      )}
                      {subcontractor.email && (
                        <span className="flex items-center">
                          <Mail className="h-3 w-3 mr-1" />
                          {subcontractor.email}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleEditSubcontractor(subcontractor)}
                    className="p-2 text-gray-400 hover:text-gray-600"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteSubcontractor(subcontractor.id)}
                    className="p-2 text-gray-400 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="px-6 py-4">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-sm font-medium text-gray-700">Employees</h4>
                  <button
                    onClick={() => {
                      setEditingEmployee(null)
                      setEmployeeForm({
                        employee_name: '',
                        role: '',
                        hourly_rate: '',
                        phone: '',
                        email: ''
                      })
                      setShowAddEmployee(subcontractor.id)
                    }}
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    <Plus className="h-4 w-4 inline mr-1" />
                    Add Employee
                  </button>
                </div>

                {showAddEmployee === subcontractor.id && (
                  <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                    <h5 className="text-sm font-medium text-gray-900 mb-3">
                      {editingEmployee ? 'Edit Employee' : 'Add New Employee'}
                    </h5>
                    <form onSubmit={(e) => handleSubmitEmployee(e, subcontractor.id)} className="space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label htmlFor="employee_name" className="block text-sm font-medium text-gray-700">
                            Name *
                          </label>
                          <input
                            type="text"
                            id="employee_name"
                            required
                            value={employeeForm.employee_name}
                            onChange={(e) => setEmployeeForm({ ...employeeForm, employee_name: e.target.value })}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                          />
                        </div>
                        <div>
                          <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                            Profession/Trade
                          </label>
                          <input
                            type="text"
                            id="role"
                            value={employeeForm.role}
                            onChange={(e) => setEmployeeForm({ ...employeeForm, role: e.target.value })}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                            placeholder="e.g., Excavator Driver, Pipe Layer, Carpenter"
                          />
                        </div>
                        <div>
                          <label htmlFor="hourly_rate" className="block text-sm font-medium text-gray-700">
                            Hourly Rate ($) *
                          </label>
                          <input
                            type="number"
                            id="hourly_rate"
                            required
                            step="0.01"
                            min="0"
                            value={employeeForm.hourly_rate}
                            onChange={(e) => setEmployeeForm({ ...employeeForm, hourly_rate: e.target.value })}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                          />
                        </div>
                        <div>
                          <label htmlFor="emp_phone" className="block text-sm font-medium text-gray-700">
                            Phone
                          </label>
                          <input
                            type="tel"
                            id="emp_phone"
                            value={employeeForm.phone}
                            onChange={(e) => setEmployeeForm({ ...employeeForm, phone: e.target.value })}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end space-x-3">
                        <button
                          type="button"
                          onClick={() => {
                            setShowAddEmployee(null)
                            setEditingEmployee(null)
                          }}
                          className="px-3 py-1.5 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-3 py-1.5 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                        >
                          {editingEmployee ? 'Update' : 'Add'} Employee
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {subcontractor.employees.length === 0 ? (
                  <p className="text-sm text-gray-500">No employees added yet.</p>
                ) : (
                  <div className="space-y-2">
                    {subcontractor.employees.map((employee) => (
                      <div key={employee.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                        <div className="flex-1">
                          <div className="flex items-center space-x-4">
                            <span className="font-medium text-gray-900">{employee.employee_name}</span>
                            {employee.role && (
                              <span className="text-sm text-gray-500">{employee.role}</span>
                            )}
                            <span className="flex items-center text-sm text-green-600 font-medium">
                              <DollarSign className="h-3 w-3" />
                              {employee.hourly_rate}/hr
                            </span>
                          </div>
                          <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                            {employee.phone && (
                              <span className="flex items-center">
                                <Phone className="h-3 w-3 mr-1" />
                                {employee.phone}
                              </span>
                            )}
                            {employee.email && (
                              <span className="flex items-center">
                                <Mail className="h-3 w-3 mr-1" />
                                {employee.email}
                              </span>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => handleEditEmployee(employee)}
                          className="p-1 text-gray-400 hover:text-gray-600"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}