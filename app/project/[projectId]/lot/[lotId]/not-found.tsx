import Link from 'next/link'
import { AlertTriangle, ArrowLeft } from 'lucide-react'

export default function LotNotFound() {
  console.error('🔴🔴🔴 LOT NOT-FOUND COMPONENT RENDERED')
  
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <AlertTriangle className="h-12 w-12 text-red-600 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Lot Not Found</h2>
        <p className="text-gray-600 mb-4">This is the custom not-found page for lots.</p>
        <p className="text-red-600 mb-4">NOT-FOUND COMPONENT IS RENDERING</p>
        
        <Link href="/dashboard" className="inline-flex items-center text-blue-600 hover:text-blue-700">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Link>
      </div>
    </div>
  )
}