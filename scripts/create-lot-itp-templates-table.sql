-- Create lot_itp_templates junction table for multiple ITP support
-- This table allows multiple ITP templates to be assigned to a single lot

-- Create the junction table if it doesn't exist
CREATE TABLE IF NOT EXISTS lot_itp_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    lot_id UUID NOT NULL REFERENCES lots(id) ON DELETE CASCADE,
    itp_template_id UUID NOT NULL REFERENCES itp_templates(id) ON DELETE CASCADE,
    assigned_by INTEGER REFERENCES profiles(id),
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Ensure unique active assignment per lot-template combination
    UNIQUE(lot_id, itp_template_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_lot_itp_templates_lot_id ON lot_itp_templates(lot_id);
CREATE INDEX IF NOT EXISTS idx_lot_itp_templates_template_id ON lot_itp_templates(itp_template_id);
CREATE INDEX IF NOT EXISTS idx_lot_itp_templates_active ON lot_itp_templates(is_active) WHERE is_active = true;

-- Add RLS policies
ALTER TABLE lot_itp_templates ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view assignments for lots in their organization
CREATE POLICY "Users can view lot ITP assignments in their organization" ON lot_itp_templates
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM lots l
            JOIN projects p ON l.project_id = p.id
            WHERE l.id = lot_itp_templates.lot_id
            AND p.organization_id IN (
                SELECT organization_id FROM user_organizations
                WHERE user_id = auth.uid()
            )
        )
    );

-- Policy: Users can create assignments for lots in their organization
CREATE POLICY "Users can create lot ITP assignments in their organization" ON lot_itp_templates
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM lots l
            JOIN projects p ON l.project_id = p.id
            WHERE l.id = lot_itp_templates.lot_id
            AND p.organization_id IN (
                SELECT organization_id FROM user_organizations
                WHERE user_id = auth.uid()
            )
        )
    );

-- Policy: Users can update assignments for lots in their organization
CREATE POLICY "Users can update lot ITP assignments in their organization" ON lot_itp_templates
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM lots l
            JOIN projects p ON l.project_id = p.id
            WHERE l.id = lot_itp_templates.lot_id
            AND p.organization_id IN (
                SELECT organization_id FROM user_organizations
                WHERE user_id = auth.uid()
            )
        )
    );

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_lot_itp_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_lot_itp_templates_updated_at ON lot_itp_templates;
CREATE TRIGGER update_lot_itp_templates_updated_at
    BEFORE UPDATE ON lot_itp_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_lot_itp_templates_updated_at();

-- Migrate existing data from lots.itp_id to lot_itp_templates (if applicable)
-- This will only run if there are lots with itp_id set but no corresponding junction table entry
INSERT INTO lot_itp_templates (lot_id, itp_template_id, assigned_by, is_active)
SELECT 
    l.id AS lot_id,
    l.itp_id AS itp_template_id,
    l.created_by AS assigned_by,
    true AS is_active
FROM lots l
WHERE l.itp_id IS NOT NULL
AND NOT EXISTS (
    SELECT 1 FROM lot_itp_templates lit
    WHERE lit.lot_id = l.id 
    AND lit.itp_template_id = l.itp_id
)
ON CONFLICT (lot_id, itp_template_id) DO NOTHING;

-- Add comment to table
COMMENT ON TABLE lot_itp_templates IS 'Junction table for many-to-many relationship between lots and ITP templates';