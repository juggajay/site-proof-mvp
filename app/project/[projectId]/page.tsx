'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface PageProps {
  params: {
    projectId: string
  }
}

export default function ProjectDetailPage({ params }: PageProps) {
  const router = useRouter()
  const projectId = params.projectId

  useEffect(() => {
    // Redirect to daily diary page
    router.replace(`/project/${projectId}/daily-diary`)
  }, [projectId, router])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Redirecting to Daily Diary...</p>
      </div>
    </div>
  )
}