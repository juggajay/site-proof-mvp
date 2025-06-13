'use client'

import React, { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'

interface LabourDocket {
  id: string
  person_name: string
  company?: string
  trade?: string
  hours_worked: number
  hourly_rate?: number
  notes?: string
  created_at: string
}

interface LabourDocketsProps {
  dailyReportId: string
}

const TRADE_OPTIONS = [
  'General Labourer',
  'Concrete Finisher',
  'Plant Operator',
  'Traffic Controller',
  'Supervisor',
  'Foreman',
  'Carpenter',
  'Steel Fixer',
  'Electrician',
  'Plumber',
  'Other'
]

export default function LabourDockets({ dailyReportId }: LabourDocketsProps) {
  const [dockets, setDockets] = useState<LabourDocket[]>([])
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  
  // Form state
  const [formData, setFormData] = useState({
    person_name: '',
    company: '',
    trade: '',
    hours_worked: '',
    hourly_rate: '',
    notes: ''
  })

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // Load existing dockets
  useEffect(() => {
    loadDockets()
  }, [dailyReportId])

  const loadDockets = async () => {
    try {
      const { data, error } = await supabase
        .from('labour_dockets')
        .select('*')
        .eq('daily_report_id', dailyReportId)
        .order('created_at', { ascending: false })

      if (error) throw error
      setDockets(data || [])
    } catch (error) {
      console.error('Error loading labour dockets:', error)
    }
  }

  const resetForm = () => {
    setFormData({
      person_name: '',
      company: '',
      trade: '',
      hours_worked: '',
      hourly_rate: '',
      notes: ''
    })
    setEditingId(null)
    setShowForm(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.person_name || !formData.hours_worked) return

    setLoading(true)
    try {
      const docketData = {
        daily_report_id: dailyReportId,
        person_name: formData.person_name,
        company: formData.company || null,
        trade: formData.trade || null,
        hours_worked: parseFloat(formData.hours_worked),
        hourly_rate: formData.hourly_rate ? parseFloat(formData.hourly_rate) : null,
        notes: formData.notes || null
      }

      if (editingId) {
        // Update existing docket
        const { error } = await supabase
          .from('labour_dockets')
          .update(docketData)
          .eq('id', editingId)
        
        if (error) throw error
      } else {
        // Insert new docket
        const { error } = await supabase
          .from('labour_dockets')
          .insert([docketData])
        
        if (error) throw error
      }

      await loadDockets()
      resetForm()
    } catch (error) {
      console.error('Error saving labour docket:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (docket: LabourDocket) => {
    setFormData({
      person_name: docket.person_name,
      company: docket.company || '',
      trade: docket.trade || '',
      hours_worked: docket.hours_worked.toString(),
      hourly_rate: docket.hourly_rate?.toString() || '',
      notes: docket.notes || ''
    })
    setEditingId(docket.id)
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this labour entry?')) return

    try {
      const { error } = await supabase
        .from('labour_dockets')
        .delete()
        .eq('id', id)

      if (error) throw error
      await loadDockets()
    } catch (error) {
      console.error('Error deleting labour docket:', error)
    }
  }

  // Calculate totals
  const totalHours = dockets.reduce((sum, d) => sum + d.hours_worked, 0)
  const totalCost = dockets.reduce((sum, d) => sum + (d.hours_worked * (d.hourly_rate || 0)), 0)

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <div className="flex items-center space-x-2">
            <svg className="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
            </svg>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Records</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{dockets.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <div className="flex items-center space-x-2">
            <svg className="h-5 w-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Hours</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalHours.toFixed(1)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <div className="flex items-center space-x-2">
            <svg className="h-5 w-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Cost</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">${totalCost.toFixed(2)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Add New Button */}
      {!showForm && (
        <button 
          onClick={() => setShowForm(true)}
          className="w-full md:w-auto bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Labour Entry
        </button>
      )}

      {/* Add/Edit Form */}
      {showForm && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
            {editingId ? 'Edit Labour Entry' : 'Add Labour Entry'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Person Name *
                </label>
                <input
                  type="text"
                  value={formData.person_name}
                  onChange={(e) => setFormData({...formData, person_name: e.target.value})}
                  placeholder="Enter person's name"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Company
                </label>
                <input
                  type="text"
                  value={formData.company}
                  onChange={(e) => setFormData({...formData, company: e.target.value})}
                  placeholder="Company name"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Trade
                </label>
                <select
                  value={formData.trade}
                  onChange={(e) => setFormData({...formData, trade: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="">Select trade</option>
                  {TRADE_OPTIONS.map(trade => (
                    <option key={trade} value={trade}>{trade}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Hours Worked *
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max="24"
                  value={formData.hours_worked}
                  onChange={(e) => setFormData({...formData, hours_worked: e.target.value})}
                  placeholder="8.0"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Hourly Rate ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.hourly_rate}
                  onChange={(e) => setFormData({...formData, hourly_rate: e.target.value})}
                  placeholder="50.00"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                placeholder="Additional notes or comments"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white resize-none"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Saving...' : editingId ? 'Update Entry' : 'Add Entry'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Labour Records List */}
      {dockets.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
            Labour Records ({dockets.length})
          </h3>
          <div className="space-y-4">
            {dockets.map((docket) => (
              <div key={docket.id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 bg-gray-50 dark:bg-gray-700">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="font-semibold text-lg text-gray-900 dark:text-white">{docket.person_name}</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-gray-600 dark:text-gray-400 mt-2">
                      {docket.company && (
                        <div><strong>Company:</strong> {docket.company}</div>
                      )}
                      {docket.trade && (
                        <div><strong>Trade:</strong> {docket.trade}</div>
                      )}
                      <div><strong>Hours:</strong> {docket.hours_worked}h</div>
                      {docket.hourly_rate && (
                        <div><strong>Rate:</strong> ${docket.hourly_rate}/h</div>
                      )}
                    </div>
                    {docket.hourly_rate && (
                      <div className="mt-2">
                        <strong className="text-green-600 dark:text-green-400">
                          Total: ${(docket.hours_worked * docket.hourly_rate).toFixed(2)}
                        </strong>
                      </div>
                    )}
                    {docket.notes && (
                      <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                        <strong>Notes:</strong> {docket.notes}
                      </div>
                    )}
                    <div className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                      Added: {new Date(docket.created_at).toLocaleString()}
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => handleEdit(docket)}
                      className="p-2 text-gray-600 hover:text-blue-600 border border-gray-300 rounded hover:border-blue-300"
                      title="Edit"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(docket.id)}
                      className="p-2 text-gray-600 hover:text-red-600 border border-gray-300 rounded hover:border-red-300"
                      title="Delete"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {dockets.length === 0 && !showForm && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
          <svg className="h-12 w-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            No labour entries yet
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Start tracking labour hours by adding your first entry.
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 mx-auto"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add First Entry
          </button>
        </div>
      )}
    </div>
  )
}