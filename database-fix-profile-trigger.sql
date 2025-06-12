-- This function will be triggered after a new user signs up.
-- It ensures a corresponding profile record is created.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert a new row into the public.profiles table
  -- with the ID and email from the new auth.users record.
  INSERT INTO public.profiles (id, email)
  VALUES (new.id, new.email);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger that calls the function
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Add a comment to confirm the trigger is in place
COMMENT ON TRIGGER on_auth_user_created ON auth.users IS 'Ensures a profile is created for every new user.';

-- Additionally, ensure the profiles table has an email column if it doesn't
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS email TEXT;