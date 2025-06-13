-- Daily Lot Report Database Schema
-- Phase 2A: Core Infrastructure Setup
-- Run this in Supabase SQL Editor

-- Daily lot reports (one per lot per day)
CREATE TABLE IF NOT EXISTS daily_lot_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lot_id UUID REFERENCES lots(id) NOT NULL,
    report_date DATE NOT NULL,
    weather VARCHAR(50) DEFAULT 'sunny',
    general_activities TEXT DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(lot_id, report_date)
);

-- Site diary entries (Tab 1)
CREATE TABLE IF NOT EXISTS diary_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    daily_report_id UUID REFERENCES daily_lot_reports(id) ON DELETE CASCADE,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    photo_url TEXT,
    gps_coordinates POINT,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Labour dockets (Tab 2)
CREATE TABLE IF NOT EXISTS labour_dockets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    daily_report_id UUID REFERENCES daily_lot_reports(id) ON DELETE CASCADE,
    person_name VARCHAR(255) NOT NULL,
    company VARCHAR(255),
    hours_worked DECIMAL(4,2) DEFAULT 0,
    hourly_rate DECIMAL(8,2) DEFAULT 0,
    total_cost DECIMAL(10,2) GENERATED ALWAYS AS (hours_worked * hourly_rate) STORED,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Plant/Equipment dockets (Tab 2)  
CREATE TABLE IF NOT EXISTS plant_dockets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    daily_report_id UUID REFERENCES daily_lot_reports(id) ON DELETE CASCADE,
    equipment_name VARCHAR(255) NOT NULL,
    docket_number VARCHAR(100),
    hours_worked DECIMAL(4,2) DEFAULT 0,
    hourly_rate DECIMAL(8,2) DEFAULT 0,
    total_cost DECIMAL(10,2) GENERATED ALWAYS AS (hours_worked * hourly_rate) STORED,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Materials dockets (Tab 2)
CREATE TABLE IF NOT EXISTS material_dockets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    daily_report_id UUID REFERENCES daily_lot_reports(id) ON DELETE CASCADE,
    material_name VARCHAR(255) NOT NULL,
    supplier VARCHAR(255),
    docket_number VARCHAR(100),
    quantity DECIMAL(10,2) DEFAULT 0,
    unit VARCHAR(50) DEFAULT 'each',
    unit_rate DECIMAL(8,2) DEFAULT 0,
    total_cost DECIMAL(10,2) GENERATED ALWAYS AS (quantity * unit_rate) STORED,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Compliance checks (Tab 3) - extends existing ITP structure
CREATE TABLE IF NOT EXISTS daily_compliance_checks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    daily_report_id UUID REFERENCES daily_lot_reports(id) ON DELETE CASCADE,
    check_type VARCHAR(50) NOT NULL, -- 'itp', 'environmental', 'safety'
    item_name VARCHAR(255) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pass', 'fail', 'na', 'pending'
    comments TEXT,
    photo_url TEXT,
    checked_by UUID REFERENCES profiles(id),
    checked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE daily_lot_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE diary_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE labour_dockets ENABLE ROW LEVEL SECURITY;
ALTER TABLE plant_dockets ENABLE ROW LEVEL SECURITY;
ALTER TABLE material_dockets ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_compliance_checks ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for organization-based access
-- Daily lot reports policy
DROP POLICY IF EXISTS "Users can manage daily reports in their organization" ON daily_lot_reports;
CREATE POLICY "Users can manage daily reports in their organization" ON daily_lot_reports
FOR ALL USING (
    lot_id IN (
        SELECT l.id FROM lots l
        JOIN projects p ON l.project_id = p.id
        WHERE p.organization_id IN (
            SELECT organization_id FROM profiles 
            WHERE id = auth.uid()
        )
    )
);

-- Diary entries policy
DROP POLICY IF EXISTS "Users can manage diary entries in their organization" ON diary_entries;
CREATE POLICY "Users can manage diary entries in their organization" ON diary_entries
FOR ALL USING (
    daily_report_id IN (
        SELECT dlr.id FROM daily_lot_reports dlr
        JOIN lots l ON dlr.lot_id = l.id
        JOIN projects p ON l.project_id = p.id
        WHERE p.organization_id IN (
            SELECT organization_id FROM profiles 
            WHERE id = auth.uid()
        )
    )
);

-- Labour dockets policy
DROP POLICY IF EXISTS "Users can manage labour dockets in their organization" ON labour_dockets;
CREATE POLICY "Users can manage labour dockets in their organization" ON labour_dockets
FOR ALL USING (
    daily_report_id IN (
        SELECT dlr.id FROM daily_lot_reports dlr
        JOIN lots l ON dlr.lot_id = l.id
        JOIN projects p ON l.project_id = p.id
        WHERE p.organization_id IN (
            SELECT organization_id FROM profiles 
            WHERE id = auth.uid()
        )
    )
);

-- Plant dockets policy
DROP POLICY IF EXISTS "Users can manage plant dockets in their organization" ON plant_dockets;
CREATE POLICY "Users can manage plant dockets in their organization" ON plant_dockets
FOR ALL USING (
    daily_report_id IN (
        SELECT dlr.id FROM daily_lot_reports dlr
        JOIN lots l ON dlr.lot_id = l.id
        JOIN projects p ON l.project_id = p.id
        WHERE p.organization_id IN (
            SELECT organization_id FROM profiles 
            WHERE id = auth.uid()
        )
    )
);

