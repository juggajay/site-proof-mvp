-- =====================================================
-- FIX RLS FOR ITP_INSPECTION_RECORDS TABLE
-- =====================================================

-- 1. Check current RLS status
SELECT 
    'Current RLS Status' as info,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'itp_inspection_records';

-- 2. Drop all existing policies on itp_inspection_records
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'itp_inspection_records' 
        AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON itp_inspection_records', pol.policyname);
        RAISE NOTICE 'Dropped policy: % on itp_inspection_records', pol.policyname;
    END LOOP;
END $$;

-- 3. TEMPORARY: Disable RLS to test
ALTER TABLE itp_inspection_records DISABLE ROW LEVEL SECURITY;

-- 4. Grant permissions
GRANT ALL ON itp_inspection_records TO authenticated;
GRANT ALL ON itp_inspection_records TO anon;
GRANT ALL ON itp_inspection_records TO service_role;

-- 5. Re-enable RLS with permissive policies
ALTER TABLE itp_inspection_records ENABLE ROW LEVEL SECURITY;

-- 6. Create simple permissive policies for authenticated users
CREATE POLICY "authenticated_can_all_inspection_records" 
ON itp_inspection_records FOR ALL 
TO authenticated
USING (true)
WITH CHECK (true);

-- 7. Also create policies for anon role
CREATE POLICY "anon_can_all_inspection_records" 
ON itp_inspection_records FOR ALL 
TO anon
USING (true)
WITH CHECK (true);

-- 8. Verify the policies were created
SELECT 
    'New Policies' as info,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies
WHERE tablename = 'itp_inspection_records'
ORDER BY policyname;

-- 9. Also check if there are any other ITP tables with RLS enabled
SELECT 
    'Other ITP Tables with RLS' as info,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public'
AND tablename LIKE '%itp%'
AND rowsecurity = true
ORDER BY tablename;