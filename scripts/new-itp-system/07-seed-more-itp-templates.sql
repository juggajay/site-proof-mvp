-- =====================================================
-- SEED MORE ITP TEMPLATES - PART 2
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
-- CATEGORY: Concrete Structures (continued)
-- =====================================================

DO $$
DECLARE
    v_org_id UUID := '550e8400-e29b-41d4-a716-446655440001'; -- Replace with your org ID
    v_template_id UUID;
    v_sort_order INTEGER;
BEGIN
    -- 10. Kerb & Gutter
    INSERT INTO itp_templates (
        organization_id, name, code, category, description, is_active
    ) VALUES (
        v_org_id,
        'Kerb & Gutter',
        'CC-003',
        'Concrete Structures',
        'ITP for kerb and gutter construction including barrier kerb and mountable kerb.',
        true
    ) RETURNING id INTO v_template_id;

    v_sort_order := 1;
    
    INSERT INTO itp_template_items (
        template_id, sort_order, description, acceptance_criteria,
        inspection_type, choices, inspection_method, reference_standard,
        is_witness_point, is_hold_point, is_mandatory
    ) VALUES
    (
        v_template_id, v_sort_order, 'String Line & Levels',
        'String lines set to design alignment and grade. Offset pegs at regular intervals.',
        'multi_choice', get_standard_choices(), 'Survey Check', 'Project Drawings',
        true, false, true
    ),
    (
        v_template_id, v_sort_order + 1, 'Base Preparation',
        'Base trimmed and compacted. Free of debris and deleterious material.',
        'multi_choice', get_standard_choices(), 'Visual Inspection', 'Project Specs',
        false, false, true
    ),
    (
        v_template_id, v_sort_order + 2, 'Formwork/Machine Setup',
        'Forms or kerb machine set to correct profile. Trial section approved if required.',
        'multi_choice', get_standard_choices(), 'Visual Inspection', 'RMS QA Spec R143',
        true, false, true
    ),
    (
        v_template_id, v_sort_order + 3, 'Concrete Quality & Finish',
        'Concrete workability suitable. Finished profile matches design. Surface texture as specified.',
        'multi_choice', get_standard_choices(), 'Visual Inspection', 'AS 2876, Project Specs',
        false, false, true
    ),
    (
        v_template_id, v_sort_order + 4, 'Joint Construction',
        'Expansion and contraction joints at correct spacing. Clean, straight cuts.',
        'multi_choice', get_standard_choices(), 'Visual Inspection', 'RMS QA Spec R143',
        true, false, true
    );

    -- 11. Concrete Retaining Walls
    INSERT INTO itp_templates (
        organization_id, name, code, category, description, is_active
    ) VALUES (
        v_org_id,
        'Concrete Retaining Walls',
        'CC-004',
        'Concrete Structures',
        'ITP for reinforced concrete retaining wall construction.',
        true
    ) RETURNING id INTO v_template_id;

    v_sort_order := 1;
    
    INSERT INTO itp_template_items (
        template_id, sort_order, description, acceptance_criteria,
        inspection_type, choices, inspection_method, reference_standard,
        is_witness_point, is_hold_point, is_mandatory
    ) VALUES
    (
        v_template_id, v_sort_order, 'Foundation Preparation',
        'Foundation excavated to design level. Bearing capacity verified by geotechnical engineer.',
        'multi_choice', get_standard_choices(), 'Visual & Geotech Report', 'Geotech Report',
        false, true, true
    ),
    (
        v_template_id, v_sort_order + 1, 'Starter Bars & Dowels',
        'Starter bars correctly positioned and secured. Spacing and projection as per drawings.',
        'multi_choice', get_standard_choices(), 'Visual Inspection', 'AS 3600, Drawings',
        true, false, true
    ),
    (
        v_template_id, v_sort_order + 2, 'Wall Reinforcement',
        'Vertical and horizontal reinforcement correctly placed. Cover maintained with spacers.',
        'multi_choice', get_standard_choices(), 'Visual Inspection', 'AS 3600, Drawings',
        true, false, true
    ),
    (
        v_template_id, v_sort_order + 3, 'Formwork Erection',
        'Formwork plumb, secure, and properly braced. Dimensions checked. Release agent applied.',
        'multi_choice', get_standard_choices(), 'Visual & Measurement', 'AS 3610',
        false, true, true
    ),
    (
        v_template_id, v_sort_order + 4, 'Concrete Placement',
        'Concrete placed in lifts as specified. Properly vibrated. No honeycombing.',
        'multi_choice', get_standard_choices(), 'Visual Inspection', 'AS 3600, Project Specs',
        true, false, true
    ),
    (
        v_template_id, v_sort_order + 5, 'Waterproofing & Drainage',
        'Waterproof membrane applied to back of wall. Drainage aggregate and pipe installed.',
        'multi_choice', get_standard_choices(), 'Visual Inspection', 'Project Specs',
        true, false, true
    );

