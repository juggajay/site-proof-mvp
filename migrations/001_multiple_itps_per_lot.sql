-- Migration: Enable multiple ITPs per lot
-- This migration creates a junction table to support many-to-many relationships
-- between lots and ITP templates, allowing multiple ITPs to be assigned to a single lot.

-- Step 1: Create the junction table for lot-ITP relationships
CREATE TABLE IF NOT EXISTS lot_itp_templates (
    id SERIAL PRIMARY KEY,
    lot_id INTEGER REFERENCES lots(id) ON DELETE CASCADE,
    itp_template_id INTEGER REFERENCES itp_templates(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    assigned_by INTEGER REFERENCES users(id),
    is_active BOOLEAN DEFAULT TRUE,
    completion_percentage DECIMAL(5,2) DEFAULT 0,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(lot_id, itp_template_id)
);

-- Step 2: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_lot_itp_templates_lot_id ON lot_itp_templates(lot_id);
CREATE INDEX IF NOT EXISTS idx_lot_itp_templates_itp_id ON lot_itp_templates(itp_template_id);
CREATE INDEX IF NOT EXISTS idx_lot_itp_templates_active ON lot_itp_templates(is_active);

-- Step 3: Add update trigger
CREATE TRIGGER lot_itp_templates_updated_at 
    BEFORE UPDATE ON lot_itp_templates 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Step 4: Migrate existing single ITP assignments to the junction table
-- This preserves existing data by copying single ITP assignments to the new table
INSERT INTO lot_itp_templates (lot_id, itp_template_id, assigned_by, is_active, created_at, updated_at)
SELECT 
    id as lot_id, 
    itp_template_id, 
    created_by as assigned_by, 
    TRUE as is_active,
    COALESCE(created_at, CURRENT_TIMESTAMP) as created_at,
    COALESCE(updated_at, CURRENT_TIMESTAMP) as updated_at
FROM lots
WHERE itp_template_id IS NOT NULL
ON CONFLICT (lot_id, itp_template_id) DO NOTHING;

-- Step 5: (Optional) After verifying the migration, you can drop the old column
-- WARNING: Only run this after confirming all data has been migrated successfully
-- ALTER TABLE lots DROP COLUMN itp_template_id;

-- To rollback this migration:
-- DROP TABLE lot_itp_templates CASCADE;