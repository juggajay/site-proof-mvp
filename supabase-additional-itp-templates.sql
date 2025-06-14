-- Additional ITP Templates for Civil-Q Platform
-- This script adds 5 new high-value, industry-standard ITP templates for the Australian civil market.
-- These are created as global templates (organization_id is NULL).

DO $$
DECLARE
    conduit_itp_id UUID;
    subgrade_itp_id UUID;
    pavement_itp_id UUID;
    proof_roll_itp_id UUID;
    topsoil_itp_id UUID;
BEGIN
    
    -- Template 5: Conduit & Pit Installation
    INSERT INTO public.itps (title, description)
    VALUES ('Conduit & Pit Installation', 'QA checklist for installing electrical/comms conduits and pits.')
    RETURNING id INTO conduit_itp_id;

    INSERT INTO public.itp_items (itp_id, description, inspection_type, "order") VALUES
        (conduit_itp_id, 'Trench depth and width conform to drawings?', 'PASS_FAIL', 1),
        (conduit_itp_id, 'Bedding sand placed and compacted?', 'PASS_FAIL', 2),
        (conduit_itp_id, 'Conduit type and size as per specification?', 'TEXT_INPUT', 3),
        (conduit_itp_id, 'Draw rope installed in all conduits?', 'PASS_FAIL', 4),
        (conduit_itp_id, 'Conduit surround (backfill) material correct?', 'PASS_FAIL', 5),
        (conduit_itp_id, 'Marker tape laid at correct depth above conduit?', 'PASS_FAIL', 6),
        (conduit_itp_id, 'Pit installed to correct level and location?', 'PASS_FAIL', 7);

    -- Template 6: Subgrade Preparation
    INSERT INTO public.itps (title, description)
    VALUES ('Subgrade Preparation', 'Checklist for the preparation and approval of the subgrade layer before paving.')
    RETURNING id INTO subgrade_itp_id;

    INSERT INTO public.itp_items (itp_id, description, inspection_type, "order") VALUES
        (subgrade_itp_id, 'Area cleared of all vegetation and topsoil?', 'PASS_FAIL', 1),
        (subgrade_itp_id, 'Proof roll completed and soft spots identified?', 'PASS_FAIL', 2),
        (subgrade_itp_id, 'Subgrade trimmed to design level (+/- tolerance)?', 'PASS_FAIL', 3),
        (subgrade_itp_id, 'Moisture conditioning complete?', 'PASS_FAIL', 4),
        (subgrade_itp_id, 'Compaction density test results received and passed?', 'TEXT_INPUT', 5),
        (subgrade_itp_id, 'Survey conformance report for levels received?', 'PASS_FAIL', 6);

    -- Template 7: Pavement Layer (Unbound Granular)
    INSERT INTO public.itps (title, description)
    VALUES ('Pavement Layer - Unbound Granular', 'Inspection for placement of unbound granular pavement materials like DGB20 or DGS40.')
    RETURNING id INTO pavement_itp_id;

    INSERT INTO public.itp_items (itp_id, description, inspection_type, "order") VALUES
        (pavement_itp_id, 'Material delivery dockets checked (source, type)?', 'PASS_FAIL', 1),
        (pavement_itp_id, 'Underlying surface approved and prepared?', 'PASS_FAIL', 2),
        (pavement_itp_id, 'Material placed in uniform layers (no segregation)?', 'PASS_FAIL', 3),
        (pavement_itp_id, 'Compacted layer thickness within tolerance?', 'NUMERIC', 4),
        (pavement_itp_id, 'Compaction density tests passed?', 'PASS_FAIL', 5),
        (pavement_itp_id, 'Final surface level and shape conform to design?', 'PASS_FAIL', 6);

    -- Template 8: Proof Rolling
    INSERT INTO public.itps (title, description)
    VALUES ('Proof Rolling Inspection', 'Checklist for conducting a proof roll to detect unstable areas in the subgrade.')
    RETURNING id INTO proof_roll_itp_id;

    INSERT INTO public.itp_items (itp_id, description, inspection_type, "order") VALUES
        (proof_roll_itp_id, 'Area to be rolled is defined and surveyed?', 'PASS_FAIL', 1),
        (proof_roll_itp_id, 'Roller weight and type as per specification?', 'TEXT_INPUT', 2),
        (proof_roll_itp_id, 'Number of roller passes completed?', 'NUMERIC', 3),
        (proof_roll_itp_id, 'Surface deformation observed (mm)?', 'NUMERIC', 4),
        (proof_roll_itp_id, 'Any unstable/pumping areas identified and marked?', 'PASS_FAIL', 5),
        (proof_roll_itp_id, 'Area passed or failed proof roll?', 'PASS_FAIL', 6);

    -- Template 9: Topsoiling & Seeding
    INSERT INTO public.itps (title, description)
    VALUES ('Topsoiling & Seeding', 'Checklist for landscape finishing works, topsoil placement, and seeding.')
    RETURNING id INTO topsoil_itp_id;

    INSERT INTO public.itp_items (itp_id, description, inspection_type, "order") VALUES
        (topsoil_itp_id, 'Finished earthwork levels conform to design?', 'PASS_FAIL', 1),
        (topsoil_itp_id, 'Topsoil source and quality approved?', 'PASS_FAIL', 2),
        (topsoil_itp_id, 'Topsoil spread to correct thickness (mm)?', 'NUMERIC', 3),
        (topsoil_itp_id, 'Surface lightly tilled/scarified before seeding?', 'PASS_FAIL', 4),
        (topsoil_itp_id, 'Seed mix type and application rate as per spec?', 'TEXT_INPUT', 5),
        (topsoil_itp_id, 'Area watered/hydromulched post-seeding?', 'PASS_FAIL', 6);
        
    RAISE NOTICE '5 new global ITP templates have been created successfully.';

END $$;

-- After running this script, you will have a total of 9 high-quality, relevant ITP templates:
-- 1. Highway Concrete Pour Inspection (existing)
-- 2. Asphalt Paving Quality Control (existing) 
-- 3. Earthworks Compaction Testing (existing)
-- 4. Drainage Installation Inspection (existing)
-- 5. Conduit & Pit Installation (new)
-- 6. Subgrade Preparation (new)
-- 7. Pavement Layer - Unbound Granular (new)
-- 8. Proof Rolling Inspection (new)
-- 9. Topsoiling & Seeding (new)