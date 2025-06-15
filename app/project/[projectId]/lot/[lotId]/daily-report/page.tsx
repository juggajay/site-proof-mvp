'use client'

import React, { useState, useEffect } from 'react'
import { ComprehensiveSiteDiary } from '../../../../../../components/site-diary/comprehensive-site-diary'
import { Card, CardContent, CardHeader, CardTitle } from '../../../../../../components/ui/card'
import { Calendar, ArrowLeft, FileText, CheckSquare, ClipboardList } from 'lucide-react'
import { Button } from '../../../../../../components/ui/button'
import Link from 'next/link'

/* Site-Proof Professional B2B Daily Report Page - Dashboard Style Implementation */

interface DailyReportPageProps {
  params: {
    projectId: string
    lotId: string
  }
}

export default function DailyReportPage({ params }: DailyReportPageProps) {
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date()
    const dateString = today.toISOString().split('T')[0]
    return dateString || new Date().toLocaleDateString('en-CA') // fallback to YYYY-MM-DD format
  })
  const [projectName, setProjectName] = useState('') 
  const [lotNumber, setLotNumber] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('site-diary') // Add active tab state

  // Load project and lot data
  useEffect(() => {
    const loadProjectData = async () => {
      setIsLoading(true)
      try {
        // Replace with your actual data fetching logic
        // Example:
        // const project = await getProject(params.projectId)
        // const lot = await getLot(params.lotId)
        
        // Mock data for now - replace with actual API calls
        setProjectName('Sample Construction Project')
        setLotNumber('1')
      } catch (error) {
        console.error('Error loading project data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadProjectData()
  }, [params.projectId, params.lotId])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1B4F72] mx-auto"></div>
          <p className="mt-2 text-sm text-[#6C757D] font-primary">Loading daily report...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 max-w-7xl">
      {/* Header with Navigation - Dashboard Style */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href={`/project/${params.projectId}/lot/${params.lotId}`}>
            <Button variant="outline" size="sm" className="border-[#1B4F72]/20 text-[#1B4F72] hover:bg-[#1B4F72]/10">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Lot
            </Button>
          </Link>
          
          <div>
            <h1 className="text-2xl font-bold text-[#1B4F72] font-heading">
              Daily Lot Report - {lotNumber}
            </h1>
            <p className="text-[#6C757D] font-primary">
              {new Date(selectedDate).toLocaleDateString('en-AU')} • {projectName}
            </p>
          </div>
        </div>

        {/* Date Picker - Dashboard Style */}
        <div className="flex items-center gap-2 bg-white border border-[#1B4F72]/20 rounded-lg px-3 py-2">
          <Calendar className="h-4 w-4 text-[#1B4F72]" />
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="text-sm font-primary border-none outline-none bg-transparent text-[#1B4F72]"
          />
        </div>
      </div>

      {/* FUNCTIONAL Tab Navigation - Dashboard Color Scheme */}
      <div className="mb-6">
        <div className="flex space-x-1 rounded-lg bg-slate-100 p-1 border border-[#1B4F72]/10">
          <button
            onClick={() => setActiveTab('site-diary')}
            className={`flex-1 rounded-md px-4 py-3 text-center text-sm font-medium transition-all duration-200 font-primary ${
              activeTab === 'site-diary' 
                ? 'bg-[#1B4F72] text-white shadow-sm' 
                : 'text-slate-600 hover:text-[#1B4F72] hover:bg-white/50'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <ClipboardList className="h-4 w-4" />
              <span className="font-semibold">Site Diary</span>
            </div>
            <div className="text-xs opacity-80 mt-1">Events & Evidence</div>
          </button>
          
          <button
            onClick={() => setActiveTab('dockets')}
            className={`flex-1 rounded-md px-4 py-3 text-center text-sm font-medium transition-all duration-200 font-primary ${
              activeTab === 'dockets' 
                ? 'bg-[#1B4F72] text-white shadow-sm' 
                : 'text-slate-600 hover:text-[#1B4F72] hover:bg-white/50'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <FileText className="h-4 w-4" />
              <span className="font-semibold">Dockets</span>
            </div>
            <div className="text-xs opacity-80 mt-1">Labour, Plant & Materials</div>
          </button>
          
          <button
            onClick={() => setActiveTab('compliance')}
            className={`flex-1 rounded-md px-4 py-3 text-center text-sm font-medium transition-all duration-200 font-primary ${
              activeTab === 'compliance' 
                ? 'bg-[#1B4F72] text-white shadow-sm' 
                : 'text-slate-600 hover:text-[#1B4F72] hover:bg-white/50'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <CheckSquare className="h-4 w-4" />
              <span className="font-semibold">Compliance</span>
            </div>
            <div className="text-xs opacity-80 mt-1">QA & Environmental</div>
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="mt-0">
        {activeTab === 'site-diary' && (
          <div>
            {/* PHASE 1 COMPREHENSIVE SITE DIARY */}
            <ComprehensiveSiteDiary
              projectId={params.projectId}
              projectName={projectName}
              selectedDate={selectedDate}
              lotNumber={lotNumber}
            />
          </div>
        )}

        {activeTab === 'dockets' && (
          <Card className="border-[#1B4F72]/20 bg-gradient-to-br from-slate-50 to-blue-50">
            <CardHeader className="bg-gradient-to-r from-[#1B4F72]/5 to-[#F1C40F]/5 border-b border-[#1B4F72]/10">
              <CardTitle className="flex items-center gap-2 text-[#1B4F72] font-heading">
                <FileText className="h-5 w-5" />
                Labour, Plant & Materials Dockets
              </CardTitle>
            </CardHeader>
            <CardContent className="py-12">
              <div className="text-center">
                <div className="w-16 h-16 bg-[#1B4F72]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileText className="h-8 w-8 text-[#1B4F72]" />
                </div>
                <h3 className="text-xl font-bold text-[#1B4F72] mb-2 font-heading">
                  Digital Dockets Coming Soon
                </h3>
                <p className="text-slate-600 mb-6 max-w-md mx-auto font-primary">
                  Track labour hours, plant usage, and material deliveries with digital dockets that integrate seamlessly with your Site Diary.
                </p>
                
                <div className="bg-white border border-[#1B4F72]/20 rounded-lg p-6 max-w-lg mx-auto shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-blue-600">2</span>
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-[#1B4F72] mb-1 font-heading">Phase 2 Feature</p>
                      <p className="text-sm text-slate-600 font-primary">
                        Digital docket management will automatically integrate with your existing Site Diary data to provide comprehensive project tracking and payroll integration.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === 'compliance' && (
          <Card className="border-[#1B4F72]/20 bg-gradient-to-br from-slate-50 to-green-50">
            <CardHeader className="bg-gradient-to-r from-[#1B4F72]/5 to-[#F1C40F]/5 border-b border-[#1B4F72]/10">
              <CardTitle className="flex items-center gap-2 text-[#1B4F72] font-heading">
                <CheckSquare className="h-5 w-5" />
                QA & Environmental Compliance
              </CardTitle>
            </CardHeader>
            <CardContent className="py-12">
              <div className="text-center">
                <div className="w-16 h-16 bg-[#1B4F72]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckSquare className="h-8 w-8 text-[#1B4F72]" />
                </div>
                <h3 className="text-xl font-bold text-[#1B4F72] mb-2 font-heading">
                  Compliance Tracking Coming Soon
                </h3>
                <p className="text-slate-600 mb-6 max-w-md mx-auto font-primary">
                  Monitor quality assurance checks, environmental compliance, and safety standards with automated reporting.
                </p>
                
                <div className="bg-white border border-[#1B4F72]/20 rounded-lg p-6 max-w-lg mx-auto shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-green-600">2</span>
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-[#1B4F72] mb-1 font-heading">Phase 2 Feature</p>
                      <p className="text-sm text-slate-600 font-primary">
                        Automated compliance reporting based on your Site Diary events, inspection data, and safety briefings with real-time compliance scoring.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}