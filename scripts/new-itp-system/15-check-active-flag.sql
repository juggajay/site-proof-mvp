-- =====================================================
-- CHECK AND FIX is_active FLAG
-- =====================================================

-- 1. Check current status of is_active flag
SELECT 
    'is_active Status' as check,
    is_active,
    COUNT(*) as template_count
FROM itp_templates
GROUP BY is_active;

-- 2. Check if any templates are inactive
SELECT 
    id,
    name,
    category,
    is_active,
    organization_id
FROM itp_templates
WHERE is_active = false OR is_active IS NULL
LIMIT 10;

-- 3. Make ALL templates active
UPDATE itp_templates 
SET is_active = true
WHERE is_active = false OR is_active IS NULL;

-- 4. Verify the update
SELECT 
    'After Update' as status,
    COUNT(*) as total_templates,
    COUNT(*) FILTER (WHERE is_active = true) as active_templates,
    COUNT(*) FILTER (WHERE organization_id IS NULL) as global_templates
FROM itp_templates;

-- 5. Test the exact query the app uses
SELECT 
    id,
    name,
    description,
    category,
    organization_id,
    is_active,
    created_at,
    updated_at
FROM itp_templates
ORDER BY name;

-- 6. Also check if there's a permission issue with the service role
SELECT 
    'Table Permissions' as check,
    grantee,
    table_name,
    privilege_type
FROM information_schema.table_privileges
WHERE table_name IN ('itp_templates', 'itp_template_items')
AND grantee IN ('authenticated', 'anon', 'service_role')
ORDER BY table_name, grantee, privilege_type;