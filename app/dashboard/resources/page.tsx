'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Users, Truck, Package } from 'lucide-react'
import { LabourResourcesTab } from '@/components/resources/labour-resources-tab'
import { PlantResourcesTab } from '@/components/resources/plant-resources-tab'
import { MaterialResourcesTab } from '@/components/resources/material-resources-tab'

export default function ResourcesPage() {
  const { user, loading } = useAuth()
  const [activeTab, setActiveTab] = useState('labour')

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading resources...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Please log in to access resources.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="px-4 py-4 lg:px-6 lg:py-6">
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center">
            <div className="mb-4 lg:mb-0">
              <h1 className="text-xl lg:text-2xl font-bold text-gray-900">Resource Library</h1>
              <p className="text-sm text-gray-500">Manage your labour, plant, and material profiles for quick data entry</p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 lg:p-6">
        <div className="bg-white shadow rounded-lg">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="labour" className="flex items-center">
                <Users className="h-4 w-4 mr-2" />
                Labour
              </TabsTrigger>
              <TabsTrigger value="plant" className="flex items-center">
                <Truck className="h-4 w-4 mr-2" />
                Plant & Equipment
              </TabsTrigger>
              <TabsTrigger value="materials" className="flex items-center">
                <Package className="h-4 w-4 mr-2" />
                Materials
              </TabsTrigger>
            </TabsList>
            
            <div className="p-6">
              <TabsContent value="labour" className="mt-0">
                <LabourResourcesTab />
              </TabsContent>
              
              <TabsContent value="plant" className="mt-0">
                <PlantResourcesTab />
              </TabsContent>
              
              <TabsContent value="materials" className="mt-0">
                <MaterialResourcesTab />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </div>
  )
}