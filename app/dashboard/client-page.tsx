'use client'

import { useState } from 'react'
import Link from 'next/link'
import { PlusCircle, FolderKanban, HardHat } from 'lucide-react'
import { Project } from '@/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CreateProjectModal } from '@/components/modals/create-project-modal'

interface DashboardClientPageProps {
  projects: Project[]
}

export function DashboardClientPage({ projects }: DashboardClientPageProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <div className="container mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Projects</h1>
        <Button onClick={() => setIsModalOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" />
          New Project
        </Button>
      </div>

      {projects.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed rounded-lg bg-card">
          <HardHat className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-2 text-xl font-semibold">No Projects Found</h3>
          <p className="mt-1 text-sm text-muted-foreground">Get started by creating your first project.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Link href={`/project/${project.id}`} key={project.id} passHref>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between text-lg">
                    <span>{project.name}</span>
                    <FolderKanban className="h-5 w-5 text-muted-foreground" />
                  </CardTitle>
                  <CardDescription>#{project.project_number}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{project.location}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <CreateProjectModal open={isModalOpen} onOpenChange={setIsModalOpen} />
    </div>
  )
}