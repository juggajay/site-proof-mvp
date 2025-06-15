'use client'

import React, { useState, useEffect } from 'react'
import { ComprehensiveSiteDiary } from '../../../../../../components/site-diary/comprehensive-site-diary'
import { Card, CardContent, CardHeader, CardTitle } from '../../../../../../components/ui/card'
import { Calendar, ArrowLeft } from 'lucide-react'
import { Button } from '../../../../../../components/ui/button'
import Link from 'next/link'

/* Site-Proof Professional B2B Daily Report Page - Exact Landing Page Implementation */

interface DailyReportPageProps {
  params: {
    projectId: string
    lotId: string
  }
}

export default function DailyReportPage({ params }: DailyReportPageProps) {
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const today = new Date()
    const dateString = today.toISOString().split('T')[0]
    return dateString || new Date().toLocaleDateString('en-CA') // fallback to YYYY-MM-DD format
  })
  const [projectName, setProjectName] = useState<string>('Sample Construction Project')
  const [lotNumber, setLotNumber] = useState<string>('1')
  const [isLoading, setIsLoading] = useState(true)

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
    <div className="container mx-auto p-4 max-w-7xl bg-[#F8F9FA] min-h-screen">
      {/* Header with Navigation - Site-Proof Branded */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href={`/project/${params.projectId}/lot/${params.lotId}`}>
            <Button variant="outline" size="sm" className="border-[#1B4F72] text-[#1B4F72] hover:bg-[#1B4F72] hover:text-white">
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

        {/* Date Picker - Site-Proof Styled */}
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-[#1B4F72]" />
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="rounded-md border-2 border-[#6C757D] bg-white px-3 py-2 text-sm font-primary text-[#2C3E50] focus:border-[#1B4F72] focus:ring-2 focus:ring-[#1B4F72]/20 transition-all duration-200"
          />
        </div>
      </div>

      {/* Tab Navigation - Site-Proof Professional Design */}
      <div className="mb-6">
        <div className="flex space-x-1 rounded-lg bg-[#F8F9FA] p-1 border border-[#DEE2E6]">
          <div className="flex-1 rounded-md bg-[#1B4F72] px-3 py-2 text-center text-sm font-medium text-white font-primary shadow-sm">
            📋 Site Diary
            <span className="ml-2 text-xs opacity-90">Events & Evidence</span>
          </div>
          <div className="flex-1 rounded-md px-3 py-2 text-center text-sm font-medium text-[#6C757D] hover:text-[#1B4F72] hover:bg-[#E9ECEF] transition-colors duration-200 font-primary">
            📊 Dockets
            <span className="ml-2 text-xs">Labour, Plant & Materials</span>
          </div>
          <div className="flex-1 rounded-md px-3 py-2 text-center text-sm font-medium text-[#6C757D] hover:text-[#1B4F72] hover:bg-[#E9ECEF] transition-colors duration-200 font-primary">
            ✅ Compliance
            <span className="ml-2 text-xs">QA & Environmental</span>
          </div>
        </div>
      </div>

      {/* PHASE 1 COMPREHENSIVE SITE DIARY - This replaces everything below */}
      <ComprehensiveSiteDiary
        projectId={params.projectId}
        projectName={projectName}
        selectedDate={selectedDate}
        lotNumber={lotNumber}
      />

      {/* Optional: Legacy Events & Evidence Section - Remove if not needed */}
      {/* 
      <Card className="mt-6 border-[#1B4F72]/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[#1B4F72] font-heading">
            ⚡ Smart Evidence Engine (Legacy)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-[#6C757D] font-primary">
            This legacy section has been replaced by the comprehensive Site Diary above.
            All event tracking is now integrated into the Events tab.
          </p>
        </CardContent>
      </Card>
      */}
    </div>
  )
}