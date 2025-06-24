-- Performance Optimization Indexes for Site Proof MVP
-- This file contains additional indexes to optimize query performance
-- Run this after the main database schema has been created

-- ========================================
-- Core Table Indexes
-- ========================================

-- Users and Authentication
CREATE INDEX IF NOT EXISTS idx_users_email_verified ON users(email_verified) WHERE email_verified = true;
CREATE INDEX IF NOT EXISTS idx_sessions_user_expires ON sessions(user_id, expires_at);

-- Organization Relationships
CREATE INDEX IF NOT EXISTS idx_user_organizations_active ON user_organizations(organization_id, user_id) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_user_organizations_role ON user_organizations(organization_id, role);

-- Projects
CREATE INDEX IF NOT EXISTS idx_projects_active ON projects(organization_id, status) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_projects_dates ON projects(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_project_members_role ON project_members(project_id, role);

-- ========================================
-- ITP Related Indexes
-- ========================================

-- ITP Templates
CREATE INDEX IF NOT EXISTS idx_itp_templates_category ON itp_templates(organization_id, category) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_itp_templates_search ON itp_templates(name, category) WHERE is_active = true;

-- ITP Items
CREATE INDEX IF NOT EXISTS idx_itp_items_mandatory ON itp_items(itp_template_id, is_mandatory) WHERE is_mandatory = true;
CREATE INDEX IF NOT EXISTS idx_itp_items_type ON itp_items(itp_template_id, item_type);

-- Lots
CREATE INDEX IF NOT EXISTS idx_lots_active_status ON lots(project_id, status) WHERE status IN ('pending', 'in_progress');
CREATE INDEX IF NOT EXISTS idx_lots_completion ON lots(project_id, actual_completion_date) WHERE actual_completion_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_lots_target_date ON lots(target_completion_date) WHERE status = 'in_progress';

-- Lot ITP Templates (Junction Table)
CREATE INDEX IF NOT EXISTS idx_lot_itp_active ON lot_itp_templates(lot_id, is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_lot_itp_completion ON lot_itp_templates(lot_id, completion_percentage);
CREATE INDEX IF NOT EXISTS idx_lot_itp_completed ON lot_itp_templates(completed_at) WHERE completed_at IS NOT NULL;

-- ========================================
-- Conformance and Inspection Indexes
-- ========================================

-- Conformance Records
CREATE INDEX IF NOT EXISTS idx_conformance_result ON conformance_records(lot_id, result_pass_fail);
CREATE INDEX IF NOT EXISTS idx_conformance_non_conf ON conformance_records(lot_id, is_non_conformance) WHERE is_non_conformance = true;
CREATE INDEX IF NOT EXISTS idx_conformance_date ON conformance_records(inspection_date);
CREATE INDEX IF NOT EXISTS idx_conformance_pending_approval ON conformance_records(lot_id, approved_by) WHERE approved_by IS NULL;

-- Non-conformances
CREATE INDEX IF NOT EXISTS idx_nc_open ON non_conformances(lot_id, status) WHERE status IN ('open', 'in_progress');
CREATE INDEX IF NOT EXISTS idx_nc_severity ON non_conformances(severity, status);
CREATE INDEX IF NOT EXISTS idx_nc_assigned ON non_conformances(assigned_to, status) WHERE status != 'closed';
CREATE INDEX IF NOT EXISTS idx_nc_target_date ON non_conformances(target_closure_date) WHERE status != 'closed';

-- Attachments
CREATE INDEX IF NOT EXISTS idx_attachments_primary ON attachments(conformance_record_id, is_primary) WHERE is_primary = true;
CREATE INDEX IF NOT EXISTS idx_attachments_type ON attachments(mime_type);

-- ========================================
-- Site Diary Indexes
-- ========================================

-- Daily Reports
CREATE INDEX IF NOT EXISTS idx_daily_reports_date_range ON daily_reports(lot_id, report_date DESC);
CREATE INDEX IF NOT EXISTS idx_daily_reports_weather ON daily_reports(weather_condition, report_date);

-- Daily Events
CREATE INDEX IF NOT EXISTS idx_daily_events_type_date ON daily_events(lot_id, event_type, event_date);
CREATE INDEX IF NOT EXISTS idx_daily_events_severity ON daily_events(lot_id, severity) WHERE severity IN ('high', 'critical');
CREATE INDEX IF NOT EXISTS idx_daily_events_open ON daily_events(lot_id, status) WHERE status IN ('open', 'in_progress');
CREATE INDEX IF NOT EXISTS idx_daily_events_delay ON daily_events(lot_id, event_date) WHERE event_type = 'delay';

-- Daily Labour
CREATE INDEX IF NOT EXISTS idx_daily_labour_date_trade ON daily_labour(lot_id, work_date, trade);
CREATE INDEX IF NOT EXISTS idx_daily_labour_worker ON daily_labour(worker_name, work_date);
CREATE INDEX IF NOT EXISTS idx_daily_labour_subcontractor ON daily_labour(subcontractor_id, work_date) WHERE subcontractor_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_daily_labour_cost ON daily_labour(lot_id, total_cost) WHERE total_cost IS NOT NULL;

-- Daily Plant
CREATE INDEX IF NOT EXISTS idx_daily_plant_equipment ON daily_plant(lot_id, equipment_type, work_date);
CREATE INDEX IF NOT EXISTS idx_daily_plant_profile ON daily_plant(plant_profile_id, work_date) WHERE plant_profile_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_daily_plant_maintenance ON daily_plant(lot_id, work_date) WHERE maintenance_notes IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_daily_plant_cost ON daily_plant(lot_id, total_cost) WHERE total_cost IS NOT NULL;

-- Daily Materials
CREATE INDEX IF NOT EXISTS idx_daily_materials_type_date ON daily_materials(lot_id, material_type, delivery_date);
CREATE INDEX IF NOT EXISTS idx_daily_materials_supplier ON daily_materials(supplier, delivery_date);
CREATE INDEX IF NOT EXISTS idx_daily_materials_docket ON daily_materials(delivery_docket) WHERE delivery_docket IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_daily_materials_profile ON daily_materials(material_profile_id, delivery_date) WHERE material_profile_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_daily_materials_cost ON daily_materials(lot_id, total_cost) WHERE total_cost IS NOT NULL;

-- ========================================
-- Resource Management Indexes
-- ========================================

-- Companies
CREATE INDEX IF NOT EXISTS idx_companies_type ON companies(organization_id, company_type) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_companies_search ON companies(company_name, company_type) WHERE is_active = true;

-- Subcontractors
CREATE INDEX IF NOT EXISTS idx_subcontractors_company ON subcontractors(company_id) WHERE company_id IS NOT NULL;

-- Subcontractor Employees
CREATE INDEX IF NOT EXISTS idx_subcontractor_employees_active ON subcontractor_employees(subcontractor_id, is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_subcontractor_employees_rate ON subcontractor_employees(hourly_rate) WHERE is_active = true;

-- Plant Profiles
CREATE INDEX IF NOT EXISTS idx_plant_profiles_company ON plant_profiles(company_id, is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_plant_profiles_type ON plant_profiles(machine_type, is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_plant_profiles_rate ON plant_profiles(default_hourly_rate) WHERE is_active = true;

-- Material Profiles
CREATE INDEX IF NOT EXISTS idx_material_profiles_category ON material_profiles(material_category, is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_material_profiles_supplier ON material_profiles(supplier) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_material_profiles_rate ON material_profiles(default_unit_rate) WHERE is_active = true;

-- ========================================
-- Reporting and Analytics Indexes
-- ========================================

-- Inspection Reports
CREATE INDEX IF NOT EXISTS idx_inspection_reports_type ON inspection_reports(lot_id, report_type);
CREATE INDEX IF NOT EXISTS idx_inspection_reports_final ON inspection_reports(lot_id, is_final) WHERE is_final = true;
CREATE INDEX IF NOT EXISTS idx_inspection_reports_date ON inspection_reports(generated_at DESC);

-- Audit Logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_recent ON audit_logs(changed_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_action ON audit_logs(changed_by, action, changed_at);

-- ========================================
-- Composite Indexes for Common Queries
-- ========================================

-- Project Dashboard Query
CREATE INDEX IF NOT EXISTS idx_project_dashboard ON lots(project_id, status, created_at);

-- Lot Detail Page Query
CREATE INDEX IF NOT EXISTS idx_lot_detail ON conformance_records(lot_id, itp_item_id, result_pass_fail);

-- Daily Report Summary
CREATE INDEX IF NOT EXISTS idx_daily_summary ON daily_reports(report_date, lot_id);

-- Cost Tracking
CREATE INDEX IF NOT EXISTS idx_labour_cost_tracking ON daily_labour(lot_id, work_date, total_cost);
CREATE INDEX IF NOT EXISTS idx_plant_cost_tracking ON daily_plant(lot_id, work_date, total_cost);
CREATE INDEX IF NOT EXISTS idx_materials_cost_tracking ON daily_materials(lot_id, delivery_date, total_cost);

-- ========================================
-- Full Text Search Indexes (PostgreSQL)
-- ========================================

-- Create text search indexes if using PostgreSQL
-- Uncomment these if you're using PostgreSQL with full text search

-- CREATE INDEX IF NOT EXISTS idx_projects_search ON projects USING gin(to_tsvector('english', name || ' ' || COALESCE(description, '')));
-- CREATE INDEX IF NOT EXISTS idx_itp_templates_fts ON itp_templates USING gin(to_tsvector('english', name || ' ' || COALESCE(description, '')));
-- CREATE INDEX IF NOT EXISTS idx_daily_reports_fts ON daily_reports USING gin(to_tsvector('english', COALESCE(work_summary, '') || ' ' || COALESCE(issues_encountered, '')));
-- CREATE INDEX IF NOT EXISTS idx_daily_events_fts ON daily_events USING gin(to_tsvector('english', title || ' ' || COALESCE(description, '')));

-- ========================================
-- Performance Statistics Views
-- ========================================

-- Create a materialized view for project statistics (refresh periodically)
CREATE MATERIALIZED VIEW IF NOT EXISTS project_stats AS
SELECT 
    p.id as project_id,
    p.name as project_name,
    COUNT(DISTINCT l.id) as total_lots,
    COUNT(DISTINCT CASE WHEN l.status = 'completed' THEN l.id END) as completed_lots,
    COUNT(DISTINCT CASE WHEN l.status = 'in_progress' THEN l.id END) as in_progress_lots,
    COUNT(DISTINCT cr.id) as total_inspections,
    COUNT(DISTINCT CASE WHEN cr.result_pass_fail = 'PASS' THEN cr.id END) as passed_inspections,
    COUNT(DISTINCT CASE WHEN cr.result_pass_fail = 'FAIL' THEN cr.id END) as failed_inspections,
    MAX(cr.inspection_date) as last_inspection_date
FROM projects p
LEFT JOIN lots l ON p.id = l.project_id
LEFT JOIN conformance_records cr ON l.id = cr.lot_id
GROUP BY p.id, p.name;

-- Create index on materialized view
CREATE INDEX IF NOT EXISTS idx_project_stats_id ON project_stats(project_id);

-- ========================================
-- Maintenance Commands
-- ========================================

-- Analyze tables to update statistics (run periodically)
ANALYZE users, profiles, organizations, projects, lots, itp_templates, itp_items, conformance_records;
ANALYZE daily_reports, daily_events, daily_labour, daily_plant, daily_materials;

-- Vacuum tables to reclaim space (run periodically)
-- VACUUM ANALYZE; -- Run this during maintenance windows