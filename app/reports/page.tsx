'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { 
  getProjectsAction, 
  getDashboardStatsAction,
  generateInspectionSummaryReportAction,
  generateNonConformanceReportAction,
  generateProjectProgressReportAction
} from '@/lib/actions'
import { Project, ProjectStats } from '@/types/database'
import Link from 'next/link'
import { ArrowLeft, FileText, Download, Filter, Calendar, BarChart3, PieChart, TrendingUp } from 'lucide-react'

export default function ReportsPage() {
  const { user, loading } = useAuth()
  const [projects, setProjects] = useState<Project[]>([])
  const [stats, setStats] = useState<ProjectStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedProject, setSelectedProject] = useState<string>('all')
  const [dateRange, setDateRange] = useState<string>('30')

  useEffect(() => {
    if (user) {
      loadReportsData()
    }
  }, [user])

  const loadReportsData = async () => {
    try {
      const [projectsResult, statsResult] = await Promise.all([
        getProjectsAction(),
        getDashboardStatsAction()
      ])

      if (projectsResult.success) {
        setProjects(projectsResult.data || [])
      }

      if (statsResult.success) {
        setStats(statsResult.data || null)
      }
    } catch (error) {
      console.error('Error loading reports data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const generateReport = async (reportType: string) => {
    try {
      console.log(`Generating ${reportType} report for project: ${selectedProject}, date range: ${dateRange} days`)
      
      let result;
      switch (reportType) {
        case 'Inspection Summary':
          result = await generateInspectionSummaryReportAction(selectedProject, dateRange)
          break
        case 'Non-Conformance':
          result = await generateNonConformanceReportAction(selectedProject, dateRange)
          break
        case 'Project Progress':
          result = await generateProjectProgressReportAction(selectedProject, dateRange)
          break
        default:
          alert(`${reportType} report generation would be implemented here`)
          return
      }
      
      if (result.success) {
        // In a real app, this would download a PDF or open a new tab with the report
        console.log('Report data:', result.data)
        alert(`${reportType} report generated successfully!\n\nCheck the browser console for detailed report data.\n\nIn a production app, this would download as a PDF file.`)
      } else {
        alert(`Failed to generate ${reportType} report: ${result.error}`)
      }
    } catch (error) {
      console.error('Report generation error:', error)
      alert(`Error generating ${reportType} report. Please try again.`)
    }
  }

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading reports...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Please log in to access reports.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center">
              <Link href="/dashboard" className="mr-4 text-gray-400 hover:text-gray-600">
                <ArrowLeft className="h-6 w-6" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
                <p className="text-sm text-gray-500">Generate inspection reports and view analytics</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Filters */}
        <div className="bg-white shadow rounded-lg mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <Filter className="h-5 w-5 mr-2" />
              Report Filters
            </h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="project-select" className="block text-sm font-medium text-gray-700 mb-2">
                  Project
                </label>
                <select
                  id="project-select"
                  value={selectedProject}
                  onChange={(e) => setSelectedProject(e.target.value)}
                  className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="all">All Projects</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id.toString()}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="date-range" className="block text-sm font-medium text-gray-700 mb-2">
                  Date Range
                </label>
                <select
                  id="date-range"
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                  className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="7">Last 7 days</option>
                  <option value="30">Last 30 days</option>
                  <option value="90">Last 90 days</option>
                  <option value="365">Last year</option>
                  <option value="all">All time</option>
                </select>
              </div>

              <div className="flex items-end">
                <button
                  onClick={() => loadReportsData()}
                  className="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <BarChart3 className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Total Projects</dt>
                      <dd className="text-lg font-medium text-gray-900">{stats.total_projects}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <TrendingUp className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Completed Inspections</dt>
                      <dd className="text-lg font-medium text-gray-900">{stats.completed_inspections}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <PieChart className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Pending Inspections</dt>
                      <dd className="text-lg font-medium text-gray-900">{stats.pending_inspections}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <FileText className="h-6 w-6 text-red-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Non-conformances</dt>
                      <dd className="text-lg font-medium text-gray-900">{stats.non_conformances}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Report Types */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Inspection Summary Report */}
          <div className="bg-white shadow rounded-lg">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <FileText className="h-8 w-8 text-blue-600" />
                <h3 className="ml-3 text-lg font-medium text-gray-900">Inspection Summary</h3>
              </div>
              <p className="text-sm text-gray-500 mb-4">
                Comprehensive overview of all inspections, including pass/fail rates and completion status.
              </p>
              <button
                onClick={() => generateReport('Inspection Summary')}
                className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Download className="h-4 w-4 mr-2" />
                Generate Report
              </button>
            </div>
          </div>

          {/* Non-Conformance Report */}
          <div className="bg-white shadow rounded-lg">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <FileText className="h-8 w-8 text-red-600" />
                <h3 className="ml-3 text-lg font-medium text-gray-900">Non-Conformance Report</h3>
              </div>
              <p className="text-sm text-gray-500 mb-4">
                Detailed report of all failed inspections, including corrective actions and status.
              </p>
              <button
                onClick={() => generateReport('Non-Conformance')}
                className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <Download className="h-4 w-4 mr-2" />
                Generate Report
              </button>
            </div>
          </div>

          {/* Project Progress Report */}
          <div className="bg-white shadow rounded-lg">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <BarChart3 className="h-8 w-8 text-green-600" />
                <h3 className="ml-3 text-lg font-medium text-gray-900">Project Progress</h3>
              </div>
              <p className="text-sm text-gray-500 mb-4">
                Progress tracking report showing completion rates and timelines for each project.
              </p>
              <button
                onClick={() => generateReport('Project Progress')}
                className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                <Download className="h-4 w-4 mr-2" />
                Generate Report
              </button>
            </div>
          </div>

          {/* Quality Metrics Report */}
          <div className="bg-white shadow rounded-lg">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <TrendingUp className="h-8 w-8 text-purple-600" />
                <h3 className="ml-3 text-lg font-medium text-gray-900">Quality Metrics</h3>
              </div>
              <p className="text-sm text-gray-500 mb-4">
                Statistical analysis of quality trends, pass rates, and performance indicators.
              </p>
              <button
                onClick={() => generateReport('Quality Metrics')}
                className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
              >
                <Download className="h-4 w-4 mr-2" />
                Generate Report
              </button>
            </div>
          </div>

          {/* Lot Completion Report */}
          <div className="bg-white shadow rounded-lg">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <PieChart className="h-8 w-8 text-yellow-600" />
                <h3 className="ml-3 text-lg font-medium text-gray-900">Lot Completion</h3>
              </div>
              <p className="text-sm text-gray-500 mb-4">
                Detailed breakdown of lot completion status and inspection records.
              </p>
              <button
                onClick={() => generateReport('Lot Completion')}
                className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
              >
                <Download className="h-4 w-4 mr-2" />
                Generate Report
              </button>
            </div>
          </div>

          {/* Custom Report */}
          <div className="bg-white shadow rounded-lg">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <FileText className="h-8 w-8 text-gray-600" />
                <h3 className="ml-3 text-lg font-medium text-gray-900">Custom Report</h3>
              </div>
              <p className="text-sm text-gray-500 mb-4">
                Build a custom report with specific filters, date ranges, and data points.
              </p>
              <button
                onClick={() => generateReport('Custom')}
                className="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Download className="h-4 w-4 mr-2" />
                Build Custom Report
              </button>
            </div>
          </div>
        </div>

        {/* Recent Reports */}
        <div className="mt-8 bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Recent Reports</h3>
          </div>
          <div className="text-center py-12">
            <FileText className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-sm font-medium text-gray-900">No reports generated yet</h3>
            <p className="mt-2 text-sm text-gray-500">
              Generate your first report using the options above.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}