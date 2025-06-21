-- =====================================================
-- FIX ITP ITEMS INSERT TO USE CORRECT item_number VALUES
-- item_number expects: 'PASS_FAIL', 'NUMERIC', 'TEXT_INPUT'
-- =====================================================

-- Update the create_itp_from_template function to handle this pattern
DROP FUNCTION IF EXISTS create_itp_from_template(UUID, UUID, UUID, VARCHAR(255), UUID);

CREATE OR REPLACE FUNCTION create_itp_from_template(
  p_template_id UUID,
  p_project_id UUID DEFAULT NULL,
  p_lot_id UUID DEFAULT NULL,
  p_name VARCHAR(255) DEFAULT NULL,
  p_created_by UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_itp_id UUID;
  v_template RECORD;
  v_user_id UUID;
  v_default_complexity VARCHAR(50);
BEGIN
  -- Get current user if not provided
  v_user_id := COALESCE(p_created_by, auth.uid());
  
  -- Get template info
  SELECT * INTO v_template FROM itp_templates WHERE id = p_template_id;
  
  IF v_template IS NULL THEN
    RAISE EXCEPTION 'Template not found';
  END IF;
  
  -- Determine default complexity based on template category
  v_default_complexity := CASE 
    WHEN v_template.category ILIKE '%complex%' OR v_template.category ILIKE '%bridge%' THEN 'High'
    WHEN v_template.category ILIKE '%simple%' OR v_template.category ILIKE '%basic%' THEN 'Low'
    ELSE 'Medium'
  END;
  
  -- Create ITP with proper values
  INSERT INTO itps (
    template_id, 
    project_id, 
    lot_id, 
    name, 
    description, 
    category,
    complexity,
    organization_id, 
    created_by,
    status,
    created_at,
    updated_at
  )
  VALUES (
    p_template_id, 
    p_project_id, 
    p_lot_id,
    COALESCE(p_name, v_template.name || ' - ' || TO_CHAR(NOW(), 'YYYY-MM-DD')),
    v_template.description,
    v_template.category,
    v_default_complexity,
    v_template.organization_id,
    v_user_id,
    'Draft',
    NOW(),
    NOW()
  )
  RETURNING id INTO v_itp_id;
  
  -- Copy template items to ITP items
  -- CRITICAL: Map inspection_method to item_number based on the enum pattern
  INSERT INTO itp_items (
    itp_id, 
    template_item_id, 
    item_number,  -- This needs to be 'PASS_FAIL', 'NUMERIC', or 'TEXT_INPUT'
    description,
    acceptance_criteria, 
    inspection_method, 
    is_mandatory, 
    sort_order,
    status,
    created_at,
    updated_at
  )
  SELECT 
    v_itp_id, 
    id,
    -- Map inspection method to the enum values
    CASE 
      WHEN UPPER(inspection_method) LIKE '%MEASURE%' OR UPPER(inspection_method) LIKE '%NUMERIC%' THEN 'NUMERIC'
      WHEN UPPER(inspection_method) LIKE '%TEXT%' OR UPPER(inspection_method) LIKE '%COMMENT%' THEN 'TEXT_INPUT'
      ELSE 'PASS_FAIL'  -- Default to PASS_FAIL
    END as item_number,
    description,
    acceptance_criteria, 
    inspection_method,  -- Keep original for reference
    is_mandatory, 
    sort_order,
    'Pending',
    NOW(),
    NOW()
  FROM itp_template_items
  WHERE template_id = p_template_id
  ORDER BY sort_order, item_number;
  
  -- If no template items exist, create defaults with proper item_number values
  IF NOT EXISTS (SELECT 1 FROM itp_template_items WHERE template_id = p_template_id) THEN
    -- Create one of each type
    INSERT INTO itp_items (itp_id, item_number, description, is_mandatory, sort_order, status, created_at, updated_at)
    VALUES 
      (v_itp_id, 'PASS_FAIL', 'General Compliance Check', true, 1, 'Pending', NOW(), NOW()),
      (v_itp_id, 'NUMERIC', 'Measurement Verification', true, 2, 'Pending', NOW(), NOW()),
      (v_itp_id, 'TEXT_INPUT', 'Additional Notes', false, 3, 'Pending', NOW(), NOW());
  END IF;
  
  RETURN v_itp_id;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT EXECUTE ON FUNCTION create_itp_from_template(UUID, UUID, UUID, VARCHAR(255), UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION create_itp_from_template(UUID, UUID, UUID, VARCHAR(255), UUID) TO service_role;

-- Test query to verify the pattern
SELECT 
    item_number,
    description,
    COUNT(*) as count
FROM itp_items
GROUP BY item_number, description
ORDER BY item_number, count DESC
LIMIT 10;

-- Example of how to manually insert items with correct pattern
/*
INSERT INTO itp_items (
    itp_id,
    item_number,  -- Must be one of: 'PASS_FAIL', 'NUMERIC', 'TEXT_INPUT'
    description,
    status,
    sort_order
) VALUES 
    ('{itp_id}', 'PASS_FAIL', 'Concrete mix design approved', 'Pending', 1),
    ('{itp_id}', 'NUMERIC', 'Slump test result (mm)', 'Pending', 2),
    ('{itp_id}', 'TEXT_INPUT', 'Additional observations', 'Pending', 3);
*/