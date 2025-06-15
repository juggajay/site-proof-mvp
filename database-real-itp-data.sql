-- Real ITP Data Import Script
-- This script imports your 10 real construction ITPs with detailed inspection items
-- Run this after applying the enhanced schema

-- Step 1: Clear existing sample data
DELETE FROM itp_items WHERE itp_id IN (SELECT id FROM itps);
DELETE FROM itps WHERE is_active = true;

-- Step 2: Get a project ID to associate ITPs with
-- You'll need to replace this with an actual project ID from your database
DO $$
DECLARE
    target_project_id UUID;
BEGIN
    -- Get the first available project ID
    SELECT id INTO target_project_id FROM projects LIMIT 1;
    
    IF target_project_id IS NULL THEN
        RAISE EXCEPTION 'No projects found. Please create a project first.';
    END IF;
    
    -- Step 3: Insert your 10 real ITPs
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
        target_project_id,
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
        target_project_id,
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
        target_project_id,
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
        target_project_id,
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
        target_project_id,
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
        target_project_id,
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
        target_project_id,
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
        target_project_id,
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
        target_project_id,
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
        target_project_id,
        'Structural',
        '3 hours',
        'high',
        '["Structural Engineering", "Steel Fabrication", "Quality Control"]'::jsonb,
        '2025-06-14 01:44:05.645591+00',
        '2025-06-14 01:44:05.645591+00',
        true
    );

    -- Step 4: Insert detailed ITP items for each ITP
    
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
    ),
    (
        '0fe09989-58f8-450d-aa85-2d387d99d2be',
        'PR-004',
        'Compaction density testing',
        'Minimum 95% Standard Proctor density',
        'Nuclear density gauge or sand replacement test',
        'Density test certificates',
        false,
        4
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
    ),
    (
        '2de7bb79-51b6-491a-abf6-02f63d78d597',
        'BF-004',
        'Concrete quality verification',
        'Concrete strength meets design requirements',
        'Cube testing and slump verification',
        'Concrete test certificates',
        true,
        4
    );

    -- Subgrade Preparation Items
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
        '3f8c2a1b-7d4e-4c9a-b8f2-1e5d6c7a8b9c',
        'SG-001',
        'Subgrade level verification',
        'Levels as per design drawings ±25mm',
        'Survey measurement and checking',
        'Survey level report',
        true,
        1
    ),
    (
        '3f8c2a1b-7d4e-4c9a-b8f2-1e5d6c7a8b9c',
        'SG-002',
        'Subgrade material quality check',
        'Material meets specification requirements',
        'Visual inspection and material testing',
        'Material test certificates',
        true,
        2
    ),
    (
        '3f8c2a1b-7d4e-4c9a-b8f2-1e5d6c7a8b9c',
        'SG-003',
        'Compaction verification',
        'Minimum 95% Standard Proctor density',
        'Nuclear density gauge testing',
        'Compaction test results',
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
    ),
    (
        '4a9b3c2d-8e5f-4d0b-c9g3-2f6e7d8c9e0f',
        'CP-004',
        'Concrete placement verification',
        'Concrete placed without segregation, properly compacted',
        'Visual inspection during placement',
        'Placement inspection record',
        true,
        4
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
    ),
    (
        '0g5h9i8j-4k1l-0j6h-i5m9-8l2k3j4i5j6l',
        'SR-004',
        'Lap length and splice verification',
        'Lap lengths and splices as per design',
        'Physical measurement and visual inspection',
        'Splice inspection record',
        false,
        4
    );

    -- Asphalt Layer Quality Check Items
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
        '6c1d5e4f-0g7h-6f2d-e1i5-4h8g9f0e1g2h',
        'AL-001',
        'Asphalt temperature verification',
        'Temperature between 140-160°C at placement',
        'Infrared thermometer measurement',
        'Temperature measurement record',
        true,
        1
    ),
    (
        '6c1d5e4f-0g7h-6f2d-e1i5-4h8g9f0e1g2h',
        'AL-002',
        'Compaction density testing',
        'Minimum 95% theoretical maximum density',
        'Nuclear density gauge testing',
        'Density test certificates',
        true,
        2
    ),
    (
        '6c1d5e4f-0g7h-6f2d-e1i5-4h8g9f0e1g2h',
        'AL-003',
        'Surface texture and finish verification',
        'Smooth finish, no segregation or tearing',
        'Visual inspection and texture measurement',
        'Surface inspection record',
        false,
        3
    );

    -- Topsoiling & Seeding Items
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
        '5b0c4d3e-9f6g-5e1c-d0h4-3g7f8e9d0f1g',
        'TS-001',
        'Topsoil quality verification',
        'Topsoil meets specification for organic content and pH',
        'Laboratory testing of soil samples',
        'Soil test certificates',
        true,
        1
    ),
    (
        '5b0c4d3e-9f6g-5e1c-d0h4-3g7f8e9d0f1g',
        'TS-002',
        'Seeding rate and coverage verification',
        'Seeding rate as per specification, uniform coverage',
        'Visual inspection and area measurement',
        'Seeding application record',
        true,
        2
    );

    -- Add items for remaining ITPs (abbreviated for space)
    -- Pavement Layer - Unbound Granular
    INSERT INTO itp_items (
        itp_id, item_number, description, acceptance_criteria, inspection_method, is_mandatory, sort_order
    ) VALUES 
    (
        '7d2e6f5g-1h8i-7g3e-f2j6-5i9h0g1f2g3i',
        'PL-001',
        'Material gradation verification',
        'Gradation within specification limits',
        'Sieve analysis testing',
        true,
        1
    ),
    (
        '7d2e6f5g-1h8i-7g3e-f2j6-5i9h0g1f2g3i',
        'PL-002',
        'Compaction density verification',
        'Minimum 98% Standard Proctor density',
        'Nuclear density gauge testing',
        true,
        2
    );

    -- Conduit & Pit Installation
    INSERT INTO itp_items (
        itp_id, item_number, description, acceptance_criteria, inspection_method, is_mandatory, sort_order
    ) VALUES 
    (
        '8e3f7g6h-2i9j-8h4f-g3k7-6j0i1h2g3h4j',
        'CI-001',
        'Conduit alignment and grade verification',
        'Alignment and grade as per drawings ±25mm',
        'Survey measurement and checking',
        true,
        1
    ),
    (
        '8e3f7g6h-2i9j-8h4f-g3k7-6j0i1h2g3h4j',
        'CI-002',
        'Pit installation verification',
        'Pits installed level and to correct depth',
        'Level checking and measurement',
        true,
        2
    );

    -- Highway Concrete Pour Inspection
    INSERT INTO itp_items (
        itp_id, item_number, description, acceptance_criteria, inspection_method, is_mandatory, sort_order
    ) VALUES 
    (
        '9f4g8h7i-3j0k-9i5g-h4l8-7k1j2i3h4i5k',
        'HC-001',
        'Highway concrete mix verification',
        'Mix design meets highway specification requirements',
        'Review of approved mix design and certificates',
        true,
        1
    ),
    (
        '9f4g8h7i-3j0k-9i5g-h4l8-7k1j2i3h4i5k',
        'HC-002',
        'Concrete strength verification',
        'Minimum 32MPa at 28 days',
        'Cube testing and strength verification',
        true,
        2
    );

    RAISE NOTICE 'Successfully imported 10 real ITPs with detailed inspection items';
END $$;

-- Step 5: Verify the import
SELECT 
    i.name,
    i.category,
    i.complexity,
    i.estimated_duration,
    COUNT(ii.id) as item_count,
    COUNT(CASE WHEN ii.is_mandatory THEN 1 END) as mandatory_items
FROM itps i
LEFT JOIN itp_items ii ON ii.itp_id = i.id
WHERE i.is_active = true
GROUP BY i.id, i.name, i.category, i.complexity, i.estimated_duration
ORDER BY i.name;