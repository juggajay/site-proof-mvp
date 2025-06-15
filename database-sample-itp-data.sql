-- Sample ITP Data for Testing
-- This script creates sample ITPs and ITP items for testing the integration

-- Insert sample ITPs (assuming we have at least one project)
INSERT INTO itps (name, description, project_id, is_active) 
VALUES 
  (
    'Standard Concrete Inspection',
    'Comprehensive inspection and test plan for concrete works including formwork, reinforcement, and concrete placement',
    (SELECT id FROM projects LIMIT 1),
    true
  ),
  (
    'Earthworks Quality Control',
    'Inspection and test plan for earthworks including excavation, compaction, and material testing',
    (SELECT id FROM projects LIMIT 1),
    true
  ),
  (
    'Steel Reinforcement ITP',
    'Inspection procedures for steel reinforcement installation and verification',
    (SELECT id FROM projects LIMIT 1),
    true
  );

-- Insert sample ITP items for Standard Concrete Inspection
INSERT INTO itp_items (itp_id, item_number, description, acceptance_criteria, inspection_method, is_mandatory, sort_order)
SELECT 
  itp.id,
  '1.1',
  'Formwork Inspection',
  'Formwork shall be clean, properly aligned, and adequately braced',
  'Visual inspection and measurement',
  true,
  1
FROM itps itp WHERE itp.name = 'Standard Concrete Inspection';

INSERT INTO itp_items (itp_id, item_number, description, acceptance_criteria, inspection_method, is_mandatory, sort_order)
SELECT 
  itp.id,
  '1.2',
  'Reinforcement Placement',
  'Reinforcement shall be placed as per drawings with correct cover and spacing',
  'Visual inspection and measurement with cover meter',
  true,
  2
FROM itps itp WHERE itp.name = 'Standard Concrete Inspection';

INSERT INTO itp_items (itp_id, item_number, description, acceptance_criteria, inspection_method, is_mandatory, sort_order)
SELECT 
  itp.id,
  '1.3',
  'Concrete Mix Verification',
  'Concrete mix shall comply with specified strength and workability requirements',
  'Slump test and cube sampling',
  true,
  3
FROM itps itp WHERE itp.name = 'Standard Concrete Inspection';

INSERT INTO itp_items (itp_id, item_number, description, acceptance_criteria, inspection_method, is_mandatory, sort_order)
SELECT 
  itp.id,
  '1.4',
  'Concrete Placement',
  'Concrete shall be placed without segregation and properly compacted',
  'Visual inspection during placement',
  true,
  4
FROM itps itp WHERE itp.name = 'Standard Concrete Inspection';

INSERT INTO itp_items (itp_id, item_number, description, acceptance_criteria, inspection_method, is_mandatory, sort_order)
SELECT 
  itp.id,
  '1.5',
  'Curing Verification',
  'Adequate curing methods shall be applied for minimum 7 days',
  'Visual inspection and documentation',
  false,
  5
FROM itps itp WHERE itp.name = 'Standard Concrete Inspection';

-- Insert sample ITP items for Earthworks Quality Control
INSERT INTO itp_items (itp_id, item_number, description, acceptance_criteria, inspection_method, is_mandatory, sort_order)
SELECT 
  itp.id,
  '2.1',
  'Excavation Depth Verification',
  'Excavation depth shall be as per design drawings ±50mm',
  'Survey measurement and level checking',
  true,
  1
FROM itps itp WHERE itp.name = 'Earthworks Quality Control';

INSERT INTO itp_items (itp_id, item_number, description, acceptance_criteria, inspection_method, is_mandatory, sort_order)
SELECT 
  itp.id,
  '2.2',
  'Subgrade Preparation',
  'Subgrade shall be clean, level, and free from organic matter',
  'Visual inspection and probing',
  true,
  2
FROM itps itp WHERE itp.name = 'Earthworks Quality Control';

INSERT INTO itp_items (itp_id, item_number, description, acceptance_criteria, inspection_method, is_mandatory, sort_order)
SELECT 
  itp.id,
  '2.3',
  'Compaction Testing',
  'Minimum 95% Standard Proctor density shall be achieved',
  'Sand replacement test or nuclear density gauge',
  true,
  3
FROM itps itp WHERE itp.name = 'Earthworks Quality Control';

INSERT INTO itp_items (itp_id, item_number, description, acceptance_criteria, inspection_method, is_mandatory, sort_order)
SELECT 
  itp.id,
  '2.4',
  'Material Quality Check',
  'Fill material shall meet specified gradation and plasticity requirements',
  'Sieve analysis and Atterberg limits testing',
  false,
  4
FROM itps itp WHERE itp.name = 'Earthworks Quality Control';

-- Insert sample ITP items for Steel Reinforcement ITP
INSERT INTO itp_items (itp_id, item_number, description, acceptance_criteria, inspection_method, is_mandatory, sort_order)
SELECT 
  itp.id,
  '3.1',
  'Steel Grade Verification',
  'Steel reinforcement shall be Grade 500 as specified',
  'Material certificates and test reports review',
  true,
  1
FROM itps itp WHERE itp.name = 'Steel Reinforcement ITP';

INSERT INTO itp_items (itp_id, item_number, description, acceptance_criteria, inspection_method, is_mandatory, sort_order)
SELECT 
  itp.id,
  '3.2',
  'Bar Diameter Check',
  'Bar diameters shall match drawing specifications',
  'Physical measurement with calipers',
  true,
  2
FROM itps itp WHERE itp.name = 'Steel Reinforcement ITP';

INSERT INTO itp_items (itp_id, item_number, description, acceptance_criteria, inspection_method, is_mandatory, sort_order)
SELECT 
  itp.id,
  '3.3',
  'Spacing Verification',
  'Bar spacing shall be as per drawings ±10mm tolerance',
  'Measurement with tape measure',
  true,
  3
FROM itps itp WHERE itp.name = 'Steel Reinforcement ITP';

INSERT INTO itp_items (itp_id, item_number, description, acceptance_criteria, inspection_method, is_mandatory, sort_order)
SELECT 
  itp.id,
  '3.4',
  'Cover Measurement',
  'Concrete cover shall meet minimum requirements as per code',
  'Cover meter or physical measurement',
  true,
  4
FROM itps itp WHERE itp.name = 'Steel Reinforcement ITP';

INSERT INTO itp_items (itp_id, item_number, description, acceptance_criteria, inspection_method, is_mandatory, sort_order)
SELECT 
  itp.id,
  '3.5',
  'Lap Length Check',
  'Lap lengths shall meet design requirements',
  'Physical measurement',
  false,
  5
FROM itps itp WHERE itp.name = 'Steel Reinforcement ITP';

-- Update some existing lots to have default inspection status
UPDATE lots SET inspection_status = 'pending' WHERE inspection_status IS NULL;

-- Optional: Assign some ITPs to existing lots for testing
UPDATE lots 
SET 
  itp_id = (SELECT id FROM itps WHERE name = 'Standard Concrete Inspection' LIMIT 1),
  inspection_status = 'pending'
WHERE name LIKE '%concrete%' OR name LIKE '%foundation%'
LIMIT 2;

UPDATE lots 
SET 
  itp_id = (SELECT id FROM itps WHERE name = 'Earthworks Quality Control' LIMIT 1),
  inspection_status = 'pending'
WHERE name LIKE '%earth%' OR name LIKE '%excavation%'
LIMIT 1;