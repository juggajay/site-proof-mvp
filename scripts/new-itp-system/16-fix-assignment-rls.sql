-- =====================================================
-- FIX RLS FOR LOT_ITP_ASSIGNMENTS TABLE
-- =====================================================

-- 1. Check current RLS status
SELECT 
    'Current RLS Status' as info,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'lot_itp_assignments';

-- 2. Check existing policies
SELECT 
    'Current Policies' as info,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies
WHERE tablename = 'lot_itp_assignments';

-- 3. Drop all existing policies on lot_itp_assignments
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'lot_itp_assignments' 
        AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON lot_itp_assignments', pol.policyname);
        RAISE NOTICE 'Dropped policy: % on lot_itp_assignments', pol.policyname;
    END LOOP;
END $$;

-- 4. TEMPORARY: Disable RLS to test
ALTER TABLE lot_itp_assignments DISABLE ROW LEVEL SECURITY;

-- 5. Grant permissions
GRANT ALL ON lot_itp_assignments TO authenticated;
GRANT ALL ON lot_itp_assignments TO anon;
GRANT ALL ON lot_itp_assignments TO service_role;

-- 6. Re-enable RLS with permissive policies
ALTER TABLE lot_itp_assignments ENABLE ROW LEVEL SECURITY;

-- 7. Create simple permissive policies
-- Allow all authenticated users to view assignments
CREATE POLICY "authenticated_can_view_assignments" 
ON lot_itp_assignments FOR SELECT 
TO authenticated
USING (true);

-- Allow all authenticated users to create assignments
CREATE POLICY "authenticated_can_create_assignments" 
ON lot_itp_assignments FOR INSERT 
TO authenticated
WITH CHECK (true);

-- Allow all authenticated users to update assignments
CREATE POLICY "authenticated_can_update_assignments" 
ON lot_itp_assignments FOR UPDATE 
TO authenticated
USING (true)
WITH CHECK (true);

-- Allow all authenticated users to delete assignments
CREATE POLICY "authenticated_can_delete_assignments" 
ON lot_itp_assignments FOR DELETE 
TO authenticated
USING (true);

-- 8. Also create policies for anon role (in case needed)
CREATE POLICY "anon_can_view_assignments" 
ON lot_itp_assignments FOR SELECT 
TO anon
USING (true);

CREATE POLICY "anon_can_create_assignments" 
ON lot_itp_assignments FOR INSERT 
TO anon
WITH CHECK (true);

-- 9. Verify the policies were created
SELECT 
    'New Policies' as info,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies
WHERE tablename = 'lot_itp_assignments'
ORDER BY policyname;

-- 10. Test insert (you can skip this if just fixing policies)
-- INSERT INTO lot_itp_assignments (lot_id, template_id, sequence_number)
-- VALUES ('2924e1e1-9d03-4b34-8e25-24cbb4d51836', 'd8a5013c-9c26-4e29-97b2-e35899c1893b', 1)
-- ON CONFLICT DO NOTHING;