'use client'

import { useState, useEffect } from 'react'
import { debugLotLookupAction } from '@/lib/actions'
import { useAuth } from '@/contexts/auth-context'

interface PageProps {
  params: {
    lotId: string
  }
}

export default function DebugLotPage({ params }: PageProps) {
  const { user } = useAuth()
  const [debugData, setDebugData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  
  useEffect(() => {
    async function runDebug() {
      if (user) {
        const result = await debugLotLookupAction(params.lotId)
        setDebugData(result)
        setIsLoading(false)
      }
    }
    runDebug()
  }, [params.lotId, user])
  
  if (isLoading) {
    return <div className="p-8">Loading debug data...</div>
  }
  
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Lot Lookup Debug</h1>
      <pre className="bg-gray-100 p-4 rounded overflow-auto">
        {JSON.stringify(debugData, null, 2)}
      </pre>
    </div>
  )
}