END $$;

-- =====================================================
-- CATEGORY: Steel & Metalwork
-- =====================================================

DO $$
DECLARE
    v_org_id UUID := '550e8400-e29b-41d4-a716-446655440001'; -- Replace with your org ID
    v_template_id UUID;
    v_sort_order INTEGER;
BEGIN
    -- 12. Structural Steel Installation
    INSERT INTO itp_templates (
        organization_id, name, code, category, description, is_active
    ) VALUES (
        v_org_id,
        'Structural Steel Installation',
        'ST-001',
        'Steel & Metalwork',
        'ITP for structural steel fabrication and installation.',
        true
    ) RETURNING id INTO v_template_id;

    v_sort_order := 1;
    
    INSERT INTO itp_template_items (
        template_id, sort_order, description, acceptance_criteria,
        inspection_type, choices, inspection_method, reference_standard,
        is_witness_point, is_hold_point, is_mandatory
    ) VALUES
    (
        v_template_id, v_sort_order, 'Material Certification',
        'Mill certificates confirm grade and properties. Material identification maintained.',
        'multi_choice', get_standard_choices(), 'Document Review', 'AS/NZS 3679.1',
        false, false, true
    ),
    (
        v_template_id, v_sort_order + 1, 'Fabrication Quality',
        'Welds inspected and tested as specified. Dimensions within tolerance. Surface preparation complete.',
        'multi_choice', get_standard_choices(), 'Visual & NDT Reports', 'AS/NZS 1554.1',
        false, true, true
    ),
    (
        v_template_id, v_sort_order + 2, 'Anchor Bolt Installation',
        'Anchor bolts correctly positioned (±3mm). Projection and thread condition satisfactory.',
        'multi_choice', get_standard_choices(), 'Survey Check', 'AS 4100, Drawings',
        false, true, true
    ),
    (
        v_template_id, v_sort_order + 3, 'Steel Erection',
        'Members erected plumb and level. Temporary bracing secure. Bolts tensioned correctly.',
        'multi_choice', get_standard_choices(), 'Visual & Survey', 'AS 4100',
        true, false, true
    ),
    (
        v_template_id, v_sort_order + 4, 'Protective Coating',
        'Surface preparation to specified standard. Coating thickness meets specification.',
        'multi_choice', get_standard_choices(), 'DFT Measurement', 'AS/NZS 2312.1',
        true, false, true
    );

    -- 13. Reinforcement Steel Fixing
    INSERT INTO itp_templates (
        organization_id, name, code, category, description, is_active
    ) VALUES (
        v_org_id,
        'Reinforcement Steel Fixing',
        'ST-002',
        'Steel & Metalwork',
        'ITP for reinforcement steel placement in concrete structures.',
        true
    ) RETURNING id INTO v_template_id;

    v_sort_order := 1;
    
    INSERT INTO itp_template_items (
        template_id, sort_order, description, acceptance_criteria,
        inspection_type, choices, inspection_method, reference_standard,
        is_witness_point, is_hold_point, is_mandatory
    ) VALUES
    (
        v_template_id, v_sort_order, 'Material Compliance',
        'Reinforcement grade and diameter as specified. Test certificates available.',
        'multi_choice', get_standard_choices(), 'Document Review', 'AS/NZS 4671',
        false, false, true
    ),
    (
        v_template_id, v_sort_order + 1, 'Bar Placement',
        'Bars positioned as per drawings. Correct size, spacing, and location.',
        'multi_choice', get_standard_choices(), 'Visual Inspection', 'AS 3600, Drawings',
        true, false, true
    ),
    (
        v_template_id, v_sort_order + 2, 'Cover & Spacing',
        'Concrete cover achieved with appropriate spacers. Bar spacing maintained.',
        'multi_choice', get_standard_choices(), 'Visual & Measurement', 'AS 3600',
        true, false, true
    ),
    (
        v_template_id, v_sort_order + 3, 'Laps & Anchorage',
        'Lap lengths and anchorage comply with design. Staggered as required.',
        'multi_choice', get_standard_choices(), 'Visual & Measurement', 'AS 3600, Drawings',
        false, false, true
    ),
    (
        v_template_id, v_sort_order + 4, 'Bar Support & Tying',
        'Bars adequately supported and tied. Stable during concrete placement.',
        'multi_choice', get_standard_choices(), 'Visual Inspection', 'AS 3600',
        false, false, true
    );

