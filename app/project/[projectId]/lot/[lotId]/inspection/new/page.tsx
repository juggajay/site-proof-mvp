'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface NewInspectionPageProps {
  params: { 
    projectId: string
    lotId: string 
  }
}

export default function NewInspectionPage({ params }: NewInspectionPageProps) {
  const [isStarting, setIsStarting] = useState(false)
  const router = useRouter()

  const handleStartInspection = async () => {
    setIsStarting(true)
    
    try {
      // Simulate starting inspection process
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // In a real app, this would create an inspection record
      console.log('Starting inspection for lot:', params.lotId)
      
      // Navigate to inspection checklist or success page
      alert('Inspection started successfully!')
      router.back() // Go back to lot details
      
    } catch (error) {
      console.error('Error starting inspection:', error)
      alert('Failed to start inspection. Please try again.')
    } finally {
      setIsStarting(false)
    }
  }

  const handleGoBack = () => {
    router.push(`/project/${params.projectId}/lot/${params.lotId}`)
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-2xl mx-auto">
        {/* Breadcrumb */}
        <nav className="mb-6">
          <button
            onClick={handleGoBack}
            className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Lot Details
          </button>
        </nav>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
            Start New Inspection
          </h1>

          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                Inspection Details
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            </div>

            <div className="border-t dark:border-gray-600 pt-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Ready to Begin?
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                This will start a new inspection for the selected lot. Make sure you have all necessary equipment and documentation ready.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={handleStartInspection}
                  disabled={isStarting}
                  className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
                    isStarting
                      ? 'bg-blue-700 text-white cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  {isStarting ? (
                    <>
                      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Starting Inspection...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Begin Inspection
                    </>
                  )}
                </button>

                <button
                  onClick={handleGoBack}
                  disabled={isStarting}
                  className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 rounded-lg font-medium transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}