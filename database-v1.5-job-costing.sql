-- Civil-Q Database Schema v1.5 - Job Costing Engine
-- This script adds comprehensive job costing capabilities to the existing schema

-- =====================================================
-- 1. CREATE NEW TABLES
-- =====================================================

-- Subcontractor companies table
CREATE TABLE IF NOT EXISTS subcontractors (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    company_name TEXT NOT NULL,
    contact_person TEXT,
    phone TEXT,
    email TEXT,
    address TEXT,
    abn TEXT, -- Australian Business Number
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(organization_id, company_name)
);

-- Subcontractor employees table
CREATE TABLE IF NOT EXISTS subcontractor_employees (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    subcontractor_id UUID REFERENCES subcontractors(id) ON DELETE CASCADE,
    employee_name TEXT NOT NULL,
    role TEXT,
    hourly_rate NUMERIC(10,2) NOT NULL DEFAULT 0,
    phone TEXT,
    email TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(subcontractor_id, employee_name)
);

-- Plant/Equipment profiles table
CREATE TABLE IF NOT EXISTS plant_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    machine_name TEXT NOT NULL,
    machine_type TEXT, -- Excavator, Crane, Truck, etc.
    supplier TEXT,
    model TEXT,
    registration TEXT,
    default_hourly_rate NUMERIC(10,2) NOT NULL DEFAULT 0,
    default_idle_rate NUMERIC(10,2),
    fuel_type TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(organization_id, machine_name)
);

-- Material profiles table
CREATE TABLE IF NOT EXISTS material_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    material_name TEXT NOT NULL,
    material_category TEXT, -- Concrete, Steel, Aggregate, etc.
    supplier TEXT,
    default_unit_rate NUMERIC(10,2) NOT NULL DEFAULT 0,
    default_unit TEXT NOT NULL, -- m3, tonnes, units, etc.
    specification TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(organization_id, material_name)
);

-- =====================================================
-- 2. ALTER EXISTING TABLES
-- =====================================================

-- Modify daily_labour table
ALTER TABLE daily_labour 
ADD COLUMN IF NOT EXISTS rate_at_time_of_entry NUMERIC(10,2),
ADD COLUMN IF NOT EXISTS cost_code TEXT,
ADD COLUMN IF NOT EXISTS subcontractor_employee_id UUID REFERENCES subcontractor_employees(id),
ADD COLUMN IF NOT EXISTS subcontractor_id UUID REFERENCES subcontractors(id),
ADD COLUMN IF NOT EXISTS total_cost NUMERIC(10,2) GENERATED ALWAYS AS (
    (hours_worked * COALESCE(rate_at_time_of_entry, hourly_rate, 0)) + 
    (COALESCE(overtime_hours, 0) * COALESCE(overtime_rate, rate_at_time_of_entry * 1.5, 0))
) STORED;

