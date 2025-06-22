'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { getProjectsAction, getDashboardStatsAction, debugDatabaseAction } from '@/lib/actions'
import { Project, ProjectStats } from '@/types/database'
import Link from 'next/link'
import { Plus, FolderOpen, BarChart3, Users, ClipboardList, AlertTriangle } from 'lucide-react'
import { NewCreateProjectModal } from '@/components/modals/new-create-project-modal'
import { SimpleCreateProjectModal } from '@/components/modals/simple-create-project-modal'

export default function DashboardPage() {
  const { user, logout, loading } = useAuth()
  const [projects, setProjects] = useState<Project[]>([])
  const [stats, setStats] = useState<ProjectStats | null>(null)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isSimpleModalOpen, setIsSimpleModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (user) {
      loadDashboardData()
    }
  }, [user])

  const loadDashboardData = async () => {
    try {
      console.log('Loading dashboard data...')
      
      // Add debug call to see server-side state
      console.log('🔍 CALLING DEBUG ACTION FROM loadDashboardData...')
      console.log('🔍 debugDatabaseAction function exists:', typeof debugDatabaseAction)
      try {
        const debugResult = await debugDatabaseAction()
        console.log('🔍 DEBUG RESULT:', JSON.stringify(debugResult, null, 2))
      } catch (debugError) {
        console.error('🔍 DEBUG ERROR:', debugError)
        console.error('🔍 DEBUG ERROR TYPE:', typeof debugError)
        console.error('🔍 DEBUG ERROR MESSAGE:', debugError instanceof Error ? debugError.message : String(debugError))
      }
      
      // Try Server Actions first, then fallback to API routes
      let projectsResult = await getProjectsAction()
      let statsResult = await getDashboardStatsAction()
      
      console.log('Server Actions results:', { projectsResult, statsResult })
      
      // If Server Actions fail, try API routes
      if (!projectsResult.success || !statsResult.success) {
        console.log('Server Actions failed, trying API routes...')
        
        try {
          const [projectsResponse, statsResponse] = await Promise.all([
            fetch('/api/projects'),
            fetch('/api/dashboard/stats')
          ])
          
          if (projectsResponse.ok) {
            projectsResult = await projectsResponse.json()
            console.log('API projects result:', projectsResult)
          }
          
          if (statsResponse.ok) {
            statsResult = await statsResponse.json()
            console.log('API stats result:', statsResult)
          }
        } catch (apiError) {
          console.error('API fallback failed:', apiError)
        }
      }

      if (projectsResult.success) {
        setProjects(projectsResult.data || [])
        console.log('Projects set:', projectsResult.data?.length || 0)
        
        // Very basic debug - show project info in console
        if (projectsResult.data && projectsResult.data.length > 0) {
          const lastProject = projectsResult.data[projectsResult.data.length - 1]
          console.log('SIMPLE DEBUG - Last project ID:', lastProject.id)
          console.log('SIMPLE DEBUG - Last project name:', lastProject.name)
          console.log('SIMPLE DEBUG - ID type:', typeof lastProject.id)
          
          // Show all project IDs
          projectsResult.data.forEach((p, index) => {
            console.log(`SIMPLE DEBUG - Project ${index}:`, p.id, p.name, typeof p.id)
          })
        }
      }

      if (statsResult.success) {
        setStats(statsResult.data || null)
        console.log('Stats set:', statsResult.data)
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleProjectCreated = () => {
    setIsCreateModalOpen(false)
    loadDashboardData()
  }

  const handleSimpleProjectCreated = () => {
    setIsSimpleModalOpen(false)
    loadDashboardData()
  }

  const handleDebugDatabase = async () => {
    console.log('🔍 DASHBOARD DEBUG: Calling debugDatabaseAction...')
    try {
      const result = await debugDatabaseAction()
      console.log('🔍 DASHBOARD DEBUG: Result:', JSON.stringify(result, null, 2))
    } catch (error) {
      console.error('🔍 DASHBOARD DEBUG: Error:', error)
    }
  }

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Please log in to access the dashboard.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="px-4 py-4 lg:px-6 lg:py-6">
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center">
            <div className="mb-4 lg:mb-0">
              <h1 className="text-xl lg:text-2xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-sm text-gray-500">Welcome back, {user.profile?.firstName || user.email}</p>
            </div>
            <div className="flex items-center space-x-2 lg:space-x-4 flex-wrap gap-2">
              <button
                onClick={async () => {
                  console.log('=== MANUAL REFRESH TRIGGERED ===')
                  await handleDebugDatabase()
                  loadDashboardData()
                }}
                className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 lg:px-4 lg:py-2 rounded-md text-xs lg:text-sm font-medium transition-colors"
              >
                🔄 Refresh+Debug
              </button>
              <button
                onClick={async () => {
                  console.log('🧪 TEST BUTTON: Calling debug action...')
                  await handleDebugDatabase()
                  setIsSimpleModalOpen(true)
                }}
                className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 lg:px-4 lg:py-2 rounded-md text-xs lg:text-sm font-medium transition-colors"
              >
                🧪 Test+Debug
              </button>
              <button
                onClick={handleDebugDatabase}
                className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 lg:px-4 lg:py-2 rounded-md text-xs lg:text-sm font-medium transition-colors"
              >
                🔍 Debug
              </button>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="inline-flex items-center px-3 py-2 lg:px-4 lg:py-2 border border-transparent text-xs lg:text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Plus className="h-3 w-3 lg:h-4 lg:w-4 mr-1 lg:mr-2" />
                <span className="hidden sm:inline">New </span>Project
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 lg:p-6">
        {/* Stats Overview */}
        {stats && (
          <div className="mb-8">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Overview</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-4 lg:p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <FolderOpen className="h-6 w-6 text-blue-600" />
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
                <div className="p-4 lg:p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <ClipboardList className="h-6 w-6 text-green-600" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Total Lots</dt>
                        <dd className="text-lg font-medium text-gray-900">{stats.total_lots}</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-4 lg:p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <BarChart3 className="h-6 w-6 text-purple-600" />
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
                <div className="p-4 lg:p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <AlertTriangle className="h-6 w-6 text-red-600" />
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
          </div>
        )}

        {/* Projects Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-medium text-gray-900">Projects</h2>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Project
            </button>
          </div>

          {projects.length === 0 ? (
            <div className="bg-white shadow rounded-lg">
              <div className="text-center py-12">
                <FolderOpen className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-4 text-sm font-medium text-gray-900">No projects found</h3>
                <p className="mt-2 text-sm text-gray-500">
                  Get started by creating your first project.
                </p>
                <p className="mt-1 text-sm text-gray-500">
                  Create your first project to start tracking on-site compliance and daily reports.
                </p>
                <div className="mt-6">
                  <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Project
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
              {projects.map((project) => (
                <Link key={project.id} href={`/project/${project.id}`}>
                  <div className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow cursor-pointer">
                    <div className="p-4 lg:p-6">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-medium text-gray-900 truncate">
                          {project.name}
                        </h3>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          project.status === 'active' ? 'bg-green-100 text-green-800' :
                          project.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                          project.status === 'on_hold' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {project.status?.replace('_', ' ') || 'Unknown'}
                        </span>
                      </div>
                      {project.project_number && (
                        <p className="mt-1 text-sm text-gray-500">
                          #{project.project_number}
                        </p>
                      )}
                      {project.description && (
                        <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                          {project.description}
                        </p>
                      )}
                      {project.location && (
                        <p className="mt-2 text-sm text-gray-500">
                          📍 {project.location}
                        </p>
                      )}
                      {/* Progress indicator placeholder - will show lot count */}
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500">Progress</span>
                          <span className="text-gray-700 font-medium">View project for details</span>
                        </div>
                      </div>
                      <div className="mt-4 flex items-center text-sm text-gray-500">
                        <span>Created {new Date(project.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Quick Actions</h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Plus className="h-5 w-5 mr-2 text-blue-600" />
                Create New Project
              </button>
              <Link href="/templates">
                <button className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                  <ClipboardList className="h-5 w-5 mr-2 text-green-600" />
                  Manage ITP Templates
                </button>
              </Link>
              <Link href="/reports">
                <button className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                  <BarChart3 className="h-5 w-5 mr-2 text-purple-600" />
                  View Reports
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Create Project Modal */}
      <NewCreateProjectModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onProjectCreated={handleProjectCreated}
      />

      {/* Simple Test Modal */}
      <SimpleCreateProjectModal
        isOpen={isSimpleModalOpen}
        onClose={() => setIsSimpleModalOpen(false)}
        onProjectCreated={handleSimpleProjectCreated}
      />
    </div>
  )
}