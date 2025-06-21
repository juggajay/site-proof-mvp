-- =====================================================
-- CHECK ACTUAL CONSTRAINT DEFINITIONS
-- =====================================================

-- 1. Check the complexity constraint definition
SELECT 
    conname AS constraint_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conname = 'chk_complexity';

-- 2. Check the status constraint definition
SELECT 
    conname AS constraint_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conname = 'chk_itp_status';

-- 3. Check all constraints on itps table
SELECT 
    conname AS constraint_name,
    contype AS constraint_type,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'itps'::regclass
ORDER BY conname;

-- 4. Check actual values in the database
SELECT 
    'Complexity Values' as check_type,
    complexity as value,
    COUNT(*) as count
FROM itps
WHERE complexity IS NOT NULL
GROUP BY complexity

UNION ALL

SELECT 
    'Status Values' as check_type,
    status as value,
    COUNT(*) as count
FROM itps
WHERE status IS NOT NULL
GROUP BY status
ORDER BY check_type, value;

-- 5. Show table structure
\d itps