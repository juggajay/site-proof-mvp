-- Fix missing project_number column in projects table
-- Run this in Supabase SQL Editor

-- 1. Check current table structure
SELECT 'Current projects table structure:' as info;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'projects' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Add the missing project_number column
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS project_number TEXT;

-- 3. Add any other missing columns that might be needed
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS description TEXT;

ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

-- 4. Ensure timestamps exist
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 5. Verify the updated table structure
SELECT 'Updated projects table structure:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'projects' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 6. Ensure RLS is enabled
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- 7. Recreate the RLS policy to ensure it's correct
DROP POLICY IF EXISTS "Users can manage projects in their organization" ON projects;

CREATE POLICY "Users can manage projects in their organization" ON projects
FOR ALL USING (
    organization_id IN (
        SELECT organization_id FROM profiles 
        WHERE id = auth.uid()
    )
);

-- 8. Test that we can insert a project (this will fail if there are still issues)
-- This is just a test - you can remove this section if you prefer
DO $$
BEGIN
    -- Only run this test if there are organizations and profiles
    IF EXISTS (SELECT 1 FROM organizations LIMIT 1) AND 
       EXISTS (SELECT 1 FROM profiles LIMIT 1) THEN
        
        INSERT INTO projects (name, project_number, location, organization_id)
        SELECT 
            'Test Project - ' || NOW()::text,
            'TEST-001',
            'Test Location',
            (SELECT id FROM organizations LIMIT 1)
        WHERE NOT EXISTS (
            SELECT 1 FROM projects WHERE name LIKE 'Test Project -%'
        );
        
        RAISE NOTICE 'Test project insertion successful!';
    ELSE
        RAISE NOTICE 'Skipping test insertion - no organizations or profiles found';
    END IF;
END $$;

-- 9. Show final status
SELECT 
    'projects' as table_name,
    COUNT(*) as total_projects,
    COUNT(CASE WHEN project_number IS NOT NULL THEN 1 END) as projects_with_numbers
FROM projects;

SELECT 'Database fix completed successfully!' as status;