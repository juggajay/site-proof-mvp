'use client'

import { useState } from 'react'
import { ArrowLeft, CheckCircle2, XCircle } from 'lucide-react'
import Link from 'next/link'

export default function TestSmartSelectsPage() {
  const [testResults, setTestResults] = useState<{
    labour: boolean | null
    plant: boolean | null
    materials: boolean | null
  }>({
    labour: null,
    plant: null,
    materials: null
  })

  const testScenarios = [
    {
      name: 'Labour Smart Select',
      description: 'Test that selecting an employee from the resource library auto-populates worker details',
      steps: [
        'Navigate to Site Diary',
        'Click "Add Labour Docket"',
        'Select an employee from the dropdown',
        'Verify worker name, trade, and hourly rate are auto-filled',
        'Submit the form and verify it saves correctly'
      ],
      key: 'labour' as const
    },
    {
      name: 'Plant Smart Select',
      description: 'Test that selecting equipment from the resource library auto-populates equipment details',
      steps: [
        'Navigate to Site Diary',
        'Click "Add Plant Docket"',
        'Select equipment from the dropdown',
        'Verify equipment type, ID, and hourly rate are auto-filled',
        'Submit the form and verify it saves correctly'
      ],
      key: 'plant' as const
    },
    {
      name: 'Materials Smart Select',
      description: 'Test that selecting a material from the resource library auto-populates material details',
      steps: [
        'Navigate to Site Diary',
        'Click "Add Materials Docket"',
        'Select a material from the dropdown',
        'Verify material type, supplier, unit, and rate are auto-filled',
        'Submit the form and verify it saves correctly'
      ],
      key: 'materials' as const
    }
  ]

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <Link href="/dashboard" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Link>
      </div>

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Test Smart Select Functionality</h1>
        <p className="text-gray-600">
          Manual testing checklist for smart select features in Site Diary dockets
        </p>
      </div>

      <div className="space-y-6">
        {testScenarios.map((scenario) => (
          <div key={scenario.key} className="bg-white shadow rounded-lg p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-lg font-medium text-gray-900">{scenario.name}</h2>
                <p className="text-sm text-gray-600 mt-1">{scenario.description}</p>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setTestResults({ ...testResults, [scenario.key]: true })}
                  className={`px-3 py-1 rounded-md text-sm font-medium ${
                    testResults[scenario.key] === true
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <CheckCircle2 className="h-4 w-4 inline mr-1" />
                  Pass
                </button>
                <button
                  onClick={() => setTestResults({ ...testResults, [scenario.key]: false })}
                  className={`px-3 py-1 rounded-md text-sm font-medium ${
                    testResults[scenario.key] === false
                      ? 'bg-red-100 text-red-800'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <XCircle className="h-4 w-4 inline mr-1" />
                  Fail
                </button>
              </div>
            </div>
            
            <div className="mt-4">
              <h3 className="text-sm font-medium text-gray-900 mb-2">Test Steps:</h3>
              <ol className="list-decimal list-inside space-y-1">
                {scenario.steps.map((step, index) => (
                  <li key={index} className="text-sm text-gray-600">{step}</li>
                ))}
              </ol>
            </div>

            {testResults[scenario.key] !== null && (
              <div className={`mt-4 p-3 rounded-md ${
                testResults[scenario.key] ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
              }`}>
                <p className="text-sm font-medium">
                  Test Result: {testResults[scenario.key] ? 'PASSED' : 'FAILED'}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-blue-900 mb-2">Prerequisites</h3>
        <ul className="list-disc list-inside space-y-1 text-sm text-blue-800">
          <li>Ensure you have created resources in the Resource Library (subcontractors, plant profiles, material profiles)</li>
          <li>Navigate to a project with an active lot to access the Site Diary</li>
          <li>Test both the smart select dropdown and manual entry options</li>
        </ul>
      </div>

      <div className="mt-6 flex space-x-4">
        <Link 
          href="/dashboard/resources" 
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
        >
          Go to Resource Library
        </Link>
        <Link 
          href="/dashboard" 
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
        >
          Go to Projects
        </Link>
      </div>
    </div>
  )
}