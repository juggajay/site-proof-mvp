// app/project/[projectId]/lot/[lotId]/client-page.tsx
'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { FullLotData, ConformanceRecord } from '../../../../../types';
import { Button } from '../../../../../components/ui/button';
import { ChecklistItem } from '../../../../../components/checklist-item';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';
import { saveInspectionAnswersAction } from '../../../../../actions';

const initializeAnswers = (lotData: FullLotData): Record<string, Partial<ConformanceRecord>> => {
  const initial: Record<string, Partial<ConformanceRecord>> = {};
  lotData.itps.itp_items.forEach(item => {
    const record = item.conformance_records?.[0];
    initial[item.id] = record || { item_id: item.id, lot_id: lotData.id };
  });
  return initial;
};

export function LotInspectionClientPage({ lotData }: { lotData: FullLotData }) {
  const [answers, setAnswers] = useState(() => initializeAnswers(lotData));
  const [isPending, startTransition] = useTransition();

  const handleAnswerChange = (itemId: string, data: Partial<ConformanceRecord>) => {
    setAnswers(prev => ({ ...prev, [itemId]: { ...prev[itemId], ...data } }));
  };

  const handleSave = async () => {
    startTransition(async () => {
      try {
        // Convert answers to the format expected by server action
        const answersArray = Object.entries(answers).map(([itp_item_id, answer]) => ({
          itp_item_id,
          pass_fail_value: answer.pass_fail_value || undefined,
          text_value: answer.text_value || undefined,
          numeric_value: answer.numeric_value || undefined,
          comment: answer.notes || undefined,
        }));

        // Create FormData for server action
        const formData = new FormData();
        formData.append('lot_id', lotData.id);
        formData.append('answers', JSON.stringify(answersArray));

        // Call server action
        const result = await saveInspectionAnswersAction(formData);

        if (result.success) {
          toast.success(result.message || "Progress saved successfully!");
        } else {
          toast.error(result.error || "Failed to save progress");
        }
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to save progress");
      }
    });
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
              item={{
                id: item.id,
                item_description: item.item_description,
                item_type: item.item_type === 'NUMERIC' ? 'MEASUREMENT' : item.item_type as 'PASS_FAIL' | 'TEXT_INPUT',
                required: true,
                acceptance_criteria: item.acceptance_criteria
              }}
              value={undefined}
              onChange={() => {}}
              onSave={() => handleAnswerChange(item.id, {})}
            />
          ))
        }
      </div>

      <div className="mt-8 flex justify-end">
        <Button onClick={handleSave} disabled={isPending}>
          {isPending ? "Saving..." : "Save Progress"}
        </Button>
      </div>
    </div>
  );
}