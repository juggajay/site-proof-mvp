-- =====================================================
-- FIX RLS ACCESS FOR ITP TEMPLATES
-- =====================================================

-- 1. Check if RLS is enabled
SELECT 
    'RLS Status Check' as check_type,
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('itp_templates', 'itp_template_items', 'lot_itp_assignments', 'itp_inspection_records');

-- 2. Check current policies
SELECT 
    'Current Policies' as check_type,
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('itp_templates', 'itp_template_items');

-- 3. Fix organization_id issue (make all templates global)
UPDATE itp_templates 
SET organization_id = NULL
WHERE organization_id IS NOT NULL;

-- 4. Drop ALL existing policies to start fresh
DO $$
DECLARE
    pol RECORD;
BEGIN
    -- Drop all policies on itp_templates
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'itp_templates' 
        AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON itp_templates', pol.policyname);
        RAISE NOTICE 'Dropped policy: % on itp_templates', pol.policyname;
    END LOOP;

    -- Drop all policies on itp_template_items
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'itp_template_items' 
        AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON itp_template_items', pol.policyname);
        RAISE NOTICE 'Dropped policy: % on itp_template_items', pol.policyname;
    END LOOP;
END $$;

-- 5. Disable RLS temporarily to test
ALTER TABLE itp_templates DISABLE ROW LEVEL SECURITY;
ALTER TABLE itp_template_items DISABLE ROW LEVEL SECURITY;

-- 6. Verify data exists
SELECT 
    'Data Check' as check_type,
    'itp_templates' as table_name,
    COUNT(*) as row_count,
    COUNT(*) FILTER (WHERE is_active = true) as active_count
FROM itp_templates
UNION ALL
SELECT 
    'Data Check' as check_type,
    'itp_template_items' as table_name,
    COUNT(*) as row_count,
    NULL as active_count
FROM itp_template_items;

-- 7. Re-enable RLS with proper policies
ALTER TABLE itp_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE itp_template_items ENABLE ROW LEVEL SECURITY;

-- 8. Create simple, permissive policies
-- Allow ALL authenticated users to view ALL templates
CREATE POLICY "anyone_can_view_templates" 
ON itp_templates FOR SELECT 
TO authenticated, anon
USING (true);

-- Allow ALL authenticated users to view ALL template items
CREATE POLICY "anyone_can_view_template_items" 
ON itp_template_items FOR SELECT 
TO authenticated, anon
USING (true);

-- 9. Grant necessary permissions
GRANT SELECT ON itp_templates TO authenticated;
GRANT SELECT ON itp_template_items TO authenticated;
GRANT SELECT ON itp_templates TO anon;
GRANT SELECT ON itp_template_items TO anon;

-- 10. Final verification
SELECT 
    'Final Check' as status,
    t.id,
    t.name,
    t.is_active,
    t.organization_id,
    COUNT(ti.id) as item_count
FROM itp_templates t
LEFT JOIN itp_template_items ti ON t.id = ti.template_id
GROUP BY t.id, t.name, t.is_active, t.organization_id
ORDER BY t.name;

-- 11. Test query that the app uses
SELECT * FROM itp_templates ORDER BY name LIMIT 5;