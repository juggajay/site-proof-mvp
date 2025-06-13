'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'
import { SiteDiaryTab } from './components/site-diary-tab'

interface DailyLotReportProps {
  params: { 
    projectId: string
    lotId: string 
  }
}

interface DailyReport {
  id: string
  lot_id: string
  report_date: string
  weather: string
  general_activities: string
  created_at: string
  updated_at: string
}

interface Lot {
  id: string
  lot_number: string
  project_id: string
}

interface Project {
  id: string
  name: string
}

export default function DailyLotReportPage({ params }: DailyLotReportProps) {
  const [activeTab, setActiveTab] = useState<'diary' | 'dockets' | 'compliance'>('diary')
  const [reportDate] = useState(new Date().toISOString().split('T')[0]) // Today
  const [dailyReport, setDailyReport] = useState<DailyReport | null>(null)
  const [lot, setLot] = useState<Lot | null>(null)
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const router = useRouter()
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    loadData()
  }, [params.lotId, params.projectId]) // Add dependencies for lot and project IDs

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Load lot and project data
      const { data: lotData, error: lotError } = await supabase
        .from('lots')
        .select(`
          id,
          lot_number,
          project_id,
          project:projects (
            id,
            name
          )
        `)
        .eq('id', params.lotId)
        .single()

      if (lotError) {
        console.error('Error loading lot:', lotError)
        throw new Error('Failed to load lot information')
      }

      setLot(lotData)
      
      // Handle project data properly
      if (lotData.project) {
        setProject(lotData.project)
      } else {
        throw new Error('Project information not found')
      }

      // Load or create today's daily report
      await loadDailyReport()

    } catch (error) {
      console.error('Error loading data:', error)
      setError(error instanceof Error ? error.message : 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const loadDailyReport = async () => {
    try {
      console.log('🔍 Loading daily report for lot:', params.lotId, 'date:', reportDate)

      // Try to get existing report
      let { data: report, error } = await supabase
        .from('daily_lot_reports')
        .select('*')
        .eq('lot_id', params.lotId)
        .eq('report_date', reportDate)
        .single()

      if (error && error.code === 'PGRST116') {
        // Report doesn't exist, create it
        console.log('📝 Creating new daily report...')
        const { data: newReport, error: createError } = await supabase
          .from('daily_lot_reports')
          .insert([{
            lot_id: params.lotId,
            report_date: reportDate,
            weather: 'sunny',
            general_activities: ''
          }])
          .select()
          .single()

        if (createError) {
          console.error('Error creating daily report:', createError)
          throw createError
        }
        
        report = newReport
        console.log('✅ Daily report created:', report.id)
      } else if (error) {
        console.error('Error loading daily report:', error)
        throw error
      } else {
        console.log('✅ Daily report loaded:', report.id)
      }

      setDailyReport(report)
    } catch (error) {
      console.error('Error with daily report:', error)
      throw error
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-AU', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400 text-lg">Loading daily report...</p>
          <p className="text-gray-500 dark:text-gray-500 text-sm mt-2">Setting up today's workspace</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Unable to Load Report
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
          <div className="space-y-3">
            <button
              onClick={loadData}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Try Again
            </button>
            <button
              onClick={() => router.back()}
              className="w-full px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push(`/project/${params.projectId}`)}
                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <ArrowLeftIcon className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Daily Lot Report
                </h1>
                <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                  <span>{project?.name}</span>
                  <span>•</span>
                  <span>Lot {lot?.lot_number}</span>
                  <span>•</span>
                  <span>{formatDate(reportDate)}</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="text-right">
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  Report #{dailyReport?.id.slice(-8).toUpperCase()}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Last updated: {dailyReport ? new Date(dailyReport.updated_at).toLocaleTimeString() : 'Never'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-4">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('diary')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'diary'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <span>📝</span>
                <span>Site Diary</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('dockets')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'dockets'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <span>💰</span>
                <span>Dockets</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('compliance')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'compliance'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <span>✅</span>
                <span>Compliance</span>
              </div>
            </button>
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="container mx-auto px-4 py-6">
        {activeTab === 'diary' && (
          <SiteDiaryTab
            dailyReport={dailyReport}
            onUpdate={loadDailyReport}
          />
        )}
        
        {activeTab === 'dockets' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
                Dockets - Coming Soon
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                The Dockets tab will allow you to track:
              </p>
              <ul className="mt-4 space-y-2 text-gray-600 dark:text-gray-400">
                <li>• Labour hours and costs</li>
                <li>• Plant and equipment usage</li>
                <li>• Material deliveries and quantities</li>
                <li>• Automatic cost calculations</li>
                <li>• Digital docket capture</li>
              </ul>
            </div>
          </div>
        )}
        
        {activeTab === 'compliance' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
                Compliance - Coming Soon
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                The Compliance tab will provide:
              </p>
              <ul className="mt-4 space-y-2 text-gray-600 dark:text-gray-400">
                <li>• ITP (Inspection and Test Plan) checks</li>
                <li>• Environmental compliance monitoring</li>
                <li>• Safety checklist verification</li>
                <li>• Photo evidence for all checks</li>
                <li>• Digital signatures and timestamps</li>
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Debug Info (remove in production) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 right-4 bg-black text-white p-3 rounded-lg text-xs max-w-sm">
          <div className="font-bold mb-2">Debug Info:</div>
          <div>Project ID: {params.projectId}</div>
          <div>Lot ID: {params.lotId}</div>
          <div>Report ID: {dailyReport?.id}</div>
          <div>Date: {reportDate}</div>
          <div>Active Tab: {activeTab}</div>
        </div>
      )}
    </div>
  )
}