const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function checkRelationship() {
  const { data: itps } = await supabase.from('itps').select('id, name');
  const { data: templates } = await supabase.from('itp_templates').select('id, name');
  
  console.log('Common IDs between itps and itp_templates:');
  const commonIds = itps.filter(itp => templates.some(t => t.id === itp.id));
  commonIds.forEach(item => console.log('- ', item.id, item.name));
  
  console.log('\nITPs only in itps table:');
  itps.filter(itp => !templates.some(t => t.id === itp.id))
      .forEach(item => console.log('- ', item.id, item.name));
  
  console.log('\nITPs only in itp_templates table:');
  templates.filter(t => !itps.some(itp => itp.id === t.id))
           .forEach(item => console.log('- ', item.id, item.name));
}

checkRelationship().catch(console.error);