-- Modify daily_plant table
ALTER TABLE daily_plant 
ADD COLUMN IF NOT EXISTS rate_at_time_of_entry NUMERIC(10,2),
ADD COLUMN IF NOT EXISTS cost_code TEXT,
ADD COLUMN IF NOT EXISTS plant_profile_id UUID REFERENCES plant_profiles(id),
ADD COLUMN IF NOT EXISTS idle_hours NUMERIC(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS idle_rate NUMERIC(10,2),
ADD COLUMN IF NOT EXISTS total_cost NUMERIC(10,2) GENERATED ALWAYS AS (
    (hours_used * COALESCE(rate_at_time_of_entry, hourly_rate, 0)) + 
    (COALESCE(idle_hours, 0) * COALESCE(idle_rate, 0))
) STORED;

-- Modify daily_materials table
ALTER TABLE daily_materials 
ADD COLUMN IF NOT EXISTS rate_at_time_of_entry NUMERIC(10,2),
ADD COLUMN IF NOT EXISTS cost_code TEXT,
ADD COLUMN IF NOT EXISTS material_profile_id UUID REFERENCES material_profiles(id),
ADD COLUMN IF NOT EXISTS calculated_total_cost NUMERIC(10,2) GENERATED ALWAYS AS (
    quantity * COALESCE(rate_at_time_of_entry, unit_cost, 0)
) STORED;

-- =====================================================
-- 3. CREATE INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_subcontractors_org ON subcontractors(organization_id);
CREATE INDEX IF NOT EXISTS idx_subcontractor_employees_subcontractor ON subcontractor_employees(subcontractor_id);
CREATE INDEX IF NOT EXISTS idx_plant_profiles_org ON plant_profiles(organization_id);
CREATE INDEX IF NOT EXISTS idx_material_profiles_org ON material_profiles(organization_id);

CREATE INDEX IF NOT EXISTS idx_daily_labour_employee ON daily_labour(subcontractor_employee_id);
CREATE INDEX IF NOT EXISTS idx_daily_plant_profile ON daily_plant(plant_profile_id);
CREATE INDEX IF NOT EXISTS idx_daily_materials_profile ON daily_materials(material_profile_id);

CREATE INDEX IF NOT EXISTS idx_daily_labour_cost_code ON daily_labour(cost_code) WHERE cost_code IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_daily_plant_cost_code ON daily_plant(cost_code) WHERE cost_code IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_daily_materials_cost_code ON daily_materials(cost_code) WHERE cost_code IS NOT NULL;

-- =====================================================
-- 4. CREATE VIEWS FOR REPORTING
-- =====================================================

-- Comprehensive labour costs view
CREATE OR REPLACE VIEW v_labour_costs AS
SELECT 
    dl.id,
    dl.lot_id,
    l.project_id,
    p.name as project_name,
    l.lot_number,
    dl.work_date,
    dl.worker_name,
    sc.company_name as subcontractor_name,
    dl.trade,
    dl.hours_worked,
    dl.overtime_hours,
    dl.rate_at_time_of_entry,
    dl.total_cost,
    dl.cost_code,
    dl.task_description
FROM daily_labour dl
JOIN lots l ON dl.lot_id = l.id
JOIN projects p ON l.project_id = p.id
LEFT JOIN subcontractor_employees se ON dl.subcontractor_employee_id = se.id
LEFT JOIN subcontractors sc ON dl.subcontractor_id = sc.id;

-- Comprehensive plant costs view
CREATE OR REPLACE VIEW v_plant_costs AS
SELECT 
    dp.id,
    dp.lot_id,
    l.project_id,
    p.name as project_name,
    l.lot_number,
    dp.work_date,
    dp.equipment_type,
    pp.machine_name,
    pp.supplier,
    dp.hours_used,
    dp.idle_hours,
    dp.rate_at_time_of_entry,
    dp.total_cost,
    dp.cost_code,
    dp.task_description
FROM daily_plant dp
JOIN lots l ON dp.lot_id = l.id
JOIN projects p ON l.project_id = p.id
LEFT JOIN plant_profiles pp ON dp.plant_profile_id = pp.id;

-- Comprehensive material costs view
CREATE OR REPLACE VIEW v_material_costs AS
SELECT 
    dm.id,
    dm.lot_id,
    l.project_id,
    p.name as project_name,
    l.lot_number,
    dm.delivery_date,
    dm.material_type,
    mp.material_name,
    mp.supplier as profile_supplier,
    dm.supplier as delivery_supplier,
    dm.quantity,
    dm.unit_measure,
    dm.rate_at_time_of_entry,
    dm.calculated_total_cost as total_cost,
    dm.cost_code,
    dm.delivery_docket
FROM daily_materials dm
JOIN lots l ON dm.lot_id = l.id
JOIN projects p ON l.project_id = p.id
LEFT JOIN material_profiles mp ON dm.material_profile_id = mp.id;

-- =====================================================
-- 5. CREATE COST SUMMARY FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION get_project_cost_summary(
    p_project_id UUID,
    p_start_date DATE,
    p_end_date DATE
) RETURNS JSON AS $$
DECLARE
    v_result JSON;
BEGIN
    WITH labour_summary AS (
        SELECT 
            COALESCE(SUM(total_cost), 0) as total_labour_cost,
            COUNT(DISTINCT work_date) as labour_days,
            COUNT(*) as labour_entries,
            json_agg(
                json_build_object(
                    'date', work_date,
                    'worker', worker_name,
                    'subcontractor', subcontractor_name,
                    'hours', hours_worked,
                    'overtime_hours', overtime_hours,
                    'rate', rate_at_time_of_entry,
                    'cost', total_cost,
                    'lot', lot_number,
                    'description', task_description
                ) ORDER BY work_date DESC
            ) as labour_details
        FROM v_labour_costs
        WHERE project_id = p_project_id
        AND work_date >= p_start_date
        AND work_date <= p_end_date
    ),
    plant_summary AS (
        SELECT 
            COALESCE(SUM(total_cost), 0) as total_plant_cost,
            COUNT(DISTINCT work_date) as plant_days,
            COUNT(*) as plant_entries,
            json_agg(
                json_build_object(
                    'date', work_date,
                    'equipment', COALESCE(machine_name, equipment_type),
                    'supplier', supplier,
                    'hours', hours_used,
                    'idle_hours', idle_hours,
                    'rate', rate_at_time_of_entry,
                    'cost', total_cost,
                    'lot', lot_number,
                    'description', task_description
                ) ORDER BY work_date DESC
            ) as plant_details
        FROM v_plant_costs
        WHERE project_id = p_project_id
        AND work_date >= p_start_date
        AND work_date <= p_end_date
    ),
    material_summary AS (
        SELECT 
            COALESCE(SUM(total_cost), 0) as total_material_cost,
            COUNT(DISTINCT delivery_date) as material_days,
            COUNT(*) as material_entries,
            json_agg(
                json_build_object(
                    'date', delivery_date,
                    'material', COALESCE(material_name, material_type),
                    'supplier', COALESCE(profile_supplier, delivery_supplier),
                    'quantity', quantity,
                    'unit', unit_measure,
                    'rate', rate_at_time_of_entry,
                    'cost', total_cost,
                    'lot', lot_number,
                    'docket', delivery_docket
                ) ORDER BY delivery_date DESC
            ) as material_details
        FROM v_material_costs
        WHERE project_id = p_project_id
        AND delivery_date >= p_start_date
        AND delivery_date <= p_end_date
    )
    SELECT json_build_object(
        'project_id', p_project_id,
        'start_date', p_start_date,
        'end_date', p_end_date,
        'total_cost', ls.total_labour_cost + ps.total_plant_cost + ms.total_material_cost,
        'labour', json_build_object(
            'total_cost', ls.total_labour_cost,
            'days_worked', ls.labour_days,
            'entries', ls.labour_entries,
            'details', ls.labour_details
        ),
        'plant', json_build_object(
            'total_cost', ps.total_plant_cost,
            'days_used', ps.plant_days,
            'entries', ps.plant_entries,
            'details', ps.plant_details
        ),
        'materials', json_build_object(
            'total_cost', ms.total_material_cost,
            'delivery_days', ms.material_days,
            'entries', ms.material_entries,
            'details', ms.material_details
        )
    ) INTO v_result
    FROM labour_summary ls, plant_summary ps, material_summary ms;
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 6. CREATE TRIGGERS FOR UPDATED_AT
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_subcontractors_updated_at BEFORE UPDATE ON subcontractors
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subcontractor_employees_updated_at BEFORE UPDATE ON subcontractor_employees
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_plant_profiles_updated_at BEFORE UPDATE ON plant_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_material_profiles_updated_at BEFORE UPDATE ON material_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 7. GRANT PERMISSIONS
-- =====================================================

-- Grant permissions to authenticated users
GRANT ALL ON subcontractors TO authenticated;
GRANT ALL ON subcontractor_employees TO authenticated;
GRANT ALL ON plant_profiles TO authenticated;
GRANT ALL ON material_profiles TO authenticated;

GRANT SELECT ON v_labour_costs TO authenticated;
GRANT SELECT ON v_plant_costs TO authenticated;
GRANT SELECT ON v_material_costs TO authenticated;

GRANT EXECUTE ON FUNCTION get_project_cost_summary TO authenticated;