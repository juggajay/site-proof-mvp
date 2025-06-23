-- =====================================================
-- SEED FINAL ITP TEMPLATES - PART 3
-- =====================================================

-- Helper function
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
-- CATEGORY: Bridge Construction
-- =====================================================

DO $$
DECLARE
    v_org_id UUID := '550e8400-e29b-41d4-a716-446655440001'; -- Replace with your org ID
    v_template_id UUID;
    v_sort_order INTEGER;
BEGIN
    -- 20. Bridge Deck Construction
    INSERT INTO itp_templates (
        organization_id, name, code, category, description, is_active
    ) VALUES (
        v_org_id,
        'Bridge Deck Construction',
        'BR-001',
        'Bridge Construction',
        'ITP for bridge deck construction including formwork, reinforcement, and concrete placement.',
        true
    ) RETURNING id INTO v_template_id;

    v_sort_order := 1;
    
    INSERT INTO itp_template_items (
        template_id, sort_order, description, acceptance_criteria,
        inspection_type, choices, inspection_method, reference_standard,
        is_witness_point, is_hold_point, is_mandatory
    ) VALUES
    (
        v_template_id, v_sort_order, 'Deck Formwork & Falsework',
        'Formwork erected to correct levels and camber. Falsework capacity certified by engineer.',
        'multi_choice', get_standard_choices(), 'Visual & Engineering Check', 'AS 3610, B-SET',
        false, true, true
    ),
    (
        v_template_id, v_sort_order + 1, 'Deck Reinforcement',
        'Top and bottom reinforcement correctly positioned. Cover maintained. Bar chairs adequate.',
        'multi_choice', get_standard_choices(), 'Visual Inspection', 'AS 5100.5, Drawings',
        true, false, true
    ),
    (
        v_template_id, v_sort_order + 2, 'Pre-pour Inspection',
        'All embedments, conduits, and drainage outlets correctly positioned. Formwork cleaned.',
        'multi_choice', get_standard_choices(), 'Visual Inspection', 'Project Drawings',
        false, true, true
    ),
    (
        v_template_id, v_sort_order + 3, 'Concrete Placement',
        'Concrete placed in continuous operation. Vibration adequate. No cold joints.',
        'multi_choice', get_standard_choices(), 'Visual Inspection', 'AS 5100.5',
        true, false, true
    ),
    (
        v_template_id, v_sort_order + 4, 'Deck Finish & Curing',
        'Surface finished to specified texture and crossfall. Curing commenced immediately.',
        'multi_choice', get_standard_choices(), 'Visual Inspection', 'B-SET, Project Specs',
        true, false, true
    );

    -- 21. Prestressed Girder Installation
    INSERT INTO itp_templates (
        organization_id, name, code, category, description, is_active
    ) VALUES (
        v_org_id,
        'Prestressed Girder Installation',
        'BR-002',
        'Bridge Construction',
        'ITP for installation of precast prestressed concrete girders.',
        true
    ) RETURNING id INTO v_template_id;

    v_sort_order := 1;
    
    INSERT INTO itp_template_items (
        template_id, sort_order, description, acceptance_criteria,
        inspection_type, choices, inspection_method, reference_standard,
        is_witness_point, is_hold_point, is_mandatory
    ) VALUES
    (
        v_template_id, v_sort_order, 'Girder Inspection',
        'Girders inspected for damage. Identification marks match drawings. QA documentation complete.',
        'multi_choice', get_standard_choices(), 'Visual & Document Review', 'AS 5100.5',
        false, false, true
    ),
    (
        v_template_id, v_sort_order + 1, 'Bearing Preparation',
        'Bearing pads installed level. Bearing surfaces clean. Temporary supports ready.',
        'multi_choice', get_standard_choices(), 'Visual Inspection', 'AS 5100.4',
        true, false, true
    ),
    (
        v_template_id, v_sort_order + 2, 'Crane & Lifting Setup',
        'Crane capacity verified. Lift plan approved. Exclusion zones established.',
        'multi_choice', get_standard_choices(), 'Document Review', 'AS 2550.1',
        false, true, true
    ),
    (
        v_template_id, v_sort_order + 3, 'Girder Placement',
        'Girders placed within tolerance (±10mm). Bearings correctly loaded. Temporary bracing installed.',
        'multi_choice', get_standard_choices(), 'Survey Check', 'AS 5100.5, Drawings',
        true, false, true
    ),
    (
        v_template_id, v_sort_order + 4, 'Diaphragm Connection',
        'Diaphragm reinforcement tied. Concrete placed and cured. Connection integrity verified.',
        'multi_choice', get_standard_choices(), 'Visual Inspection', 'AS 5100.5',
        true, false, true
    );

