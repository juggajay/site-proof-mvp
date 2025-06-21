const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function syncMissingITPs() {
  console.log('🔄 Syncing missing ITPs from itp_templates to itps...');
  
  try {
    // Get all ITPs from both tables
    const { data: itps } = await supabase.from('itps').select('id, name');
    const { data: templates } = await supabase.from('itp_templates').select('*');
    
    // Find templates that don't exist in itps
    const missingInItps = templates.filter(t => !itps.some(itp => itp.id === t.id));
    
    console.log(`Found ${missingInItps.length} ITP templates missing from itps table:`);
    missingInItps.forEach(item => console.log('- ', item.id, item.name));
    
    if (missingInItps.length === 0) {
      console.log('✅ No sync needed, all templates already exist in itps table');
      return;
    }
    
    // Map template data to itps table structure
    const itpsToInsert = missingInItps.map(template => ({
      id: template.id,
      name: template.name,
      description: template.description,
      category: template.category,
      organization_id: template.organization_id,
      created_at: template.created_at,
      updated_at: template.updated_at,
      // Set reasonable defaults for fields that don't exist in templates
      estimated_duration: null,
      complexity: 'moderate',
      required_certifications: null
    }));
    
    console.log('\\n🚀 Inserting missing ITPs into itps table...');
    
    // Insert the missing ITPs
    const { data: inserted, error } = await supabase
      .from('itps')
      .insert(itpsToInsert)
      .select();
    
    if (error) {
      console.error('❌ Error inserting ITPs:', error);
      return;
    }
    
    console.log(`✅ Successfully inserted ${inserted.length} ITPs into itps table:`);
    inserted.forEach(item => console.log('✓ ', item.id, item.name));
    
    // Verify the sync worked
    console.log('\\n🔍 Verifying sync...');
    const { data: updatedItps } = await supabase.from('itps').select('id, name');
    const stillMissing = templates.filter(t => !updatedItps.some(itp => itp.id === t.id));
    
    if (stillMissing.length === 0) {
      console.log('✅ Sync verification successful - all templates now exist in itps table');
    } else {
      console.log(`❌ Sync incomplete - ${stillMissing.length} templates still missing`);
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

syncMissingITPs();