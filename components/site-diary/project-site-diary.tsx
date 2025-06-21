'use client'

import { useState, useEffect, useCallback } from 'react'
import { format } from 'date-fns'
import Link from 'next/link'
import { Calendar, Filter, FileText, Users, Truck, Package, AlertCircle, Building } from 'lucide-react'
import { ProjectWithDetails, DailyReport, DailyEvent, DailyLabour, DailyPlant, DailyMaterials } from '@/types/database'
import { getDailyReportsByProjectAction, getDailyEventsByProjectAction, getDailyLabourByProjectAction, getDailyPlantByProjectAction, getDailyMaterialsByProjectAction } from '@/lib/actions'

interface ProjectSiteDiaryProps {
  project: ProjectWithDetails
}

export function ProjectSiteDiary({ project }: ProjectSiteDiaryProps) {
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [selectedLotId, setSelectedLotId] = useState<string | 'all'>('all')
  const [dailyReports, setDailyReports] = useState<DailyReport[]>([])
  const [dailyEvents, setDailyEvents] = useState<DailyEvent[]>([])
  const [dailyLabour, setDailyLabour] = useState<DailyLabour[]>([])
  const [dailyPlant, setDailyPlant] = useState<DailyPlant[]>([])
  const [dailyMaterials, setDailyMaterials] = useState<DailyMaterials[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'reports' | 'events' | 'labour' | 'plant' | 'materials'>('reports')

  const loadProjectDailyData = useCallback(async () => {
    setIsLoading(true)
    try {
      // Load all daily data for the project
      const [reportsResult, eventsResult, labourResult, plantResult, materialsResult] = await Promise.all([
        getDailyReportsByProjectAction(project.id.toString()),
        getDailyEventsByProjectAction(project.id.toString()),
        getDailyLabourByProjectAction(project.id.toString()),
        getDailyPlantByProjectAction(project.id.toString()),
        getDailyMaterialsByProjectAction(project.id.toString()),
      ])

      // Filter by selected date
      const dateStr = format(selectedDate, 'yyyy-MM-dd')

      if (reportsResult.success) {
        const dateReports = reportsResult.data?.filter(report => 
          report.report_date === dateStr &&
          (selectedLotId === 'all' || report.lot_id === selectedLotId)
        ) || []
        setDailyReports(dateReports)
      }

      if (eventsResult.success) {
        const dateEvents = eventsResult.data?.filter(event => 
          event.event_date === dateStr &&
          (selectedLotId === 'all' || event.lot_id === selectedLotId)
        ) || []
        setDailyEvents(dateEvents)
      }

      if (labourResult.success) {
        const dateLabour = labourResult.data?.filter(labour => 
          labour.work_date === dateStr &&
          (selectedLotId === 'all' || labour.lot_id === selectedLotId)
        ) || []
        setDailyLabour(dateLabour)
      }

      if (plantResult.success) {
        const datePlant = plantResult.data?.filter(plant => 
          plant.work_date === dateStr &&
          (selectedLotId === 'all' || plant.lot_id === selectedLotId)
        ) || []
        setDailyPlant(datePlant)
      }

      if (materialsResult.success) {
        const dateMaterials = materialsResult.data?.filter(material => 
          material.delivery_date === dateStr &&
          (selectedLotId === 'all' || material.lot_id === selectedLotId)
        ) || []
        setDailyMaterials(dateMaterials)
      }
    } catch (error) {
      console.error('Error loading project daily data:', error)
    } finally {
      setIsLoading(false)
    }
  }, [project.id, selectedDate, selectedLotId])

  useEffect(() => {
    loadProjectDailyData()
  }, [loadProjectDailyData])

  const getLotName = (lotId: string | number) => {
    const lot = project.lots.find(l => String(l.id) === String(lotId))
    return lot ? lot.lot_number : 'Unknown Lot'
  }

  const getCounts = () => ({
    reports: dailyReports.length,
    events: dailyEvents.length,
    labour: dailyLabour.length,
    plant: dailyPlant.length,
    materials: dailyMaterials.length,
  })

  const counts = getCounts()

  return (
    <div className="space-y-6">
      {/* Date and Lot Filter */}
      <div className="bg-white shadow rounded-lg p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <Calendar className="h-5 w-5 text-gray-400" />
            <input
              type="date"
              value={format(selectedDate, 'yyyy-MM-dd')}
              onChange={(e) => setSelectedDate(new Date(e.target.value))}
              className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
            <span className="text-sm text-gray-500">
              {format(selectedDate, 'EEEE, MMMM d, yyyy')}
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            <Filter className="h-5 w-5 text-gray-400" />
            <select
              value={selectedLotId}
              onChange={(e) => setSelectedLotId(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Lots</option>
              {project.lots.map(lot => (
                <option key={lot.id} value={lot.id}>
                  {lot.lot_number} {lot.description && `- ${lot.description}`}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white shadow rounded-lg">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab('reports')}
              className={`py-2 px-4 border-b-2 font-medium text-sm focus:outline-none ${
                activeTab === 'reports'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center">
                <FileText className="h-4 w-4 mr-2" />
                Daily Reports {counts.reports > 0 && `(${counts.reports})`}
              </div>
            </button>
            <button
              onClick={() => setActiveTab('events')}
              className={`py-2 px-4 border-b-2 font-medium text-sm focus:outline-none ${
                activeTab === 'events'
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
              onClick={() => setActiveTab('labour')}
              className={`py-2 px-4 border-b-2 font-medium text-sm focus:outline-none ${
                activeTab === 'labour'
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
              onClick={() => setActiveTab('plant')}
              className={`py-2 px-4 border-b-2 font-medium text-sm focus:outline-none ${
                activeTab === 'plant'
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
              onClick={() => setActiveTab('materials')}
              className={`py-2 px-4 border-b-2 font-medium text-sm focus:outline-none ${
                activeTab === 'materials'
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

        {/* Tab Content */}
        <div className="p-6">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading daily data...</p>
            </div>
          ) : (
            <>
              {activeTab === 'reports' && (
                <div className="space-y-4">
                  {dailyReports.length === 0 ? (
                    <div className="text-center py-12">
                      <FileText className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-4 text-sm font-medium text-gray-900">No Daily Reports</h3>
                      <p className="mt-2 text-sm text-gray-500">
                        No reports found for {format(selectedDate, 'MMMM d, yyyy')}
                      </p>
                    </div>
                  ) : (
                    dailyReports.map(report => (
                      <div key={report.id} className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <Building className="h-4 w-4 text-gray-400" />
                            <span className="text-sm font-medium text-gray-900">
                              Lot {getLotName(report.lot_id)}
                            </span>
                          </div>
                          <Link
                            href={`/project/${project.id}/lot/${report.lot_id}`}
                            className="text-sm text-blue-600 hover:text-blue-700"
                          >
                            View Lot →
                          </Link>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <dt className="text-xs font-medium text-gray-500">Weather</dt>
                            <dd className="mt-1 text-sm text-gray-900">
                              {report.weather_condition || 'Not recorded'}
                              {report.temperature_high && report.temperature_low && (
                                <span className="ml-2">
                                  ({report.temperature_low}°C - {report.temperature_high}°C)
                                </span>
                              )}
                            </dd>
                          </div>
                          
                          {report.work_summary && (
                            <div className="md:col-span-2">
                              <dt className="text-xs font-medium text-gray-500">Work Summary</dt>
                              <dd className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">
                                {report.work_summary}
                              </dd>
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeTab === 'events' && (
                <div className="space-y-4">
                  {dailyEvents.length === 0 ? (
                    <div className="text-center py-12">
                      <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-4 text-sm font-medium text-gray-900">No Events</h3>
                      <p className="mt-2 text-sm text-gray-500">
                        No events recorded for {format(selectedDate, 'MMMM d, yyyy')}
                      </p>
                    </div>
                  ) : (
                    dailyEvents.map(event => (
                      <div key={event.id} className="border-l-4 border-blue-400 bg-blue-50 p-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{event.event_type}</p>
                            <p className="text-sm text-gray-600 mt-1">{event.description}</p>
                            <p className="text-xs text-gray-500 mt-2">Lot: {getLotName(event.lot_id)}</p>
                          </div>
                          <span className="text-xs text-gray-500">{event.event_time || 'All day'}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeTab === 'labour' && (
                <div className="space-y-4">
                  {dailyLabour.length === 0 ? (
                    <div className="text-center py-12">
                      <Users className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-4 text-sm font-medium text-gray-900">No Labour Records</h3>
                      <p className="mt-2 text-sm text-gray-500">
                        No labour recorded for {format(selectedDate, 'MMMM d, yyyy')}
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Worker</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Trade</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Hours</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Lot</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {dailyLabour.map(labour => (
                            <tr key={labour.id}>
                              <td className="px-4 py-2 text-sm text-gray-900">{labour.worker_name}</td>
                              <td className="px-4 py-2 text-sm text-gray-500">{labour.trade || '-'}</td>
                              <td className="px-4 py-2 text-sm text-gray-500">{labour.hours_worked}</td>
                              <td className="px-4 py-2 text-sm text-gray-500">{getLotName(labour.lot_id)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'plant' && (
                <div className="space-y-4">
                  {dailyPlant.length === 0 ? (
                    <div className="text-center py-12">
                      <Truck className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-4 text-sm font-medium text-gray-900">No Plant Records</h3>
                      <p className="mt-2 text-sm text-gray-500">
                        No plant/equipment recorded for {format(selectedDate, 'MMMM d, yyyy')}
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {dailyPlant.map(plant => (
                        <div key={plant.id} className="bg-gray-50 rounded-lg p-4">
                          <h4 className="font-medium text-gray-900">{plant.equipment_type}</h4>
                          <p className="text-sm text-gray-600 mt-1">{plant.task_description || 'No description'}</p>
                          <div className="mt-2 text-xs text-gray-500">
                            <p>Hours: {plant.hours_used}</p>
                            <p>Lot: {getLotName(plant.lot_id)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'materials' && (
                <div className="space-y-4">
                  {dailyMaterials.length === 0 ? (
                    <div className="text-center py-12">
                      <Package className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-4 text-sm font-medium text-gray-900">No Materials Records</h3>
                      <p className="mt-2 text-sm text-gray-500">
                        No materials delivered on {format(selectedDate, 'MMMM d, yyyy')}
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Material</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Supplier</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Lot</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {dailyMaterials.map(material => (
                            <tr key={material.id}>
                              <td className="px-4 py-2 text-sm text-gray-900">{material.material_type}</td>
                              <td className="px-4 py-2 text-sm text-gray-500">
                                {material.quantity} {material.unit_measure || ''}
                              </td>
                              <td className="px-4 py-2 text-sm text-gray-500">{material.supplier || '-'}</td>
                              <td className="px-4 py-2 text-sm text-gray-500">{getLotName(material.lot_id)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}