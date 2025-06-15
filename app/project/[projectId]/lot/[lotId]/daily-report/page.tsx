'use client'

import React, { useState, useEffect } from 'react'
import { ComprehensiveSiteDiary } from '../../../../../../components/site-diary/comprehensive-site-diary'
import { DocketsTab } from './components/dockets-tab'
import QAInspection from './components/qa-inspection'
import EnvironmentalCompliance from './components/environmental-compliance'
import { Calendar, ArrowLeft, FileText, CheckSquare, ClipboardList } from 'lucide-react'
import { Button } from '../../../../../../components/ui/button'
import { createClient } from '../../../../../../lib/supabase/client'
import Link from 'next/link'

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
    return dateString || today.toLocaleDateString('en-CA') // fallback to YYYY-MM-DD format
  })
  const [projectName, setProjectName] = useState('')
  const [lotNumber, setLotNumber] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('site-diary')
  const [dailyReport, setDailyReport] = useState<any>(null)
  const [lot, setLot] = useState<any>(null)
  const [complianceTab, setComplianceTab] = useState<'qa' | 'environmental'>('qa')

  const supabase = createClient()

  // Load project and lot data
  useEffect(() => {
    const loadProjectData = async () => {
      setIsLoading(true)
      try {
        // Load lot data
        const { data: lotData, error: lotError } = await supabase
          .from('lots')
          .select('*')
          .eq('id', params.lotId)
          .single()

        if (lotData) {
          setLot(lotData)
          setLotNumber(lotData.name || 'Unknown')
          
          // Load project data
          const { data: projectData } = await supabase
            .from('projects')
            .select('name')
            .eq('id', params.projectId)
            .single()
          
          setProjectName(projectData?.name || 'Unknown Project')
        } else {
          // Fallback data
          setProjectName('Sample Construction Project')
          setLotNumber('Demo Lot')
          setLot({ id: params.lotId, name: 'Demo Lot' })
        }

        // Load or create daily report
        const { data: reportData, error: reportError } = await supabase
          .from('daily_reports')
          .select('*')
          .eq('lot_id', params.lotId)
          .eq('report_date', selectedDate)
          .single()

        if (reportData) {
          setDailyReport(reportData)
        } else {
          // Create new daily report
          const { data: newReport, error: createError } = await supabase
            .from('daily_reports')
            .insert({
              lot_id: params.lotId,
              report_date: selectedDate,
              weather_conditions: 'Clear',
              temperature: 22,
              created_by: 'current-user' // Replace with actual user ID
            })
            .select()
            .single()

          if (newReport) {
            setDailyReport(newReport)
          }
        }
      } catch (error) {
        console.error('Error loading project data:', error)
        // Set fallback data
        setProjectName('Sample Construction Project')
        setLotNumber('Demo Lot')
        setLot({ id: params.lotId, name: 'Demo Lot' })
      } finally {
        setIsLoading(false)
      }
    }

    loadProjectData()
  }, [params.projectId, params.lotId, selectedDate, supabase])

  const handleDateChange = (newDate: string) => {
    setSelectedDate(newDate)
    setDailyReport(null) // Reset daily report to trigger reload
  }

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
              {selectedDate ? new Date(selectedDate).toLocaleDateString('en-AU') : 'No date selected'} • {projectName}
            </p>
          </div>
        </div>

        {/* Date Picker - Dashboard Style */}
        <div className="flex items-center gap-2 bg-white border border-[#1B4F72]/20 rounded-lg px-3 py-2">
          <Calendar className="h-4 w-4 text-[#1B4F72]" />
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => handleDateChange(e.target.value)}
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

      {/* Tab Content - Using Existing Functional Components */}
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

        {activeTab === 'dockets' && dailyReport && (
          <div>
            {/* EXISTING FUNCTIONAL DOCKETS COMPONENT */}
            <DocketsTab 
              lot={lot}
              dailyReport={dailyReport}
              onUpdate={() => {
                // Refresh data if needed
                console.log('Dockets updated')
              }}
            />
          </div>
        )}

        {activeTab === 'compliance' && (
          <div className="space-y-6">
            {/* Compliance Sub-tabs */}
            <div className="bg-white rounded-lg shadow border border-[#1B4F72]/10">
              <div className="border-b border-gray-200">
                <nav className="flex space-x-8 px-6">
                  {[
                    { key: 'qa', label: '🔍 QA Inspection', desc: 'Quality Assurance' },
                    { key: 'environmental', label: '🌿 Environmental', desc: 'Environmental Compliance' }
                  ].map(({ key, label, desc }) => (
                    <button
                      key={key}
                      onClick={() => setComplianceTab(key as 'qa' | 'environmental')}
                      className={`py-4 px-1 border-b-2 font-medium text-sm transition-all duration-200 font-primary ${
                        complianceTab === key
                          ? 'border-[#1B4F72] text-[#1B4F72]'
                          : 'border-transparent text-gray-500 hover:text-[#1B4F72] hover:border-[#1B4F72]/50'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span>{label}</span>
                      </div>
                      <div className="text-xs opacity-70 mt-1">{desc}</div>
                    </button>
                  ))}
                </nav>
              </div>

              <div className="p-6">
                {complianceTab === 'qa' && dailyReport && (
                  <QAInspection
                    dailyReportId={dailyReport.id}
                    lotId={params.lotId}
                  />
                )}

                {complianceTab === 'environmental' && dailyReport && (
                  <EnvironmentalCompliance
                    dailyReportId={dailyReport.id}
                    projectId={params.projectId}
                  />
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}