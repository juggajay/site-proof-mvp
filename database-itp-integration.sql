-- Phase 1: Database Schema Updates for ITP Integration
-- Add ITP Integration Fields to Lots Table

-- Step 1.1: Add ITP Integration Fields to Lots Table
ALTER TABLE lots 
ADD COLUMN itp_id UUID REFERENCES itps(id),
ADD COLUMN inspection_status VARCHAR(20) DEFAULT 'pending' CHECK (inspection_status IN ('pending', 'in_progress', 'completed', 'failed', 'approved')),
ADD COLUMN assigned_inspector_id UUID REFERENCES profiles(id),
ADD COLUMN inspection_due_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN inspection_completed_date TIMESTAMP WITH TIME ZONE;

-- Add indexes for performance
CREATE INDEX idx_lots_itp_id ON lots(itp_id);
CREATE INDEX idx_lots_inspection_status ON lots(inspection_status);

-- Step 1.2: Create ITPs table if it doesn't exist
CREATE TABLE IF NOT EXISTS itps (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true
);

-- Create ITP Items table if it doesn't exist
CREATE TABLE IF NOT EXISTS itp_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    itp_id UUID NOT NULL REFERENCES itps(id) ON DELETE CASCADE,
    item_number VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    acceptance_criteria TEXT NOT NULL,
    inspection_method TEXT NOT NULL,
    required_documentation TEXT,
    is_mandatory BOOLEAN DEFAULT false,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for ITP tables
CREATE INDEX idx_itps_project_id ON itps(project_id);
CREATE INDEX idx_itps_is_active ON itps(is_active);
CREATE INDEX idx_itp_items_itp_id ON itp_items(itp_id);
CREATE INDEX idx_itp_items_sort_order ON itp_items(sort_order);

-- Add RLS policies for ITPs table
ALTER TABLE itps ENABLE ROW LEVEL SECURITY;

-- Policy for ITPs - users can see ITPs for projects they have access to
CREATE POLICY "Users can view ITPs for their projects" ON itps
    FOR SELECT USING (
        project_id IN (
            SELECT id FROM projects 
            WHERE project_manager_id = auth.uid()
            OR id IN (
                SELECT project_id FROM project_members 
                WHERE user_id = auth.uid()
            )
        )
    );

-- Policy for ITP Items - users can see items for ITPs they have access to
ALTER TABLE itp_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view ITP items for accessible ITPs" ON itp_items
    FOR SELECT USING (
        itp_id IN (
            SELECT id FROM itps 
            WHERE project_id IN (
                SELECT id FROM projects 
                WHERE project_manager_id = auth.uid()
                OR id IN (
                    SELECT project_id FROM project_members 
                    WHERE user_id = auth.uid()
                )
            )
        )
    );

-- Update trigger for ITPs
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_itps_updated_at BEFORE UPDATE ON itps
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert some sample ITPs for testing (optional)
INSERT INTO itps (name, description, project_id, is_active) 
SELECT 
    'Standard Concrete Inspection',
    'Standard inspection and test plan for concrete works including formwork, reinforcement, and concrete placement',
    id,
    true
FROM projects 
WHERE name LIKE '%' 
LIMIT 1;

INSERT INTO itps (name, description, project_id, is_active) 
SELECT 
    'Earthworks Quality Control',
    'Inspection and test plan for earthworks including excavation, compaction, and material testing',
    id,
    true
FROM projects 
WHERE name LIKE '%' 
LIMIT 1;