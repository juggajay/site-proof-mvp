# ITP System Migration Order

## ⚠️ IMPORTANT: Run these scripts in exact order!

### Step 0: Cleanup Old System (Optional but Recommended)
```sql
00-cleanup-old-itp-system.sql
```
This removes all old ITP tables to avoid confusion.

### Step 1: Create Core Tables
```sql
01-create-itp-tables.sql
```
Creates the new ITP system structure:
- itp_templates (replaces old itp_templates)
- itp_template_items (replaces old itp_template_items)
- lot_itp_assignments (replaces lot_itp_templates)
- itp_inspection_records (replaces conformance_records)

### Step 2: Add Security Policies
```sql
02-add-rls-policies.sql
```
Adds Row Level Security for data protection.

### Step 3: Create Helper Functions
```sql
03-create-functions.sql
```
Creates utility functions and the progress view.

### Step 4: Add Non-Conformance System
```sql
04-add-non-conformance-tables.sql
```
Adds quality management tables:
- non_conformances
- nc_attachments

### Step 5: Add Attachment Support
```sql
05-add-attachments-support.sql
```
Adds photo/file upload capabilities:
- itp_inspection_attachments
- Storage bucket creation

### Step 6-8: Seed Data (Recommended)
```sql
06-seed-itp-templates.sql
07-seed-more-itp-templates.sql
08-seed-final-itp-templates.sql
```
Adds 27 Australian standard ITP templates.

## Before Running Scripts

1. **Backup your database** if you have any important data
2. **Update the organization ID** in seed scripts:
   ```sql
   v_org_id UUID := '550e8400-e29b-41d4-a716-446655440001'; -- Replace with your org ID
   ```

## After Running Scripts

1. Create storage bucket in Supabase:
   - Go to Storage section
   - Create bucket named `itp-attachments`
   - Set to public access

2. Update your application code:
   - Replace old type imports with new ones from `/types/new-itp.ts`
   - Update server actions to use new table names
   - Update UI components to use new structure

## Verification

Run this query to verify installation:
```sql
SELECT 
    table_name,
    COUNT(*) as column_count
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name IN (
    'itp_templates',
    'itp_template_items',
    'lot_itp_assignments',
    'itp_inspection_records',
    'non_conformances',
    'itp_inspection_attachments'
)
GROUP BY table_name
ORDER BY table_name;
```

You should see 6 tables with appropriate column counts.