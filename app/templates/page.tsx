'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { getITPTemplatesAction } from '@/lib/actions'
import { ITPTemplate } from '@/types/database'
import Link from 'next/link'
import { ArrowLeft, Plus, ClipboardList, Settings, Eye } from 'lucide-react'

export default function TemplatesPage() {
  const { user, loading } = useAuth()
  const [templates, setTemplates] = useState<ITPTemplate[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      loadTemplates()
    }
  }, [user])

  const loadTemplates = async () => {
    try {
      const result = await getITPTemplatesAction()
      if (result.success) {
        setTemplates(result.data || [])
      } else {
        setError(result.error || 'Failed to load templates')
      }
    } catch (error) {
      console.error('Error loading templates:', error)
      setError('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const getCategoryColor = (category?: string) => {
    switch (category) {
      case 'structural': return 'bg-blue-100 text-blue-800'
      case 'electrical': return 'bg-yellow-100 text-yellow-800'
      case 'plumbing': return 'bg-green-100 text-green-800'
      case 'mechanical': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading templates...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Please log in to access templates.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center">
              <Link href="/dashboard" className="mr-4 text-gray-400 hover:text-gray-600">
                <ArrowLeft className="h-6 w-6" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">ITP Templates</h1>
                <p className="text-sm text-gray-500">Manage Inspection Test Plan templates</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                <Plus className="h-4 w-4 mr-2" />
                New Template
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {templates.length === 0 ? (
          <div className="bg-white shadow rounded-lg">
            <div className="text-center py-12">
              <ClipboardList className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-sm font-medium text-gray-900">No ITP templates found</h3>
              <p className="mt-2 text-sm text-gray-500">
                Get started by creating your first Inspection Test Plan template.
              </p>
              <div className="mt-6">
                <button className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Template
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map((template) => (
              <div key={template.id} className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900 truncate">
                      {template.name}
                    </h3>
                    <div className="flex items-center space-x-2">
                      <button className="text-gray-400 hover:text-gray-600">
                        <Settings className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {template.description && (
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                      {template.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between mb-4">
                    {template.category && (
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(template.category)}`}>
                        {template.category}
                      </span>
                    )}
                    <span className="text-xs text-gray-500">v{template.version}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        template.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {template.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <button className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700">
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </button>
                  </div>

                  <div className="mt-4 text-xs text-gray-500">
                    Created {new Date(template.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}