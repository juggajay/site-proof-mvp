-- Quick database verification and setup for project creation
-- Run this in Supabase SQL Editor to ensure all required tables exist

-- 1. Check if projects table exists
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_schema = 'public'
   AND table_name = 'projects'
) AS projects_table_exists;

-- 2. Create projects table if it doesn't exist
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    project_number TEXT,
    location TEXT,
    description TEXT,
    organization_id UUID REFERENCES organizations(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Enable RLS on projects table
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- 4. Drop existing policy if it exists and create new one
DROP POLICY IF EXISTS "Users can manage projects in their organization" ON projects;

CREATE POLICY "Users can manage projects in their organization" ON projects
FOR ALL USING (
    organization_id IN (
        SELECT organization_id FROM profiles 
        WHERE id = auth.uid()
    )
);

-- 5. Check if organizations table exists
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_schema = 'public'
   AND table_name = 'organizations'
) AS organizations_table_exists;

-- 6. Create organizations table if it doesn't exist
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Enable RLS on organizations table
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- 8. Create organization policy
DROP POLICY IF EXISTS "Users can view their organization" ON organizations;

CREATE POLICY "Users can view their organization" ON organizations
FOR SELECT USING (
    id IN (
        SELECT organization_id FROM profiles 
        WHERE id = auth.uid()
    )
);

-- 9. Check if profiles table exists
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_schema = 'public'
   AND table_name = 'profiles'
) AS profiles_table_exists;

-- 10. Create profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    full_name TEXT,
    organization_id UUID REFERENCES organizations(id),
    role TEXT DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 11. Enable RLS on profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 12. Create profile policies
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

CREATE POLICY "Users can view own profile" ON profiles
FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
FOR UPDATE USING (auth.uid() = id);

-- 13. Create a default organization if none exists
INSERT INTO organizations (name) 
SELECT 'Default Organization'
WHERE NOT EXISTS (SELECT 1 FROM organizations LIMIT 1);

-- 14. Create or update user profile with organization assignment
-- This will be handled by a trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    default_org_id UUID;
BEGIN
    -- Get the default organization ID
    SELECT id INTO default_org_id FROM organizations LIMIT 1;
    
    -- Insert profile for new user
    INSERT INTO public.profiles (id, email, full_name, organization_id)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        default_org_id
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 15. Create trigger for new user registration
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 16. Update existing users without profiles
INSERT INTO profiles (id, email, full_name, organization_id)
SELECT 
    u.id,
    u.email,
    COALESCE(u.raw_user_meta_data->>'full_name', u.email),
    (SELECT id FROM organizations LIMIT 1)
FROM auth.users u
WHERE NOT EXISTS (
    SELECT 1 FROM profiles p WHERE p.id = u.id
);

-- 17. Final verification - show table status
SELECT 
    'projects' as table_name,
    COUNT(*) as row_count,
    (SELECT COUNT(*) FROM information_schema.table_constraints 
     WHERE table_name = 'projects' AND constraint_type = 'FOREIGN KEY') as foreign_keys
FROM projects
UNION ALL
SELECT 
    'organizations' as table_name,
    COUNT(*) as row_count,
    (SELECT COUNT(*) FROM information_schema.table_constraints 
     WHERE table_name = 'organizations' AND constraint_type = 'FOREIGN KEY') as foreign_keys
FROM organizations
UNION ALL
SELECT 
    'profiles' as table_name,
    COUNT(*) as row_count,
    (SELECT COUNT(*) FROM information_schema.table_constraints 
     WHERE table_name = 'profiles' AND constraint_type = 'FOREIGN KEY') as foreign_keys
FROM profiles;

-- Success message
SELECT 'Database setup completed successfully! You can now test project creation.' as status;