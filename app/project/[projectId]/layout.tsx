'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

interface LayoutProps {
  children: React.ReactNode
  params: {
    projectId: string
  }
}

export default function ProjectLayout({ children, params }: LayoutProps) {
  const pathname = usePathname()
  const projectId = params.projectId
  
  const isDailyDiary = pathname.includes('/daily-diary')
  const isLots = pathname.includes('/lots')
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with Tabs */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center py-4">
            <Link href="/dashboard" className="mr-4 text-gray-400 hover:text-gray-600">
              <ArrowLeft className="h-6 w-6" />
            </Link>
            
            {/* Centered Tabs */}
            <div className="flex-1 flex justify-center">
              <div className="flex space-x-4 sm:space-x-8">
                <Link
                  href={`/project/${projectId}/daily-diary`}
                  className={`py-2 px-3 sm:px-4 border-b-2 font-medium text-sm ${
                    isDailyDiary
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Daily Diary
                </Link>
                <Link
                  href={`/project/${projectId}/lots`}
                  className={`py-2 px-3 sm:px-4 border-b-2 font-medium text-sm ${
                    isLots
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Lots
                </Link>
              </div>
            </div>
            
            {/* Right spacer to balance layout */}
            <div className="w-10"></div>
          </div>
        </div>
      </div>
      
      {children}
    </div>
  )
}