-- Step 1: Check what tables actually exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Step 2: Check if daily_lot_reports exists (needed for foreign key)
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'daily_lot_reports';

-- Step 3: Create the labour_dockets table with proper error handling

-- Drop table if it exists (to start fresh)
DROP TABLE IF EXISTS public.labour_dockets;

-- Create the table
CREATE TABLE public.labour_dockets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    daily_report_id UUID NOT NULL,
    person_name VARCHAR(255) NOT NULL,
    company VARCHAR(255),
    trade VARCHAR(100),
    hours_worked DECIMAL(4,2) NOT NULL CHECK (hours_worked >= 0),
    hourly_rate DECIMAL(8,2) CHECK (hourly_rate >= 0),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add foreign key constraint if daily_lot_reports exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'daily_lot_reports') THEN
        ALTER TABLE public.labour_dockets 
        ADD CONSTRAINT fk_labour_daily_report 
        FOREIGN KEY (daily_report_id) REFERENCES public.daily_lot_reports(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Enable RLS
ALTER TABLE public.labour_dockets ENABLE ROW LEVEL SECURITY;

-- Create simple policy
CREATE POLICY "Allow all on labour_dockets" ON public.labour_dockets FOR ALL USING (true);

-- Create index
CREATE INDEX idx_labour_dockets_daily_report ON public.labour_dockets(daily_report_id);

-- Step 4: Verify table creation
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'labour_dockets' 
ORDER BY ordinal_position;

-- Step 5: Test insert (replace with your actual daily report ID)
-- INSERT INTO public.labour_dockets (
--     daily_report_id,
--     person_name,
--     company,
--     trade,
--     hours_worked,
--     hourly_rate,
--     notes
-- ) VALUES (
--     'YOUR_DAILY_REPORT_ID_HERE',  -- Replace with actual daily report ID
--     'SQL Test Person',
--     'Test Company',
--     'General Labourer',
--     8.0,
--     50.0,
--     'Test from SQL'
-- );

-- Step 6: Check if test record was inserted
-- SELECT * FROM public.labour_dockets;