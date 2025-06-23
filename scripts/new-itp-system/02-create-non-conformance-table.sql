-- =====================================================
-- NON-CONFORMANCE TABLE
-- =====================================================

DROP TABLE IF EXISTS non_conformances CASCADE;

CREATE TABLE non_conformances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nc_number VARCHAR(50) UNIQUE NOT NULL, -- auto-generated NC-2024-001
    
    -- Source
    inspection_record_id UUID REFERENCES itp_inspection_records(id),
    lot_id UUID NOT NULL, -- REFERENCES lots(id)
    project_id UUID NOT NULL, -- REFERENCES projects(id)
    
    -- Details
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('critical', 'major', 'minor', 'observation')),
    category VARCHAR(100), -- 'workmanship', 'material', 'documentation', etc.
    
    -- Resolution
    root_cause TEXT,
    corrective_action TEXT,
    preventive_action TEXT,
    
    -- Status tracking
    status VARCHAR(50) DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'resolved', 'closed', 'verified')),
    
    -- Assignments
    raised_by UUID NOT NULL, -- REFERENCES auth.users(id)
    assigned_to UUID, -- REFERENCES auth.users(id)
    verified_by UUID, -- REFERENCES auth.users(id)
    
    -- Dates
    raised_at TIMESTAMPTZ DEFAULT NOW(),
    due_date DATE,
    resolved_at TIMESTAMPTZ,
    closed_at TIMESTAMPTZ,
    verified_at TIMESTAMPTZ,
    
    -- Attachments/Evidence
    attachments JSONB DEFAULT '[]', -- Array of {filename, url, uploaded_at}
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_non_conformances_lot ON non_conformances(lot_id);
CREATE INDEX idx_non_conformances_project ON non_conformances(project_id);
CREATE INDEX idx_non_conformances_status ON non_conformances(status);
CREATE INDEX idx_non_conformances_severity ON non_conformances(severity);
CREATE INDEX idx_non_conformances_inspection ON non_conformances(inspection_record_id);

-- Function to generate NC number
CREATE OR REPLACE FUNCTION generate_nc_number()
RETURNS VARCHAR AS $$
DECLARE
    v_year VARCHAR(4);
    v_seq_num INTEGER;
    v_nc_number VARCHAR(50);
BEGIN
    v_year := TO_CHAR(NOW(), 'YYYY');
    
    -- Get the next sequence number for this year
    SELECT COALESCE(MAX(CAST(SUBSTRING(nc_number FROM '[0-9]+$') AS INTEGER)), 0) + 1
    INTO v_seq_num
    FROM non_conformances
    WHERE nc_number LIKE 'NC-' || v_year || '-%';
    
    v_nc_number := 'NC-' || v_year || '-' || LPAD(v_seq_num::TEXT, 3, '0');
    
    RETURN v_nc_number;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate NC number
CREATE OR REPLACE FUNCTION set_nc_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.nc_number IS NULL THEN
        NEW.nc_number := generate_nc_number();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_nc_number
BEFORE INSERT ON non_conformances
FOR EACH ROW
EXECUTE FUNCTION set_nc_number();

-- Function to automatically create NC from failed inspection
CREATE OR REPLACE FUNCTION create_nc_from_inspection(
    p_inspection_record_id UUID,
    p_title VARCHAR(255),
    p_description TEXT,
    p_severity VARCHAR(20) DEFAULT 'minor',
    p_raised_by UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_nc_id UUID;
    v_inspection RECORD;
    v_assignment RECORD;
BEGIN
    -- Get inspection details
    SELECT ir.*, ti.description as item_description
    INTO v_inspection
    FROM itp_inspection_records ir
    JOIN itp_template_items ti ON ir.template_item_id = ti.id
    WHERE ir.id = p_inspection_record_id;
    
    -- Get assignment details for lot and project
    SELECT a.lot_id, l.project_id
    INTO v_assignment
    FROM lot_itp_assignments a
    JOIN lots l ON a.lot_id = l.id
    WHERE a.id = v_inspection.assignment_id;
    
    -- Create non-conformance
    INSERT INTO non_conformances (
        inspection_record_id,
        lot_id,
        project_id,
        title,
        description,
        severity,
        category,
        raised_by,
        status
    ) VALUES (
        p_inspection_record_id,
        v_assignment.lot_id,
        v_assignment.project_id,
        COALESCE(p_title, 'Failed: ' || v_inspection.item_description),
        COALESCE(p_description, 'Inspection failed for: ' || v_inspection.item_description || '. Comments: ' || COALESCE(v_inspection.comments, 'None')),
        p_severity,
        'inspection',
        COALESCE(p_raised_by, v_inspection.inspected_by),
        'open'
    ) RETURNING id INTO v_nc_id;
    
    -- Update inspection record with NC reference
    UPDATE itp_inspection_records
    SET is_non_conforming = true,
        nc_reference = (SELECT nc_number FROM non_conformances WHERE id = v_nc_id)
    WHERE id = p_inspection_record_id;
    
    RETURN v_nc_id;
END;
$$ LANGUAGE plpgsql;

-- Add comments
COMMENT ON TABLE non_conformances IS 'Non-conformance records linked to ITP inspections and lots';
COMMENT ON FUNCTION create_nc_from_inspection IS 'Creates a non-conformance record from a failed inspection';

-- Enable RLS
ALTER TABLE non_conformances ENABLE ROW LEVEL SECURITY;