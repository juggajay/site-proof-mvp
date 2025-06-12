-- Database Schema for Lots and ITPs
-- Run this in Supabase SQL Editor to create the required tables

-- Create ITPs (Inspection and Test Plans) table
CREATE TABLE IF NOT EXISTS public.itps (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Lots table
CREATE TABLE IF NOT EXISTS public.lots (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    lot_number TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'IN_PROGRESS' CHECK (status IN ('IN_PROGRESS', 'COMPLETED', 'APPROVED')),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    itp_id UUID NOT NULL REFERENCES public.itps(id) ON DELETE RESTRICT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(project_id, lot_number)
);

-- Enable RLS on both tables
ALTER TABLE public.itps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lots ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for ITPs (all users can read ITPs)
DROP POLICY IF EXISTS "Users can view ITPs" ON public.itps;
CREATE POLICY "Users can view ITPs" ON public.itps
    FOR SELECT USING (true);

-- Create RLS policies for Lots (users can only see lots from their organization's projects)
DROP POLICY IF EXISTS "Users can view own organization lots" ON public.lots;
CREATE POLICY "Users can view own organization lots" ON public.lots
    FOR SELECT USING (
        project_id IN (
            SELECT p.id FROM public.projects p
            INNER JOIN public.profiles pr ON p.organization_id = pr.organization_id
            WHERE pr.id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can insert lots in own organization projects" ON public.lots;
CREATE POLICY "Users can insert lots in own organization projects" ON public.lots
    FOR INSERT WITH CHECK (
        project_id IN (
            SELECT p.id FROM public.projects p
            INNER JOIN public.profiles pr ON p.organization_id = pr.organization_id
            WHERE pr.id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can update own organization lots" ON public.lots;
CREATE POLICY "Users can update own organization lots" ON public.lots
    FOR UPDATE USING (
        project_id IN (
            SELECT p.id FROM public.projects p
            INNER JOIN public.profiles pr ON p.organization_id = pr.organization_id
            WHERE pr.id = auth.uid()
        )
    );

-- Insert some sample ITP templates
INSERT INTO public.itps (title, description) VALUES
    ('Concrete Pour Inspection', 'Standard inspection checklist for concrete pouring activities'),
    ('Steel Reinforcement Check', 'Inspection checklist for steel reinforcement placement and spacing'),
    ('Formwork Inspection', 'Quality check for formwork installation and alignment'),
    ('Excavation Inspection', 'Safety and quality inspection for excavation works'),
    ('Electrical Installation Check', 'Inspection checklist for electrical installation works')
ON CONFLICT DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_lots_project_id ON public.lots(project_id);
CREATE INDEX IF NOT EXISTS idx_lots_itp_id ON public.lots(itp_id);
CREATE INDEX IF NOT EXISTS idx_lots_status ON public.lots(status);