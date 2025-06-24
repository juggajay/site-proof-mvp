-- Check the actual columns in the lots table
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM 
    information_schema.columns
WHERE 
    table_name = 'lots'
ORDER BY 
    ordinal_position;