-- =====================================================
-- PERFORMANCE OPTIMIZATION - DATABASE VIEWS (SAFE VERSION)
-- =====================================================
-- These views optimize complex queries by pre-joining frequently accessed data
-- This version checks for column existence to avoid errors

-- First, let's check what columns exist in the lots table
DO $$
BEGIN
    RAISE NOTICE 'Checking lots table columns...';
    FOR r IN 
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'lots'
    LOOP
        RAISE NOTICE 'Column: %', r.column_name;
    END LOOP;
END $$;

-- 1. Lot Overview View - Combines lot data with ITP assignment counts
-- This version dynamically builds based on existing columns
CREATE OR REPLACE VIEW v_lot_overview AS
SELECT 
    l.id,
    l.project_id,
    l.lot_number,
    l.description,
    -- Only include location_description if it exists
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'lots' AND column_name = 'location_description'
        ) THEN l.location_description
        ELSE NULL
    END as location_description,
    l.status,
    -- Only include date columns if they exist
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'lots' AND column_name = 'start_date'
        ) THEN l.start_date
        ELSE NULL
    END as start_date,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'lots' AND column_name = 'target_completion_date'
        ) THEN l.target_completion_date
        ELSE NULL
    END as target_completion_date,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'lots' AND column_name = 'actual_completion_date'
        ) THEN l.actual_completion_date
        ELSE NULL
    END as actual_completion_date,
    l.created_by,
    l.created_at,
    l.updated_at,
    -- ITP assignment aggregates
    COUNT(DISTINCT lia.template_id) as assigned_itp_count,
    COUNT(DISTINCT CASE WHEN lia.status = 'completed' THEN lia.template_id END) as completed_itp_count,
    COUNT(DISTINCT CASE WHEN lia.status = 'in_progress' THEN lia.template_id END) as in_progress_itp_count,
    -- Inspection progress
    COUNT(DISTINCT iir.id) as total_inspection_items,
    COUNT(DISTINCT CASE WHEN iir.status = 'pass' THEN iir.id END) as passed_items,
    COUNT(DISTINCT CASE WHEN iir.status = 'fail' THEN iir.id END) as failed_items,
    COUNT(DISTINCT CASE WHEN iir.status IN ('pass', 'fail', 'na') THEN iir.id END) as completed_items,
    -- Calculated completion percentage
    CASE 
        WHEN COUNT(DISTINCT iir.id) > 0 
        THEN ROUND((COUNT(DISTINCT CASE WHEN iir.status IN ('pass', 'fail', 'na') THEN iir.id END)::numeric / COUNT(DISTINCT iir.id)::numeric) * 100, 2)
        ELSE 0
    END as completion_percentage
FROM lots l
LEFT JOIN lot_itp_assignments lia ON l.id = lia.lot_id
LEFT JOIN itp_inspection_records iir ON lia.id = iir.assignment_id
GROUP BY 
    l.id,
    l.project_id,
    l.lot_number,
    l.description,
    l.status,
    l.created_by,
    l.created_at,
    l.updated_at;

-- Simpler version without potentially missing columns
CREATE OR REPLACE VIEW v_lot_overview_simple AS
SELECT 
    l.id,
    l.project_id,
    l.lot_number,
    l.description,
    l.status,
    l.created_by,
    l.created_at,
    l.updated_at,
    -- ITP assignment aggregates
    COUNT(DISTINCT lia.template_id) as assigned_itp_count,
    COUNT(DISTINCT CASE WHEN lia.status = 'completed' THEN lia.template_id END) as completed_itp_count,
    COUNT(DISTINCT CASE WHEN lia.status = 'in_progress' THEN lia.template_id END) as in_progress_itp_count,
    -- Inspection progress
    COUNT(DISTINCT iir.id) as total_inspection_items,
    COUNT(DISTINCT CASE WHEN iir.status = 'pass' THEN iir.id END) as passed_items,
    COUNT(DISTINCT CASE WHEN iir.status = 'fail' THEN iir.id END) as failed_items,
    COUNT(DISTINCT CASE WHEN iir.status IN ('pass', 'fail', 'na') THEN iir.id END) as completed_items,
    -- Calculated completion percentage
    CASE 
        WHEN COUNT(DISTINCT iir.id) > 0 
        THEN ROUND((COUNT(DISTINCT CASE WHEN iir.status IN ('pass', 'fail', 'na') THEN iir.id END)::numeric / COUNT(DISTINCT iir.id)::numeric) * 100, 2)
        ELSE 0
    END as completion_percentage
FROM lots l
LEFT JOIN lot_itp_assignments lia ON l.id = lia.lot_id
LEFT JOIN itp_inspection_records iir ON lia.id = iir.assignment_id
GROUP BY l.id;

-- 2. ITP Assignment Details View - Pre-joins assignment data
CREATE OR REPLACE VIEW v_itp_assignment_details AS
SELECT 
    lia.id as assignment_id,
    lia.lot_id,
    lia.template_id,
    lia.instance_name,
    lia.sequence_number,
    lia.status as assignment_status,
    lia.started_at,
    lia.completed_at,
    lia.approved_at,
    lia.assigned_to,
    lia.assigned_by,
    lia.assigned_at,
    -- Template details
    it.name as template_name,
    it.code as template_code,
    it.description as template_description,
    it.category as template_category,
    -- Inspection progress
    COUNT(DISTINCT iti.id) as total_items,
    COUNT(DISTINCT iir.id) as inspected_items,
    COUNT(DISTINCT CASE WHEN iir.status = 'pass' THEN iir.id END) as passed_items,
    COUNT(DISTINCT CASE WHEN iir.status = 'fail' THEN iir.id END) as failed_items,
    -- Completion percentage
    CASE 
        WHEN COUNT(DISTINCT iti.id) > 0 
        THEN ROUND((COUNT(DISTINCT CASE WHEN iir.status IN ('pass', 'fail', 'na') THEN iir.id END)::numeric / COUNT(DISTINCT iti.id)::numeric) * 100, 2)
        ELSE 0
    END as completion_percentage
