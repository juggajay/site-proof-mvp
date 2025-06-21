'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { getProjectByIdAction } from '@/lib/actions'
import { ProjectWithDetails } from '@/types/database'
import Link from 'next/link'
import { ArrowLeft, AlertCircle } from 'lucide-react'
import { ProjectSiteDiary } from '@/components/site-diary/project-site-diary'

interface PageProps {
  params: {
    projectId: string
  }
}

export default function ProjectSiteDiaryPage({ params }: PageProps) {
  const { user, loading } = useAuth()
  const [project, setProject] = useState<ProjectWithDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const projectId = params.projectId

  useEffect(() => {
    const loadProject = async () => {
      if (!user) return

      try {
        const result = await getProjectByIdAction(projectId)
        if (result.success) {
          setProject(result.data!)
        } else {
          setError(result.error || 'Failed to load project')
        }
      } catch (error) {
        console.error('Error loading project:', error)
        setError('An unexpected error occurred')
      } finally {
        setIsLoading(false)
      }
    }

    loadProject()
  }, [user, projectId])

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading site diary...</p>
        </div>
      </div>
    )
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
          <p className="text-gray-600">{error || 'Project not found'}</p>
          <Link href={`/project/${projectId}`} className="mt-4 inline-flex items-center text-blue-600 hover:text-blue-700">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Project
          </Link>
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
              <Link href={`/project/${projectId}`} className="mr-4 text-gray-400 hover:text-gray-600">
                <ArrowLeft className="h-6 w-6" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Site Diary</h1>
                <p className="text-sm text-gray-500">{project.name}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <ProjectSiteDiary project={project} />
      </div>
    </div>
  )
}