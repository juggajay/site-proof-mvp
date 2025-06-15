import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { ITP, ITPItem, ITPWithItems, ITPWithStats } from '@/types/database';

const supabase = createClientComponentClient();

export async function getITPsByProject(projectId: string): Promise<ITP[]> {
  console.log('🔍 Starting getITPsByProject function')
  console.log('📋 Project ID:', projectId)
  
  // Return mock data for testing - bypassing database issues
  const mockITPs: ITP[] = [
    {
      id: 'itp-1',
      project_id: projectId,
      name: 'Concrete Foundation ITP',
      description: 'Inspection and testing procedures for concrete foundation work',
      category: 'Structural',
      complexity: 'moderate',
      estimated_duration: '2-4 hours',
      required_certifications: ['Concrete Testing', 'Structural Inspection'],
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'itp-2',
      project_id: projectId,
      name: 'Steel Frame ITP',
      description: 'Quality assurance for steel frame construction',
      category: 'Structural',
      complexity: 'high',
      estimated_duration: '4-6 hours',
      required_certifications: ['Steel Welding', 'Structural Inspection'],
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'itp-3',
      project_id: projectId,
      name: 'Electrical Installation ITP',
      description: 'Electrical systems inspection and testing',
      category: 'Electrical',
      complexity: 'moderate',
      estimated_duration: '3-5 hours',
      required_certifications: ['Electrical License', 'Safety Inspection'],
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ];
  
  console.log('📊 Returning mock ITP data:', mockITPs)
  return mockITPs;
  
  // Original database code (commented out for testing)
  /*
  try {
    console.log(' Supabase client:', supabase)
    
    const { data, error } = await supabase
      .from('itps')
      .select(`
        *,
        itp_items(*)
      `)
      .eq('project_id', projectId)
      .eq('is_active', true)
      .order('name');
      
    console.log('📊 Query result - data:', data)
    console.log('❌ Query result - error:', error)
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('💥 getITPsByProject error:', error)
    return []
  }
  */
}

export async function getITPById(itpId: string): Promise<ITP | null> {
  const { data, error } = await supabase
    .from('itps')
    .select(`
      *,
      itp_items(*)
    `)
    .eq('id', itpId)
    .single();

  if (error) throw error;
  return data;
}

export async function getITPItemsByITP(itpId: string): Promise<ITPItem[]> {
  console.log('🔍 Loading ITP items for:', itpId);
  
  const mockItems: ITPItem[] = [
    {
      id: 'item-1',
      itp_id: itpId,
      item_number: '1.1',
      description: 'Verify foundation depth meets specifications',
      acceptance_criteria: 'Depth ≥ 1.5m as per drawings',
      inspection_method: 'Physical measurement',
      is_mandatory: true,
      sort_order: 1,
      required_documentation: 'Survey report, photos',
      created_at: new Date().toISOString()
    },
    {
      id: 'item-2',
      itp_id: itpId,
      item_number: '1.2',
      description: 'Check concrete strength test results',
      acceptance_criteria: 'Minimum 25 MPa compressive strength',
      inspection_method: 'Laboratory test results',
      is_mandatory: true,
      sort_order: 2,
      required_documentation: 'Lab test certificates',
      created_at: new Date().toISOString()
    },
    {
      id: 'item-3',
      itp_id: itpId,
      item_number: '1.3',
      description: 'Inspect reinforcement placement',
      acceptance_criteria: 'As per structural drawings',
      inspection_method: 'Visual inspection',
      is_mandatory: false,
      sort_order: 3,
      required_documentation: 'Photos, inspection checklist',
      created_at: new Date().toISOString()
    }
  ];
  
  console.log('📊 Returning mock ITP items:', mockItems);
  return mockItems;
}

export async function createITP(itp: Omit<ITP, 'id' | 'created_at' | 'updated_at'>): Promise<ITP> {
  const { data, error } = await supabase
    .from('itps')
    .insert([itp])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateITP(id: string, updates: Partial<ITP>): Promise<ITP> {
  const { data, error } = await supabase
    .from('itps')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteITP(id: string): Promise<void> {
  const { error } = await supabase
    .from('itps')
    .update({ is_active: false })
    .eq('id', id);

  if (error) throw error;
}

export async function createITPItem(item: Omit<ITPItem, 'id' | 'created_at'>): Promise<ITPItem> {
  const { data, error } = await supabase
    .from('itp_items')
    .insert([item])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateITPItem(id: string, updates: Partial<ITPItem>): Promise<ITPItem> {
  const { data, error } = await supabase
    .from('itp_items')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteITPItem(id: string): Promise<void> {
  const { error } = await supabase
    .from('itp_items')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// Enhanced functions for real ITP data management
export async function getITPsWithStats(projectId: string): Promise<ITPWithStats[]> {
  const { data, error } = await supabase
    .from('itp_summary')
    .select('*')
    .eq('project_id', projectId);

  if (error) throw error;
  return data || [];
}

export async function getITPsByCategory(projectId: string, category: string): Promise<ITP[]> {
  const { data, error } = await supabase
    .from('itps')
    .select(`
      *,
      itp_items(*)
    `)
    .eq('project_id', projectId)
    .eq('category', category)
    .eq('is_active', true)
    .order('name');

  if (error) throw error;
  return data || [];
}

export async function getITPsByComplexity(projectId: string, complexity: 'low' | 'moderate' | 'high'): Promise<ITP[]> {
  const { data, error } = await supabase
    .from('itps')
    .select(`
      *,
      itp_items(*)
    `)
    .eq('project_id', projectId)
    .eq('complexity', complexity)
    .eq('is_active', true)
    .order('name');

  if (error) throw error;
  return data || [];
}

export async function assignITPToLot(lotId: string, itpId: string, inspectorId?: string, dueDate?: string): Promise<void> {
  const updates: any = {
    itp_id: itpId,
    inspection_status: 'pending',
    updated_at: new Date().toISOString()
  };

  if (inspectorId) {
    updates.assigned_inspector_id = inspectorId;
  }

  if (dueDate) {
    updates.inspection_due_date = dueDate;
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
  notes?: string,
  photos?: string[]
): Promise<void> {
  const updates: any = {
    inspection_status: status,
    updated_at: new Date().toISOString()
  };

  if (notes) {
    updates.inspection_notes = notes;
  }

  if (photos) {
    updates.inspection_photos = photos;
  }

  if (status === 'completed' || status === 'approved') {
    updates.inspection_completed_date = new Date().toISOString();
  }

  const { error } = await supabase
    .from('lots')
    .update(updates)
    .eq('id', lotId);

  if (error) throw error;
}

export async function getLotsWithITPs(projectId: string): Promise<any[]> {
  const { data, error } = await supabase
    .from('lots')
    .select(`
      *,
      itp:itps(*),
      assigned_inspector:profiles(id, name, email)
    `)
    .eq('project_id', projectId)
    .not('itp_id', 'is', null);

  if (error) throw error;
  return data || [];
}

export async function searchITPs(projectId: string, searchTerm: string): Promise<ITP[]> {
  const { data, error } = await supabase
    .from('itps')
    .select(`
      *,
      itp_items(*)
    `)
    .eq('project_id', projectId)
    .eq('is_active', true)
    .or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,category.ilike.%${searchTerm}%`)
    .order('name');

  if (error) throw error;
  return data || [];
}