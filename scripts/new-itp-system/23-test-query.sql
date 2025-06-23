-- Test the exact query the app is using

-- 1. Basic query with status filter (what the app uses)
SELECT 
    'With Status Filter' as query_type,
    COUNT(*) as count
FROM lot_itp_assignments
WHERE lot_id = '3fd647f4-8ca8-487f-85a8-627bf3b2a120'
AND status IN ('pending', 'in_progress', 'completed', 'approved');

-- 2. Without status filter
SELECT 
    'Without Status Filter' as query_type,
    COUNT(*) as count
FROM lot_itp_assignments
WHERE lot_id = '3fd647f4-8ca8-487f-85a8-627bf3b2a120';

-- 3. Check all statuses
SELECT 
    status,
    COUNT(*) as count
FROM lot_itp_assignments
WHERE lot_id = '3fd647f4-8ca8-487f-85a8-627bf3b2a120'
GROUP BY status;

-- 4. Check data types
SELECT 
    'Data Type Check' as info,
    pg_typeof(lot_id) as lot_id_type,
    pg_typeof(status) as status_type,
    lot_id,
    status
FROM lot_itp_assignments
WHERE lot_id = '3fd647f4-8ca8-487f-85a8-627bf3b2a120'
LIMIT 1;

-- 5. Try different lot_id formats
SELECT 'UUID cast' as test, COUNT(*) FROM lot_itp_assignments WHERE lot_id = '3fd647f4-8ca8-487f-85a8-627bf3b2a120'::uuid
UNION ALL
SELECT 'String' as test, COUNT(*) FROM lot_itp_assignments WHERE lot_id = '3fd647f4-8ca8-487f-85a8-627bf3b2a120'
UNION ALL  
SELECT 'Lower' as test, COUNT(*) FROM lot_itp_assignments WHERE LOWER(lot_id::text) = LOWER('3fd647f4-8ca8-487f-85a8-627bf3b2a120');