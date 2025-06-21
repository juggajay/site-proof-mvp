-- =====================================================
-- FIX create_itp_from_template FUNCTION
-- This script fixes the missing complexity field issue
-- with CORRECT constraint values
-- =====================================================

-- Drop the existing function first
DROP FUNCTION IF EXISTS create_itp_from_template(UUID, UUID, UUID, VARCHAR(255), UUID);

-- Recreate the function with the complexity field included
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
  
  -- Determine default complexity based on template category or name
  v_default_complexity := CASE 
    WHEN v_template.category ILIKE '%complex%' THEN 'Complex'
    WHEN v_template.category ILIKE '%simple%' THEN 'Simple'
    ELSE 'Moderate'
  END;
  
  -- Create ITP with complexity field
  INSERT INTO itps (
    template_id, 
    project_id, 
    lot_id, 
    name, 
    description, 
    category, 
    complexity,  -- This was missing in the original function
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
    v_default_complexity,  -- Set appropriate complexity
    v_template.organization_id,
    v_user_id,
    'draft',  -- Changed from 'Draft' to 'draft' to match constraint
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
  
  -- Update ITP status if it has items
  PERFORM update_itp_status(v_itp_id);
  
  RETURN v_itp_id;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error and re-raise
    RAISE NOTICE 'Error creating ITP from template: %', SQLERRM;
    RAISE;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permissions if needed
GRANT EXECUTE ON FUNCTION create_itp_from_template(UUID, UUID, UUID, VARCHAR(255), UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION create_itp_from_template(UUID, UUID, UUID, VARCHAR(255), UUID) TO service_role;

-- =====================================================
-- ALSO FIX THE COMPLEXITY CONSTRAINT IF NEEDED
-- =====================================================

-- Check current constraint
SELECT pg_get_constraintdef(oid) AS current_constraint
FROM pg_constraint
WHERE conname = 'chk_complexity';

-- If the constraint still has 'Low/Medium/High', update it:
ALTER TABLE itps DROP CONSTRAINT IF EXISTS chk_complexity;
ALTER TABLE itps 
ADD CONSTRAINT chk_complexity 
CHECK (complexity IS NULL OR complexity IN ('Simple', 'Moderate', 'Complex'));

-- =====================================================
-- CLEANUP ANY EXISTING DATA WITH OLD VALUES
-- =====================================================

-- Update any existing ITPs with old complexity values
UPDATE itps 
SET complexity = CASE 
    WHEN complexity = 'Low' THEN 'Simple'
    WHEN complexity = 'Medium' THEN 'Moderate'
    WHEN complexity = 'High' THEN 'Complex'
    ELSE complexity
END
WHERE complexity IN ('Low', 'Medium', 'High');

-- Update any existing ITPs with uppercase status to lowercase
UPDATE itps 
SET status = LOWER(status)
WHERE status IN ('Draft', 'Active', 'In Progress', 'Completed', 'Archived');

-- =====================================================
-- FIX STATUS CONSTRAINT TOO
-- =====================================================

ALTER TABLE itps DROP CONSTRAINT IF EXISTS chk_itp_status;
ALTER TABLE itps 
ADD CONSTRAINT chk_itp_status 
CHECK (status IN ('draft', 'active', 'in progress', 'completed', 'archived'));

-- =====================================================
-- TEST THE FIXED FUNCTION
-- =====================================================

-- Test query (don't run unless you have templates set up)
/*
SELECT create_itp_from_template(
    p_template_id := (SELECT id FROM itp_templates WHERE is_active = true LIMIT 1),
    p_project_id := (SELECT id FROM projects LIMIT 1),
    p_name := 'Test ITP from Fixed Function'
);
*/

-- Verify the function exists with correct parameters
SELECT 
    routine_name,
    routine_type,
    data_type as return_type
FROM information_schema.routines
WHERE routine_schema = 'public'
    AND routine_name = 'create_itp_from_template';

-- =====================================================
-- REPORT ON FIXES APPLIED
-- =====================================================
SELECT 
  'ITPs with old complexity values' as check_type,
  COUNT(*) as count
FROM itps 
WHERE complexity IN ('Low', 'Medium', 'High')
UNION ALL
SELECT 
  'ITPs with uppercase status',
  COUNT(*)
FROM itps 
WHERE status != LOWER(status)
UNION ALL
SELECT 
  'ITPs with new complexity values',
  COUNT(*)
FROM itps 
WHERE complexity IN ('Simple', 'Moderate', 'Complex');