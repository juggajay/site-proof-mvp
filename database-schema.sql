-- Site Proof MVP Database Schema

-- Users table for authentication
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    email_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Profiles table for user information
CREATE TABLE profiles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    avatar_url VARCHAR(500),
    phone VARCHAR(20),
    timezone VARCHAR(50) DEFAULT 'UTC',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Organizations table
CREATE TABLE organizations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    website_url VARCHAR(500),
    logo_url VARCHAR(500),
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User-Organization relationships
CREATE TABLE user_organizations (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'member', -- 'owner', 'admin', 'member'
    status VARCHAR(50) DEFAULT 'active', -- 'active', 'invited', 'suspended'
    invited_by INTEGER REFERENCES users(id),
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, organization_id)
);

-- Sessions table for authentication
CREATE TABLE sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_profiles_user_id ON profiles(user_id);
CREATE INDEX idx_user_organizations_user_id ON user_organizations(user_id);
CREATE INDEX idx_user_organizations_org_id ON user_organizations(organization_id);
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_token ON sessions(session_token);
CREATE INDEX idx_sessions_expires ON sessions(expires_at);

-- Update triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER users_updated_at BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON profiles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER organizations_updated_at BEFORE UPDATE ON organizations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Projects table for site management
CREATE TABLE projects (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    project_number VARCHAR(100),
    description TEXT,
    location TEXT,
    start_date DATE,
    end_date DATE,
    status VARCHAR(50) DEFAULT 'active', -- 'active', 'completed', 'on_hold', 'cancelled'
    organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
    created_by INTEGER REFERENCES users(id),
    project_manager_id INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Project team members
CREATE TABLE project_members (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'inspector', -- 'manager', 'inspector', 'viewer'
    added_by INTEGER REFERENCES users(id),
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(project_id, user_id)
);

-- ITP (Inspection Test Plan) templates
CREATE TABLE itp_templates (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100), -- 'structural', 'electrical', 'plumbing', etc.
    version VARCHAR(20) DEFAULT '1.0',
    is_active BOOLEAN DEFAULT TRUE,
    organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ITP checklist items
CREATE TABLE itp_items (
    id SERIAL PRIMARY KEY,
    itp_template_id INTEGER REFERENCES itp_templates(id) ON DELETE CASCADE,
    item_number VARCHAR(20),
    description TEXT NOT NULL,
    specification_reference VARCHAR(255),
    inspection_method VARCHAR(100), -- 'visual', 'measurement', 'test', 'document_review'
    acceptance_criteria TEXT,
    item_type VARCHAR(50) DEFAULT 'pass_fail', -- 'pass_fail', 'numeric', 'text', 'photo_required'
    is_mandatory BOOLEAN DEFAULT TRUE,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Lots (inspection units within projects)
CREATE TABLE lots (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
    lot_number VARCHAR(100) NOT NULL,
    description TEXT,
    location_description TEXT,
    itp_template_id INTEGER REFERENCES itp_templates(id),
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'in_progress', 'completed', 'approved', 'rejected'
    start_date DATE,
    target_completion_date DATE,
    actual_completion_date DATE,
    assigned_inspector_id INTEGER REFERENCES users(id),
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(project_id, lot_number)
);

-- Inspection records (conformance records)
CREATE TABLE conformance_records (
    id SERIAL PRIMARY KEY,
    lot_id INTEGER REFERENCES lots(id) ON DELETE CASCADE,
    itp_item_id INTEGER REFERENCES itp_items(id) ON DELETE CASCADE,
    result_pass_fail VARCHAR(10), -- 'PASS', 'FAIL', 'N/A'
    result_numeric DECIMAL(10,3),
    result_text TEXT,
    comments TEXT,
    is_non_conformance BOOLEAN DEFAULT FALSE,
    corrective_action TEXT,
    inspector_id INTEGER REFERENCES users(id),
    inspection_date TIMESTAMP,
    approved_by INTEGER REFERENCES users(id),
    approval_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(lot_id, itp_item_id)
);

-- Attachments for inspections (photos, documents)
CREATE TABLE attachments (
    id SERIAL PRIMARY KEY,
    conformance_record_id INTEGER REFERENCES conformance_records(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    file_size INTEGER,
    mime_type VARCHAR(100),
    file_path VARCHAR(500),
    storage_url VARCHAR(500),
    description TEXT,
    is_primary BOOLEAN DEFAULT FALSE,
    uploaded_by INTEGER REFERENCES users(id),
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Inspection reports
CREATE TABLE inspection_reports (
    id SERIAL PRIMARY KEY,
    lot_id INTEGER REFERENCES lots(id) ON DELETE CASCADE,
    report_type VARCHAR(50) DEFAULT 'inspection', -- 'inspection', 'non_conformance', 'completion'
    title VARCHAR(255) NOT NULL,
    summary TEXT,
    total_items INTEGER DEFAULT 0,
    passed_items INTEGER DEFAULT 0,
    failed_items INTEGER DEFAULT 0,
    pending_items INTEGER DEFAULT 0,
    completion_percentage DECIMAL(5,2) DEFAULT 0,
    generated_by INTEGER REFERENCES users(id),
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    report_data JSONB, -- Store report metadata and formatting options
    file_path VARCHAR(500), -- Path to generated PDF
    is_final BOOLEAN DEFAULT FALSE
);

-- Non-conformance reports
CREATE TABLE non_conformances (
    id SERIAL PRIMARY KEY,
    conformance_record_id INTEGER REFERENCES conformance_records(id) ON DELETE CASCADE,
    lot_id INTEGER REFERENCES lots(id) ON DELETE CASCADE,
    nc_number VARCHAR(100) UNIQUE NOT NULL,
    severity VARCHAR(50) DEFAULT 'minor', -- 'critical', 'major', 'minor'
    description TEXT NOT NULL,
    root_cause TEXT,
    corrective_action TEXT,
    preventive_action TEXT,
    status VARCHAR(50) DEFAULT 'open', -- 'open', 'in_progress', 'closed', 'verified'
    raised_by INTEGER REFERENCES users(id),
    assigned_to INTEGER REFERENCES users(id),
    target_closure_date DATE,
    actual_closure_date DATE,
    verified_by INTEGER REFERENCES users(id),
    verification_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Audit log for tracking changes
CREATE TABLE audit_logs (
    id SERIAL PRIMARY KEY,
    table_name VARCHAR(100) NOT NULL,
    record_id INTEGER NOT NULL,
    action VARCHAR(50) NOT NULL, -- 'INSERT', 'UPDATE', 'DELETE'
    old_values JSONB,
    new_values JSONB,
    changed_by INTEGER REFERENCES users(id),
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address INET,
    user_agent TEXT
);

-- Junction table for multiple ITPs per lot
CREATE TABLE lot_itp_templates (
    id SERIAL PRIMARY KEY,
    lot_id INTEGER REFERENCES lots(id) ON DELETE CASCADE,
    itp_template_id INTEGER REFERENCES itp_templates(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    assigned_by INTEGER REFERENCES users(id),
    is_active BOOLEAN DEFAULT TRUE,
    completion_percentage DECIMAL(5,2) DEFAULT 0,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(lot_id, itp_template_id)
);

-- Additional indexes for performance
CREATE INDEX idx_projects_org_id ON projects(organization_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_project_members_project_id ON project_members(project_id);
CREATE INDEX idx_project_members_user_id ON project_members(user_id);
CREATE INDEX idx_itp_templates_org_id ON itp_templates(organization_id);
CREATE INDEX idx_itp_templates_active ON itp_templates(is_active);
CREATE INDEX idx_itp_items_template_id ON itp_items(itp_template_id);
CREATE INDEX idx_itp_items_order ON itp_items(order_index);
CREATE INDEX idx_lots_project_id ON lots(project_id);
CREATE INDEX idx_lots_status ON lots(status);
CREATE INDEX idx_lots_inspector ON lots(assigned_inspector_id);
CREATE INDEX idx_lot_itp_templates_lot_id ON lot_itp_templates(lot_id);
CREATE INDEX idx_lot_itp_templates_itp_id ON lot_itp_templates(itp_template_id);
CREATE INDEX idx_lot_itp_templates_active ON lot_itp_templates(is_active);
CREATE INDEX idx_conformance_lot_id ON conformance_records(lot_id);
CREATE INDEX idx_conformance_item_id ON conformance_records(itp_item_id);
CREATE INDEX idx_conformance_inspector ON conformance_records(inspector_id);
CREATE INDEX idx_attachments_record_id ON attachments(conformance_record_id);
CREATE INDEX idx_reports_lot_id ON inspection_reports(lot_id);
CREATE INDEX idx_nc_lot_id ON non_conformances(lot_id);
CREATE INDEX idx_nc_status ON non_conformances(status);
CREATE INDEX idx_audit_table_record ON audit_logs(table_name, record_id);
CREATE INDEX idx_audit_changed_by ON audit_logs(changed_by);

-- Update triggers for new tables
CREATE TRIGGER projects_updated_at BEFORE UPDATE ON projects 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER itp_templates_updated_at BEFORE UPDATE ON itp_templates 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER lots_updated_at BEFORE UPDATE ON lots 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER lot_itp_templates_updated_at BEFORE UPDATE ON lot_itp_templates 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER conformance_records_updated_at BEFORE UPDATE ON conformance_records 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER non_conformances_updated_at BEFORE UPDATE ON non_conformances 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to handle new user creation
-- This trigger automatically creates a profile and organization for new users
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    org_id INTEGER;
    org_slug VARCHAR(100);
BEGIN
    -- Create a profile for the new user
    INSERT INTO profiles (user_id, timezone)
    VALUES (NEW.id, 'UTC');
    
    -- Generate a unique organization slug
    org_slug := 'org-' || NEW.id || '-' || EXTRACT(EPOCH FROM NOW())::INTEGER;
    
    -- Create a default organization for the user
    INSERT INTO organizations (name, slug, created_by)
    VALUES (
        SPLIT_PART(NEW.email, '@', 1) || '''s Organization',
        org_slug,
        NEW.id
    )
    RETURNING id INTO org_id;
    
    -- Link the user to their organization as owner
    INSERT INTO user_organizations (user_id, organization_id, role, status)
    VALUES (NEW.id, org_id, 'owner', 'active');
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log the error but don't prevent user creation
        RAISE WARNING 'Error in handle_new_user trigger: %', SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger on user insert
DROP TRIGGER IF EXISTS on_auth_user_created ON users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Site Diary and Daily Report tables
CREATE TABLE daily_reports (
    id SERIAL PRIMARY KEY,
    lot_id INTEGER REFERENCES lots(id) ON DELETE CASCADE,
    report_date DATE NOT NULL,
    weather_condition VARCHAR(50), -- 'sunny', 'cloudy', 'rainy', 'windy', etc.
    temperature_high INTEGER,
    temperature_low INTEGER,
    work_summary TEXT,
    issues_encountered TEXT,
    safety_notes TEXT,
    visitors TEXT,
    equipment_status TEXT,
    progress_notes TEXT,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(lot_id, report_date)
);

-- Daily events/notes
CREATE TABLE daily_events (
    id SERIAL PRIMARY KEY,
    lot_id INTEGER REFERENCES lots(id) ON DELETE CASCADE,
    event_date DATE NOT NULL,
    event_time TIME,
    event_type VARCHAR(50) DEFAULT 'note', -- 'note', 'incident', 'inspection', 'delivery', etc.
    title VARCHAR(255) NOT NULL,
    description TEXT,
    severity VARCHAR(20) DEFAULT 'low', -- 'low', 'medium', 'high', 'critical'
    status VARCHAR(20) DEFAULT 'open', -- 'open', 'in_progress', 'resolved', 'closed'
    assigned_to INTEGER REFERENCES users(id),
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Daily labour records
CREATE TABLE daily_labour (
    id SERIAL PRIMARY KEY,
    lot_id INTEGER REFERENCES lots(id) ON DELETE CASCADE,
    work_date DATE NOT NULL,
    worker_name VARCHAR(100) NOT NULL,
    trade VARCHAR(50), -- 'electrician', 'plumber', 'carpenter', 'laborer', etc.
    hours_worked DECIMAL(4,2) NOT NULL,
    hourly_rate DECIMAL(8,2),
    overtime_hours DECIMAL(4,2) DEFAULT 0,
    overtime_rate DECIMAL(8,2),
    task_description TEXT,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Daily plant/equipment records
CREATE TABLE daily_plant (
    id SERIAL PRIMARY KEY,
    lot_id INTEGER REFERENCES lots(id) ON DELETE CASCADE,
    work_date DATE NOT NULL,
    equipment_type VARCHAR(100) NOT NULL, -- 'excavator', 'concrete_mixer', 'crane', etc.
    equipment_id VARCHAR(50), -- equipment number or identifier
    operator_name VARCHAR(100),
    hours_used DECIMAL(4,2) NOT NULL,
    hourly_rate DECIMAL(8,2),
    fuel_consumed DECIMAL(6,2),
    maintenance_notes TEXT,
    task_description TEXT,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Daily materials records
CREATE TABLE daily_materials (
    id SERIAL PRIMARY KEY,
    lot_id INTEGER REFERENCES lots(id) ON DELETE CASCADE,
    delivery_date DATE NOT NULL,
    material_type VARCHAR(100) NOT NULL, -- 'concrete', 'steel', 'aggregate', etc.
    supplier VARCHAR(100),
    quantity DECIMAL(10,3) NOT NULL,
    unit_measure VARCHAR(20), -- 'm3', 'tonnes', 'pieces', etc.
    unit_cost DECIMAL(8,2),
    total_cost DECIMAL(10,2),
    delivery_docket VARCHAR(50),
    quality_notes TEXT,
    received_by VARCHAR(100),
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for site diary tables
CREATE INDEX idx_daily_reports_lot_date ON daily_reports(lot_id, report_date);
CREATE INDEX idx_daily_events_lot_date ON daily_events(lot_id, event_date);
CREATE INDEX idx_daily_labour_lot_date ON daily_labour(lot_id, work_date);
CREATE INDEX idx_daily_plant_lot_date ON daily_plant(lot_id, work_date);
CREATE INDEX idx_daily_materials_lot_date ON daily_materials(lot_id, delivery_date);

-- Update triggers for site diary tables
CREATE TRIGGER daily_reports_updated_at BEFORE UPDATE ON daily_reports 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER daily_events_updated_at BEFORE UPDATE ON daily_events 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER daily_labour_updated_at BEFORE UPDATE ON daily_labour 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER daily_plant_updated_at BEFORE UPDATE ON daily_plant 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER daily_materials_updated_at BEFORE UPDATE ON daily_materials 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Sample ITP template data
INSERT INTO itp_templates (name, description, category, organization_id, created_by) VALUES
('Concrete Foundation ITP', 'Inspection Test Plan for concrete foundation work', 'structural', 1, 1),
('Electrical Installation ITP', 'Standard electrical installation checklist', 'electrical', 1, 1),
('Plumbing Rough-in ITP', 'Plumbing rough-in inspection checklist', 'plumbing', 1, 1);

-- Sample ITP items for Concrete Foundation
INSERT INTO itp_items (itp_template_id, item_number, description, inspection_method, acceptance_criteria, item_type, order_index) VALUES
(1, '1.1', 'Excavation depth and dimensions', 'measurement', 'As per approved drawings ±25mm', 'numeric', 1),
(1, '1.2', 'Base preparation and compaction', 'visual', 'Uniform, well compacted, no soft spots', 'pass_fail', 2),
(1, '1.3', 'Reinforcement placement and cover', 'measurement', 'Cover: 75mm ±10mm, spacing as per drawings', 'numeric', 3),
(1, '1.4', 'Concrete slump test', 'test', 'Slump: 100mm ±25mm', 'numeric', 4),
(1, '1.5', 'Surface finish', 'visual', 'Smooth, level finish without major defects', 'pass_fail', 5),
(1, '1.6', 'Photographic evidence', 'photo_required', 'Before, during, and after photos required', 'photo_required', 6);

-- Migrate existing single ITP assignments to the junction table
-- This will be run once to preserve existing data
INSERT INTO lot_itp_templates (lot_id, itp_template_id, assigned_by, is_active)
SELECT id, itp_template_id, created_by, TRUE
FROM lots
WHERE itp_template_id IS NOT NULL
ON CONFLICT (lot_id, itp_template_id) DO NOTHING;