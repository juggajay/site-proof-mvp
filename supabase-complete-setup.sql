-- Complete Database Setup for Site-Proof MVP
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- 1. CORE DATABASE SCHEMA
-- =============================================

-- Organizations table (if not exists)
CREATE TABLE IF NOT EXISTS organizations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Projects table (if not exists) 
CREATE TABLE IF NOT EXISTS projects (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  project_number TEXT,
  location TEXT,
  status TEXT CHECK (status IN ('active', 'completed', 'on_hold', 'cancelled')) DEFAULT 'active',
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Profiles table updates (add missing columns)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS certifications TEXT[] DEFAULT '{}';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS current_workload INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

-- Lots table (if not exists)
CREATE TABLE IF NOT EXISTS lots (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  location TEXT,
  priority TEXT CHECK (priority IN ('low', 'medium', 'high')) DEFAULT 'medium',
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 2. ITP SYSTEM TABLES
-- =============================================

-- ITPs (Inspection & Test Plans) table
CREATE TABLE IF NOT EXISTS itps (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  estimated_duration TEXT DEFAULT '1 day',
  complexity TEXT CHECK (complexity IN ('simple', 'moderate', 'complex')) DEFAULT 'moderate',
  required_certifications TEXT[],
  is_active BOOLEAN DEFAULT true,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ITP Items (checklist items within an ITP)
CREATE TABLE IF NOT EXISTS itp_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  itp_id UUID NOT NULL REFERENCES itps(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL DEFAULT 1,
  is_required BOOLEAN DEFAULT true,
  acceptance_criteria TEXT,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ITP Assignments (assign ITPs to lots)
CREATE TABLE IF NOT EXISTS itp_assignments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  lot_id UUID NOT NULL REFERENCES lots(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  itp_id UUID NOT NULL REFERENCES itps(id) ON DELETE CASCADE,
  assigned_to UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  assigned_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  scheduled_date TIMESTAMP WITH TIME ZONE NOT NULL,
  estimated_completion_date TIMESTAMP WITH TIME ZONE,
  actual_completion_date TIMESTAMP WITH TIME ZONE,
  priority TEXT CHECK (priority IN ('low', 'medium', 'high')) DEFAULT 'medium',
  status TEXT CHECK (status IN ('assigned', 'in_progress', 'completed', 'failed', 'cancelled')) DEFAULT 'assigned',
  notes TEXT,
  completion_notes TEXT,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Conformance Records (QA inspection results)
CREATE TABLE IF NOT EXISTS conformance_records (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  lot_id UUID NOT NULL REFERENCES lots(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  itp_id UUID NOT NULL REFERENCES itps(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES itp_items(id) ON DELETE CASCADE,
  assignment_id UUID REFERENCES itp_assignments(id) ON DELETE CASCADE,
  status TEXT CHECK (status IN ('pass', 'fail', 'na', 'pending')) DEFAULT 'pending',
  notes TEXT,
  checked_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  checked_at TIMESTAMP WITH TIME ZONE NOT NULL,
  photo_url TEXT,
  pass_fail_value TEXT CHECK (pass_fail_value IN ('PASS', 'FAIL', 'N/A')),
  text_value TEXT,
  numeric_value NUMERIC,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 3. SUPPORTING TABLES
-- =============================================

-- Attachments table for file uploads
CREATE TABLE IF NOT EXISTS attachments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  filename TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER,
  file_type TEXT,
  entity_type TEXT NOT NULL, -- 'conformance_record', 'itp_assignment', etc.
  entity_id UUID NOT NULL,
  uploaded_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Activity logs for audit trail
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  description TEXT NOT NULL,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  read_at TIMESTAMP WITH TIME ZONE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 4. PERFORMANCE INDEXES
-- =============================================

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_itp_assignments_lot_id ON itp_assignments(lot_id);
CREATE INDEX IF NOT EXISTS idx_itp_assignments_project_id ON itp_assignments(project_id);
CREATE INDEX IF NOT EXISTS idx_itp_assignments_assigned_to ON itp_assignments(assigned_to);
CREATE INDEX IF NOT EXISTS idx_itp_assignments_status ON itp_assignments(status);
CREATE INDEX IF NOT EXISTS idx_itp_assignments_scheduled_date ON itp_assignments(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_itp_assignments_organization_id ON itp_assignments(organization_id);

CREATE INDEX IF NOT EXISTS idx_conformance_records_lot_id ON conformance_records(lot_id);
CREATE INDEX IF NOT EXISTS idx_conformance_records_assignment_id ON conformance_records(assignment_id);
CREATE INDEX IF NOT EXISTS idx_conformance_records_status ON conformance_records(status);
CREATE INDEX IF NOT EXISTS idx_conformance_records_organization_id ON conformance_records(organization_id);

CREATE INDEX IF NOT EXISTS idx_itps_organization_id ON itps(organization_id);
CREATE INDEX IF NOT EXISTS idx_itps_is_active ON itps(is_active);
CREATE INDEX IF NOT EXISTS idx_itp_items_itp_id ON itp_items(itp_id);

CREATE INDEX IF NOT EXISTS idx_lots_project_id ON lots(project_id);
CREATE INDEX IF NOT EXISTS idx_projects_organization_id ON projects(organization_id);
CREATE INDEX IF NOT EXISTS idx_profiles_organization_id ON profiles(organization_id);

CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_organization_id ON activity_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);

-- =============================================
-- 5. ROW LEVEL SECURITY (RLS)
-- =============================================

-- Enable RLS on all tables
ALTER TABLE itps ENABLE ROW LEVEL SECURITY;
ALTER TABLE itp_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE itp_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE conformance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE lots ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ITPs
DROP POLICY IF EXISTS "Users can view ITPs in their organization" ON itps;
CREATE POLICY "Users can view ITPs in their organization" ON itps
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can create ITPs in their organization" ON itps;
CREATE POLICY "Users can create ITPs in their organization" ON itps
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

-- RLS Policies for ITP Assignments
DROP POLICY IF EXISTS "Users can view assignments in their organization" ON itp_assignments;
CREATE POLICY "Users can view assignments in their organization" ON itp_assignments
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can create assignments in their organization" ON itp_assignments;
CREATE POLICY "Users can create assignments in their organization" ON itp_assignments
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
    AND assigned_by = auth.uid()
  );

DROP POLICY IF EXISTS "Users can update assignments in their organization" ON itp_assignments;
CREATE POLICY "Users can update assignments in their organization" ON itp_assignments
  FOR UPDATE USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

-- RLS Policies for Conformance Records
DROP POLICY IF EXISTS "Users can view conformance records in their organization" ON conformance_records;
CREATE POLICY "Users can view conformance records in their organization" ON conformance_records
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can create conformance records in their organization" ON conformance_records;
CREATE POLICY "Users can create conformance records in their organization" ON conformance_records
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
    AND checked_by = auth.uid()
  );

-- RLS Policies for Lots
DROP POLICY IF EXISTS "Users can view lots in their organization" ON lots;
CREATE POLICY "Users can view lots in their organization" ON lots
  FOR SELECT USING (
    project_id IN (
      SELECT id FROM projects WHERE organization_id IN (
        SELECT organization_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

-- RLS Policies for Projects
DROP POLICY IF EXISTS "Users can view projects in their organization" ON projects;
CREATE POLICY "Users can view projects in their organization" ON projects
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

-- RLS Policies for Organizations
DROP POLICY IF EXISTS "Users can view their organization" ON organizations;
CREATE POLICY "Users can view their organization" ON organizations
  FOR SELECT USING (
    id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

-- =============================================
-- 6. SAMPLE DATA
-- =============================================

-- Insert sample organization (replace with your actual org)
INSERT INTO organizations (id, name) 
VALUES ('550e8400-e29b-41d4-a716-446655440000', 'Highway Construction Co.')
ON CONFLICT (id) DO NOTHING;

-- Insert sample project
INSERT INTO projects (id, name, description, project_number, location, organization_id)
VALUES (
  '550e8400-e29b-41d4-a716-446655440001',
  'Highway 101 Expansion',
  'Major highway expansion project',
  'HWY-101-2025',
  'Highway 101 Corridor',
  '550e8400-e29b-41d4-a716-446655440000'
) ON CONFLICT (id) DO NOTHING;

-- Insert sample lot
INSERT INTO lots (id, name, description, location, priority, project_id)
VALUES (
  '550e8400-e29b-41d4-a716-446655440002',
  'Daily Lot Report - 33',
  'Foundation work for bridge section',
  'Highway 101, Section 33',
  'high',
  '550e8400-e29b-41d4-a716-446655440001'
) ON CONFLICT (id) DO NOTHING;

-- Insert sample ITPs
INSERT INTO itps (title, description, category, estimated_duration, complexity, required_certifications, organization_id)
VALUES 
  (
    'Highway Concrete Pour Inspection',
    'Quality inspection for concrete pouring activities',
    'Structural',
    '2 days',
    'moderate',
    ARRAY['Concrete Testing', 'Highway Construction'],
    '550e8400-e29b-41d4-a716-446655440000'
  ),
  (
    'Asphalt Layer Quality Check',
    'Inspection of asphalt layer thickness and compaction',
    'Roadwork',
    '1 day',
    'simple',
    ARRAY['Asphalt Testing'],
    '550e8400-e29b-41d4-a716-446655440000'
  ),
  (
    'Bridge Foundation Inspection',
    'Comprehensive inspection of bridge foundation work',
    'Infrastructure',
    '3 days',
    'complex',
    ARRAY['Structural Engineering', 'Bridge Construction'],
    '550e8400-e29b-41d4-a716-446655440000'
  )
ON CONFLICT DO NOTHING;

-- Update existing profiles with sample certifications and organization
UPDATE profiles SET 
  certifications = ARRAY['Concrete Testing', 'Highway Construction', 'Asphalt Testing'],
  current_workload = 65,
  role = 'Senior Inspector',
  organization_id = '550e8400-e29b-41d4-a716-446655440000'
WHERE organization_id IS NULL;

-- Insert sample ITP items for the first ITP
INSERT INTO itp_items (itp_id, title, description, order_index, is_required, acceptance_criteria, organization_id)
SELECT 
  i.id,
  'Concrete Mix Verification',
  'Verify concrete mix meets specifications',
  1,
  true,
  'Mix design matches approved specifications',
  '550e8400-e29b-41d4-a716-446655440000'
FROM itps i 
WHERE i.title = 'Highway Concrete Pour Inspection' 
  AND i.organization_id = '550e8400-e29b-41d4-a716-446655440000'
ON CONFLICT DO NOTHING;

INSERT INTO itp_items (itp_id, title, description, order_index, is_required, acceptance_criteria, organization_id)
SELECT 
  i.id,
  'Temperature Check',
  'Check concrete temperature during pour',
  2,
  true,
  'Temperature within 10-32°C range',
  '550e8400-e29b-41d4-a716-446655440000'
FROM itps i 
WHERE i.title = 'Highway Concrete Pour Inspection' 
  AND i.organization_id = '550e8400-e29b-41d4-a716-446655440000'
ON CONFLICT DO NOTHING;

-- =============================================
-- 7. FUNCTIONS AND TRIGGERS
-- =============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at
DROP TRIGGER IF EXISTS update_organizations_updated_at ON organizations;
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_lots_updated_at ON lots;
CREATE TRIGGER update_lots_updated_at BEFORE UPDATE ON lots FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_itps_updated_at ON itps;
CREATE TRIGGER update_itps_updated_at BEFORE UPDATE ON itps FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_itp_assignments_updated_at ON itp_assignments;
CREATE TRIGGER update_itp_assignments_updated_at BEFORE UPDATE ON itp_assignments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_conformance_records_updated_at ON conformance_records;
CREATE TRIGGER update_conformance_records_updated_at BEFORE UPDATE ON conformance_records FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- SETUP COMPLETE
-- =============================================

-- Verify setup
SELECT 'Database setup completed successfully!' as status;
SELECT 'Organizations: ' || count(*) as organizations_count FROM organizations;
SELECT 'Projects: ' || count(*) as projects_count FROM projects;
SELECT 'Lots: ' || count(*) as lots_count FROM lots;
SELECT 'ITPs: ' || count(*) as itps_count FROM itps;
SELECT 'ITP Items: ' || count(*) as itp_items_count FROM itp_items;