END $$;

-- =====================================================
-- CATEGORY: Landscaping & Finishes
-- =====================================================

DO $$
DECLARE
    v_org_id UUID := '550e8400-e29b-41d4-a716-446655440001'; -- Replace with your org ID
    v_template_id UUID;
    v_sort_order INTEGER;
BEGIN
    -- 22. Topsoil & Landscaping
    INSERT INTO itp_templates (
        organization_id, name, code, category, description, is_active
    ) VALUES (
        v_org_id,
        'Topsoil & Landscaping',
        'LS-001',
        'Landscaping & Finishes',
        'ITP for topsoil placement and general landscaping works.',
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
        v_template_id, v_sort_order, 'Subgrade Preparation',
        'Area graded to correct levels. Debris and unsuitable material removed. Drainage adequate.',
        'multi_choice', get_standard_choices(), 'Visual Inspection', 'Landscape Drawings',
        true, false, true,
        NULL, NULL, NULL
    ),
    (
        v_template_id, v_sort_order + 1, 'Topsoil Quality',
        'Topsoil meets specification. Free from weeds, debris, and contaminants. pH tested.',
        'numeric', NULL, 'pH Test', 'AS 4419',
        false, false, true,
        5.5, 7.5, 'pH'
    ),
    (
        v_template_id, v_sort_order + 2, 'Topsoil Placement',
        'Topsoil spread to correct depth. Not placed when too wet or over frozen ground.',
        'multi_choice', get_standard_choices(), 'Depth Measurement', 'Project Specs',
        true, false, true,
        NULL, NULL, NULL
    ),
    (
        v_template_id, v_sort_order + 3, 'Fertilizer Application',
        'Correct fertilizer type and rate applied. Even distribution achieved.',
        'multi_choice', get_standard_choices(), 'Visual Inspection', 'Landscape Specs',
        false, false, true,
        NULL, NULL, NULL
    ),
    (
        v_template_id, v_sort_order + 4, 'Grass Establishment',
        'Seed/turf laid as specified. Watering regime commenced. Initial growth satisfactory.',
        'multi_choice', get_standard_choices(), 'Visual Inspection', 'AS 4419',
        true, false, true,
        NULL, NULL, NULL
    );

    -- 23. Concrete Footpaths
    INSERT INTO itp_templates (
        organization_id, name, code, category, description, is_active
    ) VALUES (
        v_org_id,
        'Concrete Footpaths',
        'LS-002',
        'Landscaping & Finishes',
        'ITP for concrete footpath construction.',
        true
    ) RETURNING id INTO v_template_id;

    v_sort_order := 1;
    
    INSERT INTO itp_template_items (
        template_id, sort_order, description, acceptance_criteria,
        inspection_type, choices, inspection_method, reference_standard,
        is_witness_point, is_hold_point, is_mandatory
    ) VALUES
    (
        v_template_id, v_sort_order, 'Subgrade & Boxing',
        'Subgrade trimmed to level. Boxing secure and to correct width/depth.',
        'multi_choice', get_standard_choices(), 'Visual & Level Check', 'AS 1428.1',
        true, false, true
    ),
    (
        v_template_id, v_sort_order + 1, 'Mesh Placement',
        'SL72 mesh positioned centrally. Laps min 300mm. Bar chairs adequate.',
        'multi_choice', get_standard_choices(), 'Visual Inspection', 'AS 3600',
        false, false, true
    ),
    (
        v_template_id, v_sort_order + 2, 'Concrete Placement',
        'Concrete placed and compacted. Surface screeded to correct falls.',
        'multi_choice', get_standard_choices(), 'Visual Inspection', 'AS 3600',
        true, false, true
    ),
    (
        v_template_id, v_sort_order + 3, 'Surface Finish',
        'Broom finish or as specified. Edges tooled. Surface free from defects.',
        'multi_choice', get_standard_choices(), 'Visual Inspection', 'AS 1428.1',
        true, false, true
    ),
    (
        v_template_id, v_sort_order + 4, 'Control Joints',
        'Joints tooled/cut at correct spacing. Depth 1/4 of slab thickness.',
        'multi_choice', get_standard_choices(), 'Visual Inspection', 'Project Specs',
        false, false, true
    );

END $$;

-- =====================================================
-- CATEGORY: Marine/Waterfront Works
-- =====================================================

