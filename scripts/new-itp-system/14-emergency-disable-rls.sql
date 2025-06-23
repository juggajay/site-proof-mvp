-- =====================================================
-- EMERGENCY: DISABLE RLS TO TEST
-- =====================================================
-- This temporarily disables RLS to verify if that's the issue

-- 1. Disable RLS on all ITP tables
ALTER TABLE itp_templates DISABLE ROW LEVEL SECURITY;
ALTER TABLE itp_template_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE lot_itp_assignments DISABLE ROW LEVEL SECURITY;
ALTER TABLE itp_inspection_records DISABLE ROW LEVEL SECURITY;

-- 2. Make all templates global (no organization restriction)
UPDATE itp_templates SET organization_id = NULL;

-- 3. Verify data exists
SELECT 
    'Templates:' as info,
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE is_active = true) as active
FROM itp_templates
UNION ALL
SELECT 
    'Template Items:' as info,
    COUNT(*) as total,
    NULL as active
FROM itp_template_items;

-- 4. Show sample data
SELECT 
    id,
    name,
    category,
    is_active,
    organization_id
FROM itp_templates
LIMIT 10;

-- WARNING: Remember to re-enable RLS after testing!
-- To re-enable, run:
-- ALTER TABLE itp_templates ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE itp_template_items ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE lot_itp_assignments ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE itp_inspection_records ENABLE ROW LEVEL SECURITY;