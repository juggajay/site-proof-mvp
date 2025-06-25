'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { getProjectsAction, deleteProjectAction } from '@/lib/actions'
import { Project } from '@/types/database'
import Link from 'next/link'
import { Plus, FolderOpen, Calendar, MapPin, Users, Trash2 } from 'lucide-react'
import { DeleteConfirmationDialog } from '@/components/ui/delete-confirmation-dialog'
import toast from 'react-hot-toast'

export default function ProjectsPage() {
  const { user, loading } = useAuth()
  const [projects, setProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean
    projectId: string | number | null
    projectName: string
  }>({
    isOpen: false,
    projectId: null,
    projectName: ''
  })
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    if (user) {
      loadProjects()
    }
  }, [user])

  const loadProjects = async () => {
    try {
      const result = await getProjectsAction()
      if (result.success) {
        setProjects(result.data || [])
      }
    } catch (error) {
      console.error('Error loading projects:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteClick = (e: React.MouseEvent, project: Project) => {
    e.preventDefault()
    e.stopPropagation()
    setDeleteDialog({
      isOpen: true,
      projectId: project.id,
      projectName: project.name
    })
  }

  const handleDeleteConfirm = async () => {
    if (!deleteDialog.projectId) return

    setIsDeleting(true)
    try {
      const result = await deleteProjectAction(deleteDialog.projectId)
      if (result.success) {
        toast.success('Project deleted successfully')
        // Reload projects from server to ensure UI is in sync
        await loadProjects()
        setDeleteDialog({ isOpen: false, projectId: null, projectName: '' })
      } else {
        toast.error(result.error || 'Failed to delete project')
      }
    } catch (error) {
      console.error('Error deleting project:', error)
      toast.error('Failed to delete project')
    } finally {
      setIsDeleting(false)
    }
  }

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading projects...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
              <p className="text-sm text-gray-500">Manage all your construction projects</p>
            </div>
            <Link 
              href="/dashboard"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Project
            </Link>
          </div>
        </div>
      </div>

      <div className="p-6">
        {projects.length === 0 ? (
          <div className="bg-white shadow rounded-lg">
            <div className="text-center py-12">
              <FolderOpen className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-sm font-medium text-gray-900">No projects found</h3>
              <p className="mt-2 text-sm text-gray-500">
                Get started by creating your first project.
              </p>
              <div className="mt-6">
                <Link
                  href="/dashboard"
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Project
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <div key={project.id} className="relative bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow">
                <Link href={`/project/${project.id}`}>
                  <div className="p-6 cursor-pointer">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-medium text-gray-900 truncate pr-2">
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
                      <p className="text-sm text-gray-500 mb-2">
                        #{project.project_number}
                      </p>
                    )}

                    {project.description && (
                      <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                        {project.description}
                      </p>
                    )}

                    {project.location && (
                      <div className="flex items-center text-sm text-gray-500 mb-2">
                        <MapPin className="h-4 w-4 mr-1" />
                        {project.location}
                      </div>
                    )}

                    <div className="flex items-center text-sm text-gray-500">
                      <Calendar className="h-4 w-4 mr-1" />
                      Created {new Date(project.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </Link>
                <div className="absolute top-4 right-4">
                  <button
                    onClick={(e) => handleDeleteClick(e, project)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-gray-100 rounded-full transition-colors"
                    title="Delete project"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <DeleteConfirmationDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false, projectId: null, projectName: '' })}
        onConfirm={handleDeleteConfirm}
        title="Delete Project"
        message="Are you sure you want to delete this project? This will also delete all associated lots, inspections, and reports."
        itemName={deleteDialog.projectName}
        isDeleting={isDeleting}
      />
    </div>
  )
}