# ITP Schema Migration Summary

## Current Status: CRITICAL ISSUES IDENTIFIED

### 🚨 DISCOVERED ISSUES & FIXES:

#### ✅ SOLVED: Constraint Values
1. **Complexity**: Must be `'Low'`, `'Medium'`, `'High'` (not Simple/Moderate/Complex)
2. **Status**: Must be `'Draft'` (uppercase, not lowercase)
3. **Function**: Was missing complexity field in INSERT

#### 🔍 DISCOVERED: Unusual Schema Design
**item_number field in itp_items table**:
- **Expected**: Sequential numbers like 'C-001', 'C-002'
- **Actually**: Stores inspection type enum values: `'PASS_FAIL'`, `'NUMERIC'`, `'TEXT_INPUT'`
- **Current Usage**:
  - `'PASS_FAIL'` - For yes/no inspections
  - `'NUMERIC'` - For measurements (slump test, temperature)
  - `'TEXT_INPUT'` - For text notes/observations

### 🚨 URGENT FIXES NEEDED:

1. **Case Sensitivity Issue**
   - Constraint requires: `Simple`, `Moderate`, `Complex` (capitalized)
   - Data contains: `simple`, `moderate`, `complex` (lowercase)
   - **Impact**: All operations fail due to case mismatch

2. **Missing Field in Function**
   - The `create_itp_from_template` function INSERT is **MISSING the complexity field entirely**
   - Current INSERT only includes: template_id, project_id, lot_id, name, description, category, organization_id, created_by, status
   - **Missing**: complexity field
   - **Impact**: Function fails with constraint violation every time

### Immediate Actions Required:

#### Step 1: DIAGNOSE THE ACTUAL CONSTRAINT
**CRITICAL**: Before applying any fixes, run `check-constraint-definition-detailed.sql` to discover:
- The EXACT constraint definition
- What values it's actually checking for
- If there are enums, domains, or lookup tables involved
- Any hidden characters or encoding issues

#### Step 2: Apply the Fix (after diagnosis)
Once we know what the constraint actually expects:
1. Update `URGENT-FIX-complexity-case-and-function.sql` with correct values
2. Run the updated fix script
3. Test with `test-after-fixes.js`

## Current Status: CRITICAL ISSUES IDENTIFIED

### Testing Results by User

#### ✅ What's Working (per user testing):
1. **Manual ITP Creation**
   - Successfully created ITP with `complexity = 'Moderate'`
   - Constraint values confirmed: `Simple/Moderate/Complex` (not `Low/Medium/High`)
   - Status might need to be lowercase

2. **Database Structure**
   - All tables created successfully
   - All columns added correctly
   - Views are functional (v_itp_overview, v_itp_assignments)
   - Backup tables preserved with data

#### ❌ Issues Found:
1. **Constraint Mismatch**
   - Migration script used wrong values: `Low/Medium/High` and `Draft/Active/etc`
   - Actual constraints require: `Simple/Moderate/Complex` and possibly lowercase status
   - Existing data has old values that violate current constraints

2. **create_itp_from_template Function**
   - Missing complexity field
   - Using wrong constraint values
   - Fix provided in `scripts/fix-create-itp-function-corrected.sql`

3. **Data Cleanup Needed**
   - Existing ITPs have `High/Medium/Low` complexity values
   - Status values are uppercase `Draft` instead of lowercase
   - Need to update all existing records

### Required Actions:
1. **Run the corrected SQL script** (`fix-create-itp-function-corrected.sql`) in Supabase dashboard
2. **Update all existing data** to use correct constraint values
3. **Test the complete workflow** after fixes are applied
4. **Update application code** to use correct values everywhere

# ITP Schema Migration Summary

## Completed Tasks

### 1. Database Migration (✅ Complete)
- Successfully executed all migration steps (1-8)
- Created backup tables with timestamp (backup_*_20250621)
- Created new `itp_template_items` table
- Added new columns to existing tables:
  - `itps`: template_id, project_id, lot_id, status, created_by
  - `itp_items`: template_item_id, status, inspected_by, inspected_date, inspection_notes
  - `itp_assignments`: role, completed_date
- Created new views: `v_itp_overview`, `v_itp_assignments`
- Created new functions: `create_itp_from_template`, `update_itp_status`
- Created triggers for automatic status updates and timestamps

### 2. TypeScript Types Update (✅ Complete)
Updated `/types/database.ts` with:
- New interfaces: `ITP`, `ITPTemplateItem`, `ITPAssignment`
- View interfaces: `VITPOverview`, `VITPAssignments`
- Extended types: `ITPWithDetails`, `ITPTemplateWithItems`
- Request types for new operations

### 3. API Routes (✅ Complete)
Created new API routes:
- `/api/itps/create-from-template/route.ts` - Create ITP from template
- `/api/itps/[id]/route.ts` - Get/Update/Delete ITP
- `/api/itps/[id]/items/route.ts` - Get/Update ITP items
- `/api/itps/overview/route.ts` - Get ITP overview data

### 4. Server Actions (✅ Complete)
Added new action functions in `/lib/actions.ts`:
- `createITPFromTemplateAction` - Create ITP from template
- `getITPByIdAction` - Fetch ITP with all details
- `updateITPItemAction` - Update inspection item status
- `getITPOverviewAction` - Get ITP overview data
- `createITPAssignmentAction` - Create ITP assignment

### 5. UI Components (✅ Complete)
- Created `CreateITPFromTemplateModal` component for new ITP creation workflow
- Existing `AssignITPModal` can still be used for backward compatibility

## Migration Results

### Database State
- ✅ All backup tables created (15 ITPs, 47 items, 29 assignments, 15 templates)
- ✅ New table `itp_template_items` created with 37 items
- ✅ All new columns added successfully
- ✅ 5 ITPs have project_id populated
- ✅ 0 ITPs have template_id (ready for new template-based workflow)
- ✅ All 47 ITP items have status field
- ✅ Views and functions created successfully

### Key Changes
1. **ITPs are now independent entities** that can be created from templates
2. **Template items** are now separate from ITP items for better template management
3. **Status tracking** added at both ITP and item level
4. **Role-based assignments** with completion tracking
5. **Automatic status updates** via database triggers

## Next Steps

1. **UI Integration**: Update lot pages to use new `CreateITPFromTemplateModal`
2. **Template Management**: Create UI for managing ITP templates and template items
3. **Migration of Existing Data**: Run script to link existing ITPs to templates
4. **Testing**: Update integration tests for new workflow
5. **Documentation**: Update user documentation for new ITP workflow

## Backward Compatibility

The migration maintains backward compatibility:
- Old `lots.itp_id` field still exists and works
- Existing ITP assignment workflow continues to function
- All existing data preserved in backup tables

## Important Notes

- Do NOT run Step 9 (cleanup) until thoroughly tested in production
- Backup tables are preserved with timestamp: `backup_*_20250621`
- The new schema supports multiple ITPs per lot (future enhancement)