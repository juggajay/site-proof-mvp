'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'

export default function TestDailyReport({ params }: { params: { projectId: string; lotId: string } }) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<any>(null)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    async function test() {
      try {
        console.log('🔍 Testing database connection...')
        console.log('📍 Lot ID:', params.lotId)
        console.log('📍 Project ID:', params.projectId)
        
        // Test 1: Check authentication
        console.log('🔐 Testing authentication...')
        const { data: { session }, error: authError } = await supabase.auth.getSession()
        console.log('Auth test result:', { 
          hasSession: !!session, 
          userId: session?.user?.id,
          error: authError 
        })
        
        if (authError) {
          throw new Error(`Authentication error: ${authError.message}`)
        }
        
        if (!session) {
          throw new Error('No active session - user not logged in')
        }
        
        // Test 2: Check if lots table works
        console.log('📦 Testing lots table access...')
        const { data: lotData, error: lotError } = await supabase
          .from('lots')
          .select('*')
          .eq('id', params.lotId)
          .single()
        
        console.log('Lot test result:', { 
          data: lotData, 
          error: lotError,
          errorCode: lotError?.code,
          errorMessage: lotError?.message
        })
        
        if (lotError) {
          throw new Error(`Lots table error: ${lotError.message} (Code: ${lotError.code})`)
        }
        
        // Test 3: Check if daily_lot_reports table exists and is accessible
        console.log('📊 Testing daily_lot_reports table access...')
        const { data: reportData, error: reportError } = await supabase
          .from('daily_lot_reports')
          .select('*')
          .eq('lot_id', params.lotId)
          .limit(1)
        
        console.log('Report test result:', { 
          data: reportData, 
          error: reportError,
          errorCode: reportError?.code,
          errorMessage: reportError?.message
        })
        
        if (reportError) {
          // Check if it's a "table doesn't exist" error
          if (reportError.code === '42P01') {
            throw new Error('daily_lot_reports table does not exist - schema not deployed')
          }
          throw new Error(`Daily reports table error: ${reportError.message} (Code: ${reportError.code})`)
        }
        
        // Test 4: Try to create a test report
        console.log('✏️ Testing report creation...')
        const testDate = new Date().toISOString().split('T')[0]
        const { data: createData, error: createError } = await supabase
          .from('daily_lot_reports')
          .insert([{
            lot_id: params.lotId,
            report_date: testDate,
            weather: 'sunny',
            general_activities: 'Test report creation'
          }])
          .select()
          .single()
        
        console.log('Create test result:', { 
          data: createData, 
          error: createError,
          errorCode: createError?.code,
          errorMessage: createError?.message
        })
        
        if (createError) {
          throw new Error(`Report creation error: ${createError.message} (Code: ${createError.code})`)
        }
        
        setData({ 
          lot: lotData, 
          reports: reportData,
          newReport: createData,
          session: session
        })
        
        console.log('✅ All tests passed successfully!')
        
      } catch (err) {
        console.error('❌ Test error:', err)
        console.error('Error type:', typeof err)
        console.error('Error message:', err instanceof Error ? err.message : 'Unknown error')
        console.error('Error stack:', err instanceof Error ? err.stack : 'No stack trace')
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }
    
    test()
  }, [params.lotId, params.projectId])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400 text-lg">Testing database connection...</p>
          <p className="text-gray-500 dark:text-gray-500 text-sm mt-2">Running diagnostics</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center max-w-2xl mx-auto p-8">
          <div className="text-red-500 text-6xl mb-4">🔧</div>
          <h1 className="text-2xl font-bold text-red-600 mb-4">Diagnostic Test Failed</h1>
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
            <p className="text-red-800 dark:text-red-200 font-mono text-sm">{error}</p>
          </div>
          
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">Debugging Steps:</h3>
            <ol className="text-left text-yellow-700 dark:text-yellow-300 text-sm space-y-1">
              <li>1. Open browser DevTools (F12) → Console tab</li>
              <li>2. Look for detailed error messages above</li>
              <li>3. Check if daily_lot_reports table exists in Supabase</li>
              <li>4. Verify RLS policies are correctly configured</li>
              <li>5. Confirm user authentication is working</li>
            </ol>
          </div>
          
          <div className="space-y-3">
            <button
              onClick={() => window.location.reload()}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Run Test Again
            </button>
            <button
              onClick={() => window.history.back()}
              className="w-full px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <div className="text-green-500 text-6xl mb-4">✅</div>
          <h1 className="text-3xl font-bold text-green-600 mb-2">Database Connection Test Successful!</h1>
          <p className="text-gray-600 dark:text-gray-400">All systems are working correctly</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Test Results */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Test Results</h2>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <span className="text-green-500">✅</span>
                <span className="text-gray-700 dark:text-gray-300">Authentication working</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-green-500">✅</span>
                <span className="text-gray-700 dark:text-gray-300">Lots table accessible</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-green-500">✅</span>
                <span className="text-gray-700 dark:text-gray-300">Daily reports table accessible</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-green-500">✅</span>
                <span className="text-gray-700 dark:text-gray-300">Report creation working</span>
              </div>
            </div>
          </div>

          {/* Data Summary */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Data Summary</h2>
            <div className="space-y-2 text-sm">
              <div><strong>Project ID:</strong> {params.projectId}</div>
              <div><strong>Lot ID:</strong> {params.lotId}</div>
              <div><strong>Lot Number:</strong> {data?.lot?.lot_number}</div>
              <div><strong>User ID:</strong> {data?.session?.user?.id}</div>
              <div><strong>New Report ID:</strong> {data?.newReport?.id}</div>
            </div>
          </div>
        </div>

        {/* Raw Data */}
        <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Raw Data (Check Console for Details)</h2>
          <pre className="bg-gray-100 dark:bg-gray-700 p-4 rounded text-xs overflow-auto">
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>

        {/* Next Steps */}
        <div className="mt-8 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4 text-green-800 dark:text-green-200">✅ Ready for Full Implementation</h2>
          <p className="text-green-700 dark:text-green-300 mb-4">
            All database connections are working correctly. The daily report system can now be fully implemented.
          </p>
          <button
            onClick={() => {
              // This would restore the full daily report page
              console.log('Ready to restore full daily report functionality')
              alert('Database test successful! Ready to implement full daily report system.')
            }}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Implement Full Daily Report System
          </button>
        </div>
      </div>
    </div>
  )
}