DO $$
DECLARE
    v_org_id UUID := '550e8400-e29b-41d4-a716-446655440001'; -- Replace with your org ID
    v_template_id UUID;
    v_sort_order INTEGER;
BEGIN
    -- 24. Rock Revetment
    INSERT INTO itp_templates (
        organization_id, name, code, category, description, is_active
    ) VALUES (
        v_org_id,
        'Rock Revetment',
        'MW-001',
        'Marine/Waterfront Works',
        'ITP for rock revetment and armour protection works.',
        true
    ) RETURNING id INTO v_template_id;

    v_sort_order := 1;
    
    INSERT INTO itp_template_items (
        template_id, sort_order, description, acceptance_criteria,
        inspection_type, choices, inspection_method, reference_standard,
        is_witness_point, is_hold_point, is_mandatory
    ) VALUES
    (
        v_template_id, v_sort_order, 'Geotextile Installation',
        'Geotextile laid with correct overlaps. No damage or contamination. Properly anchored.',
        'multi_choice', get_standard_choices(), 'Visual Inspection', 'AS 3706',
        true, false, true
    ),
    (
        v_template_id, v_sort_order + 1, 'Rock Grading',
        'Rock size and grading matches specification. Test certificates provided.',
        'multi_choice', get_standard_choices(), 'Visual & Grading Test', 'Project Specs',
        false, false, true
    ),
    (
        v_template_id, v_sort_order + 2, 'Underlayer Placement',
        'Filter layer placed to correct thickness. No segregation. Profile within tolerance.',
        'multi_choice', get_standard_choices(), 'Survey Check', 'PIANC Guidelines',
        true, false, true
    ),
    (
        v_template_id, v_sort_order + 3, 'Armour Rock Placement',
        'Armour rocks individually placed. Interlocking achieved. Slope angle correct.',
        'multi_choice', get_standard_choices(), 'Visual & Survey', 'CIRIA C683',
        true, false, true
    ),
    (
        v_template_id, v_sort_order + 4, 'Crest & Toe Details',
        'Crest level and width correct. Toe embedded to design depth. Transitions neat.',
        'multi_choice', get_standard_choices(), 'Survey Check', 'Project Drawings',
        false, true, true
    );

    -- 25. Sheet Pile Wall
    INSERT INTO itp_templates (
        organization_id, name, code, category, description, is_active
    ) VALUES (
        v_org_id,
        'Sheet Pile Wall',
        'MW-002',
        'Marine/Waterfront Works',
        'ITP for steel sheet pile wall installation.',
        true
    ) RETURNING id INTO v_template_id;

    v_sort_order := 1;
    
    INSERT INTO itp_template_items (
        template_id, sort_order, description, acceptance_criteria,
        inspection_type, choices, inspection_method, reference_standard,
        is_witness_point, is_hold_point, is_mandatory
    ) VALUES
    (
        v_template_id, v_sort_order, 'Sheet Pile Condition',
        'Piles straight, undamaged, and correct section. Interlocks clean and lubricated.',
        'multi_choice', get_standard_choices(), 'Visual Inspection', 'AS 2159',
        false, false, true
    ),
    (
        v_template_id, v_sort_order + 1, 'Setting Out',
        'Pile line set out correctly. Guide frame installed and secured.',
        'multi_choice', get_standard_choices(), 'Survey Check', 'Project Drawings',
        true, false, true
    ),
    (
        v_template_id, v_sort_order + 2, 'Pile Driving',
        'Piles driven within tolerance (1:75 vertical). Interlocks engaged. No damage during driving.',
        'multi_choice', get_standard_choices(), 'Visual & Plumb Check', 'AS 2159',
        true, false, true
    ),
    (
        v_template_id, v_sort_order + 3, 'Cut-off Level',
        'Piles cut to correct level. Cut square and neat. Capping beam preparation complete.',
        'multi_choice', get_standard_choices(), 'Level Check', 'Project Drawings',
        true, false, true
    ),
    (
        v_template_id, v_sort_order + 4, 'Corrosion Protection',
        'Coating system applied as specified. Thickness checked. Damaged areas repaired.',
        'multi_choice', get_standard_choices(), 'DFT Measurement', 'AS/NZS 2312.3',
        false, false, true
    );

END $$;

-- =====================================================
-- CATEGORY: Rail Infrastructure
-- =====================================================

DO $$
DECLARE
    v_org_id UUID := '550e8400-e29b-41d4-a716-446655440001'; -- Replace with your org ID
    v_template_id UUID;
    v_sort_order INTEGER;
