-- =====================================================
-- SEED ITP TEMPLATES - AUSTRALIAN CIVIL CONSTRUCTION
-- =====================================================

-- This script creates comprehensive ITP templates organized by category
-- Each template includes detailed inspection items with acceptance criteria

-- Helper function to create choice options for multi_choice fields
CREATE OR REPLACE FUNCTION get_standard_choices() 
RETURNS JSONB AS $$
BEGIN
    RETURN '[
        {"value": "pass", "label": "Pass"},
        {"value": "fail", "label": "Fail"},
        {"value": "na", "label": "N/A"}
    ]'::JSONB;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- CATEGORY: Site Establishment & Earthworks
-- =====================================================

DO $$
DECLARE
    v_org_id UUID := '550e8400-e29b-41d4-a716-446655440001'; -- Replace with your org ID
    v_template_id UUID;
    v_sort_order INTEGER;
BEGIN
    -- 1. Site Establishment
    INSERT INTO itp_templates (
        organization_id, name, code, category, description, is_active
    ) VALUES (
        v_org_id,
        'Site Establishment',
        'SE-001',
        'Site Establishment & Earthworks',
        'ITP for the initial setup and establishment of a construction site, including safety, environmental, and survey controls.',
        true
    ) RETURNING id INTO v_template_id;

    v_sort_order := 1;
    
    -- Template Items for Site Establishment
    INSERT INTO itp_template_items (
        template_id, sort_order, description, acceptance_criteria,
        inspection_type, choices, inspection_method, reference_standard,
        is_witness_point, is_hold_point, is_mandatory
    ) VALUES
    (
        v_template_id, v_sort_order, 'Pre-start Documentation',
        'All required permits (Council, EPA), Dial Before You Dig (DBYD) records, and construction plans are received, current, and distributed.',
        'multi_choice', get_standard_choices(), 'Document Review', 'Project Specs, Council Permit',
        false, true, true
    ),
    (
        v_template_id, v_sort_order + 1, 'Environmental Controls',
        'Sediment fence, stabilised access, spill kits, and concrete washout installed as per the approved Erosion & Sediment Control Plan (ESCP).',
        'multi_choice', get_standard_choices(), 'Visual Inspection', 'Approved ESCP',
        false, true, true
    ),
    (
        v_template_id, v_sort_order + 2, 'Site Access & Haul Roads',
        'Site access/egress point location is approved. Haul road is constructed and maintained to be safe for all vehicle types.',
        'multi_choice', get_standard_choices(), 'Visual Inspection', 'Traffic Management Plan (TMP)',
        true, false, true
    ),
    (
        v_template_id, v_sort_order + 3, 'Survey Control',
        'Primary survey control points established and protected by a registered surveyor. Control point register is available.',
        'multi_choice', get_standard_choices(), 'Review of Survey Report', 'Surveyor''s Report',
        false, true, true
    ),
    (
        v_template_id, v_sort_order + 4, 'Site Security & Fencing',
        'Temporary fencing is installed around the site perimeter, is secure, and includes appropriate safety/warning signage.',
        'multi_choice', get_standard_choices(), 'Visual Inspection', 'WHS Plan, Project Specs',
        true, false, true
    ),
    (
        v_template_id, v_sort_order + 5, 'Site Amenities & WHS',
        'Site office, toilets, and first aid station are established, compliant with WHS regulations, and fully stocked.',
        'multi_choice', get_standard_choices(), 'Visual Inspection', 'WHS Act & Regulations',
        false, false, true
    );

    -- 2. Bulk Earthworks (Cut to Fill)
    INSERT INTO itp_templates (
        organization_id, name, code, category, description, is_active
    ) VALUES (
        v_org_id,
        'Bulk Earthworks (Cut to Fill)',
        'EW-001',
        'Site Establishment & Earthworks',
        'ITP for bulk earthworks operations including cut and fill procedures.',
        true
    ) RETURNING id INTO v_template_id;

    v_sort_order := 1;
    
    INSERT INTO itp_template_items (
        template_id, sort_order, description, acceptance_criteria,
        inspection_type, choices, inspection_method, reference_standard,
        is_witness_point, is_hold_point, is_mandatory
    ) VALUES
    (
        v_template_id, v_sort_order, 'Cut Area Setout',
        'Cut profiles and levels are set out by surveyor and match design drawings.',
        'multi_choice', get_standard_choices(), 'Review of Survey Data', 'Project Drawings',
        true, false, true
    ),
    (
        v_template_id, v_sort_order + 1, 'Fill Placement Layers',
        'Suitable fill material is placed in horizontal layers not exceeding 300mm loose thickness.',
        'multi_choice', get_standard_choices(), 'Visual Inspection', 'Geotech Report, AS 3798',
        false, false, true
    ),
    (
        v_template_id, v_sort_order + 2, 'Moisture Conditioning',
        'Moisture content of fill material is within ±2% of Optimum Moisture Content (OMC) prior to compaction.',
        'multi_choice', get_standard_choices(), 'On-site Test (NDG)', 'AS 1289.5.4.1',
        true, false, true
    ),
    (
        v_template_id, v_sort_order + 3, 'Fill Compaction',
        'Each layer is compacted to achieve minimum 95% Standard Dry Density (or as per spec). Testing frequency is met (e.g., 1 test per 500m² per layer).',
        'multi_choice', get_standard_choices(), 'Review of NATA Report', 'Geotech Report, AS 3798',
        false, true, true
    ),
    (
        v_template_id, v_sort_order + 4, 'Final Trim Levels',
        'The final bulk earthworks surface is trimmed to design levels within a tolerance of +50mm / -50mm.',
        'multi_choice', get_standard_choices(), 'Review of Survey Report', 'Project Drawings',
        true, false, true
    );

    -- 3. Subgrade Preparation
    INSERT INTO itp_templates (
        organization_id, name, code, category, description, is_active
    ) VALUES (
        v_org_id,
        'Subgrade Preparation',
        'EW-002',
        'Site Establishment & Earthworks',
        'ITP for subgrade preparation prior to pavement construction.',
        true
    ) RETURNING id INTO v_template_id;

    v_sort_order := 1;
    
    INSERT INTO itp_template_items (
        template_id, sort_order, description, acceptance_criteria,
        inspection_type, choices, inspection_method, reference_standard,
        is_witness_point, is_hold_point, is_mandatory
    ) VALUES
    (
        v_template_id, v_sort_order, 'Proof Roll Inspection',
        'Subgrade is visually stable during proof-rolling with a loaded truck. No visible heaving, pumping or deflection.',
        'multi_choice', get_standard_choices(), 'Visual Inspection', 'Geotech Report, TfNSW R44',
        false, true, true
    ),
    (
        v_template_id, v_sort_order + 1, 'Final Trim & Level',
        'Surface is trimmed to design level within a tolerance of +10mm / -20mm. Crossfalls are correct.',
        'multi_choice', get_standard_choices(), 'Review of Survey Report', 'Project Drawings',
        true, false, true
    ),
    (
        v_template_id, v_sort_order + 2, 'Final Layer Compaction',
        'Final layer of subgrade achieves specified compaction (e.g., 98% Standard or 100% Modified).',
        'multi_choice', get_standard_choices(), 'Review of NATA Report', 'Geotech Report, AS 3798',
        false, true, true
    ),
    (
        v_template_id, v_sort_order + 3, 'Subgrade Approval',
        'Subgrade surface is clean, free of deleterious material and approved by the Superintendent/Client Rep for pavement placement.',
        'multi_choice', get_standard_choices(), 'Visual Inspection & Sign-off', 'Conformance Form',
        false, true, true
    );

