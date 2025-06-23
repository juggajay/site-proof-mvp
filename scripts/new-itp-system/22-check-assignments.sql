-- =====================================================
-- CHECK WHAT ASSIGNMENTS EXIST
-- =====================================================

-- 1. Check assignments for the specific lot
SELECT 
    'Assignments for lot 2924e1e1-9d03-4b34-8e25-24cbb4d51836' as info,
    a.*,
    t.name as template_name,
    t.category as template_category
FROM lot_itp_assignments a
LEFT JOIN itp_templates t ON t.id = a.template_id
WHERE a.lot_id = '2924e1e1-9d03-4b34-8e25-24cbb4d51836';

-- 2. Check all assignments
SELECT 
    'All Assignments' as info,
    a.id as assignment_id,
    a.lot_id,
    a.template_id,
    a.status,
    a.sequence_number,
    a.created_at,
    t.name as template_name,
    l.lot_number,
    l.description as lot_description
FROM lot_itp_assignments a
LEFT JOIN itp_templates t ON t.id = a.template_id
LEFT JOIN lots l ON l.id = a.lot_id
ORDER BY a.created_at DESC
LIMIT 10;

-- 3. Check if the specific lot exists
SELECT 
    'Lot Check' as info,
    id,
    lot_number,
    description,
    status,
    created_at
FROM lots
WHERE id = '2924e1e1-9d03-4b34-8e25-24cbb4d51836';

-- 4. Check template items for assigned templates
SELECT 
    'Template Items for Assigned Templates' as info,
    ti.template_id,
    t.name as template_name,
    COUNT(ti.id) as item_count
FROM lot_itp_assignments a
JOIN itp_templates t ON t.id = a.template_id
JOIN itp_template_items ti ON ti.template_id = t.id
WHERE a.lot_id = '2924e1e1-9d03-4b34-8e25-24cbb4d51836'
GROUP BY ti.template_id, t.name;

-- 5. Check inspection records
SELECT 
    'Inspection Records' as info,
    COUNT(*) as record_count
FROM itp_inspection_records ir
JOIN lot_itp_assignments a ON a.id = ir.assignment_id
WHERE a.lot_id = '2924e1e1-9d03-4b34-8e25-24cbb4d51836';

-- 6. Raw check - what's in lot_itp_assignments
SELECT COUNT(*) as total_assignments FROM lot_itp_assignments;
SELECT COUNT(*) as assignments_for_this_lot 
FROM lot_itp_assignments 
WHERE lot_id = '2924e1e1-9d03-4b34-8e25-24cbb4d51836';