-- Create lot_itp_templates junction table for multiple ITP support
-- This version works with existing numeric IDs in the database

-- Create the junction table if it doesn't exist
CREATE TABLE IF NOT EXISTS lot_itp_templates (
    id SERIAL PRIMARY KEY,
    lot_id UUID NOT NULL,  -- lots.id is UUID
    itp_template_id INTEGER NOT NULL,  -- itp_templates.id is INTEGER (SERIAL)
    assigned_by UUID REFERENCES auth.users(id),
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign key constraints
    CONSTRAINT fk_lot_id FOREIGN KEY (lot_id) REFERENCES lots(id) ON DELETE CASCADE,
    CONSTRAINT fk_itp_template_id FOREIGN KEY (itp_template_id) REFERENCES itp_templates(id) ON DELETE CASCADE,
    
    -- Ensure unique active assignment per lot-template combination
    UNIQUE(lot_id, itp_template_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_lot_itp_templates_lot_id ON lot_itp_templates(lot_id);
CREATE INDEX IF NOT EXISTS idx_lot_itp_templates_template_id ON lot_itp_templates(itp_template_id);
CREATE INDEX IF NOT EXISTS idx_lot_itp_templates_active ON lot_itp_templates(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_lot_itp_templates_assigned_at ON lot_itp_templates(assigned_at);

-- Add RLS policies
ALTER TABLE lot_itp_templates ENABLE ROW LEVEL SECURITY;

-- Policy: Authenticated users can view assignments
CREATE POLICY "Authenticated users can view lot ITP assignments" ON lot_itp_templates
    FOR SELECT
    USING (auth.role() = 'authenticated');

-- Policy: Authenticated users can create assignments
CREATE POLICY "Authenticated users can create lot ITP assignments" ON lot_itp_templates
    FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

-- Policy: Authenticated users can update assignments
CREATE POLICY "Authenticated users can update lot ITP assignments" ON lot_itp_templates
    FOR UPDATE
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

-- Policy: Authenticated users can delete assignments
CREATE POLICY "Authenticated users can delete lot ITP assignments" ON lot_itp_templates
    FOR DELETE
    USING (auth.role() = 'authenticated');

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_lot_itp_templates_updated_at BEFORE UPDATE ON lot_itp_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Migrate existing data from lots.itp_id to lot_itp_templates (if any)
INSERT INTO lot_itp_templates (lot_id, itp_template_id, assigned_by, is_active)
SELECT 
    l.id,
    l.itp_id::INTEGER,  -- Convert UUID to INTEGER if needed
    l.created_by,
    true
FROM lots l
WHERE l.itp_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM lot_itp_templates lit
    WHERE lit.lot_id = l.id 
    AND lit.itp_template_id = l.itp_id::INTEGER
  );

-- Add comment to table
COMMENT ON TABLE lot_itp_templates IS 'Junction table supporting multiple ITP templates per lot with numeric ITP IDs';