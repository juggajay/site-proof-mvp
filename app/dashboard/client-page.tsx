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
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 fade-in">
          <div>
            <h1 className="text-4xl font-heading font-bold text-slate-900 mb-2">
              Dashboard
            </h1>
            <p className="text-lg text-slate-600 font-primary">
              Welcome back! Here's an overview of your construction projects.
            </p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="site-proof-btn-primary mt-4 sm:mt-0"
          >
            <PlusCircle className="mr-2 h-5 w-5" />
            New Project
          </button>
        </div>

        {/* Site-Proof Branded Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Projects - Site-Proof Blue */}
          <Card className="text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 scale-on-hover group bg-gradient-to-br from-[#1B4F72] to-[#2E86AB]">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/90 text-sm font-medium mb-2 font-primary">Total Projects</p>
                  <p className="text-3xl font-bold font-heading">{totalProjects}</p>
                  <p className="text-white/80 text-xs mt-1 font-primary">All time</p>
                </div>
                <div className="bg-white/20 p-3 rounded-xl group-hover:bg-white/30 transition-colors duration-200">
                  <FolderKanban className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Active Projects - Site-Proof Gold */}
          <Card className="text-slate-900 border-0 shadow-lg hover:shadow-xl transition-all duration-300 scale-on-hover group bg-gradient-to-br from-[#F1C40F] to-[#F39C12]">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-900/90 text-sm font-medium mb-2 font-primary">Active Projects</p>
                  <p className="text-3xl font-bold font-heading">{activeProjects}</p>
                  <p className="text-slate-900/80 text-xs mt-1 font-primary">In progress</p>
                </div>
                <div className="bg-white/20 p-3 rounded-xl group-hover:bg-white/30 transition-colors duration-200">
                  <TrendingUp className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Completed Projects - Site-Proof Blue Variant */}
          <Card className="text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 scale-on-hover group bg-gradient-to-br from-[#2E86AB] to-[#1B4F72]">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/90 text-sm font-medium mb-2 font-primary">Completed</p>
                  <p className="text-3xl font-bold font-heading">{completedProjects}</p>
                  <p className="text-white/80 text-xs mt-1 font-primary">Delivered</p>
                </div>
                <div className="bg-white/20 p-3 rounded-xl group-hover:bg-white/30 transition-colors duration-200">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pending Projects - Site-Proof Gold Variant */}
          <Card className="text-slate-900 border-0 shadow-lg hover:shadow-xl transition-all duration-300 scale-on-hover group bg-gradient-to-br from-[#F39C12] to-[#E67E22]">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-900/90 text-sm font-medium mb-2 font-primary">Pending</p>
                  <p className="text-3xl font-bold font-heading">{pendingProjects}</p>
                  <p className="text-slate-900/80 text-xs mt-1 font-primary">Awaiting start</p>
                </div>
                <div className="bg-white/20 p-3 rounded-xl group-hover:bg-white/30 transition-colors duration-200">
                  <Clock className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Projects Section */}
        <div className="mb-6">
          <h2 className="text-2xl font-heading font-semibold text-slate-900 mb-4">
            Recent Projects
          </h2>
        </div>

        {projects.length === 0 ? (
          <Card className="text-center py-16 border-2 border-dashed border-slate-300 bg-gradient-to-br from-slate-50 to-slate-100">
            <CardContent className="p-8">
              <div className="w-16 h-16 bg-gradient-to-br from-[#1B4F72] to-[#2E86AB] rounded-full flex items-center justify-center mx-auto mb-4">
                <HardHat className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-heading font-semibold text-slate-900 mb-2">
                No Projects Found
              </h3>
              <p className="text-slate-600 font-primary mb-6 max-w-md mx-auto">
                Get started by creating your first construction project. Track progress, manage lots, and ensure quality compliance.
              </p>
              <button onClick={() => setIsModalOpen(true)} className="site-proof-btn-primary">
                <PlusCircle className="mr-2 h-5 w-5" />
                Create Your First Project
              </button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <Link href={`/project/${project.id}`} key={project.id} passHref>
                <Card className="group cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1 scale-on-hover bg-white border-slate-200">
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-xl font-heading text-slate-900 group-hover:text-[#1B4F72] transition-colors duration-200 mb-2">
                          {project.name}
                        </CardTitle>
                        <CardDescription className="text-slate-600 font-primary">
                          #{project.project_number}
                        </CardDescription>
                      </div>
                      <div className="bg-gradient-to-br from-[#1B4F72] to-[#2E86AB] p-2 rounded-lg group-hover:from-[#F1C40F] group-hover:to-[#F39C12] transition-all duration-200">
                        <FolderKanban className="h-5 w-5 text-white" />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      <div className="flex items-center text-sm text-slate-600">
                        <Calendar className="w-4 h-4 mr-2 text-[#1B4F72]" />
                        <span>Created {new Date(project.created_at).toLocaleDateString()}</span>
                      </div>
                      
                      <div className="flex items-center text-sm text-slate-600">
                        <HardHat className="w-4 h-4 mr-2 text-[#1B4F72]" />
                        <span className="truncate">{project.location}</span>
                      </div>

                      <div className="flex items-center justify-between pt-2">
                        <Badge className="bg-gradient-to-r from-[#F1C40F] to-[#F39C12] text-slate-900 border-0 font-medium">
                          Active
                        </Badge>
                        
                        <div className="text-xs text-[#1B4F72] font-medium">
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