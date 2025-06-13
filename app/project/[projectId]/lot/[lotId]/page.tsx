'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface LotPageProps {
  params: { 
    projectId: string
    lotId: string 
  }
}

export default function LotPage({ params }: LotPageProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [selectedAction, setSelectedAction] = useState<string | null>(null)
  const router = useRouter()

  const handleStartInspection = async () => {
    setIsLoading(true)
    setSelectedAction('inspection')
    
    try {
      // Simulate starting an inspection
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Navigate to inspection page (create this later)
      router.push(`/project/${params.projectId}/lot/${params.lotId}/inspection/new`)
      
    } catch (error) {
      console.error('Error starting inspection:', error)
      alert('Error starting inspection. Please try again.')
    } finally {
      setIsLoading(false)
      setSelectedAction(null)
    }
  }

  const handleEditLot = async () => {
    setIsLoading(true)
    setSelectedAction('edit')
    
    try {
      // Simulate edit action
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Navigate to edit page (create this later)
      router.push(`/project/${params.projectId}/lot/${params.lotId}/edit`)
      
    } catch (error) {
      console.error('Error navigating to edit:', error)
      alert('Edit functionality coming soon!')
    } finally {
      setIsLoading(false)
      setSelectedAction(null)
    }
  }

  const handleViewHistory = async () => {
    setIsLoading(true)
    setSelectedAction('history')
    
    try {
      // Simulate loading history
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Navigate to history page (create this later)
      router.push(`/project/${params.projectId}/lot/${params.lotId}/history`)
      
    } catch (error) {
      console.error('Error loading history:', error)
      alert('History functionality coming soon!')
    } finally {
      setIsLoading(false)
      setSelectedAction(null)
    }
  }

  const handleBackToProject = () => {
    router.push(`/project/${params.projectId}`)
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Breadcrumb Navigation */}
        <nav className="mb-6">
          <button
            onClick={handleBackToProject}
            className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Project
          </button>
        </nav>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Lot Details
          </h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                Project ID
              </label>
              <p className="text-gray-900 dark:text-gray-100 font-mono text-sm bg-gray-100 dark:bg-gray-700 p-2 rounded">
                {params.projectId}
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                Lot ID
              </label>
              <p className="text-gray-900 dark:text-gray-100 font-mono text-sm bg-gray-100 dark:bg-gray-700 p-2 rounded">
                {params.lotId}
              </p>
            </div>
          </div>

          <div className="border-t dark:border-gray-600 pt-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
              Inspection Details
            </h2>
            <div className="flex items-center gap-2 mb-4">
              <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <p className="text-gray-600 dark:text-gray-300">
                Route is working! This page is now accessible.
              </p>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              You can now add your inspection lot functionality here.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleStartInspection}
              disabled={isLoading}
              className={`flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
                selectedAction === 'inspection'
                  ? 'bg-blue-700 text-white'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {selectedAction === 'inspection' ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Starting...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Start Inspection
                </>
              )}
            </button>

            <button
              onClick={handleEditLot}
              disabled={isLoading}
              className={`flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
                selectedAction === 'edit'
                  ? 'bg-gray-300 text-gray-700'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {selectedAction === 'edit' ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Loading...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit Lot
                </>
              )}
            </button>

            <button
              onClick={handleViewHistory}
              disabled={isLoading}
              className={`flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
                selectedAction === 'history'
                  ? 'bg-gray-300 text-gray-700'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {selectedAction === 'history' ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Loading...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  View History
                </>
              )}
            </button>
          </div>

          {/* Status Information */}
          <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
              Next Steps
            </h3>
            <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
              <li>• Click 'Start Inspection' to begin a new inspection</li>
              <li>• Use 'Edit Lot' to modify lot details</li>
              <li>• View 'History' to see past inspections</li>
              <li>• All buttons now have loading states and navigation</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}