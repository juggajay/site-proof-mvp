-- =====================================================
-- NEW ITP SYSTEM - MAIN TABLES
-- =====================================================

-- Drop existing tables if needed (be careful in production!)
DROP TABLE IF EXISTS itp_inspection_records CASCADE;
DROP TABLE IF EXISTS lot_itp_assignments CASCADE;
DROP TABLE IF EXISTS itp_template_items CASCADE;
DROP TABLE IF EXISTS itp_templates CASCADE;

-- 1. ITP Templates (Blueprints)
CREATE TABLE itp_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,  -- REFERENCES organizations(id)
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE, -- e.g., "CONC-001", "ASPH-002"
    description TEXT,
    category VARCHAR(100), -- "Concrete", "Asphalt", "Steel", etc.
    version VARCHAR(20) DEFAULT '1.0',
    is_active BOOLEAN DEFAULT true,
    is_custom BOOLEAN DEFAULT false, -- true if created via ITP builder
    created_by UUID, -- REFERENCES auth.users(id)
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. ITP Template Items (Template Checklist Items)
CREATE TABLE itp_template_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID NOT NULL REFERENCES itp_templates(id) ON DELETE CASCADE,
    item_code VARCHAR(50), -- e.g., "TEMP-01", "COMP-02"
    description TEXT NOT NULL,
    inspection_type VARCHAR(20) NOT NULL CHECK (inspection_type IN ('boolean', 'numeric', 'text', 'multi_choice', 'signature')),
    
    -- Validation rules for different types
    min_value DECIMAL, -- for numeric
    max_value DECIMAL, -- for numeric
    unit VARCHAR(50), -- for numeric (e.g., "°C", "mm", "%")
    choices JSONB, -- for multi_choice [{value: "A", label: "Option A"}]
    
    -- Requirements
    acceptance_criteria TEXT,
    inspection_method TEXT,
    reference_standard VARCHAR(255), -- e.g., "AS 2870", "ASTM C143"
    
    -- Control
    is_mandatory BOOLEAN DEFAULT true,
    is_witness_point BOOLEAN DEFAULT false, -- requires supervisor approval
    is_hold_point BOOLEAN DEFAULT false, -- work cannot proceed without approval
    
    sort_order INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Lot ITP Assignments (Junction Table)
CREATE TABLE lot_itp_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lot_id UUID NOT NULL, -- REFERENCES lots(id) ON DELETE CASCADE
    template_id UUID NOT NULL REFERENCES itp_templates(id),
    
    -- Instance tracking
    instance_name VARCHAR(255), -- e.g., "Concrete Pour - Level 2"
    sequence_number INTEGER DEFAULT 1, -- order of execution
    
    -- Status
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'approved')),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    approved_at TIMESTAMPTZ,
    approved_by UUID, -- REFERENCES auth.users(id)
    
    -- Assignment
    assigned_to UUID, -- REFERENCES auth.users(id)
    assigned_by UUID, -- REFERENCES auth.users(id)
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(lot_id, template_id, sequence_number)
);

-- 4. ITP Inspection Records (Actual Inspection Data)
CREATE TABLE itp_inspection_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id UUID NOT NULL REFERENCES lot_itp_assignments(id) ON DELETE CASCADE,
    template_item_id UUID NOT NULL REFERENCES itp_template_items(id),
    
    -- Results based on inspection_type
    result_boolean BOOLEAN, -- for pass/fail
    result_numeric DECIMAL, -- for measurements
    result_text TEXT, -- for text inputs
    result_choice VARCHAR(255), -- for multi-choice
    
    -- Common fields
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'pass', 'fail', 'na', 'deferred')),
    comments TEXT,
    
    -- Inspection details
    inspected_by UUID, -- REFERENCES auth.users(id)
    inspected_at TIMESTAMPTZ,
    
    -- Witness/Hold point approvals
    witnessed_by UUID, -- REFERENCES auth.users(id)
    witnessed_at TIMESTAMPTZ,
    
    -- Non-conformance link
    is_non_conforming BOOLEAN DEFAULT false,
    nc_reference VARCHAR(50), -- link to non-conformance record
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(assignment_id, template_item_id)
);

-- Create indexes for performance
CREATE INDEX idx_itp_templates_org ON itp_templates(organization_id);
CREATE INDEX idx_itp_templates_category ON itp_templates(category);
CREATE INDEX idx_itp_templates_active ON itp_templates(is_active);

CREATE INDEX idx_itp_template_items_template ON itp_template_items(template_id);
CREATE INDEX idx_itp_template_items_sort ON itp_template_items(template_id, sort_order);

CREATE INDEX idx_lot_itp_assignments_lot ON lot_itp_assignments(lot_id);
CREATE INDEX idx_lot_itp_assignments_template ON lot_itp_assignments(template_id);
CREATE INDEX idx_lot_itp_assignments_status ON lot_itp_assignments(status);

CREATE INDEX idx_itp_inspection_records_assignment ON itp_inspection_records(assignment_id);
CREATE INDEX idx_itp_inspection_records_status ON itp_inspection_records(status);
CREATE INDEX idx_itp_inspection_records_nc ON itp_inspection_records(is_non_conforming);

-- Add comments
COMMENT ON TABLE itp_templates IS 'ITP template definitions - blueprints for inspection checklists';
COMMENT ON TABLE itp_template_items IS 'Individual checklist items within an ITP template';
COMMENT ON TABLE lot_itp_assignments IS 'Links ITP templates to lots and tracks inspection progress';
COMMENT ON TABLE itp_inspection_records IS 'Actual inspection results for each checklist item';

-- Enable Row Level Security
ALTER TABLE itp_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE itp_template_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE lot_itp_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE itp_inspection_records ENABLE ROW LEVEL SECURITY;