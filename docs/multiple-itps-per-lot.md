# Multiple ITPs Per Lot Feature

## Overview

This feature enables lots to have multiple ITP (Inspection Test Plan) templates assigned to them, allowing for more comprehensive quality inspections where different aspects of a lot might require different inspection checklists.

## Database Changes

### New Table: `lot_itp_templates`

A junction table has been added to support many-to-many relationships between lots and ITP templates:

```sql
CREATE TABLE lot_itp_templates (
    id SERIAL PRIMARY KEY,
    lot_id INTEGER REFERENCES lots(id) ON DELETE CASCADE,
    itp_template_id INTEGER REFERENCES itp_templates(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    assigned_by INTEGER REFERENCES users(id),
    is_active BOOLEAN DEFAULT TRUE,
    completion_percentage DECIMAL(5,2) DEFAULT 0,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(lot_id, itp_template_id)
);
```

### Migration

To migrate your existing database, run the SQL migration script located at:
`/migrations/001_multiple_itps_per_lot.sql`

This migration will:
1. Create the new junction table
2. Add necessary indexes
3. Migrate existing single ITP assignments to the new table
4. Preserve all existing data

## Code Changes

### Updated Actions

1. **`assignITPToLotAction`**: Now adds entries to the junction table instead of updating the lot directly
2. **`removeITPFromLotAction`**: New action to remove (soft delete) ITP assignments
3. **`getLotByIdAction`**: Fetches all associated ITP templates from the junction table

### Updated Types

The `LotWithDetails` interface now includes:
- `itp_template`: Single template for backward compatibility
- `itp_templates`: Array of all assigned templates
- `lot_itp_templates`: Junction table records

### UI Updates

The `MultiITPInspectionForm` component now:
- Shows multiple ITP templates as tabs when more than one is assigned
- Allows adding additional templates to a lot
- Shows which templates are already assigned in the assignment modal

## Usage

### Assigning Multiple ITPs

1. Navigate to a lot detail page
2. Click "Add Template" button
3. Select an ITP template from the list
4. The template will be added without replacing existing ones

### Viewing Multiple ITPs

When a lot has multiple ITPs assigned:
- They appear as tabs in the inspection form
- Each tab shows the inspection checklist for that specific ITP
- Progress is tracked independently for each ITP

### Backward Compatibility

The system maintains backward compatibility:
- Lots with single ITP assignments continue to work
- The `itp_template_id` field on lots is still supported
- Existing data is automatically migrated to the new structure

## API Changes

No breaking changes to existing APIs. New functionality is additive:
- Existing single ITP assignment continues to work
- New junction table provides enhanced functionality
- UI gracefully handles both single and multiple ITPs