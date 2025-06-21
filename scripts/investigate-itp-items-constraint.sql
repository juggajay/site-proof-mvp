-- INVESTIGATE itp_items_inspection_type_check CONSTRAINT

-- 1. Find the constraint definition
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'itp_items'::regclass
    AND conname = 'itp_items_inspection_type_check';

-- 2. Show ALL constraints on itp_items table
SELECT 
    conname as constraint_name,
    CASE contype 
        WHEN 'c' THEN 'CHECK'
        WHEN 'f' THEN 'FOREIGN KEY'
        WHEN 'p' THEN 'PRIMARY KEY'
        WHEN 'u' THEN 'UNIQUE'
    END as constraint_type,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'itp_items'::regclass
ORDER BY conname;

-- 3. Check if there's an inspection_type column
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'itp_items'
    AND column_name LIKE '%inspection%' OR column_name LIKE '%type%'
ORDER BY ordinal_position;

-- 4. Check for enum type 'itp_item_type' (from earlier investigation)
-- We saw this enum: {PASS_FAIL,TEXT_INPUT,NUMERIC}
SELECT 
    t.typname as enum_name,
    array_agg(e.enumlabel ORDER BY e.enumsortorder) as enum_values
FROM pg_type t
JOIN pg_enum e ON t.oid = e.enumtypid
WHERE t.typname = 'itp_item_type';

-- 5. See ALL columns in itp_items table
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    udt_name
FROM information_schema.columns
WHERE table_name = 'itp_items'
ORDER BY ordinal_position;

-- 6. See if any itp_items have data that might reveal the pattern
SELECT 
    id,
    item_number,
    description,
    status,
    inspection_method
FROM itp_items
WHERE item_number IN ('PASS_FAIL', 'TEXT_INPUT', 'NUMERIC')
LIMIT 10;

-- 7. Check if the constraint is checking a column that doesn't exist
-- or has been renamed
SELECT 
    'This constraint might be checking for:' as note,
    'inspection_type column with enum values' as possibility_1,
    'item_type column with enum values' as possibility_2,
    'or it might be a legacy constraint that should be dropped' as possibility_3;

-- 8. Possible fixes (DO NOT RUN YET - wait for investigation results):
-- Option A: Drop the constraint if it's legacy
-- ALTER TABLE itp_items DROP CONSTRAINT IF EXISTS itp_items_inspection_type_check;

-- Option B: Add the missing column if needed
-- ALTER TABLE itp_items ADD COLUMN inspection_type itp_item_type DEFAULT 'PASS_FAIL'::itp_item_type;

-- Option C: Update inserts to include the required field