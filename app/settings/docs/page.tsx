'use client'

import { FileText, Download, ExternalLink, Book, Video, HelpCircle } from 'lucide-react'

export default function DocumentationPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="px-6 py-6">
          <div className="flex items-center">
            <FileText className="h-8 w-8 text-gray-600 mr-3" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Documentation</h1>
              <p className="text-sm text-gray-500">User guides, tutorials, and system documentation</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto py-6 px-6">
        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center mb-4">
              <Book className="h-8 w-8 text-blue-600" />
              <h3 className="ml-3 text-lg font-medium text-gray-900">User Guide</h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Complete guide for using Site Proof including project setup, inspections, and reporting.
            </p>
            <button className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700">
              <ExternalLink className="h-4 w-4 mr-1" />
              Open Guide
            </button>
          </div>

          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center mb-4">
              <Video className="h-8 w-8 text-green-600" />
              <h3 className="ml-3 text-lg font-medium text-gray-900">Video Tutorials</h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Step-by-step video tutorials covering all major features and workflows.
            </p>
            <button className="inline-flex items-center text-sm text-green-600 hover:text-green-700">
              <ExternalLink className="h-4 w-4 mr-1" />
              Watch Videos
            </button>
          </div>

          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center mb-4">
              <HelpCircle className="h-8 w-8 text-purple-600" />
              <h3 className="ml-3 text-lg font-medium text-gray-900">Support</h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Get help from our support team or browse frequently asked questions.
            </p>
            <button className="inline-flex items-center text-sm text-purple-600 hover:text-purple-700">
              <ExternalLink className="h-4 w-4 mr-1" />
              Contact Support
            </button>
          </div>
        </div>

        {/* Documentation Sections */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Documentation Library</h3>
          </div>
          <div className="divide-y divide-gray-200">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-gray-900">Getting Started Guide</h4>
                  <p className="text-sm text-gray-500">Learn the basics of Site Proof</p>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-xs text-gray-500">PDF • 2.3 MB</span>
                  <button className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700">
                    <Download className="h-4 w-4 mr-1" />
                    Download
                  </button>
                </div>
              </div>
            </div>

            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-gray-900">Project Management Manual</h4>
                  <p className="text-sm text-gray-500">Complete guide to managing construction projects</p>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-xs text-gray-500">PDF • 5.7 MB</span>
                  <button className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700">
                    <Download className="h-4 w-4 mr-1" />
                    Download
                  </button>
                </div>
              </div>
            </div>

            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-gray-900">Quality Inspection Procedures</h4>
                  <p className="text-sm text-gray-500">Best practices for conducting quality inspections</p>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-xs text-gray-500">PDF • 3.1 MB</span>
                  <button className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700">
                    <Download className="h-4 w-4 mr-1" />
                    Download
                  </button>
                </div>
              </div>
            </div>

            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-gray-900">ITP Template Creation Guide</h4>
                  <p className="text-sm text-gray-500">How to create and manage inspection test plans</p>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-xs text-gray-500">PDF • 1.8 MB</span>
                  <button className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700">
                    <Download className="h-4 w-4 mr-1" />
                    Download
                  </button>
                </div>
              </div>
            </div>

            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-gray-900">Reporting & Analytics Guide</h4>
                  <p className="text-sm text-gray-500">Generate reports and analyze project data</p>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-xs text-gray-500">PDF • 4.2 MB</span>
                  <button className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700">
                    <Download className="h-4 w-4 mr-1" />
                    Download
                  </button>
                </div>
              </div>
            </div>

            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-gray-900">System Administration Guide</h4>
                  <p className="text-sm text-gray-500">Admin settings, user management, and system configuration</p>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-xs text-gray-500">PDF • 6.1 MB</span>
                  <button className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700">
                    <Download className="h-4 w-4 mr-1" />
                    Download
                  </button>
                </div>
              </div>
            </div>

            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-gray-900">API Documentation</h4>
                  <p className="text-sm text-gray-500">Developer guide for API integration</p>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-xs text-gray-500">Web • Interactive</span>
                  <button className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700">
                    <ExternalLink className="h-4 w-4 mr-1" />
                    View Online
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Release Notes */}
        <div className="mt-8 bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Release Notes</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-gray-900">Version 2.1.0 - Latest</h4>
                <p className="text-xs text-gray-500 mb-2">Released June 18, 2025</p>
                <ul className="text-sm text-gray-600 list-disc list-inside space-y-1">
                  <li>Enhanced project dashboard with real-time statistics</li>
                  <li>Improved mobile responsiveness for field inspections</li>
                  <li>New bulk actions for conformance records</li>
                  <li>Performance improvements and bug fixes</li>
                </ul>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-900">Version 2.0.0</h4>
                <p className="text-xs text-gray-500 mb-2">Released May 15, 2025</p>
                <ul className="text-sm text-gray-600 list-disc list-inside space-y-1">
                  <li>Complete UI redesign with modern interface</li>
                  <li>Advanced reporting capabilities</li>
                  <li>Role-based access control system</li>
                  <li>Integration with external quality systems</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}