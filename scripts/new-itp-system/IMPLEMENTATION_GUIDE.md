# ITP System Implementation Guide

## Overview
This guide walks you through implementing the new ITP system in your Site Proof MVP application.

## Database Migration Steps

### 1. Run Migration Scripts in Order

Execute these scripts in your Supabase SQL editor in sequence:

```sql
-- Step 1: Create core tables
01-create-itp-tables.sql

-- Step 2: Add RLS policies for security
02-add-rls-policies.sql

-- Step 3: Create helper functions
03-create-functions.sql

-- Step 4: Add non-conformance tables
04-add-non-conformance-tables.sql

-- Step 5: Add attachment support
05-add-attachments-support.sql

-- Step 6-8: Seed ITP templates (optional but recommended)
06-seed-itp-templates.sql
07-seed-more-itp-templates.sql
08-seed-final-itp-templates.sql
```

### 2. Update Organization ID

In the seed scripts, replace the placeholder organization ID:
```sql
v_org_id UUID := '550e8400-e29b-41d4-a716-446655440001'; -- Replace with your org ID
```

## UI Component Implementation

### 1. ITP Template List Page

Create `/app/(dashboard)/itps/page.tsx`:

```typescript
import { getITPTemplates } from '@/lib/actions'
import { ITPTemplateList } from '@/components/itp/template-list'

export default async function ITPsPage() {
  const templates = await getITPTemplates()
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">ITP Templates</h1>
      <ITPTemplateList templates={templates} />
    </div>
  )
}
```

### 2. Lot ITP Assignment

Add to lot detail page:

```typescript
import { AssignITPDialog } from '@/components/itp/assign-itp-dialog'

// In your lot detail component
<AssignITPDialog 
  lotId={lot.id} 
  onAssigned={refreshLotData}
/>
```

### 3. ITP Inspection Form

Create dynamic inspection form:

```typescript
import { ITPInspectionForm } from '@/components/itp/inspection-form'

export default function InspectionPage({ params }) {
  const { assignmentId } = params
  
  return (
    <ITPInspectionForm 
      assignmentId={assignmentId}
      onComplete={handleComplete}
    />
  )
}
```

### 4. Mobile Photo Integration

The mobile photo capture component is already created. Use it in inspection forms:

```typescript
import { MobilePhotoCapture } from '@/components/inspection/mobile-photo-capture'

// Inside inspection item
<MobilePhotoCapture
  inspectionRecordId={record.id}
  onPhotosCaptured={handlePhotos}
  maxPhotos={5}
/>
```

## Server Actions

Add these to `/lib/actions.ts`:

```typescript
// Get all ITP templates
export async function getITPTemplates() {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('itp_templates')
    .select(`
      *,
      items:itp_template_items(*)
    `)
    .eq('is_active', true)
    .order('category', { ascending: true })
    .order('name', { ascending: true })
    
  if (error) throw error
  return data
}

// Assign ITP to lot
export async function assignITPToLot(
  lotId: string, 
  templateId: string,
  instanceName?: string
) {
  const supabase = createClient()
  const user = await getUser()
  
  // Use the database function
  const { data, error } = await supabase
    .rpc('create_itp_from_template', {
      p_template_id: templateId,
      p_lot_id: lotId,
      p_name: instanceName,
      p_created_by: user.id
    })
    
  if (error) throw error
  return data
}

// Save inspection result
export async function saveInspectionResult(
  recordId: string,
  result: UpdateInspectionRecordRequest
) {
  const supabase = createClient()
  const user = await getUser()
  
  const { error } = await supabase
    .from('itp_inspection_records')
    .update({
      ...result,
      inspected_by: user.id,
      inspected_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', recordId)
    
  if (error) throw error
  
  // Check if NC needs to be created
  if (result.is_non_conforming && result.status === 'fail') {
    await createNonConformanceFromInspection(recordId)
  }
}

// Upload attachment
export async function uploadInspectionAttachment(
  recordId: string,
  file: File,
  metadata: Partial<UploadAttachmentRequest>
) {
  const supabase = createClient()
  const user = await getUser()
  
  // Upload to storage
  const filename = `${recordId}/${Date.now()}-${file.name}`
  const { error: uploadError } = await supabase
    .storage
    .from('itp-attachments')
    .upload(filename, file)
    
  if (uploadError) throw uploadError
  
  // Create attachment record
  const { error } = await supabase
    .from('itp_inspection_attachments')
    .insert({
      inspection_record_id: recordId,
      filename,
      original_filename: file.name,
      mime_type: file.type,
      file_size: file.size,
      attachment_type: metadata.attachment_type || 'photo',
      description: metadata.description,
      latitude: metadata.location?.latitude,
      longitude: metadata.location?.longitude,
      accuracy: metadata.location?.accuracy,
      uploaded_by: user.id
    })
    
  if (error) throw error
}
```

## Progress Tracking

Use the database view for progress:

```typescript
// Get ITP assignment with progress
export async function getITPAssignmentWithProgress(assignmentId: string) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('vw_itp_assignment_progress')
    .select('*')
    .eq('id', assignmentId)
    .single()
    
  if (error) throw error
  return data
}
```

## Non-Conformance Integration

Automatically create NCs from failed inspections:

```typescript
async function createNonConformanceFromInspection(recordId: string) {
  const supabase = createClient()
  
  // Get inspection details
  const { data: record } = await supabase
    .from('itp_inspection_records')
    .select(`
      *,
      assignment:lot_itp_assignments!inner(
        lot_id,
        template:itp_templates(name)
      ),
      item:itp_template_items(description)
    `)
    .eq('id', recordId)
    .single()
    
  // Create NC
  const { error } = await supabase
    .from('non_conformances')
    .insert({
      inspection_record_id: recordId,
      lot_id: record.assignment.lot_id,
      title: `Failed: ${record.item.description}`,
      description: record.comments || 'Inspection failed',
      severity: 'major',
      raised_by: record.inspected_by
    })
    
  if (error) throw error
}
```

## Mobile Considerations

### 1. Offline Support
- Cache templates locally using localStorage
- Queue inspection results for sync
- Store photos locally until upload

### 2. Touch-Optimized UI
- Large buttons (min 44x44px)
- Swipe gestures for pass/fail
- Bottom sheet for photo capture

### 3. Performance
- Lazy load inspection items
- Compress photos before upload
- Progressive form submission

## Testing Checklist

- [ ] Templates load correctly by category
- [ ] Can assign multiple ITPs to a lot
- [ ] Inspection forms show correct items
- [ ] Pass/fail/NA selections work
- [ ] Numeric validations enforce min/max
- [ ] Photos capture with GPS data
- [ ] Progress calculations are accurate
- [ ] Non-conformances auto-create on fail
- [ ] Hold points prevent progression
- [ ] Witness points require approval

## Common Issues & Solutions

### Issue: Templates not showing
**Solution**: Check organization_id matches your user's org

### Issue: Can't save inspections
**Solution**: Ensure RLS policies are applied and user has correct role

### Issue: Photos not uploading
**Solution**: Create storage bucket 'itp-attachments' with public access

### Issue: Progress showing 0%
**Solution**: Check that inspection_records are being created properly

## Next Steps

1. **ITP Builder**: Create UI for custom template creation
2. **Reports**: Generate PDF inspection reports
3. **Analytics**: Dashboard showing ITP completion rates
4. **Integration**: Connect to existing quality module
5. **Mobile App**: Native app for offline inspections

## Support

For implementation help:
- Check the architecture diagram in ARCHITECTURE.md
- Review TypeScript types in /types/new-itp.ts
- Test with seed data for real-world scenarios