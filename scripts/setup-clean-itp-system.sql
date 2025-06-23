-- Setup script for a clean ITP system
-- Run this after cleanup-itp-data.sql

-- 1. Ensure the create_itp_from_template function exists
-- If this returns false, you need to run FINAL-create-itp-from-template-function.sql first
SELECT EXISTS (
    SELECT 1 
    FROM pg_proc 
    WHERE proname = 'create_itp_from_template'
) as function_exists;

-- 2. Verify lot_itp_templates structure
SELECT 
    column_name, 
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'lot_itp_templates'
ORDER BY ordinal_position;

-- 3. Verify conformance_records can reference itp_items
SELECT 
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'conformance_records'
    AND tc.constraint_type = 'FOREIGN KEY'
    AND kcu.column_name = 'itp_item_id';

-- 4. Create a helper view to see ITP assignment status
CREATE OR REPLACE VIEW v_lot_itp_status AS
SELECT 
    l.id as lot_id,
    l.lot_number,
    l.description as lot_description,
    t.id as template_id,
    t.name as template_name,
    lit.itp_id,
    i.name as itp_instance_name,
    lit.is_active,
    lit.assigned_at,
    (SELECT COUNT(*) FROM itp_items WHERE itp_id = lit.itp_id) as item_count,
    (SELECT COUNT(*) 
     FROM conformance_records cr 
     JOIN itp_items ii ON cr.itp_item_id = ii.id 
     WHERE ii.itp_id = lit.itp_id) as completed_items
FROM lots l
LEFT JOIN lot_itp_templates lit ON l.id = lit.lot_id AND lit.is_active = true
LEFT JOIN itp_templates t ON lit.itp_template_id = t.id
LEFT JOIN itps i ON lit.itp_id = i.id
ORDER BY l.lot_number;

-- 5. Grant permissions on the view
GRANT SELECT ON v_lot_itp_status TO authenticated;

SELECT 'Setup complete! You can now:' as message
UNION ALL
SELECT '1. Assign ITP templates to lots (this will create ITP instances automatically)'
UNION ALL
SELECT '2. View assignment status with: SELECT * FROM v_lot_itp_status'
UNION ALL
SELECT '3. Conformance records will be saved against ITP instance items';