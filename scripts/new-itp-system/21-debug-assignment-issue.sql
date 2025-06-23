-- =====================================================
-- DEBUG ASSIGNMENT ISSUE
-- =====================================================

-- 1. Check table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'itp_inspection_records'
ORDER BY ordinal_position;

-- 2. Check foreign key constraints
SELECT
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'itp_inspection_records'
    AND tc.constraint_type = 'FOREIGN KEY';

-- 3. Check if user exists in auth.users (common RLS issue)
SELECT 
    auth.uid() as current_user_id,
    CASE 
        WHEN auth.uid() IS NULL THEN 'No authenticated user!'
        ELSE 'User authenticated'
    END as auth_status;

-- 4. Test creating an assignment directly
-- First, let's see what data we have
SELECT 'Lots' as data_type, COUNT(*) as count FROM lots
UNION ALL
SELECT 'ITP Templates' as data_type, COUNT(*) as count FROM itp_templates
UNION ALL
SELECT 'Template Items' as data_type, COUNT(*) as count FROM itp_template_items
UNION ALL
SELECT 'Assignments' as data_type, COUNT(*) as count FROM lot_itp_assignments
UNION ALL
SELECT 'Inspection Records' as data_type, COUNT(*) as count FROM itp_inspection_records;

-- 5. Try a simple insert to lot_itp_assignments
DO $$
DECLARE
    v_lot_id UUID;
    v_template_id UUID;
BEGIN
    -- Get first lot and template
    SELECT id INTO v_lot_id FROM lots LIMIT 1;
    SELECT id INTO v_template_id FROM itp_templates WHERE is_active = true LIMIT 1;
    
    IF v_lot_id IS NOT NULL AND v_template_id IS NOT NULL THEN
        RAISE NOTICE 'Attempting insert with lot_id: %, template_id: %', v_lot_id, v_template_id;
        
        -- Try insert
        INSERT INTO lot_itp_assignments (lot_id, template_id, sequence_number, status)
        VALUES (v_lot_id, v_template_id, 999, 'pending')
        ON CONFLICT DO NOTHING;
        
        RAISE NOTICE 'Insert attempted';
    ELSE
        RAISE NOTICE 'No lot or template found';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error during insert: %', SQLERRM;
END $$;

-- 6. Check RLS status one more time
SELECT 
    n.nspname as schema_name,
    c.relname as table_name,
    c.relrowsecurity as rls_enabled,
    c.relforcerowsecurity as rls_forced
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
AND c.relname IN ('lot_itp_assignments', 'itp_inspection_records');