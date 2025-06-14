-- Daily Lot Reports Database Schema
-- Creates comprehensive daily reporting system for construction site management

-- Daily lot reports (main container)
CREATE TABLE daily_lot_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lot_id UUID REFERENCES lots(id) ON DELETE CASCADE,
  report_date DATE NOT NULL,
  weather_condition TEXT,
  temperature_min INTEGER,
  temperature_max INTEGER,
  general_activities TEXT,
  safety_incidents TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(lot_id, report_date)
);

-- Site diary entries
CREATE TABLE site_diary_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  daily_report_id UUID REFERENCES daily_lot_reports(id) ON DELETE CASCADE,
  entry_time TIMESTAMPTZ DEFAULT NOW(),
  entry_type TEXT CHECK (entry_type IN ('activity', 'observation', 'issue', 'progress')),
  description TEXT NOT NULL,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Labour dockets
CREATE TABLE labour_dockets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  daily_report_id UUID REFERENCES daily_lot_reports(id) ON DELETE CASCADE,
  worker_name TEXT NOT NULL,
  trade TEXT,
  hours_worked DECIMAL(4,2),
  hourly_rate DECIMAL(8,2),
  overtime_hours DECIMAL(4,2),
  equipment_used TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_daily_reports_lot_date ON daily_lot_reports(lot_id, report_date);
CREATE INDEX idx_site_diary_report ON site_diary_entries(daily_report_id);
CREATE INDEX idx_labour_dockets_report ON labour_dockets(daily_report_id);

-- Create updated_at trigger for daily_lot_reports
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_daily_lot_reports_updated_at 
    BEFORE UPDATE ON daily_lot_reports 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE daily_lot_reports IS 'Main container for daily lot reports with weather and general information';
COMMENT ON TABLE site_diary_entries IS 'Individual diary entries for activities, observations, issues, and progress';
COMMENT ON TABLE labour_dockets IS 'Labour tracking records for workers, hours, and equipment usage';