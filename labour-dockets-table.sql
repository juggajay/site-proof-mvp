-- Create labour_dockets table
CREATE TABLE public.labour_dockets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    daily_report_id UUID REFERENCES public.daily_lot_reports(id) ON DELETE CASCADE,
    person_name VARCHAR(255) NOT NULL,
    company VARCHAR(255),
    trade VARCHAR(100),
    hours_worked DECIMAL(4,2) NOT NULL,
    hourly_rate DECIMAL(8,2),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.labour_dockets ENABLE ROW LEVEL SECURITY;

-- Create policy (simple for testing)
CREATE POLICY "Allow all operations on labour_dockets" ON public.labour_dockets
FOR ALL USING (true);

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_labour_dockets_daily_report_id 
ON public.labour_dockets(daily_report_id);

-- Verify table was created
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'labour_dockets';