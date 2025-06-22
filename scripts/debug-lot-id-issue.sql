-- Debug script to understand lot ID usage
-- Run this to see the structure of your lots and daily tables

-- Check lots table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns
WHERE table_name = 'lots'
ORDER BY ordinal_position;

-- Check daily_labour table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns
WHERE table_name = 'daily_labour'
AND column_name IN ('id', 'lot_id')
ORDER BY ordinal_position;

-- Check daily_plant table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns
WHERE table_name = 'daily_plant'
AND column_name IN ('id', 'lot_id')
ORDER BY ordinal_position;

-- Show sample lots with their IDs and lot numbers
SELECT id, lot_number, project_id 
FROM lots 
LIMIT 10;

-- Check if there are any daily_labour records
SELECT id, lot_id, worker_name, work_date
FROM daily_labour
LIMIT 5;