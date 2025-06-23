-- =====================================================
-- CLEANUP OLD ITP SYSTEM
-- =====================================================
-- WARNING: This will permanently delete all old ITP data!
-- Make sure to backup any important data before running this script

-- Drop old tables in correct order (respecting foreign key constraints)
DROP TABLE IF EXISTS conformance_records CASCADE;
DROP TABLE IF EXISTS itp_items CASCADE;
DROP TABLE IF EXISTS itps CASCADE;
DROP TABLE IF EXISTS lot_itp_templates CASCADE;
DROP TABLE IF EXISTS itp_template_items CASCADE;
DROP TABLE IF EXISTS itp_templates CASCADE;

-- Drop any old functions
DROP FUNCTION IF EXISTS create_itp_from_template CASCADE;

-- Drop any old views
DROP VIEW IF EXISTS vw_lot_itps CASCADE;

-- Verify cleanup
SELECT 
    'Old tables dropped successfully' as status,
    COUNT(*) as remaining_old_tables
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN (
    'conformance_records',
    'itp_items', 
    'itps',
    'lot_itp_templates',
    'itp_template_items',
    'itp_templates'
);