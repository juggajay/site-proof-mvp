-- =====================================================
-- FINAL PRODUCTION-READY create_itp_from_template FUNCTION
-- Incorporates all discovered constraints and patterns
-- =====================================================

-- Drop existing function
DROP FUNCTION IF EXISTS create_itp_from_template(UUID, UUID, UUID, VARCHAR(255), UUID);

-- Create the corrected function
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
  -- MUST use: 'Low', 'Medium', 'High'
  v_default_complexity := CASE 
    WHEN v_template.category ILIKE '%complex%' OR 
         v_template.category ILIKE '%bridge%' OR 
         v_template.category ILIKE '%structural%' THEN 'High'
    WHEN v_template.category ILIKE '%simple%' OR 
         v_template.category ILIKE '%basic%' OR
         v_template.category ILIKE '%minor%' THEN 'Low'
    ELSE 'Medium'  -- Default
  END;
  
  -- Create ITP with all required fields
  INSERT INTO itps (
    template_id, 
    project_id, 
    lot_id, 
    name, 
    description, 
    category,
    complexity,  -- CRITICAL: Must include this field
    organization_id, 
    created_by,
    status,      -- MUST be 'Draft' (uppercase)
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
    'Draft',  -- Uppercase!
    NOW(),
    NOW()
  )
  RETURNING id INTO v_itp_id;
  
  -- Copy template items to ITP items
  -- CRITICAL: item_number must be one of: 'PASS_FAIL', 'NUMERIC', 'TEXT_INPUT'
  INSERT INTO itp_items (
    itp_id, 
    template_item_id, 
    item_number,  -- This is the inspection type, not a sequential number!
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
    -- Intelligent mapping based on description and method
    CASE 
      -- Numeric measurements
      WHEN LOWER(description) LIKE '%temperature%' OR 
           LOWER(description) LIKE '%slump%' OR
           LOWER(description) LIKE '%measurement%' OR
           LOWER(description) LIKE '%thickness%' OR
           LOWER(description) LIKE '%dimension%' OR
           LOWER(acceptance_criteria) LIKE '%mm%' OR
           LOWER(acceptance_criteria) LIKE '%degrees%' OR
           LOWER(inspection_method) LIKE '%measure%' THEN 'NUMERIC'
      
      -- Text inputs
      WHEN LOWER(description) LIKE '%note%' OR 
           LOWER(description) LIKE '%comment%' OR
           LOWER(description) LIKE '%observation%' OR
           LOWER(description) LIKE '%description%' OR
           LOWER(inspection_method) LIKE '%document%' OR
           LOWER(inspection_method) LIKE '%review%' THEN 'TEXT_INPUT'
      
      -- Default to pass/fail for most inspections
      ELSE 'PASS_FAIL'
    END as item_number,
    description,
    acceptance_criteria, 
    inspection_method,
    is_mandatory, 
    sort_order,
    'Pending',
    NOW(),
    NOW()
  FROM itp_template_items
  WHERE template_id = p_template_id
  ORDER BY sort_order;
  
  -- If no template items exist, create sample items
  IF NOT EXISTS (SELECT 1 FROM itp_template_items WHERE template_id = p_template_id) THEN
    INSERT INTO itp_items (
      itp_id, 
      item_number, 
      description, 
      is_mandatory, 
      sort_order, 
      status, 
      created_at, 
      updated_at
    )
    VALUES 
      (v_itp_id, 'PASS_FAIL', 'General Compliance Check', true, 1, 'Pending', NOW(), NOW()),
      (v_itp_id, 'NUMERIC', 'Measurement Verification', false, 2, 'Pending', NOW(), NOW()),
      (v_itp_id, 'TEXT_INPUT', 'Additional Observations', false, 3, 'Pending', NOW(), NOW());
  END IF;
  
  -- Log success (optional)
  RAISE NOTICE 'Created ITP % with template %', v_itp_id, p_template_id;
  
  RETURN v_itp_id;
  
EXCEPTION
  WHEN OTHERS THEN
    -- Log error details
    RAISE NOTICE 'Error creating ITP: %', SQLERRM;
    RAISE;
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION create_itp_from_template(UUID, UUID, UUID, VARCHAR(255), UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION create_itp_from_template(UUID, UUID, UUID, VARCHAR(255), UUID) TO service_role;

-- Add helpful comments
COMMENT ON FUNCTION create_itp_from_template IS 
'Creates a new ITP from a template. 
IMPORTANT: 
- complexity must be: Low, Medium, or High
- status will be: Draft (uppercase)
- item_number must be: PASS_FAIL, NUMERIC, or TEXT_INPUT (inspection type, not sequential number)';

-- Test the function
DO $$
DECLARE
  v_test_itp_id UUID;
BEGIN
  -- Get a template to test with
  SELECT create_itp_from_template(
    p_template_id := (SELECT id FROM itp_templates WHERE is_active = true LIMIT 1),
    p_name := 'Function Test - ' || TO_CHAR(NOW(), 'YYYY-MM-DD HH24:MI:SS')
  ) INTO v_test_itp_id;
  
  RAISE NOTICE 'Test successful! Created ITP: %', v_test_itp_id;
  
  -- Show what was created
  RAISE NOTICE 'ITP has % items', (SELECT COUNT(*) FROM itp_items WHERE itp_id = v_test_itp_id);
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Test failed: %', SQLERRM;
END $$;