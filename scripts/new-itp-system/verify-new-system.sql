-- Verify New ITP System Installation

-- 1. Check if new tables exist
SELECT 
    'Tables Created' as check_type,
    COUNT(*) as count
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
    'itp_templates',
    'itp_template_items',
    'lot_itp_assignments',
    'itp_inspection_records',
    'non_conformances',
    'itp_inspection_attachments'
);

-- 2. Check if templates were seeded
SELECT 
    'Templates Seeded' as check_type,
    COUNT(*) as count
FROM itp_templates;

-- 3. Check template categories
SELECT 
    category,
    COUNT(*) as template_count
FROM itp_templates
GROUP BY category
ORDER BY category;

-- 4. Check if your organization has templates
SELECT 
    'Your Org Templates' as check_type,
    COUNT(*) as count,
    organization_id
FROM itp_templates
WHERE organization_id = '550e8400-e29b-41d4-a716-446655440001'
GROUP BY organization_id;

-- 5. Check lot assignments (new junction table)
SELECT 
    'Lot Assignments' as check_type,
    COUNT(*) as count
FROM lot_itp_assignments;

-- 6. Sample template data
SELECT 
    id,
    name,
    code,
    category,
    organization_id,
    is_active
FROM itp_templates
LIMIT 5;