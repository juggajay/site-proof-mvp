import React from 'react'
import { Building, MapPin, Calendar, Users, ChevronRight } from 'lucide-react'
import { Card, CardContent } from '../ui/card'
import { Button } from '../ui/button'

interface EnhancedProjectHeaderProps {
  projectName: string
  projectLocation?: string
  projectStatus: 'ACTIVE' | 'COMPLETED' | 'ON_HOLD' | 'PLANNING'
  organizationName: string
  totalLots: number
  activeLots: number
  completedLots: number
  startDate?: string
  endDate?: string
  onNewLot?: () => void
  onTeamManagement?: () => void
}

export function EnhancedProjectHeader({
  projectName,
  projectLocation = "Sydney",
  projectStatus,
  organizationName,
  totalLots,
  activeLots,
  completedLots,
  startDate,
  endDate,
  onNewLot,
  onTeamManagement
}: EnhancedProjectHeaderProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-800 border-green-200'
      case 'COMPLETED': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'ON_HOLD': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'PLANNING': return 'bg-purple-100 text-purple-800 border-purple-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const progressPercentage = totalLots > 0 ? Math.round((completedLots / totalLots) * 100) : 0

  return (
    <div className="mb-8">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4 font-primary">
        <span className="text-[#1B4F72] font-medium">{organizationName}</span>
        <ChevronRight className="h-4 w-4" />
        <span>Projects</span>
        <ChevronRight className="h-4 w-4" />
        <span className="text-[#1B4F72] font-medium">{projectName}</span>
      </div>

      {/* Main Project Header Card */}
      <Card className="border-[#1B4F72]/20 bg-gradient-to-r from-white to-blue-50/30">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              {/* Project Title */}
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-[#1B4F72] rounded-lg flex items-center justify-center">
                  <Building className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-[#1B4F72] font-heading mb-1">
                    {projectName}
                  </h1>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      <span className="font-primary">{projectLocation}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span className="font-primary">
                        {startDate && endDate 
                          ? `${new Date(startDate).toLocaleDateString('en-AU')} - ${new Date(endDate).toLocaleDateString('en-AU')}`
                          : 'Ongoing Project'
                        }
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Project Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
                <div className="bg-white/60 rounded-lg p-4 border border-[#1B4F72]/10">
                  <div className="text-2xl font-bold text-[#1B4F72] font-heading">{totalLots}</div>
                  <div className="text-sm text-muted-foreground font-primary">Total Lots</div>
                </div>
                <div className="bg-white/60 rounded-lg p-4 border border-green-200">
                  <div className="text-2xl font-bold text-green-600 font-heading">{activeLots}</div>
                  <div className="text-sm text-muted-foreground font-primary">Active Lots</div>
                </div>
                <div className="bg-white/60 rounded-lg p-4 border border-blue-200">
                  <div className="text-2xl font-bold text-blue-600 font-heading">{completedLots}</div>
                  <div className="text-sm text-muted-foreground font-primary">Completed</div>
                </div>
                <div className="bg-white/60 rounded-lg p-4 border border-purple-200">
                  <div className="text-2xl font-bold text-purple-600 font-heading">{progressPercentage}%</div>
                  <div className="text-sm text-muted-foreground font-primary">Progress</div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-[#1B4F72] font-primary">Project Progress</span>
                  <span className="text-sm text-muted-foreground font-primary">{progressPercentage}% Complete</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-[#1B4F72] to-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Status Badge */}
            <div className="flex flex-col items-end gap-3">
              <div className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(projectStatus)}`}>
                {projectStatus.replace('_', ' ')}
              </div>
              
              {/* Quick Actions */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-[#1B4F72]/20 text-[#1B4F72] hover:bg-[#1B4F72]/10"
                  onClick={onTeamManagement}
                >
                  <Users className="h-4 w-4 mr-2" />
                  Team
                </Button>
                <Button
                  size="sm"
                  className="bg-[#1B4F72] hover:bg-[#1B4F72]/90 text-white"
                  onClick={onNewLot}
                >
                  + New Lot
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}