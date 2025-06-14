'use client';
import { useState, useEffect, useTransition } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createClient } from '../../lib/supabase/client';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { ITP, LotWithItp } from '../../types';
import { toast } from 'sonner';
import { assignITPToLot } from '../../app/actions/assign-itp';
import { Loader2 } from 'lucide-react';

const assignItpSchema = z.object({
    itpId: z.string().uuid({ message: "Please select a valid ITP." }),
});

type AssignItpForm = z.infer<typeof assignItpSchema>;

interface AssignItpModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    lot: LotWithItp | null;
}

export function AssignItpModal({ open, onOpenChange, lot }: AssignItpModalProps) {
    const [isPending, startTransition] = useTransition();
    const [itps, setItps] = useState<ITP[]>([]);
    
    const form = useForm<AssignItpForm>({ resolver: zodResolver(assignItpSchema) });

    useEffect(() => {
        async function loadITPs() {
            if (open) {
                const supabase = createClient();
                const { data, error } = await supabase
                    .from('itps')
                    .select(`
                        id,
                        title,
                        description,
                        category,
                        estimated_duration,
                        complexity,
                        required_certifications,
                        organization_id,
                        created_at,
                        updated_at
                    `)
                    .order('title');
                    
                if (error) {
                    console.warn('Failed to load ITPs:', error);
                    toast.error("Failed to load ITP templates.");
                } else {
                    setItps(data || []);
                }
            }
        }
        loadITPs();
    }, [open]);

    const onSubmit = (data: AssignItpForm): void => {
        if (!lot) {
            toast.error("No lot selected.");
            return;
        }

        startTransition(async () => {
            const formData = new FormData();
            formData.append('lotId', lot.id);
            formData.append('projectId', lot.project_id);
            formData.append('itpId', data.itpId);

            try {
                // Calculate estimated completion date (7 days from now)
                const estimatedCompletion = new Date();
                estimatedCompletion.setDate(estimatedCompletion.getDate() + 7);
                
                const assignmentData = {
                    lot_id: lot.id,
                    project_id: lot.project_id,
                    itp_id: data.itpId,
                    assigned_to: 'system-user', // Will be set to actual user ID in server action
                    scheduled_date: new Date().toISOString(),
                    estimated_completion_date: estimatedCompletion.toISOString(),
                    priority: 'medium' as const,
                    organization_id: '00000000-0000-0000-0000-000000000000', // Default org ID
                    notes: `ITP assigned to lot ${lot.lot_number}`
                };
                
                console.log('🚀 Submitting assignment:', assignmentData);
                
                const result = await assignITPToLot(assignmentData);
                
                console.log('📋 Server action result:', result);
                
                if (!result.success) {
                    throw new Error(result.error || 'Assignment failed');
                }
                
                toast.success(`ITP assigned to lot ${lot.lot_number} successfully!`);
                form.reset();
                onOpenChange(false);
            } catch (error) {
                console.error('❌ Assignment error:', error);
                toast.error(error instanceof Error ? error.message : 'Failed to assign ITP.');
            }
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Assign Inspection & Test Plan</DialogTitle>
                    <DialogDescription>
                        Select an ITP from the list to assign it to lot: {lot?.lot_number}.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                    <Controller
                        control={form.control}
                        name="itpId"
                        render={({ field }) => (
                            <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isPending}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select an ITP template..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {itps.map((itp) => (
                                        <SelectItem key={itp.id} value={itp.id}>
                                            {itp.title}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                    />
                     {form.formState.errors.itpId && <p className="text-sm text-destructive">{form.formState.errors.itpId.message}</p>}
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>Cancel</Button>
                        <Button type="submit" disabled={isPending}>
                            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isPending ? 'Assigning...' : 'Assign ITP'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}