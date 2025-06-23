-- =====================================================
-- HELPER FUNCTIONS FOR ITP SYSTEM
-- =====================================================

-- 1. Calculate assignment progress
CREATE OR REPLACE FUNCTION calculate_assignment_progress(p_assignment_id UUID)
RETURNS TABLE (
    total_items INTEGER,
    completed_items INTEGER,
    passed_items INTEGER,
    failed_items INTEGER,
    na_items INTEGER,
    deferred_items INTEGER,
    progress_percentage DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::INTEGER as total_items,
        COUNT(CASE WHEN ir.status != 'pending' THEN 1 END)::INTEGER as completed_items,
        COUNT(CASE WHEN ir.status = 'pass' THEN 1 END)::INTEGER as passed_items,
        COUNT(CASE WHEN ir.status = 'fail' THEN 1 END)::INTEGER as failed_items,
        COUNT(CASE WHEN ir.status = 'na' THEN 1 END)::INTEGER as na_items,
        COUNT(CASE WHEN ir.status = 'deferred' THEN 1 END)::INTEGER as deferred_items,
        CASE 
            WHEN COUNT(*) > 0 THEN 
                ROUND((COUNT(CASE WHEN ir.status != 'pending' THEN 1 END)::DECIMAL / COUNT(*)::DECIMAL) * 100, 2)
            ELSE 0
        END as progress_percentage
    FROM itp_template_items ti
    LEFT JOIN itp_inspection_records ir ON ir.template_item_id = ti.id AND ir.assignment_id = p_assignment_id
    WHERE ti.template_id = (SELECT template_id FROM lot_itp_assignments WHERE id = p_assignment_id);
END;
$$ LANGUAGE plpgsql;

-- 2. Assign ITP to lot with automatic record creation
CREATE OR REPLACE FUNCTION assign_itp_to_lot(
    p_lot_id UUID,
    p_template_id UUID,
    p_instance_name VARCHAR(255) DEFAULT NULL,
    p_assigned_to UUID DEFAULT NULL,
    p_assigned_by UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_assignment_id UUID;
    v_template_name VARCHAR(255);
    v_sequence_number INTEGER;
BEGIN
    -- Get template name
    SELECT name INTO v_template_name FROM itp_templates WHERE id = p_template_id;
    
    -- Get next sequence number for this lot
    SELECT COALESCE(MAX(sequence_number), 0) + 1 
    INTO v_sequence_number
    FROM lot_itp_assignments 
    WHERE lot_id = p_lot_id;
    
    -- Create assignment
    INSERT INTO lot_itp_assignments (
        lot_id,
        template_id,
        instance_name,
        sequence_number,
        assigned_to,
        assigned_by,
        status
    ) VALUES (
        p_lot_id,
        p_template_id,
        COALESCE(p_instance_name, v_template_name || ' - #' || v_sequence_number),
        v_sequence_number,
        p_assigned_to,
        p_assigned_by,
        'pending'
    ) RETURNING id INTO v_assignment_id;
    
    -- Create inspection records for all template items
    INSERT INTO itp_inspection_records (
        assignment_id,
        template_item_id,
        status
    )
    SELECT 
        v_assignment_id,
        ti.id,
        'pending'
    FROM itp_template_items ti
    WHERE ti.template_id = p_template_id
    ORDER BY ti.sort_order;
    
    RETURN v_assignment_id;
END;
$$ LANGUAGE plpgsql;

-- 3. Get lot ITP summary
CREATE OR REPLACE FUNCTION get_lot_itp_summary(p_lot_id UUID)
RETURNS TABLE (
    assignment_id UUID,
    template_id UUID,
    template_name VARCHAR(255),
    template_code VARCHAR(50),
    instance_name VARCHAR(255),
    sequence_number INTEGER,
    status VARCHAR(50),
    total_items INTEGER,
    completed_items INTEGER,
    progress_percentage DECIMAL,
    has_non_conformances BOOLEAN,
    assigned_to UUID,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.id as assignment_id,
        a.template_id,
        t.name as template_name,
        t.code as template_code,
        a.instance_name,
        a.sequence_number,
        a.status,
        p.total_items,
        p.completed_items,
        p.progress_percentage,
        EXISTS(
            SELECT 1 FROM itp_inspection_records ir 
            WHERE ir.assignment_id = a.id AND ir.is_non_conforming = true
        ) as has_non_conformances,
        a.assigned_to,
        a.started_at,
        a.completed_at
    FROM lot_itp_assignments a
    JOIN itp_templates t ON a.template_id = t.id
    CROSS JOIN LATERAL calculate_assignment_progress(a.id) p
    WHERE a.lot_id = p_lot_id
    ORDER BY a.sequence_number;
END;
$$ LANGUAGE plpgsql;

-- 4. Update assignment status based on progress
CREATE OR REPLACE FUNCTION update_assignment_status()
RETURNS TRIGGER AS $$
DECLARE
    v_progress RECORD;
    v_new_status VARCHAR(50);
BEGIN
    -- Get progress for the assignment
    SELECT * INTO v_progress 
    FROM calculate_assignment_progress(NEW.assignment_id);
    
    -- Determine new status
    IF v_progress.completed_items = 0 THEN
        v_new_status := 'pending';
    ELSIF v_progress.completed_items < v_progress.total_items THEN
        v_new_status := 'in_progress';
    ELSE
        v_new_status := 'completed';
    END IF;
    
    -- Update assignment status if changed
    UPDATE lot_itp_assignments
    SET status = v_new_status,
        started_at = CASE 
            WHEN started_at IS NULL AND v_new_status = 'in_progress' 
            THEN NOW() 
            ELSE started_at 
        END,
        completed_at = CASE 
            WHEN v_new_status = 'completed' AND completed_at IS NULL
            THEN NOW() 
            ELSE completed_at 
        END,
        updated_at = NOW()
    WHERE id = NEW.assignment_id AND status != v_new_status;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic status updates
CREATE TRIGGER trigger_update_assignment_status
AFTER INSERT OR UPDATE ON itp_inspection_records
FOR EACH ROW
EXECUTE FUNCTION update_assignment_status();

-- 5. Create sample ITP templates
CREATE OR REPLACE FUNCTION create_sample_itp_templates(p_org_id UUID)
RETURNS VOID AS $$
DECLARE
    v_template_id UUID;
BEGIN
    -- Concrete Pour ITP
    INSERT INTO itp_templates (organization_id, name, code, category, description)
    VALUES (p_org_id, 'Concrete Pour Inspection', 'CONC-001', 'Concrete', 'Standard concrete pour quality checks')
    RETURNING id INTO v_template_id;
    
    INSERT INTO itp_template_items (template_id, item_code, description, inspection_type, acceptance_criteria, sort_order) VALUES
    (v_template_id, 'CONC-01', 'Formwork inspection', 'boolean', 'Formwork clean, properly aligned and braced', 1),
    (v_template_id, 'CONC-02', 'Reinforcement placement', 'boolean', 'As per drawings, correct spacing and cover', 2),
    (v_template_id, 'CONC-03', 'Concrete slump test', 'numeric', 'Slump within specified range', 3),
    (v_template_id, 'CONC-04', 'Concrete temperature', 'numeric', 'Temperature within acceptable range', 4),
    (v_template_id, 'CONC-05', 'Surface finish', 'text', 'Smooth finish, no honeycombing', 5);
    
    UPDATE itp_template_items SET min_value = 80, max_value = 120, unit = 'mm' WHERE template_id = v_template_id AND item_code = 'CONC-03';
    UPDATE itp_template_items SET min_value = 10, max_value = 32, unit = '°C' WHERE template_id = v_template_id AND item_code = 'CONC-04';
    
    -- Asphalt ITP
    INSERT INTO itp_templates (organization_id, name, code, category, description)
    VALUES (p_org_id, 'Asphalt Paving Inspection', 'ASPH-001', 'Asphalt', 'Asphalt laying and compaction checks')
    RETURNING id INTO v_template_id;
    
    INSERT INTO itp_template_items (template_id, item_code, description, inspection_type, acceptance_criteria, sort_order) VALUES
    (v_template_id, 'ASPH-01', 'Subbase preparation', 'boolean', 'Clean, dry, and properly graded', 1),
    (v_template_id, 'ASPH-02', 'Tack coat application', 'boolean', 'Uniform coverage at specified rate', 2),
    (v_template_id, 'ASPH-03', 'Asphalt temperature', 'numeric', 'Within specified range at delivery', 3),
    (v_template_id, 'ASPH-04', 'Layer thickness', 'numeric', 'As per specification', 4),
    (v_template_id, 'ASPH-05', 'Compaction density', 'numeric', 'Minimum density achieved', 5),
    (v_template_id, 'ASPH-06', 'Surface regularity', 'boolean', 'Within tolerance using straight edge', 6);
    
    UPDATE itp_template_items SET min_value = 140, max_value = 160, unit = '°C' WHERE template_id = v_template_id AND item_code = 'ASPH-03';
    UPDATE itp_template_items SET min_value = 40, max_value = 60, unit = 'mm' WHERE template_id = v_template_id AND item_code = 'ASPH-04';
    UPDATE itp_template_items SET min_value = 95, max_value = 100, unit = '%' WHERE template_id = v_template_id AND item_code = 'ASPH-05';
    
END;
$$ LANGUAGE plpgsql;

-- Add comments
COMMENT ON FUNCTION calculate_assignment_progress IS 'Calculates inspection progress for an ITP assignment';
COMMENT ON FUNCTION assign_itp_to_lot IS 'Assigns an ITP template to a lot and creates inspection records';
COMMENT ON FUNCTION get_lot_itp_summary IS 'Gets summary of all ITP assignments for a lot';
COMMENT ON FUNCTION update_assignment_status IS 'Automatically updates assignment status based on inspection progress';