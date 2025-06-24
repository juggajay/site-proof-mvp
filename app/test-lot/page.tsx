'use client'

import { useState, useEffect } from 'react'
import { getLotByIdAction } from '@/lib/actions'

export default function TestLotPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  
  const loadData = async () => {
    setLoading(true)
    const lotId = '156f47f9-66d4-4973-8a0d-05765fa43387'
    
    console.log('🔍 TEST PAGE: Calling getLotByIdAction')
    const result = await getLotByIdAction(lotId)
    console.log('🔍 TEST PAGE: Result:', result)
    console.log('🔍 TEST PAGE: Result stringified:', JSON.stringify(result, null, 2))
    
    setData(result)
    setLoading(false)
  }
  
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Test Lot Action</h1>
      
      <button
        onClick={loadData}
        disabled={loading}
        className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
      >
        {loading ? 'Loading...' : 'Load Lot Data'}
      </button>
      
      {data && (
        <div className="mt-4">
          <h2 className="text-xl font-semibold">Result:</h2>
          <pre className="bg-gray-100 p-4 rounded mt-2 overflow-auto">
            {JSON.stringify(data, null, 2)}
          </pre>
          
          {data.success && data.data && (
            <div className="mt-4">
              <h3 className="text-lg font-semibold">Summary:</h3>
              <ul className="list-disc pl-5 mt-2">
                <li>Lot ID: {data.data.id}</li>
                <li>Lot Number: {data.data.lot_number}</li>
                <li>Assignments: {data.data.lot_itp_assignments?.length || 0}</li>
                <li>Templates: {data.data.itp_templates?.length || 0}</li>
              </ul>
              
              {data.data.lot_itp_assignments && data.data.lot_itp_assignments.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-semibold">Assignments:</h4>
                  <ul className="list-disc pl-5 mt-2">
                    {data.data.lot_itp_assignments.map((a: any, i: number) => (
                      <li key={i}>
                        ID: {a.id}, Template: {a.template_id}, Status: {a.status}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}