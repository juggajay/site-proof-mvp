# 🔧 Database Fix: Automatic Profile Creation

## Problem
The Civil Q application was experiencing "User profile not found" errors when creating projects because new users weren't getting profile records automatically created.

## Solution
We need to implement a database trigger that automatically creates a profile record whenever a new user signs up.

## 🚀 Quick Fix (Recommended)

### Step 1: Access Supabase SQL Editor
1. Go to your Supabase dashboard
2. Navigate to the SQL Editor
3. Create a new query

### Step 2: Run the Database Fix SQL
Copy and paste this SQL into the Supabase SQL Editor and run it:

```sql
-- Simple Database Fix: Create Profile Trigger
-- Run this in Supabase SQL Editor

-- Create the trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create profiles for existing users who don't have one
INSERT INTO public.profiles (id, email, full_name)
SELECT 
    u.id,
    u.email,
    COALESCE(u.raw_user_meta_data->>'full_name', u.email)
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;
```

## 🧪 Test the Fix

### Step 1: Test User Registration
1. Go to `http://localhost:3000/login`
2. Create a new account using the "Sign up" button
3. Check your email for confirmation (if email confirmation is enabled)

### Step 2: Test Project Creation
1. After signing in, go to the dashboard
2. Try creating a new project
3. The "User profile not found" error should no longer occur

## 📁 Alternative Files Available

If you need different approaches, we've created these files:

1. **`database-fix-simple.sql`** - Simple trigger-only fix
2. **`database-fix-profile-trigger.sql`** - Comprehensive fix with table creation and RLS
3. **`scripts/setup-database.mjs`** - Automated setup script (requires Supabase access)

## 🛡️ What This Fix Does

1. **Automatic Profile Creation**: Creates a profile record for every new user
2. **Backfill Existing Users**: Adds profiles for users who signed up before the fix
3. **Error Prevention**: Eliminates "User profile not found" errors
4. **Data Integrity**: Maintains proper foreign key relationships

## ✅ Verification

After running the SQL, you should see:
- New users automatically get profile records
- Project creation works without errors
- Existing users can create projects
- Robust error handling in the application

## 🔍 Troubleshooting

If you still encounter issues:

1. **Check the trigger exists**:
   ```sql
   SELECT * FROM information_schema.triggers 
   WHERE trigger_name = 'on_auth_user_created';
   ```

2. **Check profiles table**:
   ```sql
   SELECT COUNT(*) FROM public.profiles;
   ```

3. **Check server logs** in the browser console for detailed error messages

## 📞 Support

The application now includes comprehensive error logging. Check the browser console and server logs for detailed error information if issues persist.