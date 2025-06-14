import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { ITP, ITPItem, ITPWithItems, ITPWithStats } from '@/types/database';

const supabase = createClientComponentClient();

// Add temporary debug function to test what columns actually exist
export async function testDatabaseColumns() {
  console.log('🧪 Testing database columns...');
  
  const { data: sample, error } = await supabase
    .from('itps')
    .select('*')
    .limit(1);
    
  if (sample && sample.length > 0) {
    console.log('✅ Available columns:', Object.keys(sample[0]));
  }
  
  if (error) {
    console.error('❌ Database error:', error);
  }
  
  return { sample, error };
}

export async function getITPsByProject(projectId?: string): Promise<ITP[]> {
  console.log('🔍 Fetching ITPs from database...');
  console.log('📋 Project ID:', projectId);
  
  try {
    // First test what columns are available
    await testDatabaseColumns();
    
    // Try with all columns but handle errors gracefully
    const { data, error } = await supabase
      .from('itps')
      .select('id, name, description, project_id, category, estimated_duration, complexity, required_certifications, created_at, updated_at, is_active')
      .order('created_at', { ascending: false });
      
    console.log('📊 Database response:', { data, error });
    
    if (error) {
      console.error('💥 Error fetching ITPs:', error);
      console.error('💡 Trying fallback query with basic columns only...');
      
      // Fallback query with minimal columns
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('itps')
        .select('id, name, description, created_at, updated_at')
        .order('created_at', { ascending: false });
        
      if (fallbackError) {
        console.error('💥 Fallback query also failed:', fallbackError);
        return [];
      }
      
      // Map fallback data to match ITP interface
      const mappedData = (fallbackData || []).map(item => ({
        ...item,
        project_id: projectId || 'default-project',
        category: null,
        estimated_duration: null,
        complexity: null as any,
        required_certifications: null,
        is_active: true
      }));
      
      console.log(`📊 Found ${mappedData.length} ITPs (fallback)`);
      return mappedData;
    }
    
    console.log(`📊 Found ${data?.length || 0} ITPs`);
    return data || [];
  } catch (error) {
    console.error('💥 getITPsByProject error:', error);
    return [];
  }
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
  
  const { data, error } = await supabase
    .from('itp_items')
    .select('*')
    .eq('itp_id', itpId)
    .order('sort_order');

  if (error) {
    console.error('❌ Error loading ITP items:', error);
    throw error;
  }
  
  console.log('📊 Loaded ITP items from database:', data);
  return data || [];
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