-- =====================================================
-- FINAL FIX: Use correct complexity values ('Low', 'Medium', 'High')
-- Based on actual database analysis
-- =====================================================

-- Step 1: Verify current values
SELECT 
    complexity,
    COUNT(*) as count
FROM itps
WHERE complexity IS NOT NULL
GROUP BY complexity
ORDER BY complexity;

-- Step 2: Fix the create_itp_from_template function
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
  -- Using CORRECT values: 'Low', 'Medium', 'High'
  v_default_complexity := CASE 
    WHEN v_template.category ILIKE '%complex%' OR v_template.category ILIKE '%bridge%' THEN 'High'
    WHEN v_template.category ILIKE '%simple%' OR v_template.category ILIKE '%basic%' THEN 'Low'
    ELSE 'Medium'  -- Default to Medium (not 'Moderate'!)
  END;
  
  -- Create ITP with complexity field included
  INSERT INTO itps (
    template_id, 
    project_id, 
    lot_id, 
    name, 
    description, 
    category,
    complexity,  -- Include complexity in INSERT
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
    v_default_complexity,  -- Will be 'Low', 'Medium', or 'High'
    v_template.organization_id,
    v_user_id,
    'Draft',  -- Must be uppercase!
    NOW(),
    NOW()
  )
  RETURNING id INTO v_itp_id;
  
  -- Copy template items to ITP items
  INSERT INTO itp_items (
    itp_id, 
    template_item_id, 
    item_number, 
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
    item_number, 
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
  ORDER BY sort_order, item_number;
  
  -- If no template items exist, create a default one
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
    VALUES (
      v_itp_id,
      '1',
      'General Inspection',
      true,
      1,
      'Pending',
      NOW(),
      NOW()
    );
  END IF;
  
  RETURN v_itp_id;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT EXECUTE ON FUNCTION create_itp_from_template(UUID, UUID, UUID, VARCHAR(255), UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION create_itp_from_template(UUID, UUID, UUID, VARCHAR(255), UUID) TO service_role;

-- Step 3: Test the function
-- Uncomment to test:
/*
SELECT create_itp_from_template(
    p_template_id := (SELECT id FROM itp_templates WHERE is_active = true LIMIT 1),
    p_name := 'Test ITP After Final Fix'
);
*/

-- Step 4: Verify the fix worked
SELECT 
    'Function should now work with complexity values: Low, Medium, High' as status;

-- Step 5: Update any incorrect data if needed
-- If you have any records with 'Moderate', 'Simple', 'Complex', update them:
UPDATE itps 
SET complexity = CASE 
    WHEN complexity IN ('Simple', 'simple') THEN 'Low'
    WHEN complexity IN ('Moderate', 'moderate') THEN 'Medium'
    WHEN complexity IN ('Complex', 'complex') THEN 'High'
    ELSE complexity
END
WHERE complexity NOT IN ('Low', 'Medium', 'High') 
  AND complexity IS NOT NULL;