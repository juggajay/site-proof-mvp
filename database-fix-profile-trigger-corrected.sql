-- CORRECTED Database Fix: Automatic Profile and Organization Creation Trigger
-- This script creates a trigger that automatically creates an organization and profile
-- for every new user that signs up, preventing "User profile not found" errors

-- This trigger function matches the main database schema from database-schema.sql

-- Create the trigger function that creates both organization and profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  org_id UUID;
  org_name TEXT;
BEGIN
  -- Create a new organization for the user.
  -- The organization name comes from the signup form metadata.
  org_name := COALESCE(NEW.raw_user_meta_data->>'organization_name', 'New Organization');

  INSERT INTO public.organizations (name)
  VALUES (org_name)
  RETURNING id INTO org_id;

  -- Create a profile for the new user and correctly link it to the new organization.
  INSERT INTO public.profiles (id, full_name, organization_id)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User'), org_id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger (drop existing one first to avoid conflicts)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Clean up any existing profiles that don't have organization_id
-- and create organizations for them
DO $$
DECLARE
    profile_record RECORD;
    new_org_id UUID;
BEGIN
    -- Find profiles without organization_id
    FOR profile_record IN 
        SELECT p.id, p.full_name 
        FROM public.profiles p 
        WHERE p.organization_id IS NULL
    LOOP
        -- Create a new organization for this profile
        INSERT INTO public.organizations (name)
        VALUES (COALESCE(profile_record.full_name || '''s Organization', 'Legacy Organization'))
        RETURNING id INTO new_org_id;
        
        -- Update the profile with the new organization_id
        UPDATE public.profiles 
        SET organization_id = new_org_id 
        WHERE id = profile_record.id;
    END LOOP;
END $$;