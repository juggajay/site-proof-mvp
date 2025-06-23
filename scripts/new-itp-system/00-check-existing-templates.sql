-- =====================================================
-- CHECK EXISTING ITP TEMPLATES AND ITEMS
-- =====================================================
-- This script only reads data, makes no changes

-- 1. Overall summary
SELECT 
    'TEMPLATE SUMMARY' as report_section,
    COUNT(*) as total_templates,
    COUNT(*) FILTER (WHERE organization_id IS NULL) as global_templates,
    COUNT(*) FILTER (WHERE organization_id IS NOT NULL) as org_specific_templates,
    COUNT(*) FILTER (WHERE is_custom = true) as custom_templates,
    COUNT(*) FILTER (WHERE is_active = true) as active_templates
FROM itp_templates;

-- 2. Templates by category
SELECT 
    'TEMPLATES BY CATEGORY' as report_section,
    COALESCE(category, 'No Category') as category,
    COUNT(*) as template_count,
    array_agg(name ORDER BY name) as template_names
FROM itp_templates
WHERE is_active = true
GROUP BY category
ORDER BY category;

-- 3. Template items summary
SELECT 
    'ITEMS PER TEMPLATE' as report_section,
    t.name as template_name,
    t.category,
    COUNT(ti.id) as item_count,
    t.organization_id IS NULL as is_global
FROM itp_templates t
LEFT JOIN itp_template_items ti ON t.id = ti.template_id
GROUP BY t.id, t.name, t.category, t.organization_id
ORDER BY t.category, t.name;

-- 4. Sample templates with details
SELECT 
    'SAMPLE TEMPLATE DETAILS' as report_section,
    t.id,
    t.name,
    t.code,
    t.description,
    t.organization_id,
    t.is_custom,
    t.created_at
FROM itp_templates t
ORDER BY t.created_at DESC
LIMIT 5;

-- 5. Sample template items
SELECT 
    'SAMPLE TEMPLATE ITEMS' as report_section,
    t.name as template_name,
    ti.description as item_description,
    ti.inspection_type,
    ti.is_mandatory,
    ti.is_witness_point,
    ti.is_hold_point
FROM itp_template_items ti
JOIN itp_templates t ON t.id = ti.template_id
ORDER BY t.name, ti.sort_order
LIMIT 10;

-- 6. Check for any issues
SELECT 
    'POTENTIAL ISSUES' as report_section,
    'Templates without items' as issue_type,
    COUNT(*) as count
FROM itp_templates t
LEFT JOIN itp_template_items ti ON t.id = ti.template_id
WHERE ti.id IS NULL
UNION ALL
SELECT 
    'POTENTIAL ISSUES' as report_section,
    'Inactive templates' as issue_type,
    COUNT(*) as count
FROM itp_templates
WHERE is_active = false
UNION ALL
SELECT 
    'POTENTIAL ISSUES' as report_section,
    'Templates with organization_id' as issue_type,
    COUNT(*) as count
FROM itp_templates
WHERE organization_id IS NOT NULL;