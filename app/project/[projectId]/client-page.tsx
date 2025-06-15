'use client'

import { useState } from 'react'
import Link from 'next/link'
import { PlusCircle, FileText, ChevronRight, ArrowLeft } from 'lucide-react'
import { Project, LotWithItp } from '../../../types'
import { Button } from '../../../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card'
import { Badge } from '../../../components/ui/badge'
import CreateLotModal from '../../../components/modals/create-lot-modal'
import { EnhancedProjectHeader } from '../../../components/project/enhanced-project-header'
import { SubcontractorManagement } from '../../../components/project/subcontractor-management'

export function ProjectClientPage({ project, lots }: { project: Project; lots: LotWithItp[] }) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false)
  
  // Calculate lot statistics
  const totalLots = lots.length
  const activeLots = lots.filter(lot => lot.status === 'ACTIVE' || lot.status === 'IN_PROGRESS').length
  const completedLots = lots.filter(lot => lot.status === 'COMPLETED').length
  
  return (
    <div className="container mx-auto p-4">
      {/* Back Navigation */}
      <div className="mb-4">
        <Link href="/dashboard" className="inline-flex items-center text-sm text-slate-600 hover:text-[#1B4F72] transition-colors font-primary">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Link>
      </div>

      {/* Enhanced Project Header */}
      <EnhancedProjectHeader
        projectName={project.name}
        projectLocation={project.location || 'Sydney'}
        projectStatus={'ACTIVE'}
        organizationName="Site-Proof"
        totalLots={totalLots}
        activeLots={activeLots}
        completedLots={completedLots}
        startDate={project.created_at}
        endDate={undefined}
        onNewLot={() => setIsModalOpen(true)}
        onTeamManagement={() => setIsTeamModalOpen(true)}
      />
      <Card className="border-[#1B4F72]/20 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-[#1B4F72]/5 to-[#F1C40F]/5 border-b border-[#1B4F72]/10">
          <div>
            <CardTitle className="text-[#1B4F72] font-heading">Inspection Lots</CardTitle>
            <CardDescription className="text-[#6C757D] font-primary">Manage all inspection lots for this project.</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            {lots.map((lot) => (
              <Link href={`/project/${project.id}/lot/${lot.id}/daily-report`} key={lot.id} className="block">
                <div className="border border-[#1B4F72]/20 rounded-lg p-4 flex items-center justify-between hover:bg-gradient-to-r hover:from-[#1B4F72]/5 hover:to-blue-50/50 transition-all duration-200 hover:shadow-md hover:border-[#1B4F72]/30">
                  <div className="flex items-center gap-4">
                    <div className="bg-[#1B4F72] p-3 rounded-lg">
                      <FileText className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-[#1B4F72] font-heading">{lot.lot_number}</p>
                      <p className="text-sm text-[#6C757D] font-primary">{lot.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge className={lot.status === 'COMPLETED'
                      ? 'bg-green-100 text-green-800 border-green-200'
                      : lot.status === 'ACTIVE' || lot.status === 'IN_PROGRESS'
                      ? 'bg-blue-100 text-blue-800 border-blue-200'
                      : 'bg-gray-100 text-gray-800 border-gray-200'
                    }>
                      {lot.status.replace('_', ' ')}
                    </Badge>
                    <ChevronRight className="h-5 w-5 text-[#1B4F72]" />
                  </div>
                </div>
              </Link>
            ))}
            
            {lots.length === 0 && (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-[#1B4F72]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileText className="h-8 w-8 text-[#1B4F72]" />
                </div>
                <h3 className="text-lg font-semibold text-[#1B4F72] mb-2 font-heading">No Lots Yet</h3>
                <p className="text-[#6C757D] mb-4 font-primary">Get started by creating your first inspection lot.</p>
                <Button onClick={() => setIsModalOpen(true)} className="bg-[#1B4F72] hover:bg-[#1B4F72]/90 text-white">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Create First Lot
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      <CreateLotModal open={isModalOpen} onOpenChange={setIsModalOpen} projectId={project.id} />
      
      {/* Team Management Modal */}
      {isTeamModalOpen && (
        <SubcontractorManagement
          projectId={project.id}
          onClose={() => setIsTeamModalOpen(false)}
        />
      )}
    </div>
  )
}