END $$;

-- =====================================================
-- CATEGORY: Pavements & Surfaces
-- =====================================================

DO $$
DECLARE
    v_org_id UUID := '550e8400-e29b-41d4-a716-446655440001'; -- Replace with your org ID
    v_template_id UUID;
    v_sort_order INTEGER;
BEGIN
    -- 4. Granular Pavement (DGB20)
    INSERT INTO itp_templates (
        organization_id, name, code, category, description, is_active
    ) VALUES (
        v_org_id,
        'Granular Pavement (DGB20)',
        'PV-001',
        'Pavements & Surfaces',
        'ITP for Dense Graded Base (DGB20) pavement construction.',
        true
    ) RETURNING id INTO v_template_id;

    v_sort_order := 1;
    
    INSERT INTO itp_template_items (
        template_id, sort_order, description, acceptance_criteria,
        inspection_type, choices, inspection_method, reference_standard,
        is_witness_point, is_hold_point, is_mandatory
    ) VALUES
    (
        v_template_id, v_sort_order, 'Material Conformance',
        'Material delivery dockets confirm compliance with specified class (e.g., DGB20). NATA test certificates for source material are on file.',
        'multi_choice', get_standard_choices(), 'Document Review', 'TfNSW 3051, Project Specs',
        false, false, true
    ),
    (
        v_template_id, v_sort_order + 1, 'Spreading & Thickness',
        'Material is spread evenly to achieve design compacted thickness per layer (e.g., 150mm).',
        'multi_choice', get_standard_choices(), 'Visual Inspection, Depth Check', 'Project Drawings',
        true, false, true
    ),
    (
        v_template_id, v_sort_order + 2, 'Compaction Conformance',
        'Each layer is compacted to specified relative compaction (e.g., 98% Modified).',
        'multi_choice', get_standard_choices(), 'Review of NATA Report', 'AS 1289, Project Specs',
        false, true, true
    ),
    (
        v_template_id, v_sort_order + 3, 'Surface Level & Tolerance',
        'Finished pavement surface level and crossfall conform to design within a tolerance of +5mm / -15mm.',
        'multi_choice', get_standard_choices(), 'Review of Survey Report', 'Project Drawings',
        true, false, true
    ),
    (
        v_template_id, v_sort_order + 4, 'Pavement Approval',
        'Surface is approved for priming or placement of next layer.',
        'multi_choice', get_standard_choices(), 'Visual Inspection & Sign-off', 'Conformance Form',
        false, true, true
    );

    -- 5. Asphalt Wearing Course (AC14)
    INSERT INTO itp_templates (
        organization_id, name, code, category, description, is_active
    ) VALUES (
        v_org_id,
        'Asphalt Wearing Course (AC14)',
        'PV-002',
        'Pavements & Surfaces',
        'ITP for AC14 asphalt wearing course installation.',
        true
    ) RETURNING id INTO v_template_id;

    v_sort_order := 1;
    
    INSERT INTO itp_template_items (
        template_id, sort_order, description, acceptance_criteria,
        inspection_type, choices, inspection_method, reference_standard,
        is_witness_point, is_hold_point, is_mandatory,
        -- For temperature check
        min_value, max_value, unit
    ) VALUES
    (
        v_template_id, v_sort_order, 'Surface Preparation',
        'Surface is clean, dry, and free of loose material. Tack coat applied uniformly at specified rate (e.g. 0.3 L/m²).',
        'multi_choice', get_standard_choices(), 'Visual Inspection', 'Project Specs, AS 2157',
        true, false, true,
        NULL, NULL, NULL
    ),
    (
        v_template_id, v_sort_order + 1, 'Asphalt Delivery Temp',
        'Temperature of asphalt mix measured at delivery is within the specified range (145-165°C).',
        'numeric', NULL, 'Temperature Probe', 'Mix Design, AS 2150',
        true, false, true,
        145, 165, '°C'
    ),
    (
        v_template_id, v_sort_order + 2, 'Compaction Density',
        'In-situ density achieved is >98% of Marshall Density, confirmed by testing. No shoving or roller marks visible.',
        'multi_choice', get_standard_choices(), 'Review of NATA Report', 'Mix Design, AS 2891',
        false, true, true,
        NULL, NULL, NULL
    ),
    (
        v_template_id, v_sort_order + 3, 'Finished Surface & Levels',
        'Final surface is smooth, with correct crossfall and levels within tolerance (+/- 5mm). No segregation or surface defects.',
        'multi_choice', get_standard_choices(), 'Review of Survey Report', 'Project Drawings',
        true, false, true,
        NULL, NULL, NULL
    ),
    (
        v_template_id, v_sort_order + 4, 'Joint Construction',
        'All longitudinal and transverse joints are neat, vertical, and well-compacted.',
        'multi_choice', get_standard_choices(), 'Visual Inspection', 'Project Specs',
        true, false, true,
        NULL, NULL, NULL
    );

