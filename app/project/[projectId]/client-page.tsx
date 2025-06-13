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
        <Link href="/dashboard" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-2">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
        </Link>
        <h1 className="text-3xl font-bold">{project.name}</h1>
        <p className="text-muted-foreground">Project #{project.project_number} - {project.location}</p>
      </div>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Inspection Lots</CardTitle>
            <CardDescription>Manage all inspection lots for this project.</CardDescription>
          </div>
          <Button onClick={() => setIsModalOpen(true)}><PlusCircle className="mr-2 h-4 w-4" />New Lot</Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {lots.map((lot) => (
              <Link href={`/project/${project.id}/lot/${lot.id}`} key={lot.id} className="block">
                <div className="border rounded-lg p-4 flex items-center justify-between hover:bg-muted/50">
                  <div className="flex items-center gap-4">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-semibold">{lot.lot_number}</p>
                      <p className="text-sm text-muted-foreground">{lot.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge variant={lot.status === 'COMPLETED' ? 'secondary' : 'outline'}>{lot.status.replace('_', ' ')}</Badge>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
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