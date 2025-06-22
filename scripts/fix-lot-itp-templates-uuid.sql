-- Fix lot_itp_templates table to use UUID for itp_template_id
-- This script is for when itp_templates.id is actually UUID, not INTEGER

-- First, drop the existing table
DROP TABLE IF EXISTS lot_itp_templates CASCADE;

-- Recreate the table with UUID types for both foreign keys
CREATE TABLE lot_itp_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    lot_id UUID NOT NULL REFERENCES lots(id) ON DELETE CASCADE,
    itp_template_id UUID NOT NULL REFERENCES itp_templates(id) ON DELETE CASCADE,  -- UUID to match itp_templates.id
    assigned_by UUID REFERENCES auth.users(id),
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Ensure unique active assignment per lot-template combination
    UNIQUE(lot_id, itp_template_id)
);

-- Create indexes for better performance
CREATE INDEX idx_lot_itp_templates_lot_id ON lot_itp_templates(lot_id);
CREATE INDEX idx_lot_itp_templates_template_id ON lot_itp_templates(itp_template_id);
CREATE INDEX idx_lot_itp_templates_active ON lot_itp_templates(is_active) WHERE is_active = true;
CREATE INDEX idx_lot_itp_templates_assigned_at ON lot_itp_templates(assigned_at);

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
-- Check if function already exists, if not create it
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
        CREATE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $func$
        BEGIN
            NEW.updated_at = CURRENT_TIMESTAMP;
            RETURN NEW;
        END;
        $func$ LANGUAGE plpgsql;
    END IF;
END $$;

CREATE TRIGGER update_lot_itp_templates_updated_at BEFORE UPDATE ON lot_itp_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add comment to table
COMMENT ON TABLE lot_itp_templates IS 'Junction table supporting multiple ITP templates per lot with UUID IDs';
COMMENT ON COLUMN lot_itp_templates.itp_template_id IS 'References itp_templates.id which is UUID type';