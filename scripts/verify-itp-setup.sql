-- Verify ITP setup
-- Run this script to check if the ITP instance creation is properly set up

-- 1. Check if the create_itp_from_template function exists
SELECT EXISTS (
    SELECT 1 
    FROM pg_proc 
    WHERE proname = 'create_itp_from_template'
) as function_exists;

-- 2. Check if lot_itp_templates has the itp_id column
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'lot_itp_templates' 
AND column_name = 'itp_id';

-- 3. Check existing lot_itp_templates records
SELECT 
    lit.id,
    lit.lot_id,
    lit.itp_template_id,
    lit.itp_id,
    l.lot_number,
    t.name as template_name
FROM lot_itp_templates lit
LEFT JOIN lots l ON lit.lot_id = l.id
LEFT JOIN itp_templates t ON lit.itp_template_id = t.id
WHERE lit.is_active = true
LIMIT 10;

-- 4. Check if there are any ITP instances
SELECT COUNT(*) as itp_instance_count FROM itps;

-- 5. Check if there are any ITP items (instance items)
SELECT COUNT(*) as itp_item_count FROM itp_items;

-- 6. For lot 2924e1e1-9d03-4b34-8e25-24cbb4d51836, check what's assigned
SELECT 
    lit.*,
    t.name as template_name,
    i.name as itp_instance_name
FROM lot_itp_templates lit
LEFT JOIN itp_templates t ON lit.itp_template_id = t.id
LEFT JOIN itps i ON lit.itp_id = i.id
WHERE lit.lot_id = '2924e1e1-9d03-4b34-8e25-24cbb4d51836';