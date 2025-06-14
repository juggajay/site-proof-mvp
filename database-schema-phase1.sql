-- Phase 1 Database Schema Extensions for Site Proof MVP
-- Add these to your existing database-schema.sql

-- =====================================================
-- SITE DIARY CORE TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS site_diary_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  weather_conditions VARCHAR(100),
  temperature_celsius INTEGER,
  site_supervisor VARCHAR(100),
  safety_briefing_conducted BOOLEAN DEFAULT FALSE,
  general_notes TEXT,
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure one diary entry per project per date
  CONSTRAINT unique_project_date UNIQUE (project_id, date)
);

-- =====================================================
-- MANPOWER LOGGING
-- =====================================================
CREATE TABLE IF NOT EXISTS manpower_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  diary_entry_id UUID NOT NULL REFERENCES site_diary_entries(id) ON DELETE CASCADE,
  trade VARCHAR(100) NOT NULL,
  workers_count INTEGER NOT NULL CHECK (workers_count > 0),
  hours_worked DECIMAL(4,2) NOT NULL CHECK (hours_worked > 0),
  supervisor VARCHAR(100),
  notes TEXT,
  weather_impact BOOLEAN DEFAULT FALSE,
  overtime_hours DECIMAL(4,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- EQUIPMENT LOGGING  
-- =====================================================
CREATE TABLE IF NOT EXISTS equipment_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  diary_entry_id UUID NOT NULL REFERENCES site_diary_entries(id) ON DELETE CASCADE,
  equipment_type VARCHAR(100) NOT NULL,
  equipment_id VARCHAR(50),
  hours_used DECIMAL(4,2) NOT NULL CHECK (hours_used > 0),
  operator VARCHAR(100),
  maintenance_issues TEXT,
  downtime_reason TEXT,
  downtime_hours DECIMAL(4,2) DEFAULT 0,
  fuel_usage DECIMAL(6,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- DELIVERIES LOGGING
-- =====================================================
CREATE TABLE IF NOT EXISTS delivery_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  diary_entry_id UUID NOT NULL REFERENCES site_diary_entries(id) ON DELETE CASCADE,
  delivery_time TIME NOT NULL,
  supplier VARCHAR(200) NOT NULL,
  material_type VARCHAR(200) NOT NULL,
  quantity DECIMAL(10,3) NOT NULL CHECK (quantity > 0),
  unit VARCHAR(20) NOT NULL, -- m3, tonnes, units, etc.
  delivery_docket VARCHAR(100),
  received_by VARCHAR(100) NOT NULL,
  quality_issues TEXT,
  rejection_reason TEXT,
  photos_attached BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- EVENTS LOGGING (CATEGORIZED)
-- =====================================================
CREATE TYPE event_category AS ENUM (
  'DELAY', 
  'INSTRUCTION', 
  'SAFETY', 
  'WEATHER', 
  'INSPECTION', 
  'QUALITY_ISSUE',
  'VISITOR',
  'MEETING',
  'OTHER'
);

CREATE TYPE impact_level AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

CREATE TABLE IF NOT EXISTS event_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  diary_entry_id UUID NOT NULL REFERENCES site_diary_entries(id) ON DELETE CASCADE,
  event_time TIME NOT NULL,
  category event_category NOT NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  impact_level impact_level DEFAULT 'LOW',
  responsible_party VARCHAR(100),
  follow_up_required BOOLEAN DEFAULT FALSE,
  follow_up_date DATE,
  photos_attached BOOLEAN DEFAULT FALSE,
  cost_impact DECIMAL(10,2),
  time_impact_hours DECIMAL(4,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- ENHANCED ATTACHMENTS FOR WATERMARKED PHOTOS
-- =====================================================
-- Extend existing attachments table or create new one
CREATE TABLE IF NOT EXISTS site_diary_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  diary_entry_id UUID REFERENCES site_diary_entries(id) ON DELETE CASCADE,
  manpower_entry_id UUID REFERENCES manpower_entries(id) ON DELETE CASCADE,
  equipment_entry_id UUID REFERENCES equipment_entries(id) ON DELETE CASCADE,
  delivery_entry_id UUID REFERENCES delivery_entries(id) ON DELETE CASCADE,
  event_entry_id UUID REFERENCES event_entries(id) ON DELETE CASCADE,
  
  original_filename VARCHAR(255) NOT NULL,
  watermarked_filename VARCHAR(255) NOT NULL,
  file_size BIGINT NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  
  -- Watermark metadata
  watermark_data JSONB, -- Store project name, date, time, GPS, user
  gps_latitude DECIMAL(10, 8),
  gps_longitude DECIMAL(11, 8),
  
  -- Storage paths
  original_path TEXT NOT NULL,
  watermarked_path TEXT NOT NULL,
  
  uploaded_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure at least one parent reference
  CONSTRAINT check_parent_reference CHECK (
    (diary_entry_id IS NOT NULL)::integer +
    (manpower_entry_id IS NOT NULL)::integer +
    (equipment_entry_id IS NOT NULL)::integer +
    (delivery_entry_id IS NOT NULL)::integer +
    (event_entry_id IS NOT NULL)::integer = 1
  )
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================
CREATE INDEX idx_site_diary_entries_project_date ON site_diary_entries(project_id, date DESC);
CREATE INDEX idx_site_diary_entries_created_by ON site_diary_entries(created_by);

CREATE INDEX idx_manpower_entries_diary_id ON manpower_entries(diary_entry_id);
CREATE INDEX idx_manpower_entries_trade ON manpower_entries(trade);

CREATE INDEX idx_equipment_entries_diary_id ON equipment_entries(diary_entry_id);
CREATE INDEX idx_equipment_entries_type ON equipment_entries(equipment_type);

CREATE INDEX idx_delivery_entries_diary_id ON delivery_entries(diary_entry_id);
CREATE INDEX idx_delivery_entries_supplier ON delivery_entries(supplier);

CREATE INDEX idx_event_entries_diary_id ON event_entries(diary_entry_id);
CREATE INDEX idx_event_entries_category ON event_entries(category);
CREATE INDEX idx_event_entries_impact ON event_entries(impact_level);

CREATE INDEX idx_attachments_diary_entry ON site_diary_attachments(diary_entry_id);
CREATE INDEX idx_attachments_gps ON site_diary_attachments(gps_latitude, gps_longitude);

-- =====================================================
-- ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Enable RLS on all new tables
ALTER TABLE site_diary_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE manpower_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_diary_attachments ENABLE ROW LEVEL SECURITY;

-- Site Diary Entries - Users can only access entries for projects in their organization
CREATE POLICY "Users can view site diary entries in their organization" ON site_diary_entries
  FOR SELECT USING (
    project_id IN (
      SELECT p.id FROM projects p
      INNER JOIN profiles pr ON pr.organization_id = p.organization_id
      WHERE pr.id = auth.uid()
    )
  );

CREATE POLICY "Users can create site diary entries in their organization" ON site_diary_entries
  FOR INSERT WITH CHECK (
    project_id IN (
      SELECT p.id FROM projects p
      INNER JOIN profiles pr ON pr.organization_id = p.organization_id
      WHERE pr.id = auth.uid()
    )
  );

CREATE POLICY "Users can update site diary entries in their organization" ON site_diary_entries
  FOR UPDATE USING (
    project_id IN (
      SELECT p.id FROM projects p
      INNER JOIN profiles pr ON pr.organization_id = p.organization_id
      WHERE pr.id = auth.uid()
    )
  );

-- Manpower Entries - Access through diary entry relationship
CREATE POLICY "Users can view manpower entries in their organization" ON manpower_entries
  FOR SELECT USING (
    diary_entry_id IN (
      SELECT sde.id FROM site_diary_entries sde
      INNER JOIN projects p ON p.id = sde.project_id
      INNER JOIN profiles pr ON pr.organization_id = p.organization_id
      WHERE pr.id = auth.uid()
    )
  );

CREATE POLICY "Users can create manpower entries in their organization" ON manpower_entries
  FOR INSERT WITH CHECK (
    diary_entry_id IN (
      SELECT sde.id FROM site_diary_entries sde
      INNER JOIN projects p ON p.id = sde.project_id
      INNER JOIN profiles pr ON pr.organization_id = p.organization_id
      WHERE pr.id = auth.uid()
    )
  );

CREATE POLICY "Users can update manpower entries in their organization" ON manpower_entries
  FOR UPDATE USING (
    diary_entry_id IN (
      SELECT sde.id FROM site_diary_entries sde
      INNER JOIN projects p ON p.id = sde.project_id
      INNER JOIN profiles pr ON pr.organization_id = p.organization_id
      WHERE pr.id = auth.uid()
    )
  );

-- Equipment Entries - Same pattern
CREATE POLICY "Users can view equipment entries in their organization" ON equipment_entries
  FOR SELECT USING (
    diary_entry_id IN (
      SELECT sde.id FROM site_diary_entries sde
      INNER JOIN projects p ON p.id = sde.project_id
      INNER JOIN profiles pr ON pr.organization_id = p.organization_id
      WHERE pr.id = auth.uid()
    )
  );

CREATE POLICY "Users can create equipment entries in their organization" ON equipment_entries
  FOR INSERT WITH CHECK (
    diary_entry_id IN (
      SELECT sde.id FROM site_diary_entries sde
      INNER JOIN projects p ON p.id = sde.project_id
      INNER JOIN profiles pr ON pr.organization_id = p.organization_id
      WHERE pr.id = auth.uid()
    )
  );

CREATE POLICY "Users can update equipment entries in their organization" ON equipment_entries
  FOR UPDATE USING (
    diary_entry_id IN (
      SELECT sde.id FROM site_diary_entries sde
      INNER JOIN projects p ON p.id = sde.project_id
      INNER JOIN profiles pr ON pr.organization_id = p.organization_id
      WHERE pr.id = auth.uid()
    )
  );

-- Delivery Entries - Same pattern
CREATE POLICY "Users can view delivery entries in their organization" ON delivery_entries
  FOR SELECT USING (
    diary_entry_id IN (
      SELECT sde.id FROM site_diary_entries sde
      INNER JOIN projects p ON p.id = sde.project_id
      INNER JOIN profiles pr ON pr.organization_id = p.organization_id
      WHERE pr.id = auth.uid()
    )
  );

CREATE POLICY "Users can create delivery entries in their organization" ON delivery_entries
  FOR INSERT WITH CHECK (
    diary_entry_id IN (
      SELECT sde.id FROM site_diary_entries sde
      INNER JOIN projects p ON p.id = sde.project_id
      INNER JOIN profiles pr ON pr.organization_id = p.organization_id
      WHERE pr.id = auth.uid()
    )
  );

CREATE POLICY "Users can update delivery entries in their organization" ON delivery_entries
  FOR UPDATE USING (
    diary_entry_id IN (
      SELECT sde.id FROM site_diary_entries sde
      INNER JOIN projects p ON p.id = sde.project_id
      INNER JOIN profiles pr ON pr.organization_id = p.organization_id
      WHERE pr.id = auth.uid()
    )
  );

-- Event Entries - Same pattern
CREATE POLICY "Users can view event entries in their organization" ON event_entries
  FOR SELECT USING (
    diary_entry_id IN (
      SELECT sde.id FROM site_diary_entries sde
      INNER JOIN projects p ON p.id = sde.project_id
      INNER JOIN profiles pr ON pr.organization_id = p.organization_id
      WHERE pr.id = auth.uid()
    )
  );

CREATE POLICY "Users can create event entries in their organization" ON event_entries
  FOR INSERT WITH CHECK (
    diary_entry_id IN (
      SELECT sde.id FROM site_diary_entries sde
      INNER JOIN projects p ON p.id = sde.project_id
      INNER JOIN profiles pr ON pr.organization_id = p.organization_id
      WHERE pr.id = auth.uid()
    )
  );

CREATE POLICY "Users can update event entries in their organization" ON event_entries
  FOR UPDATE USING (
    diary_entry_id IN (
      SELECT sde.id FROM site_diary_entries sde
      INNER JOIN projects p ON p.id = sde.project_id
      INNER JOIN profiles pr ON pr.organization_id = p.organization_id
      WHERE pr.id = auth.uid()
    )
  );

-- Site Diary Attachments - Same pattern
CREATE POLICY "Users can view attachments in their organization" ON site_diary_attachments
  FOR SELECT USING (
    CASE 
      WHEN diary_entry_id IS NOT NULL THEN
        diary_entry_id IN (
          SELECT sde.id FROM site_diary_entries sde
          INNER JOIN projects p ON p.id = sde.project_id
          INNER JOIN profiles pr ON pr.organization_id = p.organization_id
          WHERE pr.id = auth.uid()
        )
      ELSE TRUE -- Handle other entry types through their respective policies
    END
  );

CREATE POLICY "Users can create attachments in their organization" ON site_diary_attachments
  FOR INSERT WITH CHECK (
    CASE 
      WHEN diary_entry_id IS NOT NULL THEN
        diary_entry_id IN (
          SELECT sde.id FROM site_diary_entries sde
          INNER JOIN projects p ON p.id = sde.project_id
          INNER JOIN profiles pr ON pr.organization_id = p.organization_id
          WHERE pr.id = auth.uid()
        )
      ELSE TRUE -- Handle other entry types through their respective policies
    END
  );

-- =====================================================
-- UTILITY FUNCTIONS
-- =====================================================

-- Function to get or create today's diary entry
CREATE OR REPLACE FUNCTION get_or_create_diary_entry(
  p_project_id UUID,
  p_date DATE DEFAULT CURRENT_DATE
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  diary_id UUID;
BEGIN
  -- Try to get existing entry
  SELECT id INTO diary_id
  FROM site_diary_entries
  WHERE project_id = p_project_id AND date = p_date;
  
  -- Create if doesn't exist
  IF diary_id IS NULL THEN
    INSERT INTO site_diary_entries (project_id, date, created_by)
    VALUES (p_project_id, p_date, auth.uid())
    RETURNING id INTO diary_id;
  END IF;
  
  RETURN diary_id;
END;
$$;

-- Function to update diary entry timestamp
CREATE OR REPLACE FUNCTION update_diary_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE site_diary_entries 
  SET updated_at = NOW() 
  WHERE id = COALESCE(NEW.diary_entry_id, OLD.diary_entry_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Triggers to update diary entry timestamp when child records change
CREATE TRIGGER update_diary_on_manpower_change
  AFTER INSERT OR UPDATE OR DELETE ON manpower_entries
  FOR EACH ROW EXECUTE FUNCTION update_diary_timestamp();

CREATE TRIGGER update_diary_on_equipment_change
  AFTER INSERT OR UPDATE OR DELETE ON equipment_entries
  FOR EACH ROW EXECUTE FUNCTION update_diary_timestamp();

CREATE TRIGGER update_diary_on_delivery_change
  AFTER INSERT OR UPDATE OR DELETE ON delivery_entries
  FOR EACH ROW EXECUTE FUNCTION update_diary_timestamp();

CREATE TRIGGER update_diary_on_event_change
  AFTER INSERT OR UPDATE OR DELETE ON event_entries
  FOR EACH ROW EXECUTE FUNCTION update_diary_timestamp();