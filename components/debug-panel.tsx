'use client'

import { useState } from 'react'

interface DebugPanelProps {
  lotId: string
  lotData: any
}

export function DebugPanel({ lotId, lotData }: DebugPanelProps) {
  const [isOpen, setIsOpen] = useState(false)
  
  const runDiagnostics = async () => {
    try {
      const response = await fetch(`/api/diagnostic?lotId=${lotId}`)
      const data = await response.json()
      console.log('🔍 DIAGNOSTIC RESULTS:', data)
      alert('Check console for diagnostic results')
    } catch (error) {
      console.error('Diagnostic error:', error)
    }
  }
  
  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 bg-gray-800 text-white px-4 py-2 rounded shadow-lg text-sm"
      >
        Debug Panel
      </button>
    )
  }
  
  return (
    <div className="fixed bottom-4 right-4 bg-white border border-gray-300 rounded-lg shadow-lg p-4 max-w-md">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-bold text-sm">Debug Panel</h3>
        <button
          onClick={() => setIsOpen(false)}
          className="text-gray-500 hover:text-gray-700"
        >
          ×
        </button>
      </div>
      
      <div className="space-y-2 text-xs">
        <div>
          <strong>Lot ID:</strong> {lotId}
        </div>
        <div>
          <strong>Assignments:</strong> {lotData?.lot_itp_assignments?.length || 0}
        </div>
        <div>
          <strong>Templates:</strong> {lotData?.itp_templates?.length || 0}
        </div>
        <div>
          <strong>Environment:</strong> {process.env.NODE_ENV}
        </div>
        
        <button
          onClick={runDiagnostics}
          className="w-full bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
        >
          Run Diagnostics
        </button>
        
        <details className="mt-2">
          <summary className="cursor-pointer text-blue-600">View Raw Data</summary>
          <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto max-h-60">
            {JSON.stringify({
              lot_itp_assignments: lotData?.lot_itp_assignments,
              itp_templates: lotData?.itp_templates?.map((t: any) => ({ id: t.id, name: t.name }))
            }, null, 2)}
          </pre>
        </details>
      </div>
    </div>
  )
}