-- Enhanced ITP Database Schema for Real Construction Data
-- This script enhances the existing ITP tables to support your 10 real ITPs with categories, complexity, duration, and certifications

-- Phase 1: Enhance ITPs table with new columns for real data
ALTER TABLE itps 
ADD COLUMN IF NOT EXISTS category VARCHAR(100), -- Structural, Foundation, etc.
ADD COLUMN IF NOT EXISTS estimated_duration VARCHAR(50), -- 1 day, 2 hours, etc.
ADD COLUMN IF NOT EXISTS complexity VARCHAR(20) CHECK (complexity IN ('low', 'moderate', 'high')), -- Complexity level
ADD COLUMN IF NOT EXISTS required_certifications JSONB; -- Array of certifications

-- Add indexes for new columns
CREATE INDEX IF NOT EXISTS idx_itps_category ON itps(category);
CREATE INDEX IF NOT EXISTS idx_itps_complexity ON itps(complexity);

-- Phase 2: Enhanced RLS policies for organization-based isolation
-- Drop existing policies to recreate with organization support
DROP POLICY IF EXISTS "Users can view ITPs for their projects" ON itps;

-- Create organization-based RLS policies
CREATE POLICY "Users can view ITPs in their organization" ON itps
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = itps.project_id 
      AND projects.organization_id = (
        SELECT organization_id FROM profiles 
        WHERE profiles.id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can create ITPs in their organization" ON itps
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = itps.project_id 
      AND projects.organization_id = (
        SELECT organization_id FROM profiles 
        WHERE profiles.id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can update ITPs in their organization" ON itps
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = itps.project_id 
      AND projects.organization_id = (
        SELECT organization_id FROM profiles 
        WHERE profiles.id = auth.uid()
      )
    )
  );

-- Update ITP items policies for organization support
DROP POLICY IF EXISTS "Users can view ITP items for accessible ITPs" ON itp_items;

CREATE POLICY "Users can view ITP items in their organization" ON itp_items
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM itps 
      JOIN projects ON projects.id = itps.project_id
      WHERE itps.id = itp_items.itp_id 
      AND projects.organization_id = (
        SELECT organization_id FROM profiles 
        WHERE profiles.id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can create ITP items in their organization" ON itp_items
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM itps 
      JOIN projects ON projects.id = itps.project_id
      WHERE itps.id = itp_items.itp_id 
      AND projects.organization_id = (
        SELECT organization_id FROM profiles 
        WHERE profiles.id = auth.uid()
      )
    )
  );

-- Phase 3: Clear existing sample data to make room for real data
DELETE FROM itp_items WHERE itp_id IN (SELECT id FROM itps WHERE name IN ('Standard Concrete Inspection', 'Earthworks Quality Control', 'Steel Reinforcement ITP'));
DELETE FROM itps WHERE name IN ('Standard Concrete Inspection', 'Earthworks Quality Control', 'Steel Reinforcement ITP');

