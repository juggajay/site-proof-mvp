-- FINAL DATABASE FIX: Complete Organization and Profile Management
-- This trigger creates both an organization and profile for new users

-- First, ensure the organizations table exists
CREATE TABLE IF NOT EXISTS public.organizations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on organizations table
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- Add organization_id column to profiles if it doesn't exist
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id);

-- Create RLS policy for organizations
DROP POLICY IF EXISTS "Users can view own organization" ON public.organizations;
CREATE POLICY "Users can view own organization" ON public.organizations
    FOR SELECT USING (
        id IN (
            SELECT organization_id FROM public.profiles WHERE id = auth.uid()
        )
    );

-- Create the final, correct trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  org_id UUID;
  org_name TEXT;
BEGIN
  -- Extract organization name from the user's metadata,
  -- which we will pass from our signup form.
  -- Fallback to a default name if it's missing.
  org_name := NEW.raw_user_meta_data->>'organization_name';
  IF org_name IS NULL OR org_name = '' THEN
    org_name := NEW.email || '''s Organization';
  END IF;

  -- Create a new organization for the user.
  INSERT INTO public.organizations (name)
  VALUES (org_name)
  RETURNING id INTO org_id;

  -- Create a profile for the new user, linking their ID, email,
  -- full name, and the new organization_id.
  INSERT INTO public.profiles (id, email, full_name, organization_id)
  VALUES (
    NEW.id, 
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    org_id
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop the old trigger if it exists, then create the new one.
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update existing profiles to have organizations if they don't already
DO $$
DECLARE
    profile_record RECORD;
    org_id UUID;
BEGIN
    FOR profile_record IN 
        SELECT id, email FROM public.profiles WHERE organization_id IS NULL
    LOOP
        -- Create an organization for this existing user
        INSERT INTO public.organizations (name)
        VALUES (profile_record.email || '''s Organization')
        RETURNING id INTO org_id;
        
        -- Update the profile with the new organization_id
        UPDATE public.profiles 
        SET organization_id = org_id 
        WHERE id = profile_record.id;
    END LOOP;
END $$;