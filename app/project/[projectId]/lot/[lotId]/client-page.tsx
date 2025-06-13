// app/project/[projectId]/lot/[lotId]/client-page.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { FullLotData, ConformanceRecord } from '../../../../../types';
import { Button } from '../../../../../components/ui/button';
import ChecklistItem from '../../../../../components/checklist-item';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';

const initializeAnswers = (lotData: FullLotData): Record<string, Partial<ConformanceRecord>> => {
  const initial: Record<string, Partial<ConformanceRecord>> = {};
  lotData.itps.itp_items.forEach(item => {
    const record = item.conformance_records?.[0];
    initial[item.id] = record || { itp_item_id: item.id, lot_id: lotData.id };
  });
  return initial;
};

export function LotInspectionClientPage({ lotData }: { lotData: FullLotData }) {
  const [answers, setAnswers] = useState(() => initializeAnswers(lotData));

  const handleAnswerChange = (itemId: string, data: Partial<ConformanceRecord>) => {
    setAnswers(prev => ({ ...prev, [itemId]: { ...prev[itemId], ...data } }));
  };

  const handleSave = () => {
    // We will implement this server action next
    console.log("Saving answers:", answers);
    toast.success("Progress Saved! (Feature in development)");
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6 space-y-1">
        <Link href={`/project/${lotData.project_id}`} className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Project
        </Link>
        <h1 className="text-3xl font-bold">{lotData.itps?.title || 'Inspection Checklist'}</h1>
        <p className="text-muted-foreground">Lot: <span className="font-semibold">{lotData.lot_number}</span> - {lotData.description}</p>
      </div>

      <div className="space-y-4">
        {lotData.itps?.itp_items
          .sort((a, b) => a.order - b.order)
          .map(item => (
            <ChecklistItem
              key={item.id}
              item={item}
              value={answers[item.id] || {}}
              onChange={(data) => handleAnswerChange(item.id, data)}
            />
          ))
        }
      </div>

      <div className="mt-8 flex justify-end">
        <Button onClick={handleSave}>Save Progress</Button>
      </div>
    </div>
  );
}