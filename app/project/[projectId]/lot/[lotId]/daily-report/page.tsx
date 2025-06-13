'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { SiteDiaryTab } from './components/site-diary-tab'
import LabourDockets from './components/labour-dockets'
import QAInspection from './components/qa-inspection'
import EnvironmentalCompliance from './components/environmental-compliance'

// Minimal test component to verify dockets functionality
function MinimalDocketsTest({ dailyReport }: { dailyReport: any }) {
  const [testData, setTestData] = useState<any[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState('')

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const testInsert = async () => {
    setIsSubmitting(true)
    setMessage('Testing...')
    
    try {
      const testRecord = {
        daily_report_id: dailyReport.id,
        person_name: 'Test Person',
        company: 'Test Company',
        trade: 'General Labourer',
        hours_worked: 8,
        hourly_rate: 50,
        notes: 'Test entry from ' + new Date().toLocaleTimeString()
      }

      console.log('Inserting test record:', testRecord)

      const { data, error } = await supabase
        .from('labour_dockets')
        .insert([testRecord])
        .select()

      console.log('Insert result:', { data, error })

      if (error) {
        throw error
      }

      setMessage(`✅ Success! Added: ${data[0].person_name}`)
      loadTestData()

    } catch (error) {
      console.error('Error:', error)
      setMessage(`❌ Error: ${(error as any)?.message}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const loadTestData = async () => {
    try {
      const { data, error } = await supabase
        .from('labour_dockets')
        .select('*')
        .eq('daily_report_id', dailyReport.id)
        .order('created_at', { ascending: false })

      console.log('Load result:', { data, error })

      if (error) {
        throw error
      }

      setTestData(data || [])
      setMessage(`📊 Loaded ${data?.length || 0} records`)

    } catch (error) {
      console.error('Load error:', error)
      setMessage(`❌ Load error: ${(error as any)?.message}`)
    }
  }

  const clearTestData = async () => {
    try {
      const { error } = await supabase
        .from('labour_dockets')
        .delete()
        .eq('daily_report_id', dailyReport.id)

      if (error) throw error

      setTestData([])
      setMessage('🗑️ Cleared all test data')

    } catch (error) {
      console.error('Clear error:', error)
      setMessage(`❌ Clear error: ${(error as any)?.message}`)
    }
  }

  useEffect(() => {
    if (dailyReport?.id) {
      loadTestData()
    }
  }, [dailyReport?.id])

  return (
    <div className="space-y-6">
      {/* Test Header */}
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-yellow-900 dark:text-yellow-100 mb-2">
          🧪 Dockets Test Mode
        </h2>
        <p className="text-yellow-800 dark:text-yellow-200 mb-4">
          Testing labour dockets functionality. Check console for detailed logs.
        </p>
        <div className="text-sm text-yellow-700 dark:text-yellow-300 mb-4">
          Daily Report ID: <code className="bg-yellow-100 dark:bg-yellow-800 px-2 py-1 rounded">{dailyReport?.id}</code>
        </div>
        {message && (
          <div className="bg-white dark:bg-gray-800 border rounded p-3 mb-4">
            <p className="text-sm">{message}</p>
          </div>
        )}
      </div>

      {/* Test Controls */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Test Controls</h3>
        <div className="flex gap-3 mb-6">
          <button
            onClick={testInsert}
            disabled={isSubmitting}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Testing...
              </>
            ) : (
              '🧪 Test Insert'
            )}
          </button>
          
          <button
            onClick={loadTestData}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            📊 Load Data
          </button>
          
          <button
            onClick={clearTestData}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
          >
            🗑️ Clear All
          </button>
        </div>
      </div>

      {/* Test Results */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">
          Test Results ({testData.length} records)
        </h3>
        
        {testData.length > 0 ? (
          <div className="space-y-3">
            {testData.map((record, index) => (
              <div key={record.id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 bg-gray-50 dark:bg-gray-700">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      {record.person_name}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {record.company} • {record.trade} • {record.hours_worked}h @ ${record.hourly_rate}/h
                    </p>
                    <p className="text-sm font-medium text-green-600 dark:text-green-400">
                      Total: ${(record.hours_worked * record.hourly_rate).toFixed(2)}
                    </p>
                    {record.notes && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Notes: {record.notes}
                      </p>
                    )}
                    <p className="text-xs text-gray-400 mt-1">
                      ID: {record.id} | Created: {new Date(record.created_at).toLocaleString()}
                    </p>
                  </div>
                  <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded text-sm">
                    #{index + 1}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <p className="mb-2">No test records found</p>
            <p className="text-sm">Click "Test Insert" to add a test labour record</p>
          </div>
        )}
      </div>

      {/* Summary */}
      {testData.length > 0 && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-green-900 dark:text-green-100 mb-2">
            📈 Test Summary
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-green-600 dark:text-green-400 font-medium">Total Records:</span>
              <span className="ml-2">{testData.length}</span>
            </div>
            <div>
              <span className="text-green-600 dark:text-green-400 font-medium">Total Hours:</span>
              <span className="ml-2">{testData.reduce((sum, r) => sum + r.hours_worked, 0)}</span>
            </div>
            <div>
              <span className="text-green-600 dark:text-green-400 font-medium">Total Cost:</span>
              <span className="ml-2">${testData.reduce((sum, r) => sum + (r.hours_worked * r.hourly_rate), 0).toFixed(2)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Previous SimpleDocketsTab component (keeping for reference)
function SimpleDocketsTab({ dailyReport, onUpdate }: { dailyReport: any, onUpdate: () => void }) {
  const [labourEntries, setLabourEntries] = useState<any[]>([])
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    person_name: '',
    company: '',
    trade: 'General Labourer',
    hours_worked: '',
    hourly_rate: '',
    notes: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // Load labour entries
  useEffect(() => {
    loadLabourEntries()
  }, [dailyReport?.id])

  const loadLabourEntries = async () => {
    if (!dailyReport?.id) return
    
    try {
      const { data, error } = await supabase
        .from('labour_dockets')
        .select('*')
        .eq('daily_report_id', dailyReport.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error loading labour entries:', error)
        return
      }

      setLabourEntries(data || [])
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.person_name.trim()) {
      alert('Please enter a person name')
      return
    }
    
    if (!formData.hours_worked || parseFloat(formData.hours_worked) <= 0) {
      alert('Please enter valid hours worked')
      return
    }

    setIsSubmitting(true)

    try {
      const dataToInsert = {
        daily_report_id: dailyReport.id,
        person_name: formData.person_name.trim(),
        company: formData.company.trim(),
        trade: formData.trade,
        hours_worked: parseFloat(formData.hours_worked),
        hourly_rate: formData.hourly_rate ? parseFloat(formData.hourly_rate) : null,
        notes: formData.notes.trim() || null
      }

      console.log('Submitting:', dataToInsert)

      const { data, error } = await supabase
        .from('labour_dockets')
        .insert([dataToInsert])
        .select()

      if (error) {
        console.error('Insert error:', error)
        throw error
      }

      console.log('Success:', data)

      // Reset form
      setFormData({
        person_name: '',
        company: '',
        trade: 'General Labourer',
        hours_worked: '',
        hourly_rate: '',
        notes: ''
      })
      
      setShowForm(false)
      await loadLabourEntries()
      alert('Labour record added successfully!')

    } catch (error) {
      console.error('Error adding labour record:', error)
      alert(`Failed to add labour record: ${(error as any)?.message || 'Unknown error'}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const deleteEntry = async (id: string) => {
    if (!confirm('Delete this labour record?')) return

    try {
      const { error } = await supabase
        .from('labour_dockets')
        .delete()
        .eq('id', id)

      if (error) throw error
      await loadLabourEntries()
    } catch (error) {
      console.error('Error deleting entry:', error)
      alert('Failed to delete record')
    }
  }

  const calculateTotal = () => {
    return labourEntries.reduce((sum, entry) => {
      return sum + (entry.hours_worked * (entry.hourly_rate || 0))
    }, 0)
  }

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold text-blue-900 dark:text-blue-100">
              Labour Tracking
            </h2>
            <p className="text-blue-600 dark:text-blue-400">
              {labourEntries.length} entries • Total: ${calculateTotal().toFixed(2)}
            </p>
          </div>
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
      </div>

      {/* Add Form */}
      {showForm && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Add Labour Record</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Person Name *</label>
                <input
                  type="text"
                  value={formData.person_name}
                  onChange={(e) => setFormData({...formData, person_name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Company</label>
                <input
                  type="text"
                  value={formData.company}
                  onChange={(e) => setFormData({...formData, company: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Trade</label>
                <select
                  value={formData.trade}
                  onChange={(e) => setFormData({...formData, trade: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                >
                  <option value="General Labourer">General Labourer</option>
                  <option value="Plant Operator">Plant Operator</option>
                  <option value="Truck Driver">Truck Driver</option>
                  <option value="Concrete Finisher">Concrete Finisher</option>
                  <option value="Steel Fixer">Steel Fixer</option>
                  <option value="Carpenter">Carpenter</option>
                  <option value="Supervisor">Supervisor</option>
                  <option value="Foreman">Foreman</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Hours Worked *</label>
                <input
                  type="number"
                  step="0.25"
                  min="0"
                  value={formData.hours_worked}
                  onChange={(e) => setFormData({...formData, hours_worked: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Hourly Rate ($)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.hourly_rate}
                  onChange={(e) => setFormData({...formData, hourly_rate: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Notes</label>
                <input
                  type="text"
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Adding...
                  </>
                ) : (
                  'Add Record'
                )}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Labour Records List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Today's Labour Records</h3>
        <div className="space-y-3">
          {labourEntries.map((entry) => (
            <div key={entry.id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 flex justify-between items-start">
              <div className="flex-1">
                <h4 className="font-medium text-gray-900 dark:text-white">{entry.person_name}</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {entry.company && `${entry.company} • `}
                  {entry.trade} • {entry.hours_worked}h
                  {entry.hourly_rate && ` @ $${entry.hourly_rate}/h`}
                </p>
                {entry.hourly_rate && (
                  <p className="text-sm font-medium text-green-600 dark:text-green-400">
                    Total: ${(entry.hours_worked * entry.hourly_rate).toFixed(2)}
                  </p>
                )}
                {entry.notes && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{entry.notes}</p>
                )}
              </div>
              <button
                onClick={() => deleteEntry(entry.id)}
                className="text-red-500 hover:text-red-700 ml-4"
                title="Delete record"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          ))}
          {labourEntries.length === 0 && (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <p className="mb-2">No labour records for today</p>
              <p className="text-sm">Click "Add Labour" to start tracking labour costs</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function DailyLotReport({ params }: { params: { projectId: string; lotId: string } }) {
  const [activeTab, setActiveTab] = useState<'diary' | 'dockets' | 'compliance'>('diary')
  const [complianceTab, setComplianceTab] = useState<'qa' | 'environmental'>('qa')
  const [lot, setLot] = useState<any>(null)
  const [dailyReport, setDailyReport] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const loadData = async () => {
    try {
      setLoading(true)
      // Load lot data
      const { data: lotData } = await supabase
        .from('lots')
        .select('*, projects(id, name)')
        .eq('id', params.lotId)
        .single()

      setLot(lotData)

      // Load or create today's daily report
      const today = new Date().toISOString().split('T')[0]
      let { data: report } = await supabase
        .from('daily_lot_reports')
        .select('*')
        .eq('lot_id', params.lotId)
        .eq('report_date', today)
        .single()

      if (!report) {
        const { data: newReport } = await supabase
          .from('daily_lot_reports')
          .insert([{
            lot_id: params.lotId,
            report_date: today,
            weather: 'sunny',
            general_activities: ''
          }])
          .select()
          .single()
        report = newReport
      }

      setDailyReport(report)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [params.lotId])

  if (loading) {
    return <div className="p-8">Loading daily report...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Daily Lot Report - {lot?.lot_number || 'Lot #' + lot?.id?.slice(0, 8)}
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          {new Date().toLocaleDateString()} • {lot?.projects?.name || 'Project'}
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-4">
          <nav className="flex space-x-8">
            {[
              { key: 'diary', label: '📝 Site Diary', desc: 'Events & Evidence' },
              { key: 'dockets', label: '💰 Dockets', desc: 'Labour, Plant & Materials' },
              { key: 'compliance', label: '✅ Compliance', desc: 'QA & Environmental' }
            ].map(({ key, label, desc }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === key
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
                }`}
              >
                <div>{label}</div>
                <div className="text-xs text-gray-400">{desc}</div>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="container mx-auto px-4 py-6">
        {activeTab === 'diary' && (
          <SiteDiaryTab
            lot={lot}
            dailyReport={dailyReport}
            onUpdate={loadData}
          />
        )}
        
        {activeTab === 'dockets' && (
          <LabourDockets dailyReportId={dailyReport?.id} />
        )}
        
        {activeTab === 'compliance' && (
          <div className="space-y-6">
            {/* Compliance Sub-tabs */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
              <div className="border-b border-gray-200 dark:border-gray-700">
                <nav className="flex space-x-8 px-6">
                  {[
                    { key: 'qa', label: '🔍 QA Inspection', desc: 'ITP Checklists' },
                    { key: 'environmental', label: '🌱 Environmental', desc: 'Compliance Monitoring' }
                  ].map(({ key, label, desc }) => (
                    <button
                      key={key}
                      onClick={() => setComplianceTab(key as any)}
                      className={`py-4 px-1 border-b-2 font-medium text-sm ${
                        complianceTab === key
                          ? 'border-green-500 text-green-600 dark:text-green-400'
                          : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
                      }`}
                    >
                      <div>{label}</div>
                      <div className="text-xs text-gray-400">{desc}</div>
                    </button>
                  ))}
                </nav>
              </div>
              
              <div className="p-6">
                {complianceTab === 'qa' && (
                  <QAInspection
                    dailyReportId={dailyReport?.id}
                    lotId={params.lotId}
                  />
                )}
                
                {complianceTab === 'environmental' && (
                  <EnvironmentalCompliance
                    dailyReportId={dailyReport?.id}
                    projectId={params.projectId}
                  />
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}