const fs = require('fs')
const path = require('path')

console.log('Updating app to use "itps" table instead of "itp_templates"...')

// Files to update
const filesToUpdate = [
  'lib/actions.ts',
  'app/api/itp-templates/route.ts',
  'app/api/itp-templates/[id]/items/route.ts',
  'types/database.ts'
]

// Read and update each file
filesToUpdate.forEach(file => {
  const filePath = path.join(process.cwd(), file)
  
  try {
    let content = fs.readFileSync(filePath, 'utf8')
    const originalContent = content
    
    // Replace table references
    content = content.replace(/from\('itp_templates'\)/g, "from('itps')")
    content = content.replace(/\.from\('itp_templates'\)/g, ".from('itps')")
    
    // Replace type references (careful not to break imports)
    content = content.replace(/mockITPTemplates/g, 'mockITPs')
    content = content.replace(/ITPTemplate\[\]/g, 'ITP[]')
    content = content.replace(/ITPTemplate\b(?!s)/g, 'ITP')
    
    // Fix column references
    content = content.replace(/itp_template_id/g, 'itp_id')
    
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content)
      console.log(`✅ Updated ${file}`)
    } else {
      console.log(`ℹ️  No changes needed in ${file}`)
    }
  } catch (error) {
    console.error(`❌ Error updating ${file}:`, error.message)
  }
})

console.log('\nNext steps:')
console.log('1. Update type definitions to match the itps table schema')
console.log('2. Test the updated code')
console.log('3. Remove the duplicate itp_templates table if everything works')