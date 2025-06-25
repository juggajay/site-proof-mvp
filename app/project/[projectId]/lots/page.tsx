'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { getProjectByIdAction, debugDatabaseAction, deleteLotAction } from '@/lib/actions'
import { ProjectWithDetails, Lot } from '@/types/database'
import Link from 'next/link'
import { Plus, MapPin, Calendar, User, Building, AlertCircle, Trash2 } from 'lucide-react'
import { CreateLotModal } from '@/components/modals/create-lot-modal'
import { DeleteConfirmationDialog } from '@/components/ui/delete-confirmation-dialog'
import toast from 'react-hot-toast'

interface PageProps {
  params: {
    projectId: string
  }
}

export default function ProjectLotsPage({ params }: PageProps) {
  const { user, loading } = useAuth()
  const [project, setProject] = useState<ProjectWithDetails | null>(null)
  const [isCreateLotModalOpen, setIsCreateLotModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean
    lotId: string | number | null
    lotNumber: string
  }>({
    isOpen: false,
    lotId: null,
    lotNumber: ''
  })
  const [isDeleting, setIsDeleting] = useState(false)

  const projectId = params.projectId

  const loadProjectData = useCallback(async () => {
    try {
      const result = await getProjectByIdAction(projectId)
      
      if (result.success) {
        setProject(result.data!)
        setError(null)
      } else {
        setError(result.error || 'Failed to load project')
      }
    } catch (error) {
      console.error('Exception during project reload:', error)
      setError('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    if (user && projectId) {
      loadProjectData()
    }
  }, [user, projectId, loadProjectData])

  const handleLotCreated = () => {
    setIsCreateLotModalOpen(false)
    loadProjectData()
  }

  const handleDeleteLot = (lot: Lot) => {
    setDeleteDialog({
      isOpen: true,
      lotId: lot.id,
      lotNumber: lot.lot_number
    })
  }

  const handleDeleteConfirm = async () => {
    if (!deleteDialog.lotId) return

    setIsDeleting(true)
    try {
      const result = await deleteLotAction(deleteDialog.lotId)
      
      if (result.success) {
        toast.success('Lot deleted successfully')
        await loadProjectData()
        setDeleteDialog({ isOpen: false, lotId: null, lotNumber: '' })
      } else {
        toast.error(result.error || 'Failed to delete lot')
      }
    } catch (error) {
      console.error('Exception during delete:', error)
      toast.error('Failed to delete lot')
    } finally {
      setIsDeleting(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'completed': return 'bg-blue-100 text-blue-800'
      case 'on_hold': return 'bg-yellow-100 text-yellow-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getLotStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-gray-100 text-gray-800'
      case 'in_progress': return 'bg-blue-100 text-blue-800'
      case 'completed': return 'bg-green-100 text-green-800'
      case 'approved': return 'bg-emerald-100 text-emerald-800'
      case 'rejected': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading lots...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Project not found</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      {/* Project Info Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2">
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">{project.name}</h3>
              {project.project_number && (
                <p className="text-sm text-gray-500">#{project.project_number}</p>
              )}
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {project.description && (
                  <div className="md:col-span-2">
                    <dt className="text-sm font-medium text-gray-500">Description</dt>
                    <dd className="mt-1 text-sm text-gray-900">{project.description}</dd>
                  </div>
                )}
                
                {project.location && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500 flex items-center">
                      <MapPin className="h-4 w-4 mr-1" />
                      Location
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900">{project.location}</dd>
                  </div>
                )}

                <div>
                  <dt className="text-sm font-medium text-gray-500 flex items-center">
                    <Building className="h-4 w-4 mr-1" />
                    Organization
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900">{project.organization.name}</dd>
                </div>

                {project.start_date && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500 flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      Start Date
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {new Date(project.start_date).toLocaleDateString()}
                    </dd>
                  </div>
                )}

                {project.end_date && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500 flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      End Date
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {new Date(project.end_date).toLocaleDateString()}
                    </dd>
                  </div>
                )}

                {project.project_manager && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500 flex items-center">
                      <User className="h-4 w-4 mr-1" />
                      Project Manager
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {project.project_manager.first_name && project.project_manager.last_name
                        ? `${project.project_manager.first_name} ${project.project_manager.last_name}`
                        : 'Not assigned'}
                    </dd>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div>
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Quick Stats</h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Total Lots</span>
                  <span className="text-sm font-medium text-gray-900">{project.lots.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Pending</span>
                  <span className="text-sm font-medium text-gray-900">
                    {project.lots.filter(l => l.status === 'pending').length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">In Progress</span>
                  <span className="text-sm font-medium text-gray-900">
                    {project.lots.filter(l => l.status === 'in_progress').length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Completed</span>
                  <span className="text-sm font-medium text-gray-900">
                    {project.lots.filter(l => l.status === 'completed').length}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Lots Section */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">Lots</h3>
            <button
              onClick={() => setIsCreateLotModalOpen(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Lot
            </button>
          </div>
        </div>

        {project.lots.length === 0 ? (
          <div className="text-center py-12">
            <Building className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-sm font-medium text-gray-900">No lots found</h3>
            <p className="mt-2 text-sm text-gray-500">
              Get started by creating your first lot for this project.
            </p>
            <div className="mt-6">
              <button
                onClick={() => setIsCreateLotModalOpen(true)}
                className="inline-flex items-center px-6 py-3 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 min-h-[44px] touch-manipulation"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Lot
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Mobile Card Layout */}
            <div className="block sm:hidden space-y-4 p-4">
              {project.lots.map((lot) => (
                <div key={lot.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-medium text-gray-900">Lot {lot.lot_number}</h3>
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getLotStatusColor(lot.status)}`}>
                        {lot.status?.replace('_', ' ') || 'pending'}
                      </span>
                      <button
                        onClick={() => handleDeleteLot(lot)}
                        className="text-gray-400 hover:text-red-600 transition-colors p-1"
                        title="Delete lot"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="space-y-2 mb-4">
                    <div>
                      <span className="text-sm font-medium text-gray-500">Description:</span>
                      <p className="text-sm text-gray-900 mt-1">{lot.description || 'No description'}</p>
                      {lot.location_description && (
                        <p className="text-sm text-gray-500 mt-1">{lot.location_description}</p>
                      )}
                    </div>
                    
                    {/* Progress Indicator */}
                    {(lot.itp_template_id || lot.itp_id) && (
                      <div className="mt-3">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm font-medium text-gray-700">ITP Progress</span>
                          <span className="text-sm text-gray-500">
                            {lot.status === 'completed' ? '100%' : 
                             lot.status === 'in_progress' ? '50%' : 
                             lot.status === 'approved' ? '100%' : '0%'}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full transition-all duration-300 ${
                              lot.status === 'completed' || lot.status === 'approved' ? 'bg-green-600' : 
                              lot.status === 'in_progress' ? 'bg-blue-600' : 
                              'bg-gray-300'
                            }`}
                            style={{
                              width: lot.status === 'completed' || lot.status === 'approved' ? '100%' : 
                                     lot.status === 'in_progress' ? '50%' : '0%'
                            }}
                          />
                        </div>
                      </div>
                    )}
                    
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="text-sm font-medium text-gray-500">ITP:</span>
                        <span className="text-sm text-gray-900 ml-2">
                          {(lot.itp_template_id || lot.itp_id) ? 'Assigned' : 'Not assigned'}
                        </span>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-500">Created:</span>
                        <span className="text-sm text-gray-900 ml-2">
                          {new Date(lot.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <Link
                    href={`/project/${projectId}/lot/${lot.id}`}
                    className="block w-full px-4 py-2 bg-blue-600 text-white text-center text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
                  >
                    View Lot Details
                  </Link>
                </div>
              ))}
            </div>
            
            {/* Desktop Table Layout */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Lot Number
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ITP Template
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Progress
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {project.lots.map((lot) => (
                  <tr key={lot.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{lot.lot_number}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{lot.description || 'No description'}</div>
                      {lot.location_description && (
                        <div className="text-sm text-gray-500">{lot.location_description}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getLotStatusColor(lot.status)}`}>
                        {lot.status?.replace('_', ' ') || 'pending'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {(lot.itp_template_id || lot.itp_id) ? 'Assigned' : 'Not assigned'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {(lot.itp_template_id || lot.itp_id) && (
                        <div className="flex items-center">
                          <div className="flex-1">
                            <div className="flex items-center">
                              <div className="w-24 bg-gray-200 rounded-full h-2 mr-2">
                                <div 
                                  className={`h-2 rounded-full transition-all duration-300 ${
                                    lot.status === 'completed' || lot.status === 'approved' ? 'bg-green-600' : 
                                    lot.status === 'in_progress' ? 'bg-blue-600' : 
                                    'bg-gray-300'
                                  }`}
                                  style={{
                                    width: lot.status === 'completed' || lot.status === 'approved' ? '100%' : 
                                           lot.status === 'in_progress' ? '50%' : '0%'
                                  }}
                                />
                              </div>
                              <span className="text-sm text-gray-600">
                                {lot.status === 'completed' ? '100%' : 
                                 lot.status === 'in_progress' ? '50%' : 
                                 lot.status === 'approved' ? '100%' : '0%'}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(lot.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/project/${projectId}/lot/${lot.id}`}
                          className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-blue-600 bg-blue-50 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors min-h-[44px] min-w-[44px] justify-center"
                        >
                          View
                        </Link>
                        <button
                          onClick={() => handleDeleteLot(lot)}
                          className="inline-flex items-center p-2 text-sm text-gray-400 hover:text-red-600 transition-colors"
                          title="Delete lot"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Create Lot Modal */}
      <CreateLotModal
        isOpen={isCreateLotModalOpen}
        onClose={() => setIsCreateLotModalOpen(false)}
        onLotCreated={handleLotCreated}
        projectId={projectId}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false, lotId: null, lotNumber: '' })}
        onConfirm={handleDeleteConfirm}
        title="Delete Lot"
        message="Are you sure you want to delete this lot? This will also delete all associated inspections and reports."
        itemName={`Lot ${deleteDialog.lotNumber}`}
        isDeleting={isDeleting}
      />
    </div>
  )
}