BEGIN
    -- 26. Rail Track Construction
    INSERT INTO itp_templates (
        organization_id, name, code, category, description, is_active
    ) VALUES (
        v_org_id,
        'Rail Track Construction',
        'RL-001',
        'Rail Infrastructure',
        'ITP for rail track construction including ballast and track laying.',
        true
    ) RETURNING id INTO v_template_id;

    v_sort_order := 1;
    
    INSERT INTO itp_template_items (
        template_id, sort_order, description, acceptance_criteria,
        inspection_type, choices, inspection_method, reference_standard,
        is_witness_point, is_hold_point, is_mandatory
    ) VALUES
    (
        v_template_id, v_sort_order, 'Formation Preparation',
        'Formation trimmed to design level and crossfall. Drainage functional.',
        'multi_choice', get_standard_choices(), 'Survey Check', 'TfNSW TS 3511',
        true, false, true
    ),
    (
        v_template_id, v_sort_order + 1, 'Ballast Quality',
        'Ballast meets grading and durability requirements. Test certificates provided.',
        'multi_choice', get_standard_choices(), 'Test Results', 'AS 2758.7',
        false, false, true
    ),
    (
        v_template_id, v_sort_order + 2, 'Sleeper & Rail Placement',
        'Sleepers spaced correctly. Rails aligned and secured. Joints properly gapped.',
        'multi_choice', get_standard_choices(), 'Visual & Measurement', 'TfNSW TS 3512',
        true, false, true
    ),
    (
        v_template_id, v_sort_order + 3, 'Track Geometry',
        'Gauge, cant, twist, and alignment within tolerance. Top of rail levels correct.',
        'multi_choice', get_standard_choices(), 'Track Geometry Car', 'TfNSW TS 3513',
        false, true, true
    ),
    (
        v_template_id, v_sort_order + 4, 'Ballast Profile',
        'Ballast profile and shoulder width correct. Crib ballast adequate.',
        'multi_choice', get_standard_choices(), 'Template Check', 'TfNSW Standards',
        true, false, true
    );

    -- 27. Level Crossing
    INSERT INTO itp_templates (
        organization_id, name, code, category, description, is_active
    ) VALUES (
        v_org_id,
        'Level Crossing',
        'RL-002',
        'Rail Infrastructure',
        'ITP for level crossing construction.',
        true
    ) RETURNING id INTO v_template_id;

    v_sort_order := 1;
    
    INSERT INTO itp_template_items (
        template_id, sort_order, description, acceptance_criteria,
        inspection_type, choices, inspection_method, reference_standard,
        is_witness_point, is_hold_point, is_mandatory
    ) VALUES
    (
        v_template_id, v_sort_order, 'Road Approach',
        'Road approaches graded correctly. Sight distances achieved. Signage installed.',
        'multi_choice', get_standard_choices(), 'Visual & Survey', 'AS 1742.7',
        true, false, true
    ),
    (
        v_template_id, v_sort_order + 1, 'Crossing Surface',
        'Crossing panels/surface installed level with rails. Drainage adequate.',
        'multi_choice', get_standard_choices(), 'Visual Inspection', 'TfNSW Standards',
        true, false, true
    ),
    (
        v_template_id, v_sort_order + 2, 'Flangeway Clearance',
        'Flangeway dimensions correct (45-65mm). Clear of obstructions.',
        'multi_choice', get_standard_choices(), 'Measurement', 'TfNSW TS 3515',
        false, true, true
    ),
    (
        v_template_id, v_sort_order + 3, 'Active Protection',
        'Signals, bells, and boom gates operational. Control circuits tested.',
        'multi_choice', get_standard_choices(), 'Functional Test', 'TfNSW TS 3516',
        false, true, true
    ),
    (
        v_template_id, v_sort_order + 4, 'Final Inspection',
        'All components complete. Safety audit conducted. Commissioning documents signed.',
        'multi_choice', get_standard_choices(), 'Commissioning Check', 'TfNSW Requirements',
        false, true, true
    );

END $$;

-- Clean up
DROP FUNCTION IF EXISTS get_standard_choices();

-- Final comprehensive summary
SELECT 
    'Grand Total Templates:' as metric,
    COUNT(*) as value
FROM itp_templates
UNION ALL
SELECT 
    'Grand Total Inspection Items:',
    COUNT(*)
FROM itp_template_items ti
JOIN itp_templates t ON ti.template_id = t.id;

-- Summary by category
SELECT 
    category,
    COUNT(DISTINCT id) as template_count,
    STRING_AGG(name || ' (' || code || ')', ', ' ORDER BY code) as templates
FROM itp_templates
GROUP BY category
ORDER BY category;