# Database Setup Guide

This guide explains how to set up the Civil-Q database with all necessary tables and sample data.

## Setup Steps

### 1. Initial Database Schema
Run the main schema setup script first:
```sql
-- File: supabase-setup-fixed.sql
-- This creates all tables, RLS policies, and basic structure
```

### 2. Sample Data (Optional)
Add sample projects, lots, and basic ITP templates:
```sql
-- File: supabase-sample-data.sql
-- This adds demo projects and 4 basic ITP templates
```

### 3. Additional ITP Templates (Recommended)
Add 5 more industry-standard ITP templates for a complete system:
```sql
-- File: supabase-additional-itp-templates.sql
-- This adds 5 professional ITP templates for Australian civil construction
```

## How to Run SQL Scripts

### Via Supabase Dashboard:
1. Go to your Supabase Project Dashboard
2. Navigate to **SQL Editor**
3. Click **"+ New query"**
4. Copy and paste the script content
5. Click **"RUN"**

### Via Command Line:
```bash
# If you have psql installed and configured
psql -h your-supabase-host -U postgres -d postgres -f supabase-setup-fixed.sql
psql -h your-supabase-host -U postgres -d postgres -f supabase-sample-data.sql
psql -h your-supabase-host -U postgres -d postgres -f supabase-additional-itp-templates.sql
```

## Complete ITP Template Collection

After running all scripts, you'll have **9 professional ITP templates**:

### Basic Templates (from sample data):
1. **Highway Concrete Pour Inspection** - Quality control for concrete pours
2. **Asphalt Paving Quality Control** - Asphalt placement and compaction
3. **Earthworks Compaction Testing** - Soil compaction verification
4. **Drainage Installation Inspection** - Pipe and drainage system QA

### Advanced Templates (from additional templates):
5. **Conduit & Pit Installation** - Electrical/communications infrastructure
6. **Subgrade Preparation** - Foundation layer preparation and approval
7. **Pavement Layer - Unbound Granular** - DGB20/DGS40 material placement
8. **Proof Rolling Inspection** - Subgrade stability testing
9. **Topsoiling & Seeding** - Landscape finishing and rehabilitation

## Template Features

Each ITP template includes:
- **Multiple item types**: Pass/Fail, Text Input, Numeric measurements
- **Logical sequence**: Items ordered by typical workflow
- **Industry standards**: Based on Australian civil construction practices
- **Comprehensive coverage**: All critical quality control points

## Environment Variables

Ensure these are set in your `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Verification

After setup, verify the installation:
1. Check that all tables exist in Supabase
2. Confirm ITP templates are visible in the application
3. Test creating a new project and lot
4. Try assigning an ITP to verify the workflow

## Troubleshooting

- **Permission errors**: Ensure RLS policies are properly configured
- **Missing templates**: Check that all SQL scripts ran successfully
- **Connection issues**: Verify environment variables are correct