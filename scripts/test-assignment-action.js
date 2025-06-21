// Mock the authentication requirement
const mockUser = { id: 1 };
const requireAuth = () => Promise.resolve(mockUser);

// Mock environment variables
process.env.NODE_ENV = 'development';
process.env.USE_SUPABASE = 'true';

// Import the action (we'll simulate it since we can't easily import from actions.ts)
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

// Simulate the fixed assignITPToLotAction logic
async function simulateAssignITPToLotAction(lotId, itpTemplateId) {
  try {
    console.log('assignITPToLotAction: Assigning template', itpTemplateId, 'to lot', lotId);
    
    // Check if lot exists
    const { data: lot, error: lotError } = await supabase
      .from('lots')
      .select('*')
      .eq('id', lotId)
      .single();
    
    if (lotError || !lot) {
      console.log('Lot not found:', lotError);
      return { success: false, error: 'Lot not found' };
    }
    
    // Check if ITP exists in the itps table (which the foreign key constraint references)
    const { data: itp, error: itpError } = await supabase
      .from('itps')
      .select('*')
      .eq('id', itpTemplateId)
      .single();
    
    if (itpError || !itp) {
      console.log('ITP not found in itps table:', itpError);
      // Try to check itp_templates as fallback and provide better error message
      const { data: templateItp } = await supabase
        .from('itp_templates')
        .select('*')
        .eq('id', itpTemplateId)
        .single();
      
      if (templateItp) {
        return { success: false, error: 'ITP template exists but is not synced to itps table. Please sync data first.' };
      }
      
      return { success: false, error: `ITP template not found: ${itpTemplateId}` };
    }
    
    console.log('Found ITP:', { id: itp.id, name: itp.name });
    
    // Check if this ITP is already assigned via junction table
    const { data: existingAssignment } = await supabase
      .from('lot_itp_templates')
      .select('*')
      .eq('lot_id', lotId)
      .eq('itp_template_id', itpTemplateId)
      .single();
    
    if (existingAssignment) {
      // Reactivate if it was deactivated
      if (!existingAssignment.is_active) {
        await supabase
          .from('lot_itp_templates')
          .update({
            is_active: true,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingAssignment.id);
      }
      return { success: true, data: lot, message: 'ITP template already assigned' };
    }
    
    // Try to add entry to junction table, fallback to direct lot assignment
    let newAssignment = null;
    let assignError = null;
    
    try {
      console.log('Attempting junction table assignment...');
      const result = await supabase
        .from('lot_itp_templates')
        .insert({
          lot_id: lotId,
          itp_template_id: itpTemplateId,
          assigned_by: mockUser.id,
          is_active: true,
          assigned_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
      
      newAssignment = result.data;
      assignError = result.error;
      
      if (assignError) {
        console.log('Junction table assignment error:', assignError);
      } else {
        console.log('Junction table assignment successful');
      }
    } catch (e) {
      console.log('Junction table assignment exception:', e);
      assignError = e;
    }
    
    // If junction table fails, try direct lot assignment (legacy support)
    if (assignError) {
      console.log('Falling back to direct lot assignment');
      
      // First verify the ITP exists in itps table to avoid foreign key constraint errors
      const { data: itpExists, error: itpCheckError } = await supabase
        .from('itps')
        .select('id')
        .eq('id', itpTemplateId)
        .single();
      
      if (itpCheckError || !itpExists) {
        console.error('ITP does not exist in itps table for direct assignment:', itpTemplateId);
        return { success: false, error: `ITP not found in itps table: ${itpTemplateId}` };
      }
      
      const { data: updatedLot, error: lotUpdateError } = await supabase
        .from('lots')
        .update({
          itp_id: itpTemplateId,  // Use correct field name for actual database schema
          updated_at: new Date().toISOString()
        })
        .eq('id', lotId)
        .select()
        .single();
      
      if (lotUpdateError) {
        console.error('Both junction table and direct assignment failed:', lotUpdateError);
        return { success: false, error: `Failed to assign ITP: ${lotUpdateError.message}` };
      }
      
      newAssignment = updatedLot;
    }
    
    // Update lot status if needed
    if (lot.status === 'pending') {
      await supabase
        .from('lots')
        .update({
          status: 'IN_PROGRESS',
          updated_at: new Date().toISOString()
        })
        .eq('id', lotId);
    }
    
    console.log('✅ ITP assigned successfully:', newAssignment);
    return { success: true, data: lot, message: 'ITP assigned successfully' };
    
  } catch (error) {
    console.error('Assignment error:', error);
    return { success: false, error: 'Failed to assign ITP' };
  }
}

async function testAssignmentAction() {
  console.log('🧪 Testing fixed assignITPToLotAction...\n');
  
  const testLotId = '7948e379-1753-4a50-a647-2923e2b63dfe';
  const testItpId = '7fd887dd-a451-41f3-bebc-0b0bc37b4425';
  
  // First, reset the lot to have no ITP assigned
  console.log('1. Resetting lot ITP assignment...');
  await supabase
    .from('lots')
    .update({ itp_id: null })
    .eq('id', testLotId);
  
  // Remove any junction table assignments
  await supabase
    .from('lot_itp_templates')
    .delete()
    .eq('lot_id', testLotId)
    .eq('itp_template_id', testItpId);
  
  console.log('✅ Reset complete\n');
  
  // Now test the assignment
  console.log('2. Testing ITP assignment...');
  const result = await simulateAssignITPToLotAction(testLotId, testItpId);
  
  console.log('\nAssignment result:', result);
  
  if (result.success) {
    console.log('✅ Assignment successful!');
    
    // Verify the assignment
    const { data: verifyLot } = await supabase
      .from('lots')
      .select('*')
      .eq('id', testLotId)
      .single();
    
    console.log('Verified lot state:', {
      id: verifyLot.id,
      lot_number: verifyLot.lot_number,
      itp_id: verifyLot.itp_id,
      status: verifyLot.status
    });
    
  } else {
    console.log('❌ Assignment failed:', result.error);
  }
}

testAssignmentAction().catch(console.error);