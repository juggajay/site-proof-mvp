-- Add itp_id column to lot_itp_templates table
-- This allows storing the ITP instance ID created from the template

-- Add the itp_id column
ALTER TABLE lot_itp_templates 
ADD COLUMN IF NOT EXISTS itp_id UUID REFERENCES itps(id) ON DELETE SET NULL;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_lot_itp_templates_itp_id ON lot_itp_templates(itp_id);

-- Add comment to explain the column
COMMENT ON COLUMN lot_itp_templates.itp_id IS 'References the ITP instance created from this template for this lot';

-- Update the table comment
COMMENT ON TABLE lot_itp_templates IS 'Junction table supporting multiple ITP templates per lot with UUID IDs. Each assignment can create an ITP instance.';