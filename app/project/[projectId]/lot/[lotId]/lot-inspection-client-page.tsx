'use client'

import { useState } from 'react'
import { Button } from '../../../../../components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../../../components/ui/tabs'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import type { FullLotData } from '../../../../../types'
import ComplianceTab from '../../../../../components/tabs/compliance-tab'
import SiteDiaryTab from '../../../../../components/tabs/site-diary-tab'
import LabourMaterialsTab from '../../../../../components/tabs/labour-materials-tab'

interface LotInspectionClientPageProps {
  lotData: FullLotData
}

export default function LotInspectionClientPage({ lotData }: LotInspectionClientPageProps) {
  const [activeTab, setActiveTab] = useState('compliance')

  return (
    <div className="container mx-auto py-6 px-4 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Link href={`/project/${lotData.project_id}`}>
            <Button variant="outline" size="sm" className="border-[#1B4F72] text-[#1B4F72] hover:bg-[#1B4F72] hover:text-white">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Project
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-heading font-bold text-slate-900">{lotData.lot_number}</h1>
            <p className="text-slate-600 font-primary">
              {lotData.projects.name} • {lotData.projects.project_number}
            </p>
          </div>
        </div>
      </div>

      {/* Daily Report Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6 bg-slate-100 border border-slate-200">
          <TabsTrigger value="compliance" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#1B4F72] data-[state=active]:to-[#2E86AB] data-[state=active]:text-white">
            <div className="w-2 h-2 bg-[#1B4F72] rounded-full"></div>
            QA & Environmental
          </TabsTrigger>
          <TabsTrigger value="diary" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#F1C40F] data-[state=active]:to-[#F39C12] data-[state=active]:text-slate-900">
            <div className="w-2 h-2 bg-[#F1C40F] rounded-full"></div>
            Site Diary
          </TabsTrigger>
          <TabsTrigger value="labour" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#1B4F72] data-[state=active]:to-[#2E86AB] data-[state=active]:text-white">
            <div className="w-2 h-2 bg-[#1B4F72] rounded-full"></div>
            Labour & Materials
          </TabsTrigger>
        </TabsList>

        <TabsContent value="compliance" className="space-y-6">
          <ComplianceTab lotData={lotData} />
        </TabsContent>

        <TabsContent value="diary" className="space-y-6">
          <SiteDiaryTab lotData={lotData} />
        </TabsContent>

        <TabsContent value="labour" className="space-y-6">
          <LabourMaterialsTab lotData={lotData} />
        </TabsContent>
      </Tabs>
    </div>
  )
}