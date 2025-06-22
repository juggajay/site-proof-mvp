-- Fix existing ITP assignments by creating ITP instances
-- This script creates ITP instances for existing lot_itp_templates records that don't have them

-- First, make sure the function exists
-- (Run FINAL-create-itp-from-template-function.sql first if it doesn't exist)

-- Create ITP instances for all active assignments that don't have one
DO $$
DECLARE
    assignment RECORD;
    new_itp_id UUID;
    lot_info RECORD;
BEGIN
    -- Loop through all active assignments without ITP instances
    FOR assignment IN 
        SELECT lit.*, l.lot_number, t.name as template_name
        FROM lot_itp_templates lit
        JOIN lots l ON lit.lot_id = l.id
        JOIN itp_templates t ON lit.itp_template_id = t.id
        WHERE lit.is_active = true 
        AND lit.itp_id IS NULL
    LOOP
        -- Get lot info for naming
        SELECT * INTO lot_info FROM lots WHERE id = assignment.lot_id;
        
        -- Create ITP instance
        SELECT create_itp_from_template(
            p_template_id := assignment.itp_template_id,
            p_lot_id := assignment.lot_id,
            p_name := assignment.template_name || ' - Lot ' || lot_info.lot_number,
            p_created_by := assignment.assigned_by
        ) INTO new_itp_id;
        
        -- Update the assignment with the new ITP instance ID
        UPDATE lot_itp_templates 
        SET itp_id = new_itp_id,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = assignment.id;
        
        RAISE NOTICE 'Created ITP instance % for lot % template %', 
            new_itp_id, assignment.lot_number, assignment.template_name;
    END LOOP;
END $$;

-- Verify the results
SELECT 
    lit.id,
    l.lot_number,
    t.name as template_name,
    lit.itp_id,
    i.name as itp_instance_name,
    (SELECT COUNT(*) FROM itp_items WHERE itp_id = lit.itp_id) as item_count
FROM lot_itp_templates lit
JOIN lots l ON lit.lot_id = l.id
JOIN itp_templates t ON lit.itp_template_id = t.id
LEFT JOIN itps i ON lit.itp_id = i.id
WHERE lit.is_active = true
ORDER BY l.lot_number;