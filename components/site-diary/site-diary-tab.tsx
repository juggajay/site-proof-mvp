'use client'

import { useState, useEffect, useCallback } from 'react'
import { format } from 'date-fns'
import { Calendar, Plus, Edit2, FileText, Users, Truck, Package, AlertCircle } from 'lucide-react'
import { DailyReport, DailyEvent, DailyLabour, DailyPlant, DailyMaterials } from '@/types/database'
import { getDailyReportByDateAction, getDailyEventsByLotAction, getDailyLabourByLotAction, getDailyPlantByLotAction, getDailyMaterialsByLotAction } from '@/lib/actions'
import { DailyReportForm } from './daily-report-form'
import { DailyEventsSection } from './daily-events-section'
import { LabourDocketsSection } from './labour-dockets-section'
import { PlantDocketsSection } from './plant-dockets-section'
import { MaterialsDocketsSection } from './materials-dockets-section'

interface SiteDiaryTabProps {
  lotId: string
}

export function SiteDiaryTab({ lotId }: SiteDiaryTabProps) {
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [dailyReport, setDailyReport] = useState<DailyReport | null>(null)
  const [dailyEvents, setDailyEvents] = useState<DailyEvent[]>([])
  const [dailyLabour, setDailyLabour] = useState<DailyLabour[]>([])
  const [dailyPlant, setDailyPlant] = useState<DailyPlant[]>([])
  const [dailyMaterials, setDailyMaterials] = useState<DailyMaterials[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeSection, setActiveSection] = useState<'report' | 'events' | 'labour' | 'plant' | 'materials'>('report')
  const [showReportForm, setShowReportForm] = useState(false)

  const loadDailyData = useCallback(async () => {
    setIsLoading(true)
    try {
      // Load daily report
      const reportResult = await getDailyReportByDateAction(lotId, format(selectedDate, 'yyyy-MM-dd'))
      if (reportResult.success && reportResult.data) {
        setDailyReport(reportResult.data)
      } else {
        setDailyReport(null)
      }

      // Load all daily data
      const [eventsResult, labourResult, plantResult, materialsResult] = await Promise.all([
        getDailyEventsByLotAction(lotId),
        getDailyLabourByLotAction(lotId),
        getDailyPlantByLotAction(lotId),
        getDailyMaterialsByLotAction(lotId),
      ])

      if (eventsResult.success) {
        const dateEvents = eventsResult.data?.filter(event => 
          event.event_date === format(selectedDate, 'yyyy-MM-dd')
        ) || []
        setDailyEvents(dateEvents)
      }

      if (labourResult.success) {
        const dateLabour = labourResult.data?.filter(labour => 
          labour.work_date === format(selectedDate, 'yyyy-MM-dd')
        ) || []
        setDailyLabour(dateLabour)
      }

      if (plantResult.success) {
        const datePlant = plantResult.data?.filter(plant => 
          plant.work_date === format(selectedDate, 'yyyy-MM-dd')
        ) || []
        setDailyPlant(datePlant)
      }

      if (materialsResult.success) {
        const dateMaterials = materialsResult.data?.filter(material => 
          material.delivery_date === format(selectedDate, 'yyyy-MM-dd')
        ) || []
        setDailyMaterials(dateMaterials)
      }
    } catch (error) {
      console.error('Error loading daily data:', error)
    } finally {
      setIsLoading(false)
    }
  }, [lotId, selectedDate])

  useEffect(() => {
    loadDailyData()
  }, [loadDailyData])

  const handleDateChange = (date: Date) => {
    setSelectedDate(date)
    setShowReportForm(false)
  }

  const handleReportSaved = () => {
    setShowReportForm(false)
    loadDailyData()
  }

  const getSectionCounts = () => ({
    events: dailyEvents.length,
    labour: dailyLabour.length,
    plant: dailyPlant.length,
    materials: dailyMaterials.length,
  })

  const counts = getSectionCounts()

  return (
    <div className="space-y-6">
      {/* Date Selector */}
      <div className="bg-white shadow rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Calendar className="h-5 w-5 text-gray-400" />
            <input
              type="date"
              value={format(selectedDate, 'yyyy-MM-dd')}
              onChange={(e) => handleDateChange(new Date(e.target.value))}
              className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
            <span className="text-sm text-gray-500">
              {format(selectedDate, 'EEEE, MMMM d, yyyy')}
            </span>
          </div>
        </div>
      </div>

      {/* Section Navigation */}
      <div className="bg-white shadow rounded-lg">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveSection('report')}
              className={`py-2 px-4 border-b-2 font-medium text-sm focus:outline-none ${
                activeSection === 'report'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center">
                <FileText className="h-4 w-4 mr-2" />
                Daily Report
              </div>
            </button>
            <button
              onClick={() => setActiveSection('events')}
              className={`py-2 px-4 border-b-2 font-medium text-sm focus:outline-none ${
                activeSection === 'events'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center">
                <AlertCircle className="h-4 w-4 mr-2" />
                Events {counts.events > 0 && `(${counts.events})`}
              </div>
            </button>
            <button
              onClick={() => setActiveSection('labour')}
              className={`py-2 px-4 border-b-2 font-medium text-sm focus:outline-none ${
                activeSection === 'labour'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center">
                <Users className="h-4 w-4 mr-2" />
                Labour {counts.labour > 0 && `(${counts.labour})`}
              </div>
            </button>
            <button
              onClick={() => setActiveSection('plant')}
              className={`py-2 px-4 border-b-2 font-medium text-sm focus:outline-none ${
                activeSection === 'plant'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center">
                <Truck className="h-4 w-4 mr-2" />
                Plant {counts.plant > 0 && `(${counts.plant})`}
              </div>
            </button>
            <button
              onClick={() => setActiveSection('materials')}
              className={`py-2 px-4 border-b-2 font-medium text-sm focus:outline-none ${
                activeSection === 'materials'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center">
                <Package className="h-4 w-4 mr-2" />
                Materials {counts.materials > 0 && `(${counts.materials})`}
              </div>
            </button>
          </nav>
        </div>

        {/* Section Content */}
        <div className="p-6">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading daily data...</p>
            </div>
          ) : (
            <>
              {activeSection === 'report' && (
                <>
                  {showReportForm ? (
                    <DailyReportForm
                      lotId={lotId}
                      date={selectedDate}
                      existingReport={dailyReport}
                      onSave={handleReportSaved}
                      onCancel={() => setShowReportForm(false)}
                    />
                  ) : (
                    <div>
                      {dailyReport ? (
                        <div className="space-y-4">
                          <div className="flex justify-between items-start">
                            <h3 className="text-lg font-medium text-gray-900">Daily Report</h3>
                            <button
                              onClick={() => setShowReportForm(true)}
                              className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                            >
                              <Edit2 className="h-4 w-4 mr-2" />
                              Edit Report
                            </button>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <dt className="text-sm font-medium text-gray-500">Weather</dt>
                              <dd className="mt-1 text-sm text-gray-900">
                                {dailyReport.weather_condition || 'Not recorded'}
                                {dailyReport.temperature_high && dailyReport.temperature_low && (
                                  <span className="ml-2">
                                    ({dailyReport.temperature_low}°C - {dailyReport.temperature_high}°C)
                                  </span>
                                )}
                              </dd>
                            </div>
                            
                            {dailyReport.work_summary && (
                              <div className="md:col-span-2">
                                <dt className="text-sm font-medium text-gray-500">Work Summary</dt>
                                <dd className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">
                                  {dailyReport.work_summary}
                                </dd>
                              </div>
                            )}
                            
                            {dailyReport.issues_encountered && (
                              <div className="md:col-span-2">
                                <dt className="text-sm font-medium text-gray-500">Issues Encountered</dt>
                                <dd className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">
                                  {dailyReport.issues_encountered}
                                </dd>
                              </div>
                            )}
                            
                            {dailyReport.safety_notes && (
                              <div className="md:col-span-2">
                                <dt className="text-sm font-medium text-gray-500">Safety Notes</dt>
                                <dd className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">
                                  {dailyReport.safety_notes}
                                </dd>
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-12">
                          <FileText className="mx-auto h-12 w-12 text-gray-400" />
                          <h3 className="mt-4 text-sm font-medium text-gray-900">No Daily Report</h3>
                          <p className="mt-2 text-sm text-gray-500">
                            Create a daily report for {format(selectedDate, 'MMMM d, yyyy')}
                          </p>
                          <div className="mt-6">
                            <button
                              onClick={() => setShowReportForm(true)}
                              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Create Daily Report
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}

              {activeSection === 'events' && (
                <DailyEventsSection
                  lotId={lotId}
                  date={selectedDate}
                  events={dailyEvents}
                  onUpdate={loadDailyData}
                />
              )}

              {activeSection === 'labour' && (
                <LabourDocketsSection
                  lotId={lotId}
                  date={selectedDate}
                  labourRecords={dailyLabour}
                  onUpdate={loadDailyData}
                />
              )}

              {activeSection === 'plant' && (
                <PlantDocketsSection
                  lotId={lotId}
                  date={selectedDate}
                  plantRecords={dailyPlant}
                  onUpdate={loadDailyData}
                />
              )}

              {activeSection === 'materials' && (
                <MaterialsDocketsSection
                  lotId={lotId}
                  date={selectedDate}
                  materialsRecords={dailyMaterials}
                  onUpdate={loadDailyData}
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}