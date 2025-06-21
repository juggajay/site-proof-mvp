-- Fix the create_itp_from_template function to handle missing complexity
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
  
  -- Create ITP with default complexity if not set
  INSERT INTO itps (
    template_id, 
    project_id, 
    lot_id, 
    name, 
    description, 
    category, 
    complexity,  -- Add explicit complexity
    organization_id, 
    created_by,
    status
  )
  VALUES (
    p_template_id, 
    p_project_id, 
    p_lot_id,
    COALESCE(p_name, v_template.name || ' - ' || TO_CHAR(NOW(), 'YYYY-MM-DD')),
    v_template.description,
    v_template.category,
    'Medium',  -- Default complexity
    v_template.organization_id,
    v_user_id,
    'Draft'
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
    status
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
    'Pending'
  FROM itp_template_items
  WHERE template_id = p_template_id
  ORDER BY sort_order, item_number;
  
  -- If no template items exist, create at least one default item
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