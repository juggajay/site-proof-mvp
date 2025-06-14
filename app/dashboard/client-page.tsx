'use client'

import { useState } from 'react'
import Link from 'next/link'
import { PlusCircle, FolderKanban, HardHat, TrendingUp, Users, Calendar, CheckCircle2, Clock, AlertTriangle } from 'lucide-react'
import { Project } from '../../types'
import { Button } from '../../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Badge } from '../../components/ui/badge'
import { CreateProjectModal } from '../../components/modals/create-project-modal'

interface DashboardClientPageProps {
  projects: Project[]
}

export function DashboardClientPage({ projects }: DashboardClientPageProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Calculate metrics
  const totalProjects = projects.length
  const activeProjects = Math.floor(totalProjects * 0.7) // Mock active projects
  const completedProjects = Math.floor(totalProjects * 0.2) // Mock completed projects
  const pendingProjects = totalProjects - activeProjects - completedProjects // Remaining as pending

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 fade-in">
          <div>
            <h1 className="text-4xl font-heading font-bold text-neutral-900 mb-2">
              Dashboard
            </h1>
            <p className="text-lg text-neutral-600 font-body">
              Welcome back! Here's an overview of your construction projects.
            </p>
          </div>
          <Button
            onClick={() => setIsModalOpen(true)}
            className="mt-4 sm:mt-0"
            size="lg"
          >
            <PlusCircle className="mr-2 h-5 w-5" />
            New Project
          </Button>
        </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-primary-500 to-primary-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 scale-on-hover">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-primary-100 text-sm font-medium mb-1">Total Projects</p>
                  <p className="text-3xl font-bold">{totalProjects}</p>
                </div>
                <div className="bg-white/20 p-3 rounded-full">
                  <FolderKanban className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-success-500 to-success-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 scale-on-hover">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-success-100 text-sm font-medium mb-1">Active Projects</p>
                  <p className="text-3xl font-bold">{activeProjects}</p>
                </div>
                <div className="bg-white/20 p-3 rounded-full">
                  <TrendingUp className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-secondary-500 to-secondary-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 scale-on-hover">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-secondary-100 text-sm font-medium mb-1">Completed</p>
                  <p className="text-3xl font-bold">{completedProjects}</p>
                </div>
                <div className="bg-white/20 p-3 rounded-full">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-warning-500 to-warning-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 scale-on-hover">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-warning-100 text-sm font-medium mb-1">Pending</p>
                  <p className="text-3xl font-bold">{pendingProjects}</p>
                </div>
                <div className="bg-white/20 p-3 rounded-full">
                  <Clock className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Projects Section */}
        <div className="mb-6">
          <h2 className="text-2xl font-heading font-semibold text-neutral-900 mb-4">
            Recent Projects
          </h2>
        </div>

        {projects.length === 0 ? (
          <Card className="text-center py-16 border-2 border-dashed border-neutral-300 bg-white">
            <CardContent className="p-8">
              <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <HardHat className="w-8 h-8 text-neutral-400" />
              </div>
              <h3 className="text-xl font-heading font-semibold text-neutral-900 mb-2">
                No Projects Found
              </h3>
              <p className="text-neutral-600 font-body mb-6 max-w-md mx-auto">
                Get started by creating your first construction project. Track progress, manage lots, and ensure quality compliance.
              </p>
              <Button onClick={() => setIsModalOpen(true)} size="lg">
                <PlusCircle className="mr-2 h-5 w-5" />
                Create Your First Project
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <Link href={`/project/${project.id}`} key={project.id} passHref>
                <Card className="group cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1 scale-on-hover">
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-xl font-heading text-neutral-900 group-hover:text-primary-600 transition-colors duration-200 mb-2">
                          {project.name}
                        </CardTitle>
                        <CardDescription className="text-neutral-600 font-body">
                          #{project.project_number}
                        </CardDescription>
                      </div>
                      <div className="bg-primary-100 p-2 rounded-lg group-hover:bg-primary-200 transition-colors duration-200">
                        <FolderKanban className="h-5 w-5 text-primary-600" />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      <div className="flex items-center text-sm text-neutral-600">
                        <Calendar className="w-4 h-4 mr-2" />
                        <span>Created {new Date(project.created_at).toLocaleDateString()}</span>
                      </div>
                      
                      <div className="flex items-center text-sm text-neutral-600">
                        <HardHat className="w-4 h-4 mr-2" />
                        <span className="truncate">{project.location}</span>
                      </div>

                      <div className="flex items-center justify-between pt-2">
                        <Badge variant="active">
                          Active
                        </Badge>
                        
                        <div className="text-xs text-neutral-500 font-medium">
                          View Details →
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}

        <CreateProjectModal open={isModalOpen} onOpenChange={setIsModalOpen} />
      </div>
    </div>
  )
}