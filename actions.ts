// actions.ts
'use server';
import { revalidatePath } from 'next/cache';
import { createClient } from './lib/supabase/server';
import { z } from 'zod';
import { Lot, ConformanceRecord } from './types';

// --- Create Project Action ---
const projectSchema = z.object({
    name: z.string().min(2), projectNumber: z.string().min(1), location: z.string().min(2),
});
export async function createProjectAction(formData: FormData) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Authentication required');
    const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single();
    if (!profile?.organization_id) throw new Error('Profile/organization not found');
    const validatedData = projectSchema.safeParse({
        name: formData.get('name'), projectNumber: formData.get('projectNumber'), location: formData.get('location'),
    });
    if (!validatedData.success) throw new Error('Invalid form data');
    const { error } = await supabase.from('projects').insert({
        name: validatedData.data.name, project_number: validatedData.data.projectNumber,
        location: validatedData.data.location, organization_id: profile.organization_id,
    });
    if (error) throw new Error(error.message);
    revalidatePath('/dashboard');
    return { success: true };
}

// --- Create Lot Action ---
const lotSchema = z.object({
    lotNumber: z.string().min(1), description: z.string().min(2),
    itpId: z.string().uuid(), projectId: z.string().uuid(),
});
export async function createLotAction(formData: FormData) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Authentication required');
    const validatedData = lotSchema.safeParse({
        lotNumber: formData.get('lotNumber'), description: formData.get('description'),
        itpId: formData.get('itpId'), projectId: formData.get('projectId'),
    });
    if (!validatedData.success) throw new Error('Invalid lot data');
    const { data: lotData, error } = await supabase.from('lots').insert({
        lot_number: validatedData.data.lotNumber, description: validatedData.data.description,
        project_id: validatedData.data.projectId, itp_id: validatedData.data.itpId,
    }).select().single<Lot>();
    if (error) throw new Error(error.message);
    revalidatePath(`/project/${validatedData.data.projectId}`);
    return { success: true, newLot: lotData };
}

// --- Save Inspection Answers Action ---
export async function saveInspectionAnswersAction(answers: Partial<ConformanceRecord>[]) {
    const supabase = createClient();
    
    // Authentication check
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        throw new Error('Authentication required');
    }

    try {
        // Prepare data for upsert with completed_by field
        const answersWithUser = answers.map(answer => ({
            ...answer,
            completed_by: user.id,
            updated_at: new Date().toISOString()
        }));

        // Perform upsert operation on conformance_records table
        const { error } = await supabase
            .from('conformance_records')
            .upsert(answersWithUser, {
                onConflict: 'lot_id,itp_item_id'
            });

        if (error) {
            throw new Error(`Failed to save inspection answers: ${error.message}`);
        }

        // Revalidate the lot page to ensure fresh data
        if (answers.length > 0 && answers[0].lot_id) {
            revalidatePath(`/project/*/lot/${answers[0].lot_id}`);
        }

        return { success: true };
    } catch (error) {
        throw new Error(error instanceof Error ? error.message : 'Failed to save inspection answers');
    }
}