END $$;

-- =====================================================
-- CATEGORY: Stormwater & Drainage
-- =====================================================

DO $$
DECLARE
    v_org_id UUID := '550e8400-e29b-41d4-a716-446655440001'; -- Replace with your org ID
    v_template_id UUID;
    v_sort_order INTEGER;
BEGIN
    -- 6. Stormwater Pipes & Culverts
    INSERT INTO itp_templates (
        organization_id, name, code, category, description, is_active
    ) VALUES (
        v_org_id,
        'Stormwater Pipes & Culverts',
        'SW-001',
        'Stormwater & Drainage',
        'ITP for installation of stormwater pipes and culverts.',
        true
    ) RETURNING id INTO v_template_id;

    v_sort_order := 1;
    
    INSERT INTO itp_template_items (
        template_id, sort_order, description, acceptance_criteria,
        inspection_type, choices, inspection_method, reference_standard,
        is_witness_point, is_hold_point, is_mandatory
    ) VALUES
    (
        v_template_id, v_sort_order, 'Pipe Materials Compliance',
        'Pipes conform to specified class and diameter. Material test certificates provided.',
        'multi_choice', get_standard_choices(), 'Document Review', 'AS 4058, AS 1254',
        false, false, true
    ),
    (
        v_template_id, v_sort_order + 1, 'Trench Excavation',
        'Trench width, depth, and batter comply with design. Dewatering effective if required.',
        'multi_choice', get_standard_choices(), 'Visual Inspection', 'AS 3725, Project Drawings',
        true, false, true
    ),
    (
        v_template_id, v_sort_order + 2, 'Bedding Installation',
        'Bedding material and thickness conform to spec. Surface is level and properly compacted.',
        'multi_choice', get_standard_choices(), 'Visual & Physical Test', 'AS 2758.1, Project Specs',
        true, false, true
    ),
    (
        v_template_id, v_sort_order + 3, 'Pipe Laying & Alignment',
        'Pipes laid to correct grade (±10mm), alignment (±25mm), and jointed properly. No damage to pipes.',
        'multi_choice', get_standard_choices(), 'Review of Survey Report', 'Project Drawings',
        false, true, true
    ),
    (
        v_template_id, v_sort_order + 4, 'Backfill & Compaction',
        'Select backfill placed and compacted in layers as specified. No damage to pipes during backfilling.',
        'multi_choice', get_standard_choices(), 'Visual & Test Results', 'AS 3725, Project Specs',
        false, false, true
    );

    -- 7. Stormwater Pits & Headwalls
    INSERT INTO itp_templates (
        organization_id, name, code, category, description, is_active
    ) VALUES (
        v_org_id,
        'Stormwater Pits & Headwalls',
        'SW-002',
        'Stormwater & Drainage',
        'ITP for construction of stormwater pits and headwalls.',
        true
    ) RETURNING id INTO v_template_id;

    v_sort_order := 1;
    
    INSERT INTO itp_template_items (
        template_id, sort_order, description, acceptance_criteria,
        inspection_type, choices, inspection_method, reference_standard,
        is_witness_point, is_hold_point, is_mandatory
    ) VALUES
    (
        v_template_id, v_sort_order, 'Excavation & Foundation',
        'Excavation to correct dimensions. Foundation material placed and compacted.',
        'multi_choice', get_standard_choices(), 'Visual Inspection', 'Project Drawings',
        true, false, true
    ),
    (
        v_template_id, v_sort_order + 1, 'Precast Unit Placement',
        'Precast units are undamaged, correctly positioned, and level. Lifting certification current.',
        'multi_choice', get_standard_choices(), 'Visual Inspection', 'Manufacturer Specs',
        true, false, true
    ),
    (
        v_template_id, v_sort_order + 2, 'In-situ Concrete',
        'Concrete mix design approved. Formwork secure. Cover to reinforcement correct.',
        'multi_choice', get_standard_choices(), 'Visual & Document Review', 'AS 3600, Mix Design',
        false, true, true
    ),
    (
        v_template_id, v_sort_order + 3, 'Grate/Cover Installation',
        'Grates and covers installed level with finished surface. Correct class rating.',
        'multi_choice', get_standard_choices(), 'Visual Inspection', 'AS 3996',
        true, false, true
    );

