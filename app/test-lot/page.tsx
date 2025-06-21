'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function TestLotPage() {
  const router = useRouter()
  
  useEffect(() => {
    // Test navigation to a specific lot
    const testLotId = '1e250900-a9ab-472b-95ba-464dd8c756cd'
    const testProjectId = '9b9e6ef4-84e8-495b-84aa-6c6b53d94e4c'
    
    console.log('🧪 TEST: Navigating to lot:', testLotId)
    console.log('🧪 TEST: In project:', testProjectId)
    
    // Navigate after a short delay
    setTimeout(() => {
      const url = `/project/${testProjectId}/lot/${testLotId}`
      console.log('🧪 TEST: Navigating to URL:', url)
      router.push(url)
    }, 1000)
  }, [router])
  
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Test Lot Navigation</h1>
        <p className="text-gray-600">Navigating to lot in 1 second...</p>
        <p className="text-sm text-gray-500 mt-2">Check console for debug messages</p>
      </div>
    </div>
  )
}