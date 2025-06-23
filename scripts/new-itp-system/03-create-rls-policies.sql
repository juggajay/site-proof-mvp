-- =====================================================
-- ROW LEVEL SECURITY POLICIES
-- =====================================================

-- ITP Templates Policies
CREATE POLICY "Users can view ITP templates in their organization"
ON itp_templates FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "Users can create ITP templates"
ON itp_templates FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update ITP templates"
ON itp_templates FOR UPDATE
USING (auth.role() = 'authenticated');

-- ITP Template Items Policies
CREATE POLICY "Users can view template items"
ON itp_template_items FOR SELECT
USING (EXISTS (
    SELECT 1 FROM itp_templates t
    WHERE t.id = template_id
));

CREATE POLICY "Users can manage template items"
ON itp_template_items FOR ALL
USING (auth.role() = 'authenticated');

-- Lot ITP Assignments Policies
CREATE POLICY "Users can view lot assignments"
ON lot_itp_assignments FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "Users can create lot assignments"
ON lot_itp_assignments FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update lot assignments"
ON lot_itp_assignments FOR UPDATE
USING (auth.role() = 'authenticated');

-- ITP Inspection Records Policies
CREATE POLICY "Users can view inspection records"
ON itp_inspection_records FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "Users can create inspection records"
ON itp_inspection_records FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update inspection records"
ON itp_inspection_records FOR UPDATE
USING (auth.role() = 'authenticated');

-- Non-Conformances Policies
CREATE POLICY "Users can view non-conformances"
ON non_conformances FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "Users can create non-conformances"
ON non_conformances FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update non-conformances"
ON non_conformances FOR UPDATE
USING (auth.role() = 'authenticated');