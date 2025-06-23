-- =====================================================
-- SAFE UPDATE FOR EXISTING ITP TEMPLATES
-- =====================================================
-- This script safely updates existing templates without deleting them

-- First, let's see what we have
SELECT 
    'Current Status:' as info,
    COUNT(*) as template_count,
    COUNT(DISTINCT organization_id) as org_count,
    COUNT(*) FILTER (WHERE organization_id IS NULL) as global_templates,
    COUNT(*) FILTER (WHERE organization_id IS NOT NULL) as org_specific_templates
FROM itp_templates;

-- Make existing templates globally available (remove org requirement)
UPDATE itp_templates 
SET organization_id = NULL
WHERE organization_id IS NOT NULL
AND is_custom = false; -- Only update standard templates, not custom ones

-- Show updated results
SELECT 
    t.id,
    t.name,
    t.code,
    t.category,
    CASE 
        WHEN t.organization_id IS NULL THEN 'Global'
        ELSE 'Organization-specific'
    END as availability,
    COUNT(ti.id) as item_count
FROM itp_templates t
LEFT JOIN itp_template_items ti ON t.id = ti.template_id
GROUP BY t.id, t.name, t.code, t.category, t.organization_id
ORDER BY t.category, t.name;

-- Update RLS policies (safe to run multiple times)
DO $$
BEGIN
    -- Drop old policies if they exist
    DROP POLICY IF EXISTS "Users can view active ITP templates" ON itp_templates;
    DROP POLICY IF EXISTS "All authenticated users can view active ITP templates" ON itp_templates;
    
    -- Create new policy for global access
    CREATE POLICY "All authenticated users can view active ITP templates" 
    ON itp_templates FOR SELECT 
    TO authenticated
    USING (is_active = true);
    
    RAISE NOTICE 'RLS policies updated successfully';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error updating policies: %', SQLERRM;
END $$;

-- Summary
SELECT 
    'Summary after update:' as info,
    COUNT(*) FILTER (WHERE organization_id IS NULL) as global_templates,
    COUNT(*) FILTER (WHERE organization_id IS NOT NULL) as org_specific_templates,
    COUNT(DISTINCT category) as categories,
    array_agg(DISTINCT category) as category_list
FROM itp_templates
WHERE is_active = true;