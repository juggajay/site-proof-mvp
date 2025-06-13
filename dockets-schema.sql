-- Labour dockets table
CREATE TABLE IF NOT EXISTS labour_dockets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    daily_report_id UUID REFERENCES daily_lot_reports(id) ON DELETE CASCADE,
    person_name VARCHAR(255) NOT NULL,
    company VARCHAR(255),
    trade VARCHAR(100),
    hours_worked DECIMAL(4,2) NOT NULL,
    hourly_rate DECIMAL(8,2),
    total_cost DECIMAL(10,2) GENERATED ALWAYS AS (hours_worked * COALESCE(hourly_rate, 0)) STORED,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Plant/Equipment dockets table
CREATE TABLE IF NOT EXISTS plant_dockets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    daily_report_id UUID REFERENCES daily_lot_reports(id) ON DELETE CASCADE,
    equipment_name VARCHAR(255) NOT NULL,
    equipment_type VARCHAR(100),
    docket_number VARCHAR(100),
    operator_name VARCHAR(255),
    hours_worked DECIMAL(4,2) NOT NULL,
    hourly_rate DECIMAL(8,2),
    total_cost DECIMAL(10,2) GENERATED ALWAYS AS (hours_worked * COALESCE(hourly_rate, 0)) STORED,
    fuel_consumption DECIMAL(6,2),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Materials dockets table
CREATE TABLE IF NOT EXISTS material_dockets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    daily_report_id UUID REFERENCES daily_lot_reports(id) ON DELETE CASCADE,
    material_name VARCHAR(255) NOT NULL,
    supplier VARCHAR(255),
    docket_number VARCHAR(100),
    quantity DECIMAL(10,2) NOT NULL,
    unit VARCHAR(50) NOT NULL,
    unit_rate DECIMAL(8,2),
    total_cost DECIMAL(10,2) GENERATED ALWAYS AS (quantity * COALESCE(unit_rate, 0)) STORED,
    delivery_time TIME,
    truck_rego VARCHAR(20),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for all tables
ALTER TABLE labour_dockets ENABLE ROW LEVEL SECURITY;
ALTER TABLE plant_dockets ENABLE ROW LEVEL SECURITY;
ALTER TABLE material_dockets ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can manage labour dockets" ON labour_dockets
FOR ALL USING (
    daily_report_id IN (
        SELECT id FROM daily_lot_reports 
        WHERE lot_id IN (SELECT id FROM lots)
    )
);

CREATE POLICY "Users can manage plant dockets" ON plant_dockets
FOR ALL USING (
    daily_report_id IN (
        SELECT id FROM daily_lot_reports 
        WHERE lot_id IN (SELECT id FROM lots)
    )
);

CREATE POLICY "Users can manage material dockets" ON material_dockets
FOR ALL USING (
    daily_report_id IN (
        SELECT id FROM daily_lot_reports 
        WHERE lot_id IN (SELECT id FROM lots)
    )
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_labour_dockets_daily_report ON labour_dockets(daily_report_id);
CREATE INDEX IF NOT EXISTS idx_plant_dockets_daily_report ON plant_dockets(daily_report_id);
CREATE INDEX IF NOT EXISTS idx_material_dockets_daily_report ON material_dockets(daily_report_id);