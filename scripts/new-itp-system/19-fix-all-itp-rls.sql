-- =====================================================
-- COMPREHENSIVE FIX FOR ALL ITP TABLES RLS
-- =====================================================
-- This script fixes RLS for ALL ITP-related tables

-- List of ITP tables
-- itp_templates
-- itp_template_items  
-- lot_itp_assignments
-- itp_inspection_records
-- itp_attachments (if exists)
-- itp_non_conformances (if exists)

-- 1. Drop all existing policies
DO $$
DECLARE
    pol RECORD;
    tbl TEXT;
    tables TEXT[] := ARRAY['itp_templates', 'itp_template_items', 'lot_itp_assignments', 'itp_inspection_records', 'itp_attachments', 'itp_non_conformances'];
BEGIN
    FOREACH tbl IN ARRAY tables
    LOOP
        -- Check if table exists
        IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = tbl AND schemaname = 'public') THEN
            RAISE NOTICE 'Processing table: %', tbl;
            
            -- Drop all policies
            FOR pol IN 
                SELECT policyname 
                FROM pg_policies 
                WHERE tablename = tbl 
                AND schemaname = 'public'
            LOOP
                EXECUTE format('DROP POLICY IF EXISTS %I ON %I', pol.policyname, tbl);
                RAISE NOTICE '  Dropped policy: % on %', pol.policyname, tbl;
            END LOOP;
            
            -- Disable RLS
            EXECUTE format('ALTER TABLE %I DISABLE ROW LEVEL SECURITY', tbl);
            
            -- Grant permissions
            EXECUTE format('GRANT ALL ON %I TO authenticated', tbl);
            EXECUTE format('GRANT ALL ON %I TO anon', tbl);
            EXECUTE format('GRANT ALL ON %I TO service_role', tbl);
            
            -- Re-enable RLS
            EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', tbl);
            
            -- Create permissive policy
            EXECUTE format('CREATE POLICY "allow_all_for_authenticated" ON %I FOR ALL TO authenticated USING (true) WITH CHECK (true)', tbl);
            EXECUTE format('CREATE POLICY "allow_all_for_anon" ON %I FOR ALL TO anon USING (true) WITH CHECK (true)', tbl);
            
            RAISE NOTICE '  Created permissive policies for %', tbl;
        ELSE
            RAISE NOTICE 'Table % does not exist, skipping', tbl;
        END IF;
    END LOOP;
END $$;

-- 2. Verify all tables and their RLS status
SELECT 
    tablename,
    rowsecurity as rls_enabled,
    CASE 
        WHEN rowsecurity THEN 'RLS Enabled'
        ELSE 'RLS Disabled'
    END as status
FROM pg_tables 
WHERE schemaname = 'public'
AND tablename IN ('itp_templates', 'itp_template_items', 'lot_itp_assignments', 'itp_inspection_records', 'itp_attachments', 'itp_non_conformances')
ORDER BY tablename;

-- 3. Verify policies
SELECT 
    tablename,
    COUNT(*) as policy_count,
    array_agg(policyname ORDER BY policyname) as policies
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('itp_templates', 'itp_template_items', 'lot_itp_assignments', 'itp_inspection_records', 'itp_attachments', 'itp_non_conformances')
GROUP BY tablename
ORDER BY tablename;

-- 4. Test query to ensure we can read templates
SELECT COUNT(*) as template_count FROM itp_templates;
SELECT COUNT(*) as assignment_count FROM lot_itp_assignments;
SELECT COUNT(*) as record_count FROM itp_inspection_records;