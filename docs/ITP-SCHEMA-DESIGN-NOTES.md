# ITP Schema Design Notes

## Important Discovery: Unusual Schema Pattern

### item_number Field Behavior
The `item_number` field in the `itp_items` table does NOT store sequential item numbers (like C-001, C-002) as you might expect. Instead, it stores the **inspection type** from an enum.

**Valid Values (from itp_item_type enum):**
- `'PASS_FAIL'` - For yes/no compliance checks
- `'NUMERIC'` - For measurements (temperature, slump test, dimensions)
- `'TEXT_INPUT'` - For observations and notes

### Current Data Examples:
```sql
-- Pass/Fail items
item_number = 'PASS_FAIL', description = 'Concrete mix design approved'
item_number = 'PASS_FAIL', description = 'Forms inspected and approved'

-- Numeric items  
item_number = 'NUMERIC', description = 'Slump test result'
item_number = 'NUMERIC', description = 'Concrete temperature'

-- Text items
item_number = 'TEXT_INPUT', description = 'Additional notes'
```

### Constraint Requirements:
1. **Complexity**: `'Low'`, `'Medium'`, `'High'` (capitalized)
2. **Status**: `'Draft'`, `'Active'`, etc. (capitalized)
3. **item_number**: Must be one of the enum values above

### Design Implications:

#### Problems with Current Design:
1. No field for actual item reference numbers
2. Confusing field naming (item_number doesn't contain numbers)
3. Limited to 3 inspection types

#### Suggested Improvements:
1. **Add reference_number column** for identifiers like 'C-001'
2. **Rename item_number to inspection_type** for clarity
3. **Use sort_order** for sequencing items

#### Mapping Strategy:
The function uses keyword matching to determine inspection type:
- Keywords like "temperature", "slump", "mm" → `'NUMERIC'`
- Keywords like "note", "comment", "observation" → `'TEXT_INPUT'`
- Everything else → `'PASS_FAIL'`

### Migration Considerations:
If refactoring this schema:
```sql
-- Add new column for reference numbers
ALTER TABLE itp_items ADD COLUMN reference_number VARCHAR(50);

-- Populate with sequential numbers
UPDATE itp_items 
SET reference_number = 'ITEM-' || LPAD(sort_order::text, 3, '0')
WHERE reference_number IS NULL;

-- Eventually rename item_number to inspection_type
ALTER TABLE itp_items RENAME COLUMN item_number TO inspection_type;
```

### For Developers:
- Always use enum values for item_number
- Use sort_order for item sequencing
- Consider the inspection type when creating items
- Document this unusual pattern in code comments