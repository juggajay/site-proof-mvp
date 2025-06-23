-- Cleanup script to start fresh with ITP data
-- WARNING: This will delete existing inspection data!

-- 1. Delete all conformance records
TRUNCATE TABLE conformance_records CASCADE;

-- 2. Delete all lot-ITP assignments
TRUNCATE TABLE lot_itp_templates CASCADE;

-- 3. Delete all ITP instances and their items
TRUNCATE TABLE itp_items CASCADE;
TRUNCATE TABLE itps CASCADE;

-- 4. Remove legacy itp_id from lots table if it exists
ALTER TABLE lots DROP COLUMN IF EXISTS itp_id;

-- 5. Ensure lot_itp_templates has the itp_id column
ALTER TABLE lot_itp_templates 
ADD COLUMN IF NOT EXISTS itp_id UUID REFERENCES itps(id) ON DELETE SET NULL;

-- 6. Add index for better performance
CREATE INDEX IF NOT EXISTS idx_lot_itp_templates_itp_id ON lot_itp_templates(itp_id);

-- 7. Verify the cleanup
SELECT 'Conformance Records' as table_name, COUNT(*) as record_count FROM conformance_records
UNION ALL
SELECT 'Lot ITP Templates', COUNT(*) FROM lot_itp_templates
UNION ALL
SELECT 'ITP Instances', COUNT(*) FROM itps
UNION ALL
SELECT 'ITP Items', COUNT(*) FROM itp_items;

-- 8. Check if create_itp_from_template function exists
SELECT EXISTS (
    SELECT 1 
    FROM pg_proc 
    WHERE proname = 'create_itp_from_template'
) as function_exists;

-- If the function doesn't exist, you need to run FINAL-create-itp-from-template-function.sql