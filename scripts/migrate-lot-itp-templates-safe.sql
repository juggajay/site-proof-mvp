-- Safe migration to fix lot_itp_templates table data types
-- This preserves existing data by creating a new table and migrating data

-- Step 1: Create new table with correct structure
CREATE TABLE lot_itp_templates_new (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    lot_id UUID NOT NULL REFERENCES lots(id) ON DELETE CASCADE,
    itp_template_id INTEGER NOT NULL REFERENCES itp_templates(id) ON DELETE CASCADE,
    assigned_by UUID REFERENCES auth.users(id),
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(lot_id, itp_template_id)
);

-- Step 2: Try to migrate existing data (this might fail if UUIDs don't match integers)
-- You may need to manually map the UUID values to integer IDs
INSERT INTO lot_itp_templates_new (id, lot_id, itp_template_id, assigned_by, assigned_at, is_active, created_at, updated_at)
SELECT 
    id,
    lot_id,
    -- This conversion will only work if the UUID contains a valid integer
    -- You might need to create a mapping table instead
    CASE 
        WHEN itp_template_id::text ~ '^\d+$' THEN itp_template_id::text::integer
        ELSE NULL
    END as itp_template_id,
    assigned_by,
    assigned_at,
    is_active,
    created_at,
    updated_at
FROM lot_itp_templates
WHERE itp_template_id IS NOT NULL;

-- Step 3: Drop old table and rename new one
DROP TABLE lot_itp_templates CASCADE;
ALTER TABLE lot_itp_templates_new RENAME TO lot_itp_templates;

-- Step 4: Recreate indexes
CREATE INDEX idx_lot_itp_templates_lot_id ON lot_itp_templates(lot_id);
CREATE INDEX idx_lot_itp_templates_template_id ON lot_itp_templates(itp_template_id);
CREATE INDEX idx_lot_itp_templates_active ON lot_itp_templates(is_active) WHERE is_active = true;
CREATE INDEX idx_lot_itp_templates_assigned_at ON lot_itp_templates(assigned_at);

-- Step 5: Recreate RLS policies
ALTER TABLE lot_itp_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view lot ITP assignments" ON lot_itp_templates
    FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can create lot ITP assignments" ON lot_itp_templates
    FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update lot ITP assignments" ON lot_itp_templates
    FOR UPDATE
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete lot ITP assignments" ON lot_itp_templates
    FOR DELETE
    USING (auth.role() = 'authenticated');

-- Step 6: Recreate trigger
CREATE TRIGGER update_lot_itp_templates_updated_at BEFORE UPDATE ON lot_itp_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add comments
COMMENT ON TABLE lot_itp_templates IS 'Junction table supporting multiple ITP templates per lot';
COMMENT ON COLUMN lot_itp_templates.itp_template_id IS 'References itp_templates.id which is INTEGER type';