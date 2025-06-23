-- =====================================================
-- ROW LEVEL SECURITY POLICIES FOR ITP SYSTEM
-- =====================================================

-- Helper function to get user's organization
CREATE OR REPLACE FUNCTION get_user_organization_id()
RETURNS UUID AS $$
BEGIN
    RETURN (
        SELECT organization_id 
        FROM profiles 
        WHERE id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- ITP Templates Policies
-- =====================================================

-- View: Users can view templates from their organization
CREATE POLICY "Users can view own org templates"
    ON itp_templates FOR SELECT
    USING (organization_id = get_user_organization_id());

-- Insert: Users can create templates for their organization
CREATE POLICY "Users can create templates"
    ON itp_templates FOR INSERT
    WITH CHECK (organization_id = get_user_organization_id());

-- Update: Users can update their org's templates
CREATE POLICY "Users can update own org templates"
    ON itp_templates FOR UPDATE
    USING (organization_id = get_user_organization_id())
    WITH CHECK (organization_id = get_user_organization_id());

-- Delete: Only admins can delete templates
CREATE POLICY "Admins can delete templates"
    ON itp_templates FOR DELETE
    USING (
        organization_id = get_user_organization_id() 
        AND EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'owner')
        )
    );

-- =====================================================
-- ITP Template Items Policies
-- =====================================================

-- View: Users can view items if they can view the template
CREATE POLICY "Users can view template items"
    ON itp_template_items FOR SELECT
    USING (
        template_id IN (
            SELECT id FROM itp_templates 
            WHERE organization_id = get_user_organization_id()
        )
    );

-- Insert: Users can create items for their org's templates
CREATE POLICY "Users can create template items"
    ON itp_template_items FOR INSERT
    WITH CHECK (
        template_id IN (
            SELECT id FROM itp_templates 
            WHERE organization_id = get_user_organization_id()
        )
    );

-- Update: Users can update items for their org's templates
CREATE POLICY "Users can update template items"
    ON itp_template_items FOR UPDATE
    USING (
        template_id IN (
            SELECT id FROM itp_templates 
            WHERE organization_id = get_user_organization_id()
        )
    )
    WITH CHECK (
        template_id IN (
            SELECT id FROM itp_templates 
            WHERE organization_id = get_user_organization_id()
        )
    );

-- Delete: Only admins can delete items
CREATE POLICY "Admins can delete template items"
    ON itp_template_items FOR DELETE
    USING (
        template_id IN (
            SELECT id FROM itp_templates 
            WHERE organization_id = get_user_organization_id()
        )
        AND EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'owner')
        )
    );

-- =====================================================
-- Lot ITP Assignments Policies
-- =====================================================

-- View: Users can view assignments for lots in their org
CREATE POLICY "Users can view lot assignments"
    ON lot_itp_assignments FOR SELECT
    USING (
        lot_id IN (
            SELECT id FROM lots 
            WHERE project_id IN (
                SELECT id FROM projects 
                WHERE organization_id = get_user_organization_id()
            )
        )
    );

-- Insert: Users can create assignments
CREATE POLICY "Users can create assignments"
    ON lot_itp_assignments FOR INSERT
    WITH CHECK (
        lot_id IN (
            SELECT id FROM lots 
            WHERE project_id IN (
                SELECT id FROM projects 
                WHERE organization_id = get_user_organization_id()
            )
        )
    );

-- Update: Users can update assignments
CREATE POLICY "Users can update assignments"
    ON lot_itp_assignments FOR UPDATE
    USING (
        lot_id IN (
            SELECT id FROM lots 
            WHERE project_id IN (
                SELECT id FROM projects 
                WHERE organization_id = get_user_organization_id()
            )
        )
    );

-- Delete: Only admins can delete assignments
CREATE POLICY "Admins can delete assignments"
    ON lot_itp_assignments FOR DELETE
    USING (
        lot_id IN (
            SELECT id FROM lots 
            WHERE project_id IN (
                SELECT id FROM projects 
                WHERE organization_id = get_user_organization_id()
            )
        )
        AND EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'owner')
        )
    );

-- =====================================================
-- ITP Inspection Records Policies
-- =====================================================

-- View: Users can view inspection records for their org
CREATE POLICY "Users can view inspection records"
    ON itp_inspection_records FOR SELECT
    USING (
        assignment_id IN (
            SELECT a.id FROM lot_itp_assignments a
            JOIN lots l ON a.lot_id = l.id
            JOIN projects p ON l.project_id = p.id
            WHERE p.organization_id = get_user_organization_id()
        )
    );

-- Insert: Users can create inspection records
CREATE POLICY "Users can create inspection records"
    ON itp_inspection_records FOR INSERT
    WITH CHECK (
        assignment_id IN (
            SELECT a.id FROM lot_itp_assignments a
            JOIN lots l ON a.lot_id = l.id
            JOIN projects p ON l.project_id = p.id
            WHERE p.organization_id = get_user_organization_id()
        )
    );

-- Update: Users can update inspection records
CREATE POLICY "Users can update inspection records"
    ON itp_inspection_records FOR UPDATE
    USING (
        assignment_id IN (
            SELECT a.id FROM lot_itp_assignments a
            JOIN lots l ON a.lot_id = l.id
            JOIN projects p ON l.project_id = p.id
            WHERE p.organization_id = get_user_organization_id()
        )
    );

-- Delete: No one can delete inspection records (audit trail)
-- If needed, add a policy for admins only

-- Add helpful comment
COMMENT ON FUNCTION get_user_organization_id() IS 'Helper function to get the organization ID of the current user';