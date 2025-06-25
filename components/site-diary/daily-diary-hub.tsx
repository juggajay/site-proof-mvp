'use client'

import { useState, useEffect, useCallback } from 'react'
import { format, addDays } from 'date-fns'
import { Calendar, Users, Truck, Package, StickyNote, AlertCircle } from 'lucide-react'
import { ProjectWithDetails } from '@/types/database'
import { getTomorrowNotesAction } from '@/lib/actions'
import { LabourTab } from './tabs/labour-tab'
import { PlantTab } from './tabs/plant-tab'
import { MaterialsTab } from './tabs/materials-tab'
import { NotesForTomorrowTab } from './tabs/notes-for-tomorrow-tab'

interface DailyDiaryHubProps {
  project: ProjectWithDetails
}

interface TomorrowNote {
  id: string
  project_id: string
  note_content: string
  target_date: string
  created_at: string
  created_by: string
}

export function DailyDiaryHub({ project }: DailyDiaryHubProps) {
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [activeTab, setActiveTab] = useState<'labour' | 'plant' | 'materials' | 'notes'>('labour')
  const [tomorrowNotes, setTomorrowNotes] = useState<TomorrowNote[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Load tomorrow's notes for the selected date
  const loadTomorrowNotes = useCallback(async () => {
    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd')
      const result = await getTomorrowNotesAction(project.id.toString(), dateStr)
      
      if (result.success && result.data) {
        setTomorrowNotes(result.data)
      }
    } catch (error) {
      console.error('Error loading tomorrow notes:', error)
    }
  }, [project.id, selectedDate])

  useEffect(() => {
    loadTomorrowNotes()
    setIsLoading(false)
  }, [loadTomorrowNotes])

  const tabs = [
    { id: 'labour' as const, name: 'Labour', icon: Users },
    { id: 'plant' as const, name: 'Plant', icon: Truck },
    { id: 'materials' as const, name: 'Materials', icon: Package },
    { id: 'notes' as const, name: 'Notes for Tomorrow', icon: StickyNote },
  ]

  return (
    <div className="space-y-6">
      {/* Tomorrow's Notes Display */}
      {tomorrowNotes.length > 0 && (
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-lg">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-blue-400 mt-0.5" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">Notes from Yesterday</h3>
              <div className="mt-2 text-sm text-blue-700 space-y-2">
                {tomorrowNotes.map((note) => (
                  <p key={note.id}>{note.note_content}</p>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Date Selector */}
      <div className="bg-white shadow rounded-lg p-4">
        <div className="flex items-center space-x-4">
          <Calendar className="h-5 w-5 text-gray-400" />
          <input
            type="date"
            value={format(selectedDate, 'yyyy-MM-dd')}
            onChange={(e) => setSelectedDate(new Date(e.target.value))}
            className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          />
          <span className="text-sm text-gray-500">
            {format(selectedDate, 'EEEE, MMMM d, yyyy')}
          </span>
        </div>
      </div>

      {/* Main Tabs */}
      <div className="bg-white shadow rounded-lg">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 py-3 px-4 border-b-2 font-medium text-sm focus:outline-none transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-center">
                    <Icon className="h-4 w-4 mr-2" />
                    {tab.name}
                  </div>
                </button>
              )
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading...</p>
            </div>
          ) : (
            <>
              {activeTab === 'labour' && (
                <LabourTab
                  project={project}
                  selectedDate={selectedDate}
                />
              )}
              {activeTab === 'plant' && (
                <PlantTab
                  project={project}
                  selectedDate={selectedDate}
                />
              )}
              {activeTab === 'materials' && (
                <MaterialsTab
                  project={project}
                  selectedDate={selectedDate}
                />
              )}
              {activeTab === 'notes' && (
                <NotesForTomorrowTab
                  project={project}
                  defaultDate={addDays(selectedDate, 1)}
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}