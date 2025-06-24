-- Check assignments for lot 156f47f9-66d4-4973-8a0d-05765fa43387
SELECT 
    'Assignment Check' as query,
    a.*,
    t.name as template_name
FROM lot_itp_assignments a
LEFT JOIN itp_templates t ON t.id = a.template_id
WHERE a.lot_id = '156f47f9-66d4-4973-8a0d-05765fa43387'
ORDER BY a.created_at DESC;

-- Check if there's a type mismatch
SELECT 
    'Type Check' as query,
    pg_typeof(lot_id) as lot_id_type,
    lot_id,
    LENGTH(lot_id::text) as lot_id_length
FROM lot_itp_assignments
WHERE lot_id::text LIKE '%156f47f9%'
LIMIT 5;

-- Count by status
SELECT 
    'Status Summary' as query,
    status,
    COUNT(*) as count
FROM lot_itp_assignments
WHERE lot_id = '156f47f9-66d4-4973-8a0d-05765fa43387'
GROUP BY status;

-- Check most recent assignments
SELECT 
    'Recent Assignments' as query,
    lot_id,
    template_id,
    status,
    created_at
FROM lot_itp_assignments
ORDER BY created_at DESC
LIMIT 10;