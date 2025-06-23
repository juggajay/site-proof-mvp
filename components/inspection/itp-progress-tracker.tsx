'use client'

import { useMemo } from 'react'
import { CheckCircle, XCircle, MinusCircle, AlertCircle } from 'lucide-react'

interface ITPProgressTrackerProps {
  totalItems: number
  conformanceRecords: Array<{
    itp_item_id: string | number
    result_pass_fail: string
  }>
  itpItems: Array<{
    id: string | number
  }>
}

export function ITPProgressTracker({ 
  totalItems, 
  conformanceRecords, 
  itpItems 
}: ITPProgressTrackerProps) {
  const stats = useMemo(() => {
    // Filter conformance records to only include ones for current ITP items
    const relevantRecords = conformanceRecords.filter(record =>
      itpItems.some(item => item.id === record.itp_item_id)
    )

    const passed = relevantRecords.filter(r => r.result_pass_fail === 'PASS').length
    const failed = relevantRecords.filter(r => r.result_pass_fail === 'FAIL').length
    const na = relevantRecords.filter(r => r.result_pass_fail === 'N/A').length
    const completed = passed + failed + na
    const pending = totalItems - completed

    return {
      total: totalItems,
      completed,
      passed,
      failed,
      na,
      pending,
      percentage: totalItems > 0 ? Math.round((completed / totalItems) * 100) : 0
    }
  }, [totalItems, conformanceRecords, itpItems])

  return (
    <div className="space-y-3">
      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
        <div className="h-full flex">
          {stats.passed > 0 && (
            <div 
              className="bg-green-500 h-full transition-all duration-300"
              style={{ width: `${(stats.passed / stats.total) * 100}%` }}
              title={`${stats.passed} Passed`}
            />
          )}
          {stats.failed > 0 && (
            <div 
              className="bg-red-500 h-full transition-all duration-300"
              style={{ width: `${(stats.failed / stats.total) * 100}%` }}
              title={`${stats.failed} Failed`}
            />
          )}
          {stats.na > 0 && (
            <div 
              className="bg-gray-400 h-full transition-all duration-300"
              style={{ width: `${(stats.na / stats.total) * 100}%` }}
              title={`${stats.na} N/A`}
            />
          )}
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
        <div className="flex items-center gap-2">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <span className="text-gray-700">
            Passed: <strong>{stats.passed}</strong>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <XCircle className="h-4 w-4 text-red-600" />
          <span className="text-gray-700">
            Failed: <strong>{stats.failed}</strong>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <MinusCircle className="h-4 w-4 text-gray-600" />
          <span className="text-gray-700">
            N/A: <strong>{stats.na}</strong>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-blue-600" />
          <span className="text-gray-700">
            Pending: <strong>{stats.pending}</strong>
          </span>
        </div>
      </div>

      {/* Completion Status */}
      <div className="text-center">
        <span className={`text-lg font-semibold ${
          stats.percentage === 100 ? 'text-green-600' : 
          stats.percentage > 0 ? 'text-blue-600' : 
          'text-gray-500'
        }`}>
          {stats.percentage}% Complete
        </span>
        <span className="text-sm text-gray-500 ml-2">
          ({stats.completed} of {stats.total} items)
        </span>
      </div>
    </div>
  )
}