'use client'

import { useState } from 'react'
import { Button } from '../../../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card'
import { Badge } from '../../../components/ui/badge'
import CreateLotModal from '../../../components/modals/create-lot-modal'
import { Plus, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import type { Project, LotWithItp } from '../../../types'

interface ClientPageProps {
  project: Project
  initialLots: LotWithItp[]
}

export default function ClientPage({ project, initialLots }: ClientPageProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'IN_PROGRESS':
        return 'bg-yellow-100 text-yellow-800'
      case 'COMPLETED':
        return 'bg-blue-100 text-blue-800'
      case 'APPROVED':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatStatus = (status: string) => {
    return status.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())
  }

  return (
    <div className="container mx-auto py-6 px-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Link href="/dashboard">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Projects
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">{project.name}</h1>
            <p className="text-muted-foreground">
              {project.project_number} • {project.location}
            </p>
          </div>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Lot
        </Button>
      </div>

      {/* Project Info Card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Project Information</CardTitle>
          <CardDescription>
            Details about this project and its inspection lots
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Project Number</p>
              <p className="text-lg">{project.project_number}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Location</p>
              <p className="text-lg">{project.location}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Lots</p>
              <p className="text-lg">{initialLots.length}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lots Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Inspection Lots</h2>
          <p className="text-muted-foreground">
            {initialLots.length} lot{initialLots.length !== 1 ? 's' : ''}
          </p>
        </div>

        {initialLots.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="text-center">
                <h3 className="text-lg font-medium mb-2">No lots yet</h3>
                <p className="text-muted-foreground mb-4">
                  Create your first inspection lot to get started
                </p>
                <Button onClick={() => setIsModalOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Lot
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {initialLots.map((lot) => (
              <Link href={`/project/${project.id}/lot/${lot.id}`} key={lot.id}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{lot.lot_number}</CardTitle>
                      <Badge className={getStatusColor(lot.status)}>
                        {formatStatus(lot.status)}
                      </Badge>
                    </div>
                    <CardDescription>
                      {lot.itps?.title || 'No ITP assigned'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      {lot.description || 'No description provided'}
                    </p>
                    <div className="flex justify-between items-center">
                      <p className="text-xs text-muted-foreground">
                        Created {new Date(lot.created_at).toLocaleDateString()}
                      </p>
                      <Button variant="outline" size="sm" onClick={(e) => e.preventDefault()}>
                        View Inspection
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Create Lot Modal */}
      <CreateLotModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        projectId={project.id}
      />
    </div>
  )
}