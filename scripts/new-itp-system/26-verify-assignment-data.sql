-- Verify assignment data for lot 156f47f9-66d4-4973-8a0d-05765fa43387

-- 1. Show all assignments for this lot
SELECT 
    'Assignments' as section,
    a.id,
    a.template_id,
    t.name as template_name,
    a.status,
    a.created_at
FROM lot_itp_assignments a
LEFT JOIN itp_templates t ON t.id = a.template_id
WHERE a.lot_id = '156f47f9-66d4-4973-8a0d-05765fa43387'
ORDER BY a.created_at DESC;

-- 2. Show inspection records for these assignments
SELECT 
    'Inspection Records' as section,
    r.id,
    r.assignment_id,
    ti.description as item_description,
    r.status,
    r.created_at
FROM lot_itp_assignments a
JOIN itp_inspection_records r ON r.assignment_id = a.id
JOIN itp_template_items ti ON ti.id = r.template_item_id
WHERE a.lot_id = '156f47f9-66d4-4973-8a0d-05765fa43387'
ORDER BY a.created_at DESC, ti.sort_order
LIMIT 20;

-- 3. Count summary
SELECT 
    'Summary' as section,
    COUNT(DISTINCT a.id) as assignments,
    COUNT(DISTINCT r.id) as inspection_records,
    COUNT(DISTINCT a.template_id) as unique_templates
FROM lot_itp_assignments a
LEFT JOIN itp_inspection_records r ON r.assignment_id = a.id
WHERE a.lot_id = '156f47f9-66d4-4973-8a0d-05765fa43387';

-- 4. Compare with other lots that work
SELECT 
    'Working Lot Comparison' as section,
    l.lot_number,
    l.id as lot_id,
    COUNT(DISTINCT a.id) as assignments,
    COUNT(DISTINCT r.id) as inspection_records
FROM lots l
LEFT JOIN lot_itp_assignments a ON a.lot_id = l.id
LEFT JOIN itp_inspection_records r ON r.assignment_id = a.id
WHERE l.id IN (
    '3fd647f4-8ca8-487f-85a8-627bf3b2a120', -- Working lot
    '156f47f9-66d4-4973-8a0d-05765fa43387'  -- Problematic lot
)
GROUP BY l.id, l.lot_number
ORDER BY l.lot_number;