-- Material dockets policy
DROP POLICY IF EXISTS "Users can manage material dockets in their organization" ON material_dockets;
CREATE POLICY "Users can manage material dockets in their organization" ON material_dockets
FOR ALL USING (
    daily_report_id IN (
        SELECT dlr.id FROM daily_lot_reports dlr
        JOIN lots l ON dlr.lot_id = l.id
        JOIN projects p ON l.project_id = p.id
        WHERE p.organization_id IN (
            SELECT organization_id FROM profiles 
            WHERE id = auth.uid()
        )
    )
);

-- Compliance checks policy
DROP POLICY IF EXISTS "Users can manage compliance checks in their organization" ON daily_compliance_checks;
CREATE POLICY "Users can manage compliance checks in their organization" ON daily_compliance_checks
FOR ALL USING (
    daily_report_id IN (
        SELECT dlr.id FROM daily_lot_reports dlr
        JOIN lots l ON dlr.lot_id = l.id
        JOIN projects p ON l.project_id = p.id
        WHERE p.organization_id IN (
            SELECT organization_id FROM profiles 
            WHERE id = auth.uid()
        )
    )
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_daily_lot_reports_lot_date ON daily_lot_reports(lot_id, report_date);
CREATE INDEX IF NOT EXISTS idx_diary_entries_daily_report ON diary_entries(daily_report_id);
CREATE INDEX IF NOT EXISTS idx_labour_dockets_daily_report ON labour_dockets(daily_report_id);
CREATE INDEX IF NOT EXISTS idx_plant_dockets_daily_report ON plant_dockets(daily_report_id);
CREATE INDEX IF NOT EXISTS idx_material_dockets_daily_report ON material_dockets(daily_report_id);
CREATE INDEX IF NOT EXISTS idx_compliance_checks_daily_report ON daily_compliance_checks(daily_report_id);

-- Create storage bucket for diary photos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('diary-photos', 'diary-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policy for diary photos
DROP POLICY IF EXISTS "Users can upload diary photos" ON storage.objects;
CREATE POLICY "Users can upload diary photos" ON storage.objects
FOR INSERT WITH CHECK (
    bucket_id = 'diary-photos' AND
    auth.uid() IS NOT NULL
);

DROP POLICY IF EXISTS "Users can view diary photos" ON storage.objects;
CREATE POLICY "Users can view diary photos" ON storage.objects
FOR SELECT USING (
    bucket_id = 'diary-photos'
);

-- Insert sample weather data and compliance check templates
INSERT INTO daily_compliance_checks (daily_report_id, check_type, item_name, status, comments)
SELECT 
    NULL as daily_report_id,
    'template' as check_type,
    item_name,
    'pending' as status,
    'Template item' as comments
FROM (
    VALUES 
    ('Site Safety Induction'),
    ('PPE Compliance Check'),
    ('Environmental Controls'),
    ('Traffic Management'),
    ('Excavation Safety'),
    ('Concrete Pour Quality'),
    ('Compaction Testing'),
    ('Survey Verification')
) AS templates(item_name)
ON CONFLICT DO NOTHING;

-- Create function to get or create daily report
CREATE OR REPLACE FUNCTION get_or_create_daily_report(
    p_lot_id UUID,
    p_report_date DATE DEFAULT CURRENT_DATE
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    report_id UUID;
BEGIN
    -- Try to get existing report
    SELECT id INTO report_id
    FROM daily_lot_reports
    WHERE lot_id = p_lot_id AND report_date = p_report_date;
    
    -- If not found, create new report
    IF report_id IS NULL THEN
        INSERT INTO daily_lot_reports (lot_id, report_date, weather, general_activities)
        VALUES (p_lot_id, p_report_date, 'sunny', '')
        RETURNING id INTO report_id;
    END IF;
    
    RETURN report_id;
END;
$$;

-- Verify table creation
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables 
WHERE tablename IN (
    'daily_lot_reports',
    'diary_entries', 
    'labour_dockets',
    'plant_dockets',
    'material_dockets',
    'daily_compliance_checks'
)
ORDER BY tablename;

-- Show table row counts
SELECT 
    'daily_lot_reports' as table_name,
    COUNT(*) as row_count
FROM daily_lot_reports
UNION ALL
SELECT 
    'diary_entries' as table_name,
    COUNT(*) as row_count
FROM diary_entries
UNION ALL
SELECT 
    'labour_dockets' as table_name,
    COUNT(*) as row_count
FROM labour_dockets
UNION ALL
SELECT 
    'plant_dockets' as table_name,
    COUNT(*) as row_count
FROM plant_dockets
UNION ALL
SELECT 
    'material_dockets' as table_name,
    COUNT(*) as row_count
FROM material_dockets
UNION ALL
SELECT 
    'daily_compliance_checks' as table_name,
    COUNT(*) as row_count
FROM daily_compliance_checks;

SELECT 'Daily Lot Report database schema setup completed successfully!' as status;