END $$;

-- =====================================================
-- CATEGORY: Services & Utilities
-- =====================================================

DO $$
DECLARE
    v_org_id UUID := '550e8400-e29b-41d4-a716-446655440001'; -- Replace with your org ID
    v_template_id UUID;
    v_sort_order INTEGER;
BEGIN
    -- 14. Electrical Conduits
    INSERT INTO itp_templates (
        organization_id, name, code, category, description, is_active
    ) VALUES (
        v_org_id,
        'Electrical Conduits',
        'SV-001',
        'Services & Utilities',
        'ITP for underground electrical conduit installation.',
        true
    ) RETURNING id INTO v_template_id;

    v_sort_order := 1;
    
    INSERT INTO itp_template_items (
        template_id, sort_order, description, acceptance_criteria,
        inspection_type, choices, inspection_method, reference_standard,
        is_witness_point, is_hold_point, is_mandatory
    ) VALUES
    (
        v_template_id, v_sort_order, 'Conduit Materials',
        'Conduits are correct type and size. Fittings compatible. No damage.',
        'multi_choice', get_standard_choices(), 'Visual Inspection', 'AS/NZS 2053',
        false, false, true
    ),
    (
        v_template_id, v_sort_order + 1, 'Trench & Bedding',
        'Trench depth provides required cover. Bedding material as specified.',
        'multi_choice', get_standard_choices(), 'Visual & Measurement', 'Service Authority Reqs',
        true, false, true
    ),
    (
        v_template_id, v_sort_order + 2, 'Conduit Installation',
        'Conduits laid straight with correct fall. Joints properly made. Draw wire installed.',
        'multi_choice', get_standard_choices(), 'Visual Inspection', 'AS/NZS 3000',
        false, true, true
    ),
    (
        v_template_id, v_sort_order + 3, 'Marker Tape & Cover',
        'Warning tape installed at correct depth. Minimum cover maintained.',
        'multi_choice', get_standard_choices(), 'Visual Inspection', 'Service Authority Reqs',
        true, false, true
    );

    -- 15. Water & Sewer Services
    INSERT INTO itp_templates (
        organization_id, name, code, category, description, is_active
    ) VALUES (
        v_org_id,
        'Water & Sewer Services',
        'SV-002',
        'Services & Utilities',
        'ITP for water main and sewer installation.',
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
        v_template_id, v_sort_order, 'Pipe & Fitting Compliance',
        'Pipes and fittings comply with specifications. Certificates provided.',
        'multi_choice', get_standard_choices(), 'Document Review', 'AS/NZS 4130, WSAA Codes',
        false, false, true,
        NULL, NULL, NULL
    ),
    (
        v_template_id, v_sort_order + 1, 'Trench Preparation',
        'Trench width and depth correct. Dewatered if required. Bedding placed.',
        'multi_choice', get_standard_choices(), 'Visual Inspection', 'WSAA Codes',
        true, false, true,
        NULL, NULL, NULL
    ),
    (
        v_template_id, v_sort_order + 2, 'Pipe Installation',
        'Pipes laid to correct grade and alignment. Joints properly made.',
        'multi_choice', get_standard_choices(), 'Survey Check', 'WSAA Codes, Drawings',
        false, true, true,
        NULL, NULL, NULL
    ),
    (
        v_template_id, v_sort_order + 3, 'Pressure Testing',
        'Pressure test conducted at specified pressure for required duration. No leaks.',
        'numeric', NULL, 'Pressure Test', 'AS/NZS 2566.2',
        false, true, true,
        0, 1200, 'kPa'
    ),
    (
        v_template_id, v_sort_order + 4, 'Disinfection & Flushing',
        'Mains disinfected and flushed. Water quality test results satisfactory.',
        'multi_choice', get_standard_choices(), 'Test Results', 'AS/NZS 3500',
        false, true, true,
        NULL, NULL, NULL
    );

END $$;

