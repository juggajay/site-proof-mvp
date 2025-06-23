-- Check the assignment that was just created
SELECT 
    a.*,
    t.name as template_name
FROM lot_itp_assignments a
LEFT JOIN itp_templates t ON t.id = a.template_id
WHERE a.lot_id = '3fd647f4-8ca8-487f-85a8-627bf3b2a120'
ORDER BY a.created_at DESC;

-- Check if it has a status value
SELECT 
    id,
    lot_id,
    template_id,
    status,
    CASE 
        WHEN status IS NULL THEN 'NULL status'
        WHEN status = '' THEN 'Empty string'
        WHEN status IN ('pending', 'in_progress', 'completed', 'approved') THEN 'Valid status'
        ELSE 'Invalid status: ' || status
    END as status_check,
    created_at
FROM lot_itp_assignments
WHERE lot_id = '3fd647f4-8ca8-487f-85a8-627bf3b2a120';