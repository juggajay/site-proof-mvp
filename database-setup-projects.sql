-- Database setup for Site-Proof MVP - Projects Table
-- Run this in your Supabase SQL Editor

-- Create projects table
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

-- Enable RLS on projects table
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for projects
CREATE POLICY "Users can manage projects in their organization" ON projects
FOR ALL USING (
    organization_id IN (
        SELECT organization_id FROM profiles 
        WHERE id = auth.uid()
    )
);

-- Create organizations table if it doesn't exist
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on organizations table
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for organizations
CREATE POLICY "Users can view their organization" ON organizations
FOR SELECT USING (
    id IN (
        SELECT organization_id FROM profiles 
        WHERE id = auth.uid()
    )
);

-- Create profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    full_name TEXT,
    organization_id UUID REFERENCES organizations(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for profiles
CREATE POLICY "Users can view and update their own profile" ON profiles
FOR ALL USING (auth.uid() = id);

-- Create lots table if it doesn't exist
CREATE TABLE IF NOT EXISTS lots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lot_number TEXT NOT NULL,
    description TEXT,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    itp_id UUID REFERENCES itps(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on lots table
ALTER TABLE lots ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for lots
CREATE POLICY "Users can manage lots in their organization projects" ON lots
FOR ALL USING (
    project_id IN (
        SELECT p.id FROM projects p
        JOIN profiles pr ON pr.organization_id = p.organization_id
        WHERE pr.id = auth.uid()
    )
);

-- Create ITPs table if it doesn't exist
CREATE TABLE IF NOT EXISTS itps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    organization_id UUID REFERENCES organizations(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on ITPs table
ALTER TABLE itps ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for ITPs
CREATE POLICY "Users can manage ITPs in their organization" ON itps
FOR ALL USING (
    organization_id IN (
        SELECT organization_id FROM profiles 
        WHERE id = auth.uid()
    )
);

-- Create sample organization and user profile for testing
DO $$
DECLARE
    org_id UUID;
    user_id UUID;
BEGIN
    -- Insert sample organization
    INSERT INTO organizations (name) 
    VALUES ('Sample Construction Company') 
    ON CONFLICT DO NOTHING
    RETURNING id INTO org_id;
    
    -- If no org_id returned (conflict), get existing one
    IF org_id IS NULL THEN
        SELECT id INTO org_id FROM organizations WHERE name = 'Sample Construction Company' LIMIT 1;
    END IF;
    
    -- Create sample ITP
    INSERT INTO itps (title, description, organization_id)
    VALUES ('Standard Construction ITP', 'Standard inspection and test plan for construction projects', org_id)
    ON CONFLICT DO NOTHING;
    
END $$;

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    default_org_id UUID;
BEGIN
    -- Get the default organization (first one)
    SELECT id INTO default_org_id FROM organizations LIMIT 1;
    
    -- Insert profile for new user
    INSERT INTO profiles (id, email, full_name, organization_id)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        default_org_id
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user registration
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- Refresh the schema cache
NOTIFY pgrst, 'reload schema';