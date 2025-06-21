'use client'

import { useState } from 'react'
import { api, withLoadingToast } from '@/lib/api-wrapper'
import toast from 'react-hot-toast'

export default function TestErrorPage() {
  const [loading, setLoading] = useState(false)

  // Test client-side error boundary
  const throwError = () => {
    throw new Error('This is a test error to demonstrate the error boundary!')
  }

  // Test successful API call with toast
  const testSuccessfulApi = async () => {
    const result = await api.get('/api/auth/me', {
      showSuccessToast: true,
      successMessage: 'User data loaded successfully!',
    })
    console.log('API Success Result:', result)
  }

  // Test failed API call with toast
  const testFailedApi = async () => {
    const result = await api.post('/api/auth/login', {
      email: 'invalid@example.com',
      password: 'wrongpassword',
    }, {
      errorMessage: 'Login failed. Please check your credentials.',
    })
    console.log('API Error Result:', result)
  }

  // Test network error
  const testNetworkError = async () => {
    const result = await api.get('http://localhost:9999/nonexistent', {
      errorMessage: 'Unable to connect to server',
    })
    console.log('Network Error Result:', result)
  }

  // Test loading toast with promise
  const testLoadingToast = async () => {
    setLoading(true)
    try {
      await withLoadingToast(
        new Promise((resolve) => setTimeout(resolve, 2000)),
        {
          loading: 'Processing your request...',
          success: 'Request completed successfully!',
          error: 'Request failed',
        }
      )
    } finally {
      setLoading(false)
    }
  }

  // Test custom toast types
  const showCustomToasts = () => {
    toast.success('This is a success toast!')
    setTimeout(() => toast.error('This is an error toast!'), 1000)
    setTimeout(() => toast('This is a default toast!'), 2000)
    setTimeout(() => toast.loading('This is a loading toast...'), 3000)
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Error Handling & Toast Test Page</h1>
      
      <div className="space-y-6">
        <section className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Error Boundary Test</h2>
          <p className="text-gray-600 mb-4">
            Click the button below to throw a client-side error and see the error boundary in action.
          </p>
          <button
            onClick={throwError}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            Throw Error (Will crash this page)
          </button>
        </section>

        <section className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">API Tests with Toast Notifications</h2>
          <div className="space-y-3">
            <button
              onClick={testSuccessfulApi}
              className="block w-full sm:w-auto px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              Test Successful API Call
            </button>
            
            <button
              onClick={testFailedApi}
              className="block w-full sm:w-auto px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              Test Failed API Call
            </button>
            
            <button
              onClick={testNetworkError}
              className="block w-full sm:w-auto px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              Test Network Error
            </button>
          </div>
        </section>

        <section className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Loading Toast Test</h2>
          <button
            onClick={testLoadingToast}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Processing...' : 'Test Loading Toast (2s delay)'}
          </button>
        </section>

        <section className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Custom Toast Types</h2>
          <button
            onClick={showCustomToasts}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            Show Various Toast Types
          </button>
        </section>
      </div>

      <div className="mt-8 p-4 bg-gray-100 rounded-lg">
        <h3 className="font-semibold mb-2">How to use in your components:</h3>
        <pre className="text-sm bg-gray-800 text-gray-100 p-4 rounded overflow-x-auto">
{`import { api } from '@/lib/api-wrapper'
import toast from 'react-hot-toast'

// Simple API call with automatic error toast
const result = await api.post('/api/projects', data)

// API call with custom messages
const result = await api.post('/api/projects', data, {
  showSuccessToast: true,
  successMessage: 'Project created!',
  errorMessage: 'Failed to create project'
})

// Manual toast
toast.success('Operation completed!')
toast.error('Something went wrong!')

// Loading toast with promise
import { withLoadingToast } from '@/lib/api-wrapper'

await withLoadingToast(
  saveData(),
  {
    loading: 'Saving...',
    success: 'Saved!',
    error: 'Failed to save'
  }
)`}</pre>
      </div>
    </div>
  )
}