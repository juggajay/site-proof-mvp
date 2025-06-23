-- =====================================================
-- EMERGENCY: DISABLE RLS ON ASSIGNMENT TABLES
-- =====================================================
-- Use this if the other script doesn't work

-- Disable RLS on all ITP-related tables
ALTER TABLE lot_itp_assignments DISABLE ROW LEVEL SECURITY;
ALTER TABLE itp_inspection_records DISABLE ROW LEVEL SECURITY;

-- Grant full permissions
GRANT ALL ON lot_itp_assignments TO authenticated;
GRANT ALL ON lot_itp_assignments TO anon;
GRANT ALL ON itp_inspection_records TO authenticated;
GRANT ALL ON itp_inspection_records TO anon;

-- Verify
SELECT 
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename IN ('lot_itp_assignments', 'itp_inspection_records');

-- NOTE: Remember to re-enable RLS with proper policies later!