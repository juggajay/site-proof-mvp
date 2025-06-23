-- Quick check and seed ITP templates
-- First, let's check if templates exist
SELECT COUNT(*) as template_count FROM itp_templates;

-- If empty, seed with basic templates
DO $$
BEGIN
    -- Only insert if table is empty
    IF NOT EXISTS (SELECT 1 FROM itp_templates LIMIT 1) THEN
        RAISE NOTICE 'No templates found, seeding basic templates...';
        
        -- Insert a few basic templates without organization_id
        INSERT INTO itp_templates (name, code, category, description, is_active, is_custom) VALUES
        ('Site Establishment', 'SE-001', 'Site Establishment & Earthworks', 'ITP for site setup and establishment', true, false),
        ('Bulk Earthworks', 'BE-001', 'Site Establishment & Earthworks', 'ITP for bulk earthworks operations', true, false),
        ('Concrete Footings', 'CF-001', 'Concrete Works', 'ITP for concrete footings and foundations', true, false),
        ('Concrete Slabs', 'CS-001', 'Concrete Works', 'ITP for concrete slab construction', true, false),
        ('Asphalt Base Course', 'AC-001', 'Asphalt & Bituminous Works', 'ITP for asphalt base course installation', true, false);
        
        -- Add basic items for Site Establishment template
        INSERT INTO itp_template_items (
            template_id, 
            sort_order, 
            description, 
            acceptance_criteria,
            inspection_type, 
            is_mandatory
        )
        SELECT 
            id,
            1,
            'Site boundaries established',
            'Survey marks in place',
            'boolean',
            true
        FROM itp_templates WHERE code = 'SE-001'
        UNION ALL
        SELECT 
            id,
            2,
            'Site access established',
            'Access roads suitable for construction traffic',
            'boolean',
            true
        FROM itp_templates WHERE code = 'SE-001'
        UNION ALL
        SELECT 
            id,
            3,
            'Services located and marked',
            'All underground services identified',
            'boolean',
            true
        FROM itp_templates WHERE code = 'SE-001';
        
        -- Add basic items for Concrete Footings template
        INSERT INTO itp_template_items (
            template_id, 
            sort_order, 
            description, 
            acceptance_criteria,
            inspection_type, 
            is_mandatory
        )
        SELECT 
            id,
            1,
            'Excavation complete',
            'Correct depth and dimensions',
            'boolean',
            true
        FROM itp_templates WHERE code = 'CF-001'
        UNION ALL
        SELECT 
            id,
            2,
            'Reinforcement installed',
            'As per drawings',
            'boolean',
            true
        FROM itp_templates WHERE code = 'CF-001'
        UNION ALL
        SELECT 
            id,
            3,
            'Concrete poured',
            'Correct strength and finish',
            'boolean',
            true
        FROM itp_templates WHERE code = 'CF-001';
        
        RAISE NOTICE 'Basic templates seeded successfully';
    ELSE
        RAISE NOTICE 'Templates already exist, skipping seed';
    END IF;
END $$;

-- Show results
SELECT 
    t.id,
    t.name,
    t.code,
    t.category,
    t.organization_id,
    COUNT(ti.id) as item_count
FROM itp_templates t
LEFT JOIN itp_template_items ti ON t.id = ti.template_id
GROUP BY t.id, t.name, t.code, t.category, t.organization_id
ORDER BY t.category, t.name;