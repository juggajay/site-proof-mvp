# Database Setup

This application now supports both Supabase (recommended for production) and mock data (fallback for development).

## Option 1: Supabase Setup (Recommended)

1. Go to [supabase.com](https://supabase.com) and create a free account
2. Create a new project
3. Go to Settings → API to get your:
   - Project URL
   - Public anon key

4. Create a `.env.local` file in the project root:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
JWT_SECRET=your-secret-key-change-in-production
```

5. Run the SQL schema (you can copy it from the existing `types/database.ts` file)

## Option 2: Mock Data (Current)

If you don't set up Supabase credentials, the app will automatically use mock data. This works locally but has limitations on serverless platforms like Vercel.

## Database Schema

The main tables you need in Supabase:

```sql
-- Create tables matching the TypeScript types
CREATE TABLE organizations (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  created_by INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE profiles (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  first_name TEXT,
  last_name TEXT,
  avatar_url TEXT,
  phone TEXT,
  timezone TEXT DEFAULT 'UTC',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  project_number TEXT,
  description TEXT,
  location TEXT,
  start_date DATE,
  end_date DATE,
  status TEXT NOT NULL DEFAULT 'active',
  organization_id INTEGER REFERENCES organizations(id),
  created_by INTEGER NOT NULL,
  project_manager_id INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE lots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id),
  lot_number TEXT NOT NULL,
  description TEXT,
  location_description TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  itp_template_id UUID,
  assigned_inspector_id INTEGER,
  created_by INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Testing the Fix

1. With Supabase configured, projects will persist between requests
2. Without Supabase, projects work locally but may not persist on Vercel
3. The application automatically detects which mode to use

## Deployment

For Vercel deployment, add the environment variables in your Vercel dashboard under Settings → Environment Variables.