-- =====================================================
-- CATEGORY: Quality & Testing
-- =====================================================

DO $$
DECLARE
    v_org_id UUID := '550e8400-e29b-41d4-a716-446655440001'; -- Replace with your org ID
    v_template_id UUID;
    v_sort_order INTEGER;
BEGIN
    -- 16. Compaction Testing
    INSERT INTO itp_templates (
        organization_id, name, code, category, description, is_active
    ) VALUES (
        v_org_id,
        'Compaction Testing',
        'QT-001',
        'Quality & Testing',
        'ITP for field density testing of earthworks and pavements.',
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
        v_template_id, v_sort_order, 'Test Frequency',
        'Testing frequency meets specification (e.g., 1 test per 500m² per layer).',
        'multi_choice', get_standard_choices(), 'Review Test Register', 'Project Specs',
        false, false, true,
        NULL, NULL, NULL
    ),
    (
        v_template_id, v_sort_order + 1, 'Test Method',
        'Appropriate test method used (sand replacement, nuclear gauge).',
        'multi_choice', get_standard_choices(), 'Review Test Method', 'AS 1289.5.3.1',
        false, false, true,
        NULL, NULL, NULL
    ),
    (
        v_template_id, v_sort_order + 2, 'Density Results',
        'Field density achieves specified percentage of maximum dry density.',
        'numeric', NULL, 'Test Results', 'AS 1289.5.4.1',
        false, true, true,
        95, 100, '%'
    ),
    (
        v_template_id, v_sort_order + 3, 'Moisture Content',
        'Moisture content within specified range of optimum.',
        'numeric', NULL, 'Test Results', 'AS 1289.2.1.1',
        false, false, true,
        -2, 2, '% of OMC'
    ),
    (
        v_template_id, v_sort_order + 4, 'Failed Test Areas',
        'Areas failing tests are reworked and retested satisfactorily.',
        'multi_choice', get_standard_choices(), 'Review Retest Results', 'Project Specs',
        false, false, true,
        NULL, NULL, NULL
    );

    -- 17. Concrete Testing
    INSERT INTO itp_templates (
        organization_id, name, code, category, description, is_active
    ) VALUES (
        v_org_id,
        'Concrete Testing',
        'QT-002',
        'Quality & Testing',
        'ITP for concrete sampling and testing.',
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
        v_template_id, v_sort_order, 'Mix Design Approval',
        'Concrete mix design submitted and approved prior to placement.',
        'multi_choice', get_standard_choices(), 'Document Review', 'AS 1379',
        false, false, true,
        NULL, NULL, NULL
    ),
    (
        v_template_id, v_sort_order + 1, 'Slump Testing',
        'Slump test conducted at required frequency. Results within specification.',
        'numeric', NULL, 'Slump Test', 'AS 1012.3.1',
        true, false, true,
        0, 120, 'mm'
    ),
    (
        v_template_id, v_sort_order + 2, 'Sample Collection',
        'Compression test samples taken at specified frequency. Properly labeled.',
        'multi_choice', get_standard_choices(), 'Visual Verification', 'AS 1012.1',
        true, false, true,
        NULL, NULL, NULL
    ),
    (
        v_template_id, v_sort_order + 3, 'Early Age Results',
        '7-day compression results indicate likely compliance.',
        'numeric', NULL, 'Test Results', 'AS 1012.9',
        false, false, true,
        20, 50, 'MPa'
    ),
    (
        v_template_id, v_sort_order + 4, '28-Day Results',
        '28-day compression results meet specified strength.',
        'numeric', NULL, 'Test Results', 'AS 1012.9',
        false, true, true,
        25, 65, 'MPa'
    );

END $$;

-- =====================================================
-- CATEGORY: Environmental & Safety
-- =====================================================

DO $$
DECLARE
    v_org_id UUID := '550e8400-e29b-41d4-a716-446655440001'; -- Replace with your org ID
    v_template_id UUID;
    v_sort_order INTEGER;
