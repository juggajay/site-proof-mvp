'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { getProjectByIdAction } from '@/lib/actions'
import { ProjectWithDetails } from '@/types/database'
import Link from 'next/link'
import { ArrowLeft, AlertCircle } from 'lucide-react'
import { DailyDiaryHub } from '@/components/site-diary/daily-diary-hub'

interface PageProps {
  params: {
    projectId: string
  }
}

export default function ProjectDailyDiaryPage({ params }: PageProps) {
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
          <p className="text-gray-600">Loading daily diary...</p>
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
          <Link href="/dashboard" className="mt-4 inline-flex items-center text-blue-600 hover:text-blue-700">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Daily Diary</h1>
        <p className="text-sm text-gray-500">{project.name}</p>
      </div>
      <DailyDiaryHub project={project} />
    </div>
  )
}