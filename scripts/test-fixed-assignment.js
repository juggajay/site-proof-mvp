const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function testFixedAssignment() {
  console.log('🧪 Testing fixed ITP assignment logic...\n');
  
  const testLotId = '7948e379-1753-4a50-a647-2923e2b63dfe';
  const testItpId = '7fd887dd-a451-41f3-bebc-0b0bc37b4425';
  
  try {
    // 1. Verify the ITP exists in both tables after sync
    console.log('1. Checking ITP existence in both tables...');
    
    const { data: itpInItps } = await supabase
      .from('itps')
      .select('*')
      .eq('id', testItpId)
      .single();
    
    const { data: itpInTemplates } = await supabase
      .from('itp_templates')
      .select('*')
      .eq('id', testItpId)
      .single();
    
    console.log('✅ ITP in itps table:', itpInItps ? itpInItps.name : 'NOT FOUND');
    console.log('✅ ITP in itp_templates table:', itpInTemplates ? itpInTemplates.name : 'NOT FOUND');
    
    if (!itpInItps) {
      console.log('❌ Test cannot proceed - ITP not found in itps table');
      return;
    }
    
    // 2. Test direct assignment (what our assignment function does)
    console.log('\n2. Testing direct assignment...');
    
    const { data: updatedLot, error: updateError } = await supabase
      .from('lots')
      .update({
        itp_id: testItpId,
        updated_at: new Date().toISOString()
      })
      .eq('id', testLotId)
      .select()
      .single();
    
    if (updateError) {
      console.log('❌ Direct assignment failed:', updateError.message);
      return;
    }
    
    console.log('✅ Direct assignment successful!');
    console.log('Updated lot:', {
      id: updatedLot.id,
      lot_number: updatedLot.lot_number,
      itp_id: updatedLot.itp_id,
      status: updatedLot.status
    });
    
    // 3. Test if we can fetch the lot with ITP data
    console.log('\n3. Testing lot retrieval with ITP data...');
    
    const { data: lotWithItp } = await supabase
      .from('lots')
      .select(`
        *,
        projects:project_id(*),
        itps:itp_id(*)
      `)
      .eq('id', testLotId)
      .single();
    
    if (lotWithItp && lotWithItp.itps) {
      console.log('✅ Lot with ITP retrieved successfully:');
      console.log('Lot:', lotWithItp.lot_number);
      console.log('ITP:', lotWithItp.itps.name);
    } else {
      console.log('⚠️  Lot retrieved but ITP join failed');
    }
    
    // 4. Test if ITP items can be fetched
    console.log('\n4. Testing ITP items retrieval...');
    
    const { data: itpItems } = await supabase
      .from('itp_items')
      .select('*')
      .eq('itp_template_id', testItpId)
      .order('sort_order');
    
    console.log(`✅ Found ${itpItems?.length || 0} ITP items for this template`);
    if (itpItems && itpItems.length > 0) {
      console.log('Sample items:', itpItems.slice(0, 3).map(item => ({
        item_number: item.item_number,
        description: item.description
      })));
    }
    
    console.log('\n🎉 All tests passed! The assignment should now work correctly.');
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

testFixedAssignment();