BEGIN
    -- 18. Environmental Controls
    INSERT INTO itp_templates (
        organization_id, name, code, category, description, is_active
    ) VALUES (
        v_org_id,
        'Environmental Controls',
        'ES-001',
        'Environmental & Safety',
        'ITP for environmental protection measures.',
        true
    ) RETURNING id INTO v_template_id;

    v_sort_order := 1;
    
    INSERT INTO itp_template_items (
        template_id, sort_order, description, acceptance_criteria,
        inspection_type, choices, inspection_method, reference_standard,
        is_witness_point, is_hold_point, is_mandatory
    ) VALUES
    (
        v_template_id, v_sort_order, 'Erosion Controls',
        'Sediment fences, hay bales, and other controls installed and maintained.',
        'multi_choice', get_standard_choices(), 'Visual Inspection', 'Approved ESCP',
        false, false, true
    ),
    (
        v_template_id, v_sort_order + 1, 'Water Quality',
        'Site discharge water quality meets environmental requirements.',
        'multi_choice', get_standard_choices(), 'Water Testing', 'EPA Guidelines',
        false, false, true
    ),
    (
        v_template_id, v_sort_order + 2, 'Spill Containment',
        'Spill kits available and adequately stocked. Bunding for fuel/chemical storage.',
        'multi_choice', get_standard_choices(), 'Visual Inspection', 'EPA Requirements',
        false, false, true
    ),
    (
        v_template_id, v_sort_order + 3, 'Waste Management',
        'Waste segregated and disposed appropriately. Waste tracking documentation.',
        'multi_choice', get_standard_choices(), 'Document Review', 'EPA Guidelines',
        false, false, true
    ),
    (
        v_template_id, v_sort_order + 4, 'Dust Control',
        'Dust suppression measures implemented. No visible dust leaving site.',
        'multi_choice', get_standard_choices(), 'Visual Inspection', 'Environmental Permit',
        false, false, true
    );

    -- 19. Traffic Management
    INSERT INTO itp_templates (
        organization_id, name, code, category, description, is_active
    ) VALUES (
        v_org_id,
        'Traffic Management',
        'ES-002',
        'Environmental & Safety',
        'ITP for traffic control implementation.',
        true
    ) RETURNING id INTO v_template_id;

    v_sort_order := 1;
    
    INSERT INTO itp_template_items (
        template_id, sort_order, description, acceptance_criteria,
        inspection_type, choices, inspection_method, reference_standard,
        is_witness_point, is_hold_point, is_mandatory
    ) VALUES
    (
        v_template_id, v_sort_order, 'TCP Implementation',
        'Traffic Control Plan implemented as approved. All devices in place.',
        'multi_choice', get_standard_choices(), 'Visual Inspection', 'Approved TCP',
        false, true, true
    ),
    (
        v_template_id, v_sort_order + 1, 'Signage Compliance',
        'All signs correct size, retroreflective, and properly positioned.',
        'multi_choice', get_standard_choices(), 'Visual Inspection', 'AS 1742.3',
        false, false, true
    ),
    (
        v_template_id, v_sort_order + 2, 'Delineation',
        'Cones, barriers, and delineators correctly spaced and secured.',
        'multi_choice', get_standard_choices(), 'Visual Inspection', 'MUTCD',
        false, false, true
    ),
    (
        v_template_id, v_sort_order + 3, 'Traffic Controller',
        'Traffic controllers certified and equipped with correct PPE.',
        'multi_choice', get_standard_choices(), 'Certificate Check', 'RMS Requirements',
        false, false, true
    ),
    (
        v_template_id, v_sort_order + 4, 'Night Works',
        'Adequate lighting provided. Enhanced delineation for night visibility.',
        'multi_choice', get_standard_choices(), 'Visual Inspection', 'AS 1742.3',
        false, false, true
    );

END $$;

-- Clean up
DROP FUNCTION IF EXISTS get_standard_choices();

-- Final summary
SELECT 
    'Total Templates:' as metric,
    COUNT(*) as value
FROM itp_templates
WHERE code LIKE 'SE-%' OR code LIKE 'EW-%' OR code LIKE 'PV-%' 
   OR code LIKE 'SW-%' OR code LIKE 'CC-%' OR code LIKE 'ST-%'
   OR code LIKE 'SV-%' OR code LIKE 'QT-%' OR code LIKE 'ES-%'
UNION ALL
SELECT 
    'Total Inspection Items:',
    COUNT(*)
FROM itp_template_items ti
JOIN itp_templates t ON ti.template_id = t.id
WHERE t.code LIKE 'SE-%' OR t.code LIKE 'EW-%' OR t.code LIKE 'PV-%' 
   OR t.code LIKE 'SW-%' OR t.code LIKE 'CC-%' OR t.code LIKE 'ST-%'
   OR t.code LIKE 'SV-%' OR t.code LIKE 'QT-%' OR t.code LIKE 'ES-%';