FROM lot_itp_assignments lia
JOIN itp_templates it ON lia.template_id = it.id
LEFT JOIN itp_template_items iti ON it.id = iti.template_id
LEFT JOIN itp_inspection_records iir ON lia.id = iir.assignment_id AND iti.id = iir.template_item_id
GROUP BY lia.id, it.id, it.name, it.code, it.description, it.category;

-- 3. Project Dashboard View - Aggregated project statistics
CREATE OR REPLACE VIEW v_project_dashboard AS
SELECT 
    p.id as project_id,
    p.name as project_name,
    p.status as project_status,
    -- Lot statistics
    COUNT(DISTINCT l.id) as total_lots,
    COUNT(DISTINCT CASE WHEN l.status = 'pending' THEN l.id END) as pending_lots,
    COUNT(DISTINCT CASE WHEN l.status = 'in_progress' THEN l.id END) as in_progress_lots,
    COUNT(DISTINCT CASE WHEN l.status = 'completed' THEN l.id END) as completed_lots,
    -- ITP statistics
    COUNT(DISTINCT lia.id) as total_itp_assignments,
    COUNT(DISTINCT CASE WHEN lia.status = 'completed' THEN lia.id END) as completed_assignments,
    -- Inspection statistics
    COUNT(DISTINCT iir.id) as total_inspections,
    COUNT(DISTINCT CASE WHEN iir.status = 'pass' THEN iir.id END) as passed_inspections,
    COUNT(DISTINCT CASE WHEN iir.status = 'fail' THEN iir.id END) as failed_inspections,
    -- Non-conformance count
    COUNT(DISTINCT CASE WHEN iir.is_non_conforming = true THEN iir.id END) as non_conformances,
    -- Overall completion
    CASE 
        WHEN COUNT(DISTINCT iir.id) > 0 
        THEN ROUND((COUNT(DISTINCT CASE WHEN iir.status IN ('pass', 'fail', 'na') THEN iir.id END)::numeric / COUNT(DISTINCT iir.id)::numeric) * 100, 2)
        ELSE 0
    END as overall_completion_percentage
FROM projects p
LEFT JOIN lots l ON p.id = l.project_id
LEFT JOIN lot_itp_assignments lia ON l.id = lia.lot_id
LEFT JOIN itp_inspection_records iir ON lia.id = iir.assignment_id
GROUP BY p.id, p.name, p.status;

-- 4. Inspection Items View - Denormalized view for quick inspection form loading
CREATE OR REPLACE VIEW v_inspection_items AS
SELECT 
    iir.id as record_id,
    iir.assignment_id,
    iir.template_item_id,
    iir.status as inspection_status,
    iir.result_boolean,
    iir.result_numeric,
    iir.result_text,
    iir.result_choice,
    iir.comments,
    iir.inspected_by,
    iir.inspected_at,
    iir.is_non_conforming,
    -- Template item details
    iti.item_code,
    iti.description as item_description,
    iti.inspection_type,
    iti.min_value,
    iti.max_value,
    iti.unit,
    iti.choices,
    iti.acceptance_criteria,
    iti.inspection_method,
    iti.reference_standard,
    iti.is_mandatory,
    iti.is_witness_point,
    iti.is_hold_point,
    iti.sort_order,
    -- Assignment details
    lia.lot_id,
    lia.template_id,
    lia.status as assignment_status
FROM itp_inspection_records iir
JOIN itp_template_items iti ON iir.template_item_id = iti.id
JOIN lot_itp_assignments lia ON iir.assignment_id = lia.id
ORDER BY iti.sort_order;

-- Create indexes on views' underlying tables for better performance
CREATE INDEX IF NOT EXISTS idx_lot_itp_assignments_status_lot 
    ON lot_itp_assignments(lot_id, status);

CREATE INDEX IF NOT EXISTS idx_itp_inspection_records_assignment_status 
    ON itp_inspection_records(assignment_id, status);

-- Grant permissions (uncomment and adjust based on your user roles)
-- GRANT SELECT ON v_lot_overview TO authenticated;
-- GRANT SELECT ON v_lot_overview_simple TO authenticated;
-- GRANT SELECT ON v_itp_assignment_details TO authenticated;
-- GRANT SELECT ON v_project_dashboard TO authenticated;
-- GRANT SELECT ON v_inspection_items TO authenticated;

-- Add comments for documentation
COMMENT ON VIEW v_lot_overview IS 'Optimized view for lot listing with ITP assignment and inspection progress (includes all columns if they exist)';
COMMENT ON VIEW v_lot_overview_simple IS 'Simplified lot overview without potentially missing columns';
COMMENT ON VIEW v_itp_assignment_details IS 'Pre-joined view for ITP assignment details with inspection progress';
COMMENT ON VIEW v_project_dashboard IS 'Aggregated view for project dashboard statistics';
COMMENT ON VIEW v_inspection_items IS 'Denormalized view for efficient inspection form loading';