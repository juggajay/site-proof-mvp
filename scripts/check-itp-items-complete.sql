-- CHECK ITP_ITEMS TABLE STRUCTURE AND CONSTRAINTS

-- 1. Show ALL columns in itp_items table
SELECT 
    ordinal_position,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'itp_items'
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Show ALL constraints on itp_items (don't filter by name)
SELECT 
    conname as constraint_name,
    contype as type_code,
    pg_get_constraintdef(oid) as definition
FROM pg_constraint 
WHERE conrelid = 'itp_items'::regclass;

-- 3. Try to insert a test item to see what error we get
DO $$
BEGIN
    INSERT INTO itp_items (
        id,
        itp_id,
        item_number,
        description,
        status
    ) VALUES (
        gen_random_uuid(),
        (SELECT id FROM itps LIMIT 1),
        'TEST-001',
        'Test Item',
        'Pending'
    );
    RAISE NOTICE 'Insert successful';
EXCEPTION 
    WHEN OTHERS THEN
        RAISE NOTICE 'Error: %', SQLERRM;
        RAISE NOTICE 'Error Detail: %', SQLSTATE;
END $$;

-- 4. Check if we have any items successfully in the table
SELECT COUNT(*) as total_items FROM itp_items;

-- 5. If there are items, show a sample
SELECT * FROM itp_items LIMIT 5;

-- 6. Check what values are in item_number column if any exist
SELECT DISTINCT item_number, COUNT(*) as count
FROM itp_items
GROUP BY item_number
ORDER BY count DESC
LIMIT 10;

-- 7. Try different insert patterns to find what works
-- Test with minimal fields
DO $$
BEGIN
    INSERT INTO itp_items (
        itp_id,
        description
    ) VALUES (
        (SELECT id FROM itps LIMIT 1),
        'Minimal Test Item'
    );
    RAISE NOTICE 'Minimal insert successful';
EXCEPTION 
    WHEN OTHERS THEN
        RAISE NOTICE 'Minimal insert error: %', SQLERRM;
END $$;

-- 8. Check if there's a default constraint causing issues
SELECT 
    column_name,
    column_default
FROM information_schema.columns
WHERE table_name = 'itp_items'
    AND column_default IS NOT NULL;