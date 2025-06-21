'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function TestRoutePage() {
  const router = useRouter()
  const [lotId, setLotId] = useState('1e250900-a9ab-472b-95ba-464dd8c756cd')
  const [projectId, setProjectId] = useState('9b9e6ef4-84e8-495b-84aa-6c6b53d94e4c')
  
  const handleNavigate = () => {
    const url = `/project/${projectId}/lot/${lotId}`
    console.log('🚀 Navigating to:', url)
    router.push(url)
  }
  
  const handleDirectWindowNavigate = () => {
    const url = `/project/${projectId}/lot/${lotId}`
    console.log('🚀 Direct window navigation to:', url)
    window.location.href = url
  }
  
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto bg-white shadow rounded-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Test Route Navigation</h1>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Project ID</label>
            <input
              type="text"
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Lot ID</label>
            <input
              type="text"
              value={lotId}
              onChange={(e) => setLotId(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>
          
          <div className="pt-4 space-y-3">
            <button
              onClick={handleNavigate}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Navigate with router.push()
            </button>
            
            <button
              onClick={handleDirectWindowNavigate}
              className="w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
            >
              Navigate with window.location.href
            </button>
            
            <a
              href={`/project/${projectId}/lot/${lotId}`}
              className="block w-full text-center bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700"
            >
              Navigate with anchor tag
            </a>
          </div>
          
          <div className="pt-4 border-t mt-4">
            <p className="text-sm text-gray-600">Current URL will be:</p>
            <code className="block mt-1 p-2 bg-gray-100 rounded text-xs">
              /project/{projectId}/lot/{lotId}
            </code>
          </div>
        </div>
      </div>
    </div>
  )
}