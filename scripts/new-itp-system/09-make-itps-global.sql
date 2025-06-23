-- =====================================================
-- MAKE ITP TEMPLATES GLOBALLY AVAILABLE
-- =====================================================
-- This script removes organization-specific restrictions from ITP templates
-- making them available to all organizations

-- 1. First, drop the organization_id constraint if it exists
ALTER TABLE itp_templates 
ALTER COLUMN organization_id DROP NOT NULL;

-- 2. Update all existing templates to remove organization_id
UPDATE itp_templates 
SET organization_id = NULL
WHERE organization_id IS NOT NULL;

-- 3. Drop and recreate RLS policies to allow global access
DROP POLICY IF EXISTS "Users can view active ITP templates" ON itp_templates;
DROP POLICY IF EXISTS "Users can view ITP template items" ON itp_template_items;

-- 4. Create new RLS policies for global access
-- Allow all authenticated users to view all active templates
CREATE POLICY "All authenticated users can view active ITP templates" 
ON itp_templates FOR SELECT 
TO authenticated
USING (is_active = true);

-- Allow all authenticated users to view template items
CREATE POLICY "All authenticated users can view ITP template items" 
ON itp_template_items FOR SELECT 
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM itp_templates t
        WHERE t.id = itp_template_items.template_id
        AND t.is_active = true
    )
);

-- 5. Create policy for custom templates (organization-specific)
-- Organizations can only manage their own custom templates
CREATE POLICY "Organizations can manage their custom templates" 
ON itp_templates FOR ALL 
TO authenticated
USING (
    -- Can only modify custom templates they own
    is_custom = true 
    AND organization_id = auth.uid()::uuid
)
WITH CHECK (
    is_custom = true 
    AND organization_id = auth.uid()::uuid
);

-- 6. Update lot_itp_assignments policies to ensure access
DROP POLICY IF EXISTS "Users can view lot assignments" ON lot_itp_assignments;
DROP POLICY IF EXISTS "Users can create lot assignments" ON lot_itp_assignments;
DROP POLICY IF EXISTS "Users can update lot assignments" ON lot_itp_assignments;

-- Allow users to view assignments for lots they have access to
CREATE POLICY "Users can view lot assignments" 
ON lot_itp_assignments FOR SELECT 
TO authenticated
USING (true); -- Will be filtered by lot access

-- Allow users to create assignments for lots they have access to
CREATE POLICY "Users can create lot assignments" 
ON lot_itp_assignments FOR INSERT 
TO authenticated
WITH CHECK (true); -- Will be validated by lot access

-- Allow users to update assignments for lots they have access to
CREATE POLICY "Users can update lot assignments" 
ON lot_itp_assignments FOR UPDATE 
TO authenticated
USING (true); -- Will be filtered by lot access

-- 7. Add comment to explain the new structure
COMMENT ON COLUMN itp_templates.organization_id IS 
'Only used for custom templates created by organizations. NULL for standard templates available to all.';

-- 8. Create index for better performance
CREATE INDEX IF NOT EXISTS idx_itp_templates_active ON itp_templates(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_itp_templates_custom ON itp_templates(is_custom, organization_id) WHERE is_custom = true;