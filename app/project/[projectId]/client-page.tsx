'use client'

import { useState } from 'react'
import Link from 'next/link'
import { PlusCircle, FileText, ChevronRight, ArrowLeft } from 'lucide-react'
import { Project, LotWithItp } from '../../../types'
import { Button } from '../../../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card'
import { Badge } from '../../../components/ui/badge'
import CreateLotModal from '../../../components/modals/create-lot-modal'

export function ProjectClientPage({ project, lots }: { project: Project; lots: LotWithItp[] }) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  
  return (
    <div className="container mx-auto">
      <div className="mb-6">
        <Link href="/dashboard" className="inline-flex items-center text-sm text-slate-600 hover:text-[#1B4F72] mb-2 transition-colors">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
        </Link>
        <h1 className="text-3xl font-heading font-bold text-slate-900">{project.name}</h1>
        <p className="text-slate-600 font-primary">Project #{project.project_number} - {project.location}</p>
      </div>
      <Card className="border-slate-200 shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between bg-gradient-to-r from-slate-50 to-slate-100">
          <div>
            <CardTitle className="text-slate-900 font-heading">Inspection Lots</CardTitle>
            <CardDescription className="text-slate-600 font-primary">Manage all inspection lots for this project.</CardDescription>
          </div>
          <Button onClick={() => setIsModalOpen(true)} className="site-proof-btn-primary">
            <PlusCircle className="mr-2 h-4 w-4" />
            New Lot
          </Button>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            {lots.map((lot) => (
              <Link href={`/project/${project.id}/lot/${lot.id}/daily-report`} key={lot.id} className="block">
                <div className="border border-slate-200 rounded-lg p-4 flex items-center justify-between hover:bg-gradient-to-r hover:from-slate-50 hover:to-slate-100 transition-all duration-200 hover:shadow-md">
                  <div className="flex items-center gap-4">
                    <div className="bg-gradient-to-br from-[#1B4F72] to-[#2E86AB] p-2 rounded-lg">
                      <FileText className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900 font-heading">{lot.lot_number}</p>
                      <p className="text-sm text-slate-600 font-primary">{lot.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge className={lot.status === 'COMPLETED'
                      ? 'bg-gradient-to-r from-[#F1C40F] to-[#F39C12] text-slate-900 border-0'
                      : 'bg-gradient-to-r from-[#1B4F72] to-[#2E86AB] text-white border-0'
                    }>
                      {lot.status.replace('_', ' ')}
                    </Badge>
                    <ChevronRight className="h-5 w-5 text-[#1B4F72]" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
      <CreateLotModal open={isModalOpen} onOpenChange={setIsModalOpen} projectId={project.id} />
    </div>
  )
}