END $$;

-- =====================================================
-- CATEGORY: Concrete Structures
-- =====================================================

DO $$
DECLARE
    v_org_id UUID := '550e8400-e29b-41d4-a716-446655440001'; -- Replace with your org ID
    v_template_id UUID;
    v_sort_order INTEGER;
BEGIN
    -- 8. Concrete Footings
    INSERT INTO itp_templates (
        organization_id, name, code, category, description, is_active
    ) VALUES (
        v_org_id,
        'Concrete Footings',
        'CC-001',
        'Concrete Structures',
        'ITP for concrete footing construction including pad and strip footings.',
        true
    ) RETURNING id INTO v_template_id;

    v_sort_order := 1;
    
    INSERT INTO itp_template_items (
        template_id, sort_order, description, acceptance_criteria,
        inspection_type, choices, inspection_method, reference_standard,
        is_witness_point, is_hold_point, is_mandatory,
        min_value, max_value, unit
    ) VALUES
    (
        v_template_id, v_sort_order, 'Excavation Dimensions',
        'Excavation dimensions, depths, and founding material conform to design and geotechnical requirements.',
        'multi_choice', get_standard_choices(), 'Visual & Survey Check', 'Geotech Report, Drawings',
        false, true, true,
        NULL, NULL, NULL
    ),
    (
        v_template_id, v_sort_order + 1, 'Reinforcement Placement',
        'Reinforcement size, spacing, and cover conform to drawings. Bars are clean and properly tied.',
        'multi_choice', get_standard_choices(), 'Visual Inspection', 'AS 3600, Project Drawings',
        true, false, true,
        NULL, NULL, NULL
    ),
    (
        v_template_id, v_sort_order + 2, 'Concrete Placement',
        'Approved mix design used. Slump test within specification. No segregation during placement.',
        'numeric', NULL, 'Slump Test', 'AS 1012.3.1',
        true, false, true,
        80, 120, 'mm'
    ),
    (
        v_template_id, v_sort_order + 3, 'Curing Protection',
        'Curing method applied immediately after finishing. Protection maintained for specified period.',
        'multi_choice', get_standard_choices(), 'Visual Inspection', 'AS 3600, Project Specs',
        false, false, true,
        NULL, NULL, NULL
    );

    -- 9. Concrete Slabs
    INSERT INTO itp_templates (
        organization_id, name, code, category, description, is_active
    ) VALUES (
        v_org_id,
        'Concrete Slabs',
        'CC-002',
        'Concrete Structures',
        'ITP for concrete slab construction including ground slabs and suspended slabs.',
        true
    ) RETURNING id INTO v_template_id;

    v_sort_order := 1;
    
    INSERT INTO itp_template_items (
        template_id, sort_order, description, acceptance_criteria,
        inspection_type, choices, inspection_method, reference_standard,
        is_witness_point, is_hold_point, is_mandatory
    ) VALUES
    (
        v_template_id, v_sort_order, 'Subgrade/Formwork Preparation',
        'Subgrade compacted and level. Formwork secure, clean, and to correct dimensions.',
        'multi_choice', get_standard_choices(), 'Visual Inspection', 'AS 3610, Drawings',
        true, false, true
    ),
    (
        v_template_id, v_sort_order + 1, 'Vapour Barrier & Mesh',
        'Vapour barrier installed with sealed laps. Mesh positioned with correct cover and properly supported.',
        'multi_choice', get_standard_choices(), 'Visual Inspection', 'AS 2870, AS 3600',
        true, false, true
    ),
    (
        v_template_id, v_sort_order + 2, 'Concrete Pour & Finish',
        'Concrete placed without segregation. Finished to correct levels and surface texture.',
        'multi_choice', get_standard_choices(), 'Visual & Level Check', 'Project Specs',
        false, false, true
    ),
    (
        v_template_id, v_sort_order + 3, 'Joint Installation',
        'Control joints cut at correct spacing and depth. Construction joints properly prepared.',
        'multi_choice', get_standard_choices(), 'Visual Inspection', 'AS 3600, Drawings',
        true, false, true
    );

END $$;

-- Clean up helper function
DROP FUNCTION IF EXISTS get_standard_choices();

-- Add comments
COMMENT ON TABLE itp_templates IS 'Seeded with comprehensive Australian civil construction ITP templates';
COMMENT ON TABLE itp_template_items IS 'Detailed inspection items with acceptance criteria based on Australian Standards';

-- Summary query to verify seeded data
SELECT 
    category,
    COUNT(DISTINCT id) as template_count,
    STRING_AGG(name || ' (' || code || ')', ', ' ORDER BY code) as templates
FROM itp_templates
WHERE code IN ('SE-001', 'EW-001', 'EW-002', 'PV-001', 'PV-002', 'SW-001', 'SW-002', 'CC-001', 'CC-002')
GROUP BY category
ORDER BY category;