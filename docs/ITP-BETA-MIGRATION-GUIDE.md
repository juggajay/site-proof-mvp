# ITP System Beta Migration Guide

## Overview
This guide will help you prepare your ITP system for beta release with a clean, reliable architecture.

## Current Issues
1. **Data Inconsistency**: Tab shows different completion % than internal view
2. **Save Reliability**: Some saves appear successful but data isn't persisted
3. **Mixed Architecture**: System uses both template items and instance items inconsistently

## Migration Steps

### Step 1: Backup Current Data (Optional)
If you want to preserve any existing data:
```sql
-- Create backup tables
CREATE TABLE backup_conformance_records AS SELECT * FROM conformance_records;
CREATE TABLE backup_lot_itp_templates AS SELECT * FROM lot_itp_templates;
```

### Step 2: Clean Existing Data
Run the cleanup script:
```sql
-- Run: scripts/cleanup-itp-data.sql
```

### Step 3: Ensure Database Functions Exist
```sql
-- Run: scripts/FINAL-create-itp-from-template-function.sql
-- Run: scripts/add-itp-id-to-lot-itp-templates.sql
```

### Step 4: Setup Clean System
```sql
-- Run: scripts/setup-clean-itp-system.sql
```

### Step 5: Deploy Code Updates
The latest code includes:
- Fixed item numbering display
- Automatic data refresh after saves
- Consistent progress calculations
- Proper ITP instance creation

## How the New System Works

### ITP Assignment Flow
1. User assigns ITP template to lot
2. System automatically creates ITP instance
3. System copies template items to instance items
4. Conformance records reference instance items

### Progress Tracking
- All progress calculations use database records
- UI state is temporary until saved
- Data refreshes automatically after successful saves

## Testing the Beta System

### 1. Assign a New ITP
- Go to a lot
- Click "Assign ITP Template"
- Select template(s)
- Verify ITP instance is created

### 2. Complete Inspections
- Click PASS/FAIL/N/A on items
- Click "Save All Changes"
- Verify progress updates in both tab and internal view

### 3. Verify Data Persistence
- Reload the page
- Check that all saved inspections are preserved
- Verify progress percentages match

## Future ITP Builder Considerations

Since you're planning an ITP builder, the current architecture supports:
- Custom ITP template creation
- Dynamic item types (PASS_FAIL, NUMERIC, TEXT_INPUT)
- Flexible inspection criteria
- Template versioning (through the version field)

## Monitoring for Beta

Check the system health with:
```sql
-- View all ITP assignments and their status
SELECT * FROM v_lot_itp_status;

-- Check for orphaned conformance records
SELECT COUNT(*) as orphaned_records
FROM conformance_records cr
WHERE NOT EXISTS (
  SELECT 1 FROM itp_items ii 
  WHERE ii.id = cr.itp_item_id
);
```

## Support
If you encounter issues during beta:
1. Check browser console for detailed error messages
2. Run the verification queries above
3. Check that all database migrations have been applied

## Next Steps After Beta
1. Implement ITP Builder UI
2. Add batch operations for efficiency
3. Add audit trail for compliance
4. Implement offline support for field inspections