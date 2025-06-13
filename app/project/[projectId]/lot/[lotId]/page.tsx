import { createClient } from '../../../../../lib/supabase/server'
import { notFound } from 'next/navigation'
import LotInspectionClientPage from './lot-inspection-client-page'
import type { FullLotData } from '../../../../../types'

interface LotPageProps {
  params: {
    projectId: string
    lotId: string
  }
}

export default async function LotPage({ params }: LotPageProps) {
  const supabase = createClient()

  // Fetch lot with all related data
  const { data: lotData, error } = await supabase
    .from('lots')
    .select(`
      *,
      projects (
        id,
        name,
        project_number
      ),
      itps (
        title,
        itp_items (
          id,
          item_description,
          item_type,
          order_index,
          conformance_records (
            id,
            pass_fail_value,
            text_value,
            numeric_value,
            comment,
            completed_by,
            updated_at,
            attachments (
              id
            )
          )
        )
      )
    `)
    .eq('id', params.lotId)
    .eq('project_id', params.projectId)
    .single()

  if (error || !lotData) {
    console.error('Error fetching lot data:', error)
    notFound()
  }

  // Transform the data to match our types
  const fullLotData: FullLotData = {
    ...lotData,
    projects: lotData.projects,
    itps: {
      title: lotData.itps?.title || '',
      itp_items: lotData.itps?.itp_items?.map(item => ({
        ...item,
        order: item.order_index,
        conformance_records: item.conformance_records || []
      })) || []
    }
  }

  return <LotInspectionClientPage lotData={fullLotData} />
}