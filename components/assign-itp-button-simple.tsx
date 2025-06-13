'use client'

import { useState } from 'react'

export function AssignITPButton({ lotId, lotName }: { lotId: string; lotName: string }) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleAssign = async () => {
    setIsLoading(true)
    
    try {
      // Simple assignment without Supabase for now
      await new Promise(resolve => setTimeout(resolve, 1000))
      alert('ITP assignment simulated successfully!')
      setIsOpen(false)
    } catch (error) {
      alert('Assignment failed')
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-md font-medium min-h-[44px]"
      >
        Assign ITP to Lot
      </button>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">
          Assign ITP to {lotName}
        </h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Select ITP
            </label>
            <select className="w-full p-3 border border-gray-300 rounded-md text-gray-900">
              <option>Highway Concrete Pour Inspection</option>
              <option>Asphalt Layer Quality Check</option>
              <option>Bridge Foundation Inspection</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Assign to
            </label>
            <select className="w-full p-3 border border-gray-300 rounded-md text-gray-900">
              <option>John Rodriguez - Senior Inspector</option>
              <option>Sarah Chen - Quality Engineer</option>
              <option>Mike Thompson - Site Inspector</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Scheduled Date
            </label>
            <input
              type="date"
              className="w-full p-3 border border-gray-300 rounded-md text-gray-900"
            />
          </div>
        </div>

        <div className="flex gap-2 mt-6">
          <button
            onClick={() => setIsOpen(false)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleAssign}
            disabled={isLoading}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? 'Assigning...' : 'Assign ITP'}
          </button>
        </div>
      </div>
    </div>
  )
}