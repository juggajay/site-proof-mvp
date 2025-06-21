// Example: How to work with multiple ITPs per lot

import { assignITPToLotAction, removeITPFromLotAction, getLotByIdAction } from '@/lib/actions'

// Example 1: Assign multiple ITPs to a lot
async function assignMultipleITPs(lotId: string) {
  // Assign first ITP template
  const result1 = await assignITPToLotAction(lotId, 'itp-template-1')
  if (result1.success) {
    console.log('First ITP assigned successfully')
  }
  
  // Assign second ITP template - this will ADD to the lot, not replace
  const result2 = await assignITPToLotAction(lotId, 'itp-template-2')
  if (result2.success) {
    console.log('Second ITP assigned successfully')
  }
  
  // Assign third ITP template
  const result3 = await assignITPToLotAction(lotId, 'itp-template-3')
  if (result3.success) {
    console.log('Third ITP assigned successfully')
  }
}

// Example 2: Get lot with all assigned ITPs
async function getLotWithAllITPs(lotId: string) {
  const result = await getLotByIdAction(lotId)
  
  if (result.success && result.data) {
    const lot = result.data
    
    // Access multiple templates (new way)
    if (lot.itp_templates && lot.itp_templates.length > 0) {
      console.log(`Lot has ${lot.itp_templates.length} ITP templates assigned:`)
      lot.itp_templates.forEach(template => {
        console.log(`- ${template.name} (${template.itp_items.length} items)`)
      })
    }
    
    // Access single template (backward compatibility)
    if (lot.itp_template) {
      console.log(`Primary template: ${lot.itp_template.name}`)
    }
  }
}

// Example 3: Remove an ITP from a lot
async function removeITP(lotId: string, itpTemplateId: string) {
  const result = await removeITPFromLotAction(lotId, itpTemplateId)
  
  if (result.success) {
    console.log('ITP removed successfully')
  }
}

// Example 4: Working with conformance records across multiple ITPs
async function getConformanceByITP(lotId: string) {
  const result = await getLotByIdAction(lotId)
  
  if (result.success && result.data) {
    const lot = result.data
    
    // Group conformance records by ITP template
    const conformanceByTemplate = new Map()
    
    lot.itp_templates?.forEach(template => {
      const templateRecords = lot.conformance_records.filter(record =>
        template.itp_items.some(item => item.id === record.itp_item_id)
      )
      conformanceByTemplate.set(template.id, {
        template: template.name,
        total: template.itp_items.length,
        completed: templateRecords.length,
        passed: templateRecords.filter(r => r.result_pass_fail === 'PASS').length,
        failed: templateRecords.filter(r => r.result_pass_fail === 'FAIL').length
      })
    })
    
    // Display progress for each ITP
    conformanceByTemplate.forEach((stats, templateId) => {
      const percentage = Math.round((stats.completed / stats.total) * 100)
      console.log(`${stats.template}: ${percentage}% complete (${stats.passed} passed, ${stats.failed} failed)`)
    })
  }
}