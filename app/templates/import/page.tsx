'use client'

import { useState } from 'react'
import { Upload, Download, FileText, CheckCircle2, AlertTriangle } from 'lucide-react'

interface CSVRow {
  id?: string
  itp_template_id?: string
  item_number?: string
  description?: string
  specification_reference?: string
  inspection_method?: string
  acceptance_criteria?: string
  item_type?: string
  is_mandatory?: string
  order_index?: string
}

export default function ImportITPItemsPage() {
  const [csvData, setCsvData] = useState<string>('')
  const [parsedData, setParsedData] = useState<CSVRow[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [importResults, setImportResults] = useState<{success: number, errors: string[]}>({success: 0, errors: []})

  const parseCSV = (text: string): CSVRow[] => {
    const lines = text.trim().split('\n')
    if (lines.length < 2) return []

    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
    const rows = lines.slice(1).map(line => {
      const values = line.split(',').map(v => v.trim().replace(/"/g, ''))
      const row: CSVRow = {}
      headers.forEach((header, index) => {
        row[header as keyof CSVRow] = values[index] || ''
      })
      return row
    })

    return rows
  }

  const handleCSVInput = (text: string) => {
    setCsvData(text)
    if (text.trim()) {
      try {
        const parsed = parseCSV(text)
        setParsedData(parsed)
      } catch (error) {
        console.error('Error parsing CSV:', error)
        setParsedData([])
      }
    } else {
      setParsedData([])
    }
  }

  const handleImport = async () => {
    setIsProcessing(true)
    const results = {success: 0, errors: [] as string[]}

    try {
      // Call the API to import ITP items
      const response = await fetch('/api/itp-items/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ items: parsedData }),
      })

      const result = await response.json()
      
      if (result.success) {
        results.success = result.data.imported || parsedData.length
        results.errors = result.data.errors || []
      } else {
        results.errors.push(`Import failed: ${result.error}`)
      }
    } catch (error) {
      console.error('Import error:', error)
      results.errors.push(`Network error: ${error}`)
    }

    setImportResults(results)
    setIsProcessing(false)
  }

  const downloadTemplate = () => {
    const template = `id,itp_template_id,item_number,description,specification_reference,inspection_method,acceptance_criteria,item_type,is_mandatory,order_index
1,1,1.1,"Excavation depth and dimensions","Drawing REF-001","measurement","As per approved drawings ±25mm","numeric","true",1
2,1,1.2,"Base preparation and compaction","Spec 123-A","visual","Uniform, well compacted, no soft spots","pass_fail","true",2
3,1,1.3,"Photographic evidence","QA-001","visual","Before, during, and after photos required","photo_required","true",3`

    const blob = new Blob([template], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'itp_items_template.csv'
    a.click()
    window.URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Upload className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Import ITP Items</h1>
                <p className="text-sm text-gray-500">Bulk import inspection test plan items from CSV</p>
              </div>
            </div>
            <button
              onClick={downloadTemplate}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <Download className="h-4 w-4 mr-2" />
              Download Template
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto py-6 px-6">
        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-medium text-blue-900 mb-2">How to Import ITP Items</h3>
          <ol className="list-decimal list-inside text-sm text-blue-800 space-y-1">
            <li>Download the CSV template to see the required format</li>
            <li>Prepare your CSV file with the ITP items data</li>
            <li>Copy and paste the CSV content in the text area below</li>
            <li>Review the parsed data preview</li>
            <li>Click &quot;Import Items&quot; to add them to the system</li>
          </ol>
        </div>

        {/* CSV Input */}
        <div className="bg-white shadow rounded-lg mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              CSV Data Input
            </h3>
          </div>
          <div className="p-6">
            <label htmlFor="csv-input" className="block text-sm font-medium text-gray-700 mb-2">
              Paste your CSV content here:
            </label>
            <textarea
              id="csv-input"
              value={csvData}
              onChange={(e) => handleCSVInput(e.target.value)}
              rows={10}
              className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm font-mono"
              placeholder="id,itp_template_id,item_number,description,specification_reference,inspection_method,acceptance_criteria,item_type,is_mandatory,order_index
1,1,1.1,Excavation depth and dimensions,Drawing REF-001,measurement,As per approved drawings ±25mm,numeric,true,1
2,1,1.2,Base preparation and compaction,Spec 123-A,visual,Uniform well compacted no soft spots,pass_fail,true,2"
            />
            <p className="mt-2 text-sm text-gray-500">
              Expected format: CSV with headers including id, itp_template_id, item_number, description, etc.
            </p>
          </div>
        </div>

        {/* Data Preview */}
        {parsedData.length > 0 && (
          <div className="bg-white shadow rounded-lg mb-6">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                Data Preview ({parsedData.length} items)
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Item #
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Method
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Mandatory
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {parsedData.slice(0, 10).map((row, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {row.item_number || row.id}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                        {row.description}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {row.inspection_method}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {row.item_type}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {row.is_mandatory}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {parsedData.length > 10 && (
                <div className="px-6 py-3 bg-gray-50 text-sm text-gray-500">
                  Showing 10 of {parsedData.length} items...
                </div>
              )}
            </div>
          </div>
        )}

        {/* Import Actions */}
        {parsedData.length > 0 && (
          <div className="bg-white shadow rounded-lg mb-6">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Ready to Import</h3>
                  <p className="text-sm text-gray-500">
                    {parsedData.length} ITP items ready for import
                  </p>
                </div>
                <button
                  onClick={handleImport}
                  disabled={isProcessing}
                  className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {isProcessing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Import Items
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Import Results */}
        {importResults.success > 0 || importResults.errors.length > 0 ? (
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Import Results</h3>
            </div>
            <div className="p-6">
              {importResults.success > 0 && (
                <div className="flex items-center mb-4 text-green-700">
                  <CheckCircle2 className="h-5 w-5 mr-2" />
                  Successfully imported {importResults.success} items
                </div>
              )}
              
              {importResults.errors.length > 0 && (
                <div className="mb-4">
                  <div className="flex items-center text-red-700 mb-2">
                    <AlertTriangle className="h-5 w-5 mr-2" />
                    {importResults.errors.length} errors occurred
                  </div>
                  <div className="bg-red-50 border border-red-200 rounded-md p-3">
                    <ul className="text-sm text-red-700 space-y-1">
                      {importResults.errors.map((error, index) => (
                        <li key={index}>• {error}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}