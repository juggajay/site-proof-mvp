import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Lot, Project, ITP, Profile } from '@/types/database';

const supabase = createClientComponentClient();

export async function getLots(projectId?: string): Promise<Lot[]> {
  let query = supabase
    .from('lots')
    .select(`
      *,
      project:projects(*),
      itp:itps(
        *,
        itp_items(*)
      ),
      assigned_inspector:profiles(*)
    `);

  if (projectId) {
    query = query.eq('project_id', projectId);
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getLotById(id: string): Promise<Lot | null> {
  const { data, error } = await supabase
    .from('lots')
    .select(`
      *,
      project:projects(*),
      itp:itps(
        *,
        itp_items(*)
      ),
      assigned_inspector:profiles(*)
    `)
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

export async function createLot(lot: Omit<Lot, 'id' | 'created_at' | 'updated_at' | 'inspection_status'>): Promise<Lot> {
  const lotData = {
    ...lot,
    inspection_status: 'pending' as const
  };

  const { data, error } = await supabase
    .from('lots')
    .insert(lotData)
    .select(`
      *,
      project:projects(*),
      itp:itps(
        *,
        itp_items(*)
      ),
      assigned_inspector:profiles(*)
    `)
    .single();

  if (error) throw error;
  return data;
}

export async function updateLot(id: string, updates: Partial<Lot>): Promise<Lot> {
  const { data, error } = await supabase
    .from('lots')
    .update(updates)
    .eq('id', id)
    .select(`
      *,
      project:projects(*),
      itp:itps(
        *,
        itp_items(*)
      ),
      assigned_inspector:profiles(*)
    `)
    .single();

  if (error) throw error;
  return data;
}

export async function updateLotITP(lotId: string, itpId: string, inspectorId?: string): Promise<void> {
  const updates: any = {
    itp_id: itpId,
    inspection_status: 'pending',
    updated_at: new Date().toISOString()
  };

  if (inspectorId) {
    updates.assigned_inspector_id = inspectorId;
  }

  const { error } = await supabase
    .from('lots')
    .update(updates)
    .eq('id', lotId);

  if (error) throw error;
}

export async function updateLotInspectionStatus(
  lotId: string, 
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'approved',
  completedDate?: string
): Promise<void> {
  const updates: any = {
    inspection_status: status,
    updated_at: new Date().toISOString()
  };

  if (status === 'completed' || status === 'approved') {
    updates.inspection_completed_date = completedDate || new Date().toISOString();
  }

  const { error } = await supabase
    .from('lots')
    .update(updates)
    .eq('id', lotId);

  if (error) throw error;
}

export async function assignInspectorToLot(lotId: string, inspectorId: string, dueDate?: string): Promise<void> {
  const updates: any = {
    assigned_inspector_id: inspectorId,
    updated_at: new Date().toISOString()
  };

  if (dueDate) {
    updates.inspection_due_date = dueDate;
  }

  const { error } = await supabase
    .from('lots')
    .update(updates)
    .eq('id', lotId);

  if (error) throw error;
}

export async function deleteLot(id: string): Promise<void> {
  const { error } = await supabase
    .from('lots')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function getLotsByInspector(inspectorId: string): Promise<Lot[]> {
  const { data, error } = await supabase
    .from('lots')
    .select(`
      *,
      project:projects(*),
      itp:itps(
        *,
        itp_items(*)
      ),
      assigned_inspector:profiles(*)
    `)
    .eq('assigned_inspector_id', inspectorId)
    .order('inspection_due_date', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function getLotsByStatus(status: string, projectId?: string): Promise<Lot[]> {
  let query = supabase
    .from('lots')
    .select(`
      *,
      project:projects(*),
      itp:itps(
        *,
        itp_items(*)
      ),
      assigned_inspector:profiles(*)
    `)
    .eq('inspection_status', status);

  if (projectId) {
    query = query.eq('project_id', projectId);
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}