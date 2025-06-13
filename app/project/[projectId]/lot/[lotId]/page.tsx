// app/project/[projectId]/lot/[lotId]/page.tsx (CORRECTED)

import { createClient } from '../../../../../lib/supabase/server';
import { notFound } from "next/navigation";
import { LotInspectionClientPage } from "./client-page";
import { FullLotData, ItpItem, ConformanceRecordWithAttachments } from '../../../../../types'; // Import the specific types we need

type LotInspectionPageProps = {
  params: {
    projectId: string;
    lotId: string;
  };
};

export default async function LotInspectionPage({ params }: LotInspectionPageProps) {
  const supabase = createClient();

  // This is a more direct and robust query to get all the data we need.
  const { data: lotData, error } = await supabase
    .from('lots')
    .select(`
      *,
      projects (*),
      itps (
        *,
        itp_items (
          *,
          conformance_records (
            *,
            attachments (*)
          )
        )
      )
    `)
    .eq('id', params.lotId)
    .eq('project_id', params.projectId)
    // This filter is important: only get conformance records for THIS lot.
    .eq('itps.itp_items.conformance_records.lot_id', params.lotId)
    .single();

  if (error || !lotData) {
    console.error("Error fetching lot data:", error);
    notFound();
  }
  
  // This ensures that even if there are no itp_items, the array exists.
  if (lotData.itps && !lotData.itps.itp_items) {
    lotData.itps.itp_items = [];
  }

  // Ensure every item has a conformance_records array.
  if (lotData.itps && lotData.itps.itp_items) {
    lotData.itps.itp_items.forEach((item: any) => {
      if (!item.conformance_records) {
        item.conformance_records = [];
      }
    });
  }
  
  return <LotInspectionClientPage lotData={lotData as FullLotData} />;
}