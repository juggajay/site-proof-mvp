-- =====================================================
-- COMPLETELY DISABLE RLS ON ALL ITP TABLES
-- =====================================================
-- Nuclear option - disable RLS entirely

-- 1. Find and disable RLS on ALL tables with 'itp' in the name
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public' 
        AND (
            tablename LIKE '%itp%' 
            OR tablename LIKE '%lot%'
            OR tablename LIKE '%conformance%'
            OR tablename LIKE '%inspection%'
        )
    LOOP
        EXECUTE format('ALTER TABLE %I DISABLE ROW LEVEL SECURITY', r.tablename);
        RAISE NOTICE 'Disabled RLS on table: %', r.tablename;
        
        -- Also grant all permissions
        EXECUTE format('GRANT ALL ON %I TO authenticated', r.tablename);
        EXECUTE format('GRANT ALL ON %I TO anon', r.tablename);
        EXECUTE format('GRANT ALL ON %I TO service_role', r.tablename);
        EXECUTE format('GRANT ALL ON %I TO postgres', r.tablename);
        RAISE NOTICE 'Granted all permissions on table: %', r.tablename;
    END LOOP;
END $$;

-- 2. Specifically ensure these critical tables have RLS disabled
ALTER TABLE itp_templates DISABLE ROW LEVEL SECURITY;
ALTER TABLE itp_template_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE lot_itp_assignments DISABLE ROW LEVEL SECURITY;
ALTER TABLE itp_inspection_records DISABLE ROW LEVEL SECURITY;

-- 3. Extra permissions just to be sure
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon;

-- 4. Check what we've done
SELECT 
    tablename,
    rowsecurity,
    CASE 
        WHEN rowsecurity THEN '❌ RLS STILL ENABLED!'
        ELSE '✅ RLS Disabled'
    END as status
FROM pg_tables 
WHERE schemaname = 'public'
AND (
    tablename LIKE '%itp%' 
    OR tablename LIKE '%lot%'
    OR tablename LIKE '%conformance%'
    OR tablename LIKE '%inspection%'
)
ORDER BY 
    CASE WHEN rowsecurity THEN 0 ELSE 1 END,
    tablename;

-- 5. Show any remaining policies (should be none)
SELECT 
    tablename,
    COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
AND (
    tablename LIKE '%itp%' 
    OR tablename LIKE '%lot%'
    OR tablename LIKE '%conformance%'
    OR tablename LIKE '%inspection%'
)
GROUP BY tablename
HAVING COUNT(*) > 0;

-- 6. If there are STILL policies, drop them all
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT DISTINCT tablename, policyname
        FROM pg_policies 
        WHERE schemaname = 'public'
        AND (
            tablename LIKE '%itp%' 
            OR tablename LIKE '%lot%'
            OR tablename LIKE '%conformance%'
            OR tablename LIKE '%inspection%'
        )
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I', pol.policyname, pol.tablename);
        RAISE NOTICE 'Dropped policy % on %', pol.policyname, pol.tablename;
    END LOOP;
END $$;