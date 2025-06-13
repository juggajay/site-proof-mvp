'use client'

import { useRouter } from 'next/navigation'
import { v4 as uuidv4 } from 'uuid'

interface HistoryPageProps {
  params: { 
    projectId: string
    lotId: string 
  }
}

export default function HistoryPage({ params }: HistoryPageProps) {
  const router = useRouter()

  const handleGoBack = () => {
    router.push(`/project/${params.projectId}/lot/${params.lotId}`)
  }

  // Mock history data
  const historyItems = [
    {
      id: uuidv4(),
      action: 'Inspection Started',
      user: 'John Doe',
      timestamp: '2024-01-15 10:30:00',
      status: 'completed'
    },
    {
      id: uuidv4(),
      action: 'Lot Created',
      user: 'Jane Smith',
      timestamp: '2024-01-14 14:20:00',
      status: 'completed'
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-4xl mx-auto">
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
            Lot History
          </h1>

          <div className="space-y-4">
            {historyItems.map((item) => (
              <div key={item.id} className="border-l-4 border-blue-500 pl-4 py-3 bg-gray-50 dark:bg-gray-700 rounded-r-lg">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {item.action}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      by {item.user}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {item.timestamp}
                    </p>
                    <span className={`inline-block px-2 py-1 text-xs rounded ${
                      item.status === 'completed' 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                    }`}>
                      {item.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {historyItems.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400">
                No history records found for this lot.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}