-- Phase 4: Insert your 10 real ITPs
-- Note: Replace 'PROJECT_ID_PLACEHOLDER' with actual project ID when running
INSERT INTO itps (
  id, 
  name, 
  description, 
  project_id, 
  category, 
  estimated_duration, 
  complexity, 
  required_certifications, 
  created_at, 
  updated_at, 
  is_active
) VALUES 
(
  '0fe09989-58f8-450d-aa85-2d387d99d2be',
  'Proof Rolling Inspection',
  'Checklist for conducting a proof roll to detect unstable areas in the subgrade.',
  (SELECT id FROM projects LIMIT 1), -- Will be replaced with actual project ID
  'Structural',
  '1 day',
  'moderate',
  '["Earthworks", "Heavy Equipment Operation"]'::jsonb,
  '2025-06-14 01:44:05.645591+00',
  '2025-06-14 01:44:05.645591+00',
  true
),
(
  '2de7bb79-51b6-491a-abf6-02f63d78d597',
  'Bridge Foundation Inspection',
  'Quality inspection procedures for bridge foundation construction.',
  (SELECT id FROM projects LIMIT 1),
  'Structural',
  '2 days',
  'high',
  '["Structural Engineering", "Foundation Inspection"]'::jsonb,
  '2025-06-14 01:44:05.645591+00',
  '2025-06-14 01:44:05.645591+00',
  true
),
(
  '3f8c2a1b-7d4e-4c9a-b8f2-1e5d6c7a8b9c',
  'Subgrade Preparation',
  'Foundation work preparation and quality control procedures.',
  (SELECT id FROM projects LIMIT 1),
  'Foundation',
  '1 day',
  'moderate',
  '["Earthworks", "Soil Testing"]'::jsonb,
  '2025-06-14 01:44:05.645591+00',
  '2025-06-14 01:44:05.645591+00',
  true
),
(
  '4a9b3c2d-8e5f-4d0b-c9g3-2f6e7d8c9e0f',
  'Concrete Pour Inspection',
  'Quality control procedures for concrete pouring operations.',
  (SELECT id FROM projects LIMIT 1),
  'Quality Control',
  '4 hours',
  'high',
  '["Concrete Technology", "Quality Control"]'::jsonb,
  '2025-06-14 01:44:05.645591+00',
  '2025-06-14 01:44:05.645591+00',
  true
),
(
  '5b0c4d3e-9f6g-5e1c-d0h4-3g7f8e9d0f1g',
  'Topsoiling & Seeding',
  'Landscaping and final surface preparation inspection procedures.',
  (SELECT id FROM projects LIMIT 1),
  'Landscaping',
  '2 hours',
  'low',
  '["Landscaping", "Environmental Compliance"]'::jsonb,
  '2025-06-14 01:44:05.645591+00',
  '2025-06-14 01:44:05.645591+00',
  true
),
(
  '6c1d5e4f-0g7h-6f2d-e1i5-4h8g9f0e1g2h',
  'Asphalt Layer Quality Check',
  'Pavement quality inspection and testing procedures.',
  (SELECT id FROM projects LIMIT 1),
  'Pavement',
  '3 hours',
  'moderate',
  '["Pavement Engineering", "Material Testing"]'::jsonb,
  '2025-06-14 01:44:05.645591+00',
  '2025-06-14 01:44:05.645591+00',
  true
),
(
  '7d2e6f5g-1h8i-7g3e-f2j6-5i9h0g1f2g3i',
  'Pavement Layer - Unbound Granular',
  'Base course preparation and quality control inspection.',
  (SELECT id FROM projects LIMIT 1),
  'Pavement',
  '4 hours',
  'moderate',
  '["Pavement Engineering", "Material Testing", "Compaction"]'::jsonb,
  '2025-06-14 01:44:05.645591+00',
  '2025-06-14 01:44:05.645591+00',
  true
),
(
  '8e3f7g6h-2i9j-8h4f-g3k7-6j0i1h2g3h4j',
  'Conduit & Pit Installation',
  'Infrastructure installation inspection and verification procedures.',
  (SELECT id FROM projects LIMIT 1),
  'Infrastructure',
  '6 hours',
  'moderate',
  '["Electrical Installation", "Underground Services"]'::jsonb,
  '2025-06-14 01:44:05.645591+00',
  '2025-06-14 01:44:05.645591+00',
  true
),
(
  '9f4g8h7i-3j0k-9i5g-h4l8-7k1j2i3h4i5k',
  'Highway Concrete Pour Inspection',
  'Major concrete structure inspection for highway construction.',
  (SELECT id FROM projects LIMIT 1),
  'Structural',
  '1 day',
  'high',
  '["Concrete Technology", "Highway Engineering", "Quality Control"]'::jsonb,
  '2025-06-14 01:44:05.645591+00',
  '2025-06-14 01:44:05.645591+00',
  true
),
(
  '0g5h9i8j-4k1l-0j6h-i5m9-8l2k3j4i5j6l',
  'Steel Reinforcement Inspection',
  'Structural integrity inspection for steel reinforcement installation.',
  (SELECT id FROM projects LIMIT 1),
  'Structural',
  '3 hours',
  'high',
  '["Structural Engineering", "Steel Fabrication", "Quality Control"]'::jsonb,
  '2025-06-14 01:44:05.645591+00',
  '2025-06-14 01:44:05.645591+00',
  true
);

-- Phase 5: Create detailed ITP items for each real ITP
-- Proof Rolling Inspection Items
INSERT INTO itp_items (
  itp_id,
  item_number,
  description,
  acceptance_criteria,
  inspection_method,
  required_documentation,
  is_mandatory,
  sort_order
) VALUES 
(
  '0fe09989-58f8-450d-aa85-2d387d99d2be',
  'PR-001',
  'Visual inspection of subgrade surface',
  'No visible cracks, rutting, or pumping',
  'Visual assessment and photographic documentation',
  'Photos of subgrade condition',
  true,
  1
),
(
  '0fe09989-58f8-450d-aa85-2d387d99d2be',
  'PR-002', 
  'Proof rolling with loaded truck',
  'No deflection >25mm, no pumping or rutting',
  'Loaded truck minimum 40 tonnes, 3 passes minimum',
  'Proof rolling certificate, load verification',
  true,
  2
),
(
  '0fe09989-58f8-450d-aa85-2d387d99d2be',
  'PR-003',
  'Moisture content verification',
  'Within ±2% of optimum moisture content',
  'Nuclear density gauge or sand replacement method',
  'Moisture content test results',
  true,
  3
);

-- Bridge Foundation Inspection Items
INSERT INTO itp_items (
  itp_id,
  item_number,
  description,
  acceptance_criteria,
  inspection_method,
  required_documentation,
  is_mandatory,
  sort_order
) VALUES 
(
  '2de7bb79-51b6-491a-abf6-02f63d78d597',
  'BF-001',
  'Foundation excavation depth verification',
  'Excavation depth as per design ±50mm',
  'Survey measurement and level checking',
  'Survey report, level measurements',
  true,
  1
),
(
  '2de7bb79-51b6-491a-abf6-02f63d78d597',
  'BF-002',
  'Foundation bearing capacity assessment',
  'Bearing capacity meets design requirements',
  'Plate load test or dynamic cone penetration',
  'Bearing capacity test report',
  true,
  2
),
(
  '2de7bb79-51b6-491a-abf6-02f63d78d597',
  'BF-003',
  'Reinforcement placement verification',
  'Reinforcement as per drawings with correct cover',
  'Visual inspection and cover meter testing',
  'Reinforcement placement certificate',
  true,
  3
);

-- Concrete Pour Inspection Items
INSERT INTO itp_items (
  itp_id,
  item_number,
  description,
  acceptance_criteria,
  inspection_method,
  required_documentation,
  is_mandatory,
  sort_order
) VALUES 
(
  '4a9b3c2d-8e5f-4d0b-c9g3-2f6e7d8c9e0f',
  'CP-001',
  'Concrete mix design verification',
  'Mix design approved and compliant with specifications',
  'Review of mix design certificate',
  'Approved mix design certificate',
  true,
  1
),
(
  '4a9b3c2d-8e5f-4d0b-c9g3-2f6e7d8c9e0f',
  'CP-002',
  'Slump test verification',
  'Slump within specified range ±25mm',
  'Standard slump cone test',
  'Slump test results',
  true,
  2
),
(
  '4a9b3c2d-8e5f-4d0b-c9g3-2f6e7d8c9e0f',
  'CP-003',
  'Concrete cube sampling',
  'Minimum 1 set per 50m³ or per day',
  'Standard cube sampling procedure',
  'Cube sampling record',
  true,
  3
);

-- Steel Reinforcement Inspection Items
INSERT INTO itp_items (
  itp_id,
  item_number,
  description,
  acceptance_criteria,
  inspection_method,
  required_documentation,
  is_mandatory,
  sort_order
) VALUES 
(
  '0g5h9i8j-4k1l-0j6h-i5m9-8l2k3j4i5j6l',
  'SR-001',
  'Steel grade and certification verification',
  'Steel grade as specified with valid certificates',
  'Review of mill certificates and test reports',
  'Mill certificates, material test certificates',
  true,
  1
),
(
  '0g5h9i8j-4k1l-0j6h-i5m9-8l2k3j4i5j6l',
  'SR-002',
  'Bar diameter and spacing verification',
  'Bar sizes and spacing as per drawings ±10mm',
  'Physical measurement with calipers and tape',
  'Measurement record sheet',
  true,
  2
),
(
  '0g5h9i8j-4k1l-0j6h-i5m9-8l2k3j4i5j6l',
  'SR-003',
  'Concrete cover verification',
  'Cover meets minimum code requirements',
  'Cover meter testing and physical measurement',
  'Cover measurement report',
  true,
  3
);

-- Add sample items for other ITPs (abbreviated for space)
-- Asphalt Layer Quality Check Items
INSERT INTO itp_items (
  itp_id,
  item_number,
  description,
  acceptance_criteria,
  inspection_method,
  is_mandatory,
  sort_order
) VALUES 
(
  '6c1d5e4f-0g7h-6f2d-e1i5-4h8g9f0e1g2h',
  'AL-001',
  'Asphalt temperature verification',
  'Temperature between 140-160°C at placement',
  'Infrared thermometer measurement',
  true,
  1
),
(
  '6c1d5e4f-0g7h-6f2d-e1i5-4h8g9f0e1g2h',
  'AL-002',
  'Compaction density testing',
  'Minimum 95% theoretical maximum density',
  'Nuclear density gauge testing',
  true,
  2
);

-- Phase 6: Update lots table to support enhanced ITP integration
ALTER TABLE lots 
ADD COLUMN IF NOT EXISTS inspection_notes TEXT,
ADD COLUMN IF NOT EXISTS inspector_signature VARCHAR(255),
ADD COLUMN IF NOT EXISTS inspection_photos JSONB; -- Array of photo URLs

-- Create index for inspection notes search
CREATE INDEX IF NOT EXISTS idx_lots_inspection_notes ON lots USING gin(to_tsvector('english', inspection_notes));

-- Phase 7: Create view for ITP summary statistics
CREATE OR REPLACE VIEW itp_summary AS
SELECT 
  i.id,
  i.name,
  i.category,
  i.complexity,
  i.estimated_duration,
  i.project_id,
  p.name as project_name,
  COUNT(ii.id) as total_items,
  COUNT(CASE WHEN ii.is_mandatory THEN 1 END) as mandatory_items,
  COUNT(l.id) as assigned_lots,
  COUNT(CASE WHEN l.inspection_status = 'completed' THEN 1 END) as completed_inspections
FROM itps i
LEFT JOIN projects p ON p.id = i.project_id
LEFT JOIN itp_items ii ON ii.itp_id = i.id
LEFT JOIN lots l ON l.itp_id = i.id
WHERE i.is_active = true
GROUP BY i.id, i.name, i.category, i.complexity, i.estimated_duration, i.project_id, p.name;

-- Grant access to the view
GRANT SELECT ON itp_summary TO authenticated;