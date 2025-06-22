'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { 
  getProjectByIdAction,
  getProjectCostSummaryAction,
  getProjectLabourCostsAction,
  getProjectPlantCostsAction,
  getProjectMaterialCostsAction
} from '@/lib/actions'
import { ProjectWithDetails, Lot, ProjectCostSummary } from '@/types/database'
import Link from 'next/link'
import { 
  ArrowLeft, 
  DollarSign, 
  TrendingUp, 
  Users, 
  Truck, 
  Package,
  Calendar,
  Filter,
  Download,
  RefreshCw,
  AlertCircle
} from 'lucide-react'
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns'

interface PageProps {
  params: {
    projectId: string
  }
}

// Chart colors
const COLORS = {
  labour: '#3B82F6', // blue
  plant: '#10B981', // green
  materials: '#F59E0B' // yellow
}

export default function JobCostReportPage({ params }: PageProps) {
  const { user, loading } = useAuth()
  const [project, setProject] = useState<ProjectWithDetails | null>(null)
  const [costSummary, setCostSummary] = useState<ProjectCostSummary | null>(null)
  const [labourCosts, setLabourCosts] = useState<any[]>([])
  const [plantCosts, setPlantCosts] = useState<any[]>([])
  const [materialCosts, setMaterialCosts] = useState<any[]>([])
  const [lots, setLots] = useState<Lot[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Filter states
  const [dateRange, setDateRange] = useState('30')
  const [selectedLot, setSelectedLot] = useState<string>('all')
  const [costCategory, setCostCategory] = useState<string>('all')
  
  const projectId = params.projectId

  // Calculate date range
  const getDateRange = useCallback(() => {
    const endDate = new Date()
    let startDate: Date
    
    switch (dateRange) {
      case '7':
        startDate = subDays(endDate, 7)
        break
      case '30':
        startDate = subDays(endDate, 30)
        break
      case '90':
        startDate = subDays(endDate, 90)
        break
      case 'month':
        startDate = startOfMonth(endDate)
        break
      case 'all':
        startDate = new Date('2020-01-01')
        break
      default:
        startDate = subDays(endDate, 30)
    }
    
    return {
      startDate: format(startDate, 'yyyy-MM-dd'),
      endDate: format(endDate, 'yyyy-MM-dd')
    }
  }, [dateRange])

  const loadCostData = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const { startDate, endDate } = getDateRange()
      const lotFilter = selectedLot !== 'all' ? selectedLot : undefined
      
      // Load all data in parallel
      const [
        projectResult,
        summaryResult,
        labourResult,
        plantResult,
        materialResult
      ] = await Promise.all([
        getProjectByIdAction(projectId),
        getProjectCostSummaryAction(projectId, startDate, endDate),
        costCategory === 'all' || costCategory === 'labour' 
          ? getProjectLabourCostsAction(projectId, startDate, endDate, lotFilter)
          : Promise.resolve({ success: true, data: [] }),
        costCategory === 'all' || costCategory === 'plant'
          ? getProjectPlantCostsAction(projectId, startDate, endDate, lotFilter)
          : Promise.resolve({ success: true, data: [] }),
        costCategory === 'all' || costCategory === 'materials'
          ? getProjectMaterialCostsAction(projectId, startDate, endDate, lotFilter)
          : Promise.resolve({ success: true, data: [] })
      ])
      
      if (projectResult.success && projectResult.data) {
        setProject(projectResult.data)
        // Extract lots from project data
        setLots(projectResult.data.lots || [])
      } else {
        setError(projectResult.error || 'Failed to load project')
        return
      }
      
      if (summaryResult.success && summaryResult.data) {
        setCostSummary(summaryResult.data)
      }
      
      if (labourResult.success) {
        setLabourCosts(labourResult.data || [])
      }
      
      if (plantResult.success) {
        setPlantCosts(plantResult.data || [])
      }
      
      if (materialResult.success) {
        setMaterialCosts(materialResult.data || [])
      }
    } catch (error) {
      console.error('Error loading cost data:', error)
      setError('An unexpected error occurred while loading cost data')
    } finally {
      setIsLoading(false)
    }
  }, [projectId, selectedLot, costCategory, getDateRange])

  useEffect(() => {
    if (user && projectId) {
      loadCostData()
    }
  }, [user, projectId, loadCostData])

  // Prepare chart data
  const pieChartData = costSummary ? [
    { name: 'Labour', value: costSummary.labour.total_cost, color: COLORS.labour },
    { name: 'Plant', value: costSummary.plant.total_cost, color: COLORS.plant },
    { name: 'Materials', value: costSummary.materials.total_cost, color: COLORS.materials }
  ].filter(item => item.value > 0) : []

  // Prepare time series data
  const prepareTimeSeriesData = () => {
    const dateMap = new Map<string, { date: string, labour: number, plant: number, materials: number }>()
    
    // Process labour costs
    labourCosts.forEach(cost => {
      const date = cost.work_date
      if (!dateMap.has(date)) {
        dateMap.set(date, { date, labour: 0, plant: 0, materials: 0 })
      }
      const entry = dateMap.get(date)!
      entry.labour += cost.total_cost || 0
    })
    
    // Process plant costs
    plantCosts.forEach(cost => {
      const date = cost.work_date
      if (!dateMap.has(date)) {
        dateMap.set(date, { date, labour: 0, plant: 0, materials: 0 })
      }
      const entry = dateMap.get(date)!
      entry.plant += cost.total_cost || 0
    })
    
    // Process material costs
    materialCosts.forEach(cost => {
      const date = cost.delivery_date
      if (!dateMap.has(date)) {
        dateMap.set(date, { date, labour: 0, plant: 0, materials: 0 })
      }
      const entry = dateMap.get(date)!
      entry.materials += cost.total_cost || 0
    })
    
    return Array.from(dateMap.values()).sort((a, b) => a.date.localeCompare(b.date))
  }

  const timeSeriesData = prepareTimeSeriesData()

  // Prepare lot breakdown data
  const prepareLotBreakdownData = () => {
    const lotMap = new Map<string, { lot: string, labour: number, plant: number, materials: number, total: number }>()
    
    // Process labour costs by lot
    labourCosts.forEach(cost => {
      const lotNumber = cost.lot_number || 'Unknown'
      if (!lotMap.has(lotNumber)) {
        lotMap.set(lotNumber, { lot: lotNumber, labour: 0, plant: 0, materials: 0, total: 0 })
      }
      const entry = lotMap.get(lotNumber)!
      entry.labour += cost.total_cost || 0
      entry.total += cost.total_cost || 0
    })
    
    // Process plant costs by lot
    plantCosts.forEach(cost => {
      const lotNumber = cost.lot_number || 'Unknown'
      if (!lotMap.has(lotNumber)) {
        lotMap.set(lotNumber, { lot: lotNumber, labour: 0, plant: 0, materials: 0, total: 0 })
      }
      const entry = lotMap.get(lotNumber)!
      entry.plant += cost.total_cost || 0
      entry.total += cost.total_cost || 0
    })
    
    // Process material costs by lot
    materialCosts.forEach(cost => {
      const lotNumber = cost.lot_number || 'Unknown'
      if (!lotMap.has(lotNumber)) {
        lotMap.set(lotNumber, { lot: lotNumber, labour: 0, plant: 0, materials: 0, total: 0 })
      }
      const entry = lotMap.get(lotNumber)!
      entry.materials += cost.total_cost || 0
      entry.total += cost.total_cost || 0
    })
    
    return Array.from(lotMap.values()).sort((a, b) => b.total - a.total)
  }

  const lotBreakdownData = prepareLotBreakdownData()

  // Calculate summary statistics
  const calculateStats = () => {
    const totalCost = costSummary?.total_cost || 0
    const daysInRange = timeSeriesData.length || 1
    const avgDailyCost = totalCost / daysInRange
    const costPerLot = lotBreakdownData.length > 0 ? totalCost / lotBreakdownData.length : 0
    
    const mostExpensiveCategory = pieChartData.length > 0 
      ? pieChartData.reduce((prev, current) => prev.value > current.value ? prev : current).name
      : 'N/A'
    
    return {
      totalCost,
      avgDailyCost,
      costPerLot,
      mostExpensiveCategory
    }
  }

  const stats = calculateStats()

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value)
  }

  const exportReport = () => {
    if (!costSummary) return

    // Prepare CSV data
    const csvRows = []
    
    // Header
    csvRows.push(['Civil-Q Job Cost Report'])
    csvRows.push([`Project: ${project?.name || 'N/A'}`])
    csvRows.push([`Date Range: ${dateRange === 'all' ? 'All Time' : dateRange === '7' ? 'Last 7 Days' : dateRange === '30' ? 'Last 30 Days' : dateRange === '90' ? 'Last 90 Days' : 'This Month'}`])
    csvRows.push([`Generated: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`])
    csvRows.push([])
    
    // Summary section
    csvRows.push(['SUMMARY'])
    csvRows.push(['Category', 'Amount'])
    csvRows.push(['Total Labour', `$${costSummary.labour.total_cost.toFixed(2)}`])
    csvRows.push(['Total Plant', `$${costSummary.plant.total_cost.toFixed(2)}`])
    csvRows.push(['Total Materials', `$${costSummary.materials.total_cost.toFixed(2)}`])
    csvRows.push(['Total Cost', `$${costSummary.total_cost.toFixed(2)}`])
    csvRows.push([])
    
    // Labour details
    if (labourCosts.length > 0) {
      csvRows.push(['LABOUR COSTS'])
      csvRows.push(['Date', 'Worker', 'Company', 'Trade', 'Hours', 'Rate', 'Total'])
      labourCosts.forEach(cost => {
        csvRows.push([
          format(new Date(cost.work_date), 'dd/MM/yyyy'),
          cost.worker_name || 'N/A',
          cost.company_name || 'N/A',
          cost.trade || 'N/A',
          cost.hours_worked.toString(),
          `$${cost.hourly_rate.toFixed(2)}`,
          `$${cost.total_cost.toFixed(2)}`
        ])
      })
      csvRows.push([])
    }
    
    // Plant details
    if (plantCosts.length > 0) {
      csvRows.push(['PLANT & EQUIPMENT COSTS'])
      csvRows.push(['Date', 'Equipment', 'Type', 'ID', 'Hours', 'Rate', 'Fuel (L)', 'Total'])
      plantCosts.forEach(cost => {
        csvRows.push([
          format(new Date(cost.work_date), 'dd/MM/yyyy'),
          cost.equipment_name || cost.equipment_type,
          cost.equipment_type,
          cost.equipment_id || 'N/A',
          cost.hours_used.toString(),
          `$${cost.hourly_rate.toFixed(2)}`,
          cost.fuel_consumed?.toString() || '0',
          `$${cost.total_cost.toFixed(2)}`
        ])
      })
      csvRows.push([])
    }
    
    // Materials details
    if (materialCosts.length > 0) {
      csvRows.push(['MATERIALS COSTS'])
      csvRows.push(['Date', 'Material', 'Type', 'Supplier', 'Quantity', 'Unit', 'Unit Cost', 'Total'])
      materialCosts.forEach(cost => {
        csvRows.push([
          format(new Date(cost.delivery_date), 'dd/MM/yyyy'),
          cost.material_name || cost.material_type,
          cost.material_type,
          cost.supplier || 'N/A',
          cost.quantity.toString(),
          cost.unit_of_measure,
          `$${cost.unit_cost.toFixed(2)}`,
          `$${cost.total_cost.toFixed(2)}`
        ])
      })
    }
    
    // Convert to CSV string
    const csvContent = csvRows.map(row => 
      row.map(cell => {
        // Escape quotes and wrap in quotes if contains comma
        const escaped = String(cell).replace(/"/g, '""')
        return escaped.includes(',') ? `"${escaped}"` : escaped
      }).join(',')
    ).join('\n')
    
    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    
    link.setAttribute('href', url)
    link.setAttribute('download', `job-cost-report-${project?.name?.toLowerCase().replace(/\s+/g, '-') || 'project'}-${format(new Date(), 'yyyyMMdd')}.csv`)
    link.style.visibility = 'hidden'
    
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading cost report...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Please log in to access reports.</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-900 font-medium mb-2">Error Loading Report</p>
          <p className="text-gray-600">{error}</p>
          <button
            onClick={loadCostData}
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </button>
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
              <Link 
                href={`/project/${projectId}`} 
                className="mr-4 text-gray-400 hover:text-gray-600"
              >
                <ArrowLeft className="h-6 w-6" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Job Cost Report</h1>
                <p className="text-sm text-gray-500">{project?.name}</p>
              </div>
            </div>
            <button
              onClick={exportReport}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <Download className="h-4 w-4 mr-2" />
              Export to CSV
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Filters */}
        <div className="bg-white shadow rounded-lg mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <Filter className="h-5 w-5 mr-2" />
              Report Filters
            </h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label htmlFor="date-range" className="block text-sm font-medium text-gray-700 mb-2">
                  Date Range
                </label>
                <select
                  id="date-range"
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                  className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="7">Last 7 days</option>
                  <option value="30">Last 30 days</option>
                  <option value="90">Last 90 days</option>
                  <option value="month">This month</option>
                  <option value="all">All time</option>
                </select>
              </div>

              <div>
                <label htmlFor="lot-filter" className="block text-sm font-medium text-gray-700 mb-2">
                  Lot/Area
                </label>
                <select
                  id="lot-filter"
                  value={selectedLot}
                  onChange={(e) => setSelectedLot(e.target.value)}
                  className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="all">All Lots</option>
                  {lots.map((lot) => (
                    <option key={lot.id} value={lot.id.toString()}>
                      {lot.lot_number} - {lot.description}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="category-filter" className="block text-sm font-medium text-gray-700 mb-2">
                  Cost Category
                </label>
                <select
                  id="category-filter"
                  value={costCategory}
                  onChange={(e) => setCostCategory(e.target.value)}
                  className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="all">All Categories</option>
                  <option value="labour">Labour Only</option>
                  <option value="plant">Plant/Equipment Only</option>
                  <option value="materials">Materials Only</option>
                </select>
              </div>

              <div className="flex items-end">
                <button
                  onClick={loadCostData}
                  className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Update Report
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Summary Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <DollarSign className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Costs</dt>
                    <dd className="text-lg font-medium text-gray-900">{formatCurrency(stats.totalCost)}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <TrendingUp className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Avg Daily Cost</dt>
                    <dd className="text-lg font-medium text-gray-900">{formatCurrency(stats.avgDailyCost)}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Package className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Cost per Lot</dt>
                    <dd className="text-lg font-medium text-gray-900">{formatCurrency(stats.costPerLot)}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <AlertCircle className="h-6 w-6 text-red-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Highest Category</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats.mostExpensiveCategory}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Cost Breakdown Pie Chart */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Cost Breakdown</h3>
            {pieChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-12 text-gray-500">
                No cost data available for the selected period
              </div>
            )}
          </div>

          {/* Cost Over Time Line Chart */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Cost Over Time</h3>
            {timeSeriesData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={timeSeriesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(date) => format(new Date(date), 'MMM dd')}
                  />
                  <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
                  <Tooltip 
                    formatter={(value: number) => formatCurrency(value)}
                    labelFormatter={(date) => format(new Date(date), 'MMM dd, yyyy')}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="labour" 
                    stroke={COLORS.labour} 
                    name="Labour"
                    strokeWidth={2}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="plant" 
                    stroke={COLORS.plant} 
                    name="Plant"
                    strokeWidth={2}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="materials" 
                    stroke={COLORS.materials} 
                    name="Materials"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-12 text-gray-500">
                No time series data available
              </div>
            )}
          </div>
        </div>

        {/* Cost by Lot Bar Chart */}
        <div className="bg-white shadow rounded-lg p-6 mb-8">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Cost by Lot/Area</h3>
          {lotBreakdownData.length > 0 ? (
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={lotBreakdownData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="lot" />
                <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Legend />
                <Bar dataKey="labour" stackId="a" fill={COLORS.labour} name="Labour" />
                <Bar dataKey="plant" stackId="a" fill={COLORS.plant} name="Plant" />
                <Bar dataKey="materials" stackId="a" fill={COLORS.materials} name="Materials" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-12 text-gray-500">
              No lot breakdown data available
            </div>
          )}
        </div>

        {/* Detailed Cost Tables */}
        <div className="space-y-6">
          {/* Labour Costs Table */}
          {(costCategory === 'all' || costCategory === 'labour') && labourCosts.length > 0 && (
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900 flex items-center">
                  <Users className="h-5 w-5 mr-2" />
                  Labour Costs Detail
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Worker
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Subcontractor
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Lot
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Hours
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Rate
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {labourCosts.slice(0, 10).map((cost, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {format(new Date(cost.work_date), 'MMM dd, yyyy')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {cost.worker_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {cost.subcontractor_name || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {cost.lot_number}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {cost.hours_worked + (cost.overtime_hours || 0)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(cost.rate_at_time_of_entry || 0)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {formatCurrency(cost.total_cost || 0)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {labourCosts.length > 10 && (
                  <div className="px-6 py-3 bg-gray-50 text-sm text-gray-500">
                    Showing 10 of {labourCosts.length} entries
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Plant Costs Table */}
          {(costCategory === 'all' || costCategory === 'plant') && plantCosts.length > 0 && (
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900 flex items-center">
                  <Truck className="h-5 w-5 mr-2" />
                  Plant/Equipment Costs Detail
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Equipment
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Supplier
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Lot
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Hours
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Rate
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {plantCosts.slice(0, 10).map((cost, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {format(new Date(cost.work_date), 'MMM dd, yyyy')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {cost.machine_name || cost.equipment_type}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {cost.supplier || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {cost.lot_number}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {cost.hours_used + (cost.idle_hours || 0)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(cost.rate_at_time_of_entry || 0)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {formatCurrency(cost.total_cost || 0)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {plantCosts.length > 10 && (
                  <div className="px-6 py-3 bg-gray-50 text-sm text-gray-500">
                    Showing 10 of {plantCosts.length} entries
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Material Costs Table */}
          {(costCategory === 'all' || costCategory === 'materials') && materialCosts.length > 0 && (
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900 flex items-center">
                  <Package className="h-5 w-5 mr-2" />
                  Materials Costs Detail
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Material
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Supplier
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Lot
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Quantity
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Unit Cost
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {materialCosts.slice(0, 10).map((cost, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {format(new Date(cost.delivery_date), 'MMM dd, yyyy')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {cost.material_name || cost.material_type}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {cost.profile_supplier || cost.delivery_supplier || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {cost.lot_number}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {cost.quantity} {cost.unit_measure}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(cost.rate_at_time_of_entry || 0)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {formatCurrency(cost.total_cost || 0)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {materialCosts.length > 10 && (
                  <div className="px-6 py-3 bg-gray-50 text-sm text-gray-500">
                    Showing 10 of {materialCosts.length} entries
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* No Data Message */}
        {costSummary && costSummary.total_cost === 0 && (
          <div className="bg-white shadow rounded-lg p-6 text-center">
            <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Cost Data Available</h3>
            <p className="text-gray-500">
              No cost data has been recorded for the selected filters. 
              Try adjusting the date range or filters to see cost information.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}