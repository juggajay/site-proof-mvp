# Database Setup Guide for Site-Proof MVP

This guide will help you set up the complete database schema for the Site-Proof MVP application.

## 🚀 Quick Setup

### Step 1: Run the Complete Database Setup

1. **Open your Supabase Dashboard**
   - Go to [supabase.com](https://supabase.com)
   - Navigate to your project
   - Click on "SQL Editor" in the left sidebar

2. **Execute the Setup Script**
   - Copy the entire contents of `supabase-complete-setup.sql`
   - Paste it into the SQL Editor
   - Click "Run" to execute

### Step 2: Verify Setup

After running the script, you should see:
```
Database setup completed successfully!
Organizations: 1
Projects: 1  
Lots: 1
ITPs: 3
ITP Items: 2
```

## 📊 Database Schema Overview

### Core Tables
- **organizations** - Company/organization data
- **projects** - Construction projects
- **lots** - Project lots/sections
- **profiles** - User profiles (enhanced with certifications, workload, role)

### ITP System Tables
- **itps** - Inspection & Test Plans
- **itp_items** - Individual checklist items within ITPs
- **itp_assignments** - Assignments of ITPs to lots
- **conformance_records** - QA inspection results

### Supporting Tables
- **attachments** - File uploads and documents
- **activity_logs** - Audit trail for all actions
- **notifications** - User notifications

## 🔐 Security Features

### Row Level Security (RLS)
- All tables have RLS enabled
- Users can only access data from their organization
- Proper policies for SELECT, INSERT, UPDATE operations

### Audit Trail
- All major actions are logged in `activity_logs`
- Automatic timestamps on all records
- User tracking for accountability

## 🎯 Sample Data Included

The setup includes sample data for testing:

### Organization
- **Highway Construction Co.** (ID: `550e8400-e29b-41d4-a716-446655440000`)

### Project
- **Highway 101 Expansion** - Major highway expansion project

### Lot
- **Daily Lot Report - 33** - Foundation work for bridge section

### ITPs
1. **Highway Concrete Pour Inspection** (Structural, 2 days, moderate)
2. **Asphalt Layer Quality Check** (Roadwork, 1 day, simple)  
3. **Bridge Foundation Inspection** (Infrastructure, 3 days, complex)

## 🧪 Testing the Assignment Feature

After setup, test the ITP assignment:

1. **Navigate to Daily Report**
   - Go to `/project/[projectId]/lot/[lotId]/daily-report`
   - You should see the "Assign ITP" button

2. **Fill Out Assignment Form**
   - Select an ITP from the dropdown
   - Choose a team member
   - Set scheduled date
   - Add notes (optional)

3. **Submit Assignment**
   - Click "Assign ITP"
   - Watch console for detailed logging
   - Assignment should save to database

### Expected Console Output
```
📝 Submitting assignment: {assignment data}
🚀 Assignment received: {assignment data}
💾 Saving assignment to database: {database data}
✅ Assignment saved to database! {result}
📝 Activity log created successfully
🎉 Assignment completed successfully!
```

## 🔧 Troubleshooting

### Common Issues

1. **RLS Policies Blocking Access**
   - Ensure your user profile has `organization_id` set
   - Check that the organization exists in the database

2. **Missing Columns Error**
   - The setup script adds missing columns with `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`
   - Re-run the setup script if needed

3. **Foreign Key Constraints**
   - Ensure all referenced records exist (organization, project, lot)
   - Check the sample data section of the setup script

### Verification Queries

Check if setup was successful:

```sql
-- Check organizations
SELECT * FROM organizations;

-- Check projects  
SELECT * FROM projects;

-- Check ITPs
SELECT * FROM itps;

-- Check user profiles
SELECT id, name, email, role, organization_id FROM profiles;
```

## 📈 Performance Optimizations

The setup includes performance indexes on:
- Foreign key relationships
- Frequently queried columns
- Organization-based filtering
- Status and date fields

## 🔄 Next Steps

After database setup:

1. **Update Environment Variables**
   - Ensure `.env.local` has correct Supabase credentials
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

2. **Test Authentication**
   - Sign up/login to create user profile
   - Verify organization assignment

3. **Test ITP Assignment**
   - Navigate to daily report page
   - Complete assignment workflow
   - Verify data persistence

4. **Monitor Activity Logs**
   - Check `activity_logs` table for audit trail
   - Verify proper user tracking

## 🎉 Success!

Your Site-Proof MVP database is now ready for production use with:
- ✅ Complete schema with all required tables
- ✅ Row Level Security for data protection  
- ✅ Performance indexes for fast queries
- ✅ Sample data for immediate testing
- ✅ Audit trail for compliance
- ✅ Real database persistence for ITP assignments

The application will now save real data to your Supabase database instead of using mock data!