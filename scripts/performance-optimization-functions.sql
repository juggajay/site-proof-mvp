-- =====================================================
-- PERFORMANCE OPTIMIZATION - DATABASE FUNCTIONS
-- =====================================================
-- Optimized functions to reduce round trips and improve performance

-- 1. Optimized ITP Assignment Function
-- This function assigns multiple ITPs and creates inspection records in a single transaction
CREATE OR REPLACE FUNCTION assign_itps_to_lot(
    p_lot_id UUID,
    p_template_ids UUID[],
    p_assigned_by UUID
) RETURNS JSON AS $$
DECLARE
    v_result JSON;
    v_assignment_id UUID;
    v_template_id UUID;
    v_assignments_created INTEGER := 0;
    v_records_created INTEGER := 0;
    v_lot_status TEXT;
BEGIN
    -- Start transaction
    BEGIN
        -- Get current lot status
        SELECT status INTO v_lot_status FROM lots WHERE id = p_lot_id;
        
        -- Process each template
        FOREACH v_template_id IN ARRAY p_template_ids
        LOOP
            -- Check if assignment already exists
            SELECT id INTO v_assignment_id
            FROM lot_itp_assignments
            WHERE lot_id = p_lot_id AND template_id = v_template_id;
            
            IF v_assignment_id IS NULL THEN
                -- Create new assignment
                INSERT INTO lot_itp_assignments (
                    lot_id, template_id, status, assigned_by, assigned_at
                ) VALUES (
                    p_lot_id, v_template_id, 'pending', p_assigned_by, NOW()
                ) RETURNING id INTO v_assignment_id;
                
                v_assignments_created := v_assignments_created + 1;
                
                -- Create inspection records for all template items
                INSERT INTO itp_inspection_records (
                    assignment_id, template_item_id, status
                )
                SELECT 
                    v_assignment_id,
                    iti.id,
                    'pending'
                FROM itp_template_items iti
                WHERE iti.template_id = v_template_id;
                
                GET DIAGNOSTICS v_records_created = v_records_created + ROW_COUNT;
            END IF;
        END LOOP;
        
        -- Update lot status if needed
        IF v_lot_status = 'pending' AND v_assignments_created > 0 THEN
            UPDATE lots SET status = 'IN_PROGRESS' WHERE id = p_lot_id;
        END IF;
        
        -- Return result
        v_result := json_build_object(
            'success', true,
            'assignments_created', v_assignments_created,
            'records_created', v_records_created,
            'message', format('%s ITP(s) assigned successfully', array_length(p_template_ids, 1))
        );
        
        RETURN v_result;
    EXCEPTION
        WHEN OTHERS THEN
            -- Rollback and return error
            RAISE EXCEPTION 'Failed to assign ITPs: %', SQLERRM;
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Get Lot with ITPs Function
-- Optimized function to fetch lot data with all related ITPs in one query
CREATE OR REPLACE FUNCTION get_lot_with_itps(p_lot_id UUID)
RETURNS JSON AS $$
DECLARE
    v_lot JSON;
    v_assignments JSON;
    v_templates JSON;
BEGIN
    -- Get lot data
    SELECT row_to_json(l.*) INTO v_lot
    FROM lots l
    WHERE l.id = p_lot_id;
    
    -- Get assignments with template data and progress
    SELECT json_agg(
        json_build_object(
            'id', a.id,
            'template_id', a.template_id,
            'status', a.status,
            'assigned_at', a.assigned_at,
            'template', row_to_json(t.*),
            'progress', (
                SELECT json_build_object(
                    'total_items', COUNT(DISTINCT iti.id),
                    'completed_items', COUNT(DISTINCT CASE WHEN iir.status IN ('pass', 'fail', 'na') THEN iir.id END),
                    'passed_items', COUNT(DISTINCT CASE WHEN iir.status = 'pass' THEN iir.id END),
                    'failed_items', COUNT(DISTINCT CASE WHEN iir.status = 'fail' THEN iir.id END),
                    'completion_percentage', 
                        CASE 
                            WHEN COUNT(DISTINCT iti.id) > 0 
                            THEN ROUND((COUNT(DISTINCT CASE WHEN iir.status IN ('pass', 'fail', 'na') THEN iir.id END)::numeric / COUNT(DISTINCT iti.id)::numeric) * 100, 2)
                            ELSE 0
                        END
                )
                FROM itp_template_items iti
                LEFT JOIN itp_inspection_records iir ON iir.assignment_id = a.id AND iir.template_item_id = iti.id
                WHERE iti.template_id = a.template_id
            )
        )
    ) INTO v_assignments
    FROM lot_itp_assignments a
    JOIN itp_templates t ON a.template_id = t.id
    WHERE a.lot_id = p_lot_id;
    
    -- Return combined result
    RETURN json_build_object(
        'lot', v_lot,
        'assignments', COALESCE(v_assignments, '[]'::json)
    );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- 3. Batch Update Inspection Records
-- Optimized function to update multiple inspection records at once
CREATE OR REPLACE FUNCTION update_inspection_records(
    p_updates JSON[]
) RETURNS JSON AS $$
DECLARE
    v_update JSON;
    v_updated_count INTEGER := 0;
BEGIN
    -- Process each update
    FOREACH v_update IN ARRAY p_updates
    LOOP
        UPDATE itp_inspection_records
        SET 
            status = COALESCE((v_update->>'status')::text, status),
            result_boolean = COALESCE((v_update->>'result_boolean')::boolean, result_boolean),
            result_numeric = COALESCE((v_update->>'result_numeric')::numeric, result_numeric),
            result_text = COALESCE(v_update->>'result_text', result_text),
            result_choice = COALESCE(v_update->>'result_choice', result_choice),
            comments = COALESCE(v_update->>'comments', comments),
            inspected_by = COALESCE((v_update->>'inspected_by')::uuid, inspected_by),
            inspected_at = CASE 
                WHEN v_update->>'status' IS NOT NULL AND (v_update->>'status')::text != 'pending'
                THEN NOW()
                ELSE inspected_at
            END,
            updated_at = NOW()
        WHERE id = (v_update->>'id')::uuid;
        
        GET DIAGNOSTICS v_updated_count = v_updated_count + ROW_COUNT;
    END LOOP;
    
    RETURN json_build_object(
        'success', true,
        'updated_count', v_updated_count,
        'message', format('%s inspection records updated', v_updated_count)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Get Project Dashboard Stats
-- Optimized function for dashboard statistics
CREATE OR REPLACE FUNCTION get_project_dashboard_stats(p_project_id UUID)
RETURNS JSON AS $$
DECLARE
    v_stats JSON;
BEGIN
    SELECT json_build_object(
        'project_id', p.id,
        'project_name', p.name,
        'lots', json_build_object(
            'total', COUNT(DISTINCT l.id),
            'pending', COUNT(DISTINCT CASE WHEN l.status = 'pending' THEN l.id END),
            'in_progress', COUNT(DISTINCT CASE WHEN l.status = 'in_progress' THEN l.id END),
            'completed', COUNT(DISTINCT CASE WHEN l.status = 'completed' THEN l.id END)
        ),
        'itps', json_build_object(
            'total_assignments', COUNT(DISTINCT lia.id),
            'completed_assignments', COUNT(DISTINCT CASE WHEN lia.status = 'completed' THEN lia.id END),
            'active_templates', COUNT(DISTINCT lia.template_id)
        ),
        'inspections', json_build_object(
            'total', COUNT(DISTINCT iir.id),
            'passed', COUNT(DISTINCT CASE WHEN iir.status = 'pass' THEN iir.id END),
            'failed', COUNT(DISTINCT CASE WHEN iir.status = 'fail' THEN iir.id END),
            'pending', COUNT(DISTINCT CASE WHEN iir.status = 'pending' THEN iir.id END),
            'completion_rate', 
                CASE 
                    WHEN COUNT(DISTINCT iir.id) > 0 
                    THEN ROUND((COUNT(DISTINCT CASE WHEN iir.status IN ('pass', 'fail', 'na') THEN iir.id END)::numeric / COUNT(DISTINCT iir.id)::numeric) * 100, 2)
                    ELSE 0
                END
        ),
        'non_conformances', COUNT(DISTINCT CASE WHEN iir.is_non_conforming = true THEN iir.id END)
    ) INTO v_stats
    FROM projects p
    LEFT JOIN lots l ON p.id = l.project_id
    LEFT JOIN lot_itp_assignments lia ON l.id = lia.lot_id
    LEFT JOIN itp_inspection_records iir ON lia.id = iir.assignment_id
    WHERE p.id = p_project_id
    GROUP BY p.id, p.name;
    
    RETURN v_stats;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Grant execute permissions
-- GRANT EXECUTE ON FUNCTION assign_itps_to_lot TO authenticated;
-- GRANT EXECUTE ON FUNCTION get_lot_with_itps TO authenticated;
-- GRANT EXECUTE ON FUNCTION update_inspection_records TO authenticated;
-- GRANT EXECUTE ON FUNCTION get_project_dashboard_stats TO authenticated;

-- Add comments
COMMENT ON FUNCTION assign_itps_to_lot IS 'Optimized function to assign multiple ITPs to a lot in a single transaction';
COMMENT ON FUNCTION get_lot_with_itps IS 'Efficiently fetch lot data with all ITP assignments and progress';
COMMENT ON FUNCTION update_inspection_records IS 'Batch update inspection records to reduce round trips';
COMMENT ON FUNCTION get_project_dashboard_stats IS 'Get aggregated dashboard statistics in a single query';