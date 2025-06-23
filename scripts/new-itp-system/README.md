# New ITP System Setup Guide

## Overview
This is a complete redesign of the ITP system with the following improvements:
- Clean separation between templates and instances
- Support for multiple inspection types (boolean, numeric, text, multi-choice, signature)
- Built-in non-conformance integration
- Support for witness and hold points
- Automatic progress tracking
- Ready for custom ITP builder

## Database Setup

### Step 1: Run Migration Scripts
Execute these scripts in order:

```sql
-- 1. Create main ITP tables
\i scripts/new-itp-system/01-create-itp-tables.sql

-- 2. Create non-conformance table
\i scripts/new-itp-system/02-create-non-conformance-table.sql

-- 3. Create RLS policies
\i scripts/new-itp-system/03-create-rls-policies.sql

-- 4. Create helper functions
\i scripts/new-itp-system/04-create-helper-functions.sql
```

### Step 2: Create Sample Templates (Optional)
```sql
-- Replace with your organization ID
SELECT create_sample_itp_templates('550e8400-e29b-41d4-a716-446655440001');
```

## Key Concepts

### 1. ITP Templates
- **Purpose**: Reusable inspection checklists
- **Code**: Unique identifier like "CONC-001"
- **Category**: Groups templates (Concrete, Asphalt, Steel, etc.)
- **Version**: Supports template versioning
- **is_custom**: Marks templates created via ITP builder

### 2. Template Items
- **inspection_type**: Determines UI control
  - `boolean`: Pass/Fail buttons
  - `numeric`: Number input with min/max validation
  - `text`: Text area for notes
  - `multi_choice`: Dropdown selection
  - `signature`: Digital signature capture
- **Validation**: Min/max values, units, choices
- **Control Points**:
  - `is_witness_point`: Requires supervisor review
  - `is_hold_point`: Work stops until approved

### 3. Lot ITP Assignments
- Links templates to lots
- Tracks inspection progress
- Supports multiple ITPs per lot
- Automatic sequencing

### 4. Inspection Records
- One record per template item
- Stores actual inspection results
- Links to non-conformances
- Tracks who inspected and when

### 5. Non-Conformances
- Auto-generated NC numbers (NC-2024-001)
- Severity levels: critical, major, minor, observation
- Full lifecycle tracking
- Linked to inspection records

## Usage Examples

### Assign ITP to Lot
```sql
SELECT assign_itp_to_lot(
    p_lot_id := '2924e1e1-9d03-4b34-8e25-24cbb4d51836',
    p_template_id := 'template-uuid-here',
    p_instance_name := 'Concrete Pour - Ground Floor',
    p_assigned_to := 'inspector-user-id'
);
```

### Get Lot ITP Summary
```sql
SELECT * FROM get_lot_itp_summary('2924e1e1-9d03-4b34-8e25-24cbb4d51836');
```

### Create Non-Conformance from Failed Inspection
```sql
SELECT create_nc_from_inspection(
    p_inspection_record_id := 'inspection-record-uuid',
    p_title := 'Concrete slump test failed',
    p_description := 'Slump measured at 130mm, exceeds maximum of 120mm',
    p_severity := 'major'
);
```

## Frontend Integration

### Key Components Needed

1. **ITP Assignment Modal**
   - Multi-select templates
   - Set instance names
   - Assign inspectors

2. **Inspection Form**
   - Dynamic controls based on inspection_type
   - Validation based on min/max values
   - Witness/hold point indicators
   - Auto-save functionality

3. **Progress Dashboard**
   - Visual progress bars
   - Status indicators
   - NC count badges

4. **Non-Conformance List**
   - Filterable by status, severity
   - Quick actions (assign, close)
   - Due date tracking

## Benefits Over Old System

1. **Clean Architecture**
   - No mixing of templates and instances
   - Clear data relationships
   - Efficient queries

2. **Flexibility**
   - Multiple inspection types
   - Custom validation rules
   - Extensible for ITP builder

3. **Quality Control**
   - Automatic NC creation
   - Witness/hold points
   - Full audit trail

4. **Performance**
   - Proper indexes
   - Efficient progress calculations
   - Minimal data duplication

## Next Steps

1. Update frontend components to use new types
2. Create API endpoints for new functions
3. Build ITP assignment UI
4. Implement dynamic inspection form
5. Add non-conformance management UI