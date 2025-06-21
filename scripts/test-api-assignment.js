// Test the API endpoint directly to simulate the real-world usage
const axios = require('axios');

async function testAPIAssignment() {
  console.log('🧪 Testing API assignment endpoint...\n');
  
  const testLotId = '7948e379-1753-4a50-a647-2923e2b63dfe';
  const testItpId = '7fd887dd-a451-41f3-bebc-0b0bc37b4425';
  
  try {
    // Reset the assignment first using direct database call
    const { createClient } = require('@supabase/supabase-js');
    require('dotenv').config({ path: '.env.local' });
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    
    console.log('1. Resetting lot assignment...');
    await supabase
      .from('lots')
      .update({ itp_id: null })
      .eq('id', testLotId);
    
    // Test the API endpoint
    console.log('2. Testing API assignment...');
    
    const response = await axios.post('http://localhost:3000/api/lots/assign-itp', {
      lotId: testLotId,
      itpTemplateId: testItpId
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('API Response status:', response.status);
    console.log('API Response data:', response.data);
    
    if (response.data.success) {
      console.log('✅ API assignment successful!');
      
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
      
      console.log('\n🎉 The foreign key constraint error has been resolved!');
    } else {
      console.log('❌ API assignment failed:', response.data.error);
    }
    
  } catch (error) {
    if (error.response) {
      console.log('❌ API Error:', error.response.status, error.response.data);
    } else {
      console.log('❌ Network/Other Error:', error.message);
      console.log('Note: Make sure the development server is running (npm run dev)');
    }
  }
}

// Only run if axios is available
try {
  require('axios');
  testAPIAssignment();
} catch (e) {
  console.log('⚠️  axios not available, skipping API test');
  console.log('To test the API endpoint, run: npm install axios && node scripts/test-api-assignment.js');
}