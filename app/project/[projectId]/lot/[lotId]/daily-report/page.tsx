'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'

export default function DailyLotReport({ params }: { params: { projectId: string; lotId: string } }) {
  const [activeTab, setActiveTab] = useState<'diary' | 'dockets' | 'compliance'>('diary')
  const [lot, setLot] = useState<any>(null)
  const [dailyReport, setDailyReport] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    async function loadData() {
      try {
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
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Site Diary - Today's Activities</h2>
            <p className="text-green-600 mb-4">🎉 Daily Report System is working!</p>
            <p className="text-gray-600 dark:text-gray-400">
              This is where the Site Diary tab will go - with weather selector, activities text, and the killer "Add Photo/Note" feature with automatic watermarking.
            </p>
          </div>
        )}
        
        {activeTab === 'dockets' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Dockets - Commercial Data</h2>
            <p className="text-gray-600 dark:text-gray-400">
              This will capture Labour, Plant/Equipment, and Materials data for payment claims.
            </p>
          </div>
        )}
        
        {activeTab === 'compliance' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Compliance - QA & Environmental</h2>
            <p className="text-gray-600 dark:text-gray-400">
              This will show ITP checklists and environmental compliance checks.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}