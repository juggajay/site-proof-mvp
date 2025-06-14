'use client'

import { useEffect } from 'react'
import { SiteProofLogo } from '../components/ui/site-proof-logo'
import { AlertTriangle } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log error details for debugging
    console.error('Application error:', {
      message: error.message,
      stack: error.stack,
      digest: error.digest
    })
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="max-w-md w-full bg-white shadow-lg rounded-xl p-8 text-center border border-slate-200">
        <div className="mb-6">
          <SiteProofLogo size="md" showText={true} className="mx-auto mb-6" />
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </div>
        </div>
        <h2 className="text-xl font-semibold text-slate-900 mb-3 font-heading">
          Something went wrong
        </h2>
        <p className="text-slate-600 mb-6 font-primary">
          {error.message || 'An unexpected error occurred while processing your request.'}
        </p>
        <button
          onClick={() => reset()}
          className="w-full bg-blue-800 text-white px-6 py-3 rounded-lg hover:bg-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-800 focus:ring-offset-2 transition-colors font-medium"
        >
          Try again
        </button>
        <p className="text-xs text-slate-500 mt-4">
          If this problem persists, please contact our support team.
        </p>
      </div>
    </div>
  )
}