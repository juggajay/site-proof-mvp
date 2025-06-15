'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import ITPSelectionModal from '@/components/itps/ITPSelectionModal'

interface QAInspectionProps {
  dailyReportId: string
  lotId: string
}

export function QAInspection({ dailyReportId, lotId }: QAInspectionProps) {
  const [showITPModal, setShowITPModal] = useState(false)
  const [selectedITP, setSelectedITP] = useState<any>(null)

  // Mock lot data for debugging - in real app this would come from props
  const lot = {
    id: lotId,
    lot_number: 'LOT-001',
    name: 'Demo Lot',
    itp_id: null // No ITP assigned initially
  }

  const projectId = 'demo-project' // This would come from props in real app

  console.log('QA Component - Lot data:', lot) // Debug log

  const handleSelectITP = (itpId: string) => {
    console.log('Selected ITP ID:', itpId) // Debug log
    setSelectedITP({ id: itpId, name: 'Selected ITP' })
    setShowITPModal(false)
    // TODO: Save ITP assignment to lot
  }

  return (
    <div className="space-y-6 p-6">
      {/* Debug Info */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-900">Debug Info</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <p><strong>Lot ID:</strong> {lot?.id || 'Not available'}</p>
            <p><strong>Lot Number:</strong> {lot?.lot_number || 'Not available'}</p>
            <p><strong>Current ITP ID:</strong> {lot?.itp_id || 'None assigned'}</p>
            <p><strong>Project ID:</strong> {projectId}</p>
            <p><strong>Selected ITP:</strong> {selectedITP?.name || 'None'}</p>
            <p><strong>Daily Report ID:</strong> {dailyReportId}</p>
          </div>
        </CardContent>
      </Card>

      {/* QA Inspection Status */}
      <Card>
        <CardHeader>
          <CardTitle>QA Inspection Status</CardTitle>
        </CardHeader>
        <CardContent>
          {lot?.itp_id || selectedITP ? (
            // ITP is assigned
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="font-medium text-green-900 mb-2">✅ ITP Assigned</h3>
                <div className="text-green-700 text-sm space-y-1">
                  <p><strong>ITP:</strong> {selectedITP?.name || 'Assigned (ID: ' + lot?.itp_id + ')'}</p>
                  {selectedITP && (
                    <>
                      <p><strong>Category:</strong> {selectedITP.category}</p>
                      <p><strong>Complexity:</strong> {selectedITP.complexity}</p>
                      <p><strong>Duration:</strong> {selectedITP.estimated_duration}</p>
                    </>
                  )}
                </div>
              </div>
              
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">Next Steps:</h4>
                <p className="text-gray-700 text-sm mb-3">ITP is assigned. Ready to proceed with quality inspection.</p>
                <Button variant="outline" disabled>
                  Start Inspection (Coming Soon)
                </Button>
              </div>
            </div>
          ) : (
            // No ITP assigned
            <div className="space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <h3 className="font-medium text-amber-900 mb-2">⚠️ ITP Required</h3>
                <p className="text-amber-700 text-sm mb-3">
                  An Inspection & Test Plan must be selected before quality inspection can begin.
                </p>
                <Button 
                  onClick={() => setShowITPModal(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Select ITP
                </Button>
              </div>
              
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">About ITPs:</h4>
                <p className="text-gray-600 text-sm">
                  Inspection & Test Plans define the quality assurance procedures for construction activities. 
                  Select the appropriate ITP based on the type of work being performed.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ITP Selection Modal */}
      {showITPModal && (
        <ITPSelectionModal
          isOpen={showITPModal}
          onClose={() => setShowITPModal(false)}
          onSelectITP={handleSelectITP}
          projectId={projectId}
          lotName={lot?.name || 'Demo Lot'}
        />
      )}
    </div>
  )
}

export default QAInspection