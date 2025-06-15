// Temporary test script to debug ITP fetching
import { createClient } from '@supabase/auth-helpers-nextjs';

const supabase = createClient();

async function testITPFetch() {
  console.log('🧪 TESTING: Direct ITP database query...');
  
  try {
    // Test 1: Get all ITPs without any filters
    console.log('\n=== TEST 1: All ITPs ===');
    const { data: allItps, error: allError } = await supabase
      .from('itps')
      .select('*')
      .limit(20);
      
    console.log('📊 ALL ITPs in database:', allItps);
    console.log('📊 Total ITPs found:', allItps?.length || 0);
    console.log('❌ All ITPs query error:', allError);
    
    if (allItps && allItps.length > 0) {
      console.log('✅ Database contains', allItps.length, 'ITPs total');
      console.log('📋 Sample ITP structure:', allItps[0]);
      console.log('📋 Available columns:', Object.keys(allItps[0] || {}));
    }
    
    // Test 2: Get active ITPs only
    console.log('\n=== TEST 2: Active ITPs ===');
    const { data: activeItps, error: activeError } = await supabase
      .from('itps')
      .select('*')
      .eq('is_active', true)
      .limit(10);
      
    console.log('📊 Active ITPs:', activeItps);
    console.log('📊 Active ITPs count:', activeItps?.length || 0);
    console.log('❌ Active ITPs error:', activeError);
    
  } catch (error) {
    console.error('💥 Test error:', error);
  }
}

// Run the test
testITPFetch();