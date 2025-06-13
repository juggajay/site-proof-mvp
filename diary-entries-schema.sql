-- Site diary entries table
CREATE TABLE IF NOT EXISTS diary_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    daily_report_id UUID REFERENCES daily_lot_reports(id) ON DELETE CASCADE,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    photo_url TEXT,
    gps_latitude DECIMAL(10, 8),
    gps_longitude DECIMAL(11, 8),
    weather_at_time VARCHAR(50),
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE diary_entries ENABLE ROW LEVEL SECURITY;

-- Create policy for diary entries
CREATE POLICY "Users can manage diary entries" ON diary_entries
FOR ALL USING (
    daily_report_id IN (
        SELECT id FROM daily_lot_reports 
        WHERE lot_id IN (SELECT id FROM lots)
    )
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_diary_entries_daily_report ON diary_entries(daily_report_id);
CREATE INDEX IF NOT EXISTS idx_diary_entries_timestamp ON diary_entries(timestamp);

-- Storage policies for site photos
INSERT INTO storage.buckets (id, name, public) VALUES ('site-photos', 'site-photos', true) ON CONFLICT DO NOTHING;

-- Allow authenticated users to upload photos
CREATE POLICY "Users can upload site photos" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'site-photos' AND 
  auth.role() = 'authenticated'
);

-- Allow users to view photos
CREATE POLICY "Users can view site photos" ON storage.objects FOR SELECT USING (
  bucket_id = 'site-photos'
);