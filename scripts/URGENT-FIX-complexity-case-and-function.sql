-- =====================================================
-- URGENT FIX: Case-sensitive complexity values and missing field in function
-- =====================================================

-- Step 1: Update ALL existing data to use correct case (capitalized)
UPDATE itps 
SET complexity = 
  CASE 
    WHEN LOWER(complexity) = 'simple' THEN 'Simple'
    WHEN LOWER(complexity) = 'moderate' THEN 'Moderate'
    WHEN LOWER(complexity) = 'complex' THEN 'Complex'
    WHEN LOWER(complexity) = 'low' THEN 'Simple'
    WHEN LOWER(complexity) = 'medium' THEN 'Moderate'
    WHEN LOWER(complexity) = 'high' THEN 'Complex'
    ELSE complexity
  END
WHERE complexity IS NOT NULL;

-- Step 2: Check what values we have now
SELECT DISTINCT complexity, COUNT(*) as count
FROM itps
GROUP BY complexity
ORDER BY complexity;

-- Step 3: Drop and recreate the function WITH the complexity field
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
BEGIN
  -- Get current user if not provided
  v_user_id := COALESCE(p_created_by, auth.uid());
  
  -- Get template info
  SELECT * INTO v_template FROM itp_templates WHERE id = p_template_id;
  
  IF v_template IS NULL THEN
    RAISE EXCEPTION 'Template not found';
  END IF;
  
  -- CRITICAL FIX: Include complexity in the INSERT!
  INSERT INTO itps (
    template_id, 
    project_id, 
    lot_id, 
    name, 
    description, 
    category,
    complexity,  -- THIS WAS MISSING!
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
    'Moderate',  -- Default complexity with proper case
    v_template.organization_id,
    v_user_id,
    'Draft',  -- Keep as is for now, check if needs to be lowercase
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
      status
    )
    VALUES (
      v_itp_id,
      '1',
      'General Inspection',
      true,
      1,
      'Pending'
    );
  END IF;
  
  RETURN v_itp_id;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT EXECUTE ON FUNCTION create_itp_from_template(UUID, UUID, UUID, VARCHAR(255), UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION create_itp_from_template(UUID, UUID, UUID, VARCHAR(255), UUID) TO service_role;

-- Step 4: Verify the constraint is what we expect
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conname = 'chk_complexity';

-- Step 5: Test the function works now
-- Uncomment to test:
/*
SELECT create_itp_from_template(
    p_template_id := (SELECT id FROM itp_templates WHERE is_active = true LIMIT 1),
    p_name := 'Test ITP After Fix'
);
*/

-- Step 6: Check if status also needs to be case-sensitive
SELECT DISTINCT status, COUNT(*) as count
FROM itps
GROUP BY status
ORDER BY status;

-- If status needs to be lowercase, uncomment and run:
/*
UPDATE itps 
SET status = LOWER(status)
WHERE status != LOWER(status);
*/