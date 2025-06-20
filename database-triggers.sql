-- Database triggers for Site Proof MVP

-- Function to handle new user creation
-- This trigger automatically creates a profile and organization for new users
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    org_id INTEGER;
    org_slug VARCHAR(100);
BEGIN
    -- Create a profile for the new user
    INSERT INTO profiles (user_id, timezone)
    VALUES (NEW.id, 'UTC');
    
    -- Generate a unique organization slug
    org_slug := 'org-' || NEW.id || '-' || EXTRACT(EPOCH FROM NOW())::INTEGER;
    
    -- Create a default organization for the user
    INSERT INTO organizations (name, slug, created_by)
    VALUES (
        SPLIT_PART(NEW.email, '@', 1) || '''s Organization',
        org_slug,
        NEW.id
    )
    RETURNING id INTO org_id;
    
    -- Link the user to their organization as owner
    INSERT INTO user_organizations (user_id, organization_id, role, status)
    VALUES (NEW.id, org_id, 'owner', 'active');
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log the error but don't prevent user creation
        RAISE WARNING 'Error in handle_new_user trigger: %', SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger on user insert
DROP TRIGGER IF EXISTS on_auth_user_created ON users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Add this to the main schema file