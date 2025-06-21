-- =====================================================
-- CHECK CONSTRAINT DEFINITION
-- This script reveals what the constraint ACTUALLY checks
-- =====================================================

-- 1. Get the exact constraint definition
SELECT 
    conname AS constraint_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conname = 'chk_complexity'
    AND conrelid = 'itps'::regclass;

-- 2. Check ALL constraints on the itps table
SELECT 
    conname AS constraint_name,
    contype AS constraint_type,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'itps'::regclass
ORDER BY conname;

-- 3. Check if there's a complexity-related enum type
SELECT 
    n.nspname as schema,
    t.typname as enum_name,
    array_agg(e.enumlabel ORDER BY e.enumsortorder) as enum_values
FROM pg_type t
JOIN pg_enum e ON t.oid = e.enumtypid
JOIN pg_namespace n ON n.oid = t.typnamespace
WHERE t.typname LIKE '%complex%' 
   OR t.typname LIKE '%itp%'
GROUP BY n.nspname, t.typname;

-- 4. Check the actual column definition
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    udt_name
FROM information_schema.columns
WHERE table_name = 'itps' 
    AND column_name = 'complexity';

-- 5. Look for any domain types
SELECT 
    domain_name,
    data_type,
    domain_default
FROM information_schema.domains
WHERE domain_schema = 'public'
    AND (domain_name LIKE '%complex%' OR domain_name LIKE '%itp%');

-- 6. Check if there's a lookup table for complexity
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
    AND (table_name LIKE '%complex%' OR table_name LIKE '%level%')
ORDER BY table_name;

-- 7. Get a sample row to see exact values
SELECT 
    id,
    complexity,
    LENGTH(complexity) as complexity_length,
    '>' || complexity || '<' as complexity_with_markers,
    complexity::bytea as complexity_bytes
FROM itps
WHERE complexity IS NOT NULL
LIMIT 5;

-- 8. Check if there are hidden characters or encoding issues
SELECT 
    DISTINCT 
    complexity,
    LENGTH(complexity) as length,
    MD5(complexity) as hash
FROM itps
WHERE complexity IS NOT NULL
ORDER BY complexity;

-- 9. Try to find what values actually work by checking existing data
SELECT 
    complexity,
    COUNT(*) as count,
    MIN(created_at) as first_created,
    MAX(created_at) as last_created
FROM itps
WHERE complexity IS NOT NULL
GROUP BY complexity
ORDER BY count DESC;