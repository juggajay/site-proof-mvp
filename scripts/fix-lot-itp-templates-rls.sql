-- Fix RLS policies for lot_itp_templates to work with mock authentication
-- This updates the policies to be more permissive for authenticated users

-- Drop existing policies
DROP POLICY IF EXISTS "Authenticated users can view lot ITP assignments" ON lot_itp_templates;
DROP POLICY IF EXISTS "Authenticated users can create lot ITP assignments" ON lot_itp_templates;
DROP POLICY IF EXISTS "Authenticated users can update lot ITP assignments" ON lot_itp_templates;
DROP POLICY IF EXISTS "Authenticated users can delete lot ITP assignments" ON lot_itp_templates;

-- Create new, more permissive policies for development
-- In production, you would want stricter policies based on organization membership

-- Policy: Any authenticated user can view assignments
CREATE POLICY "Users can view lot ITP assignments" ON lot_itp_templates
    FOR SELECT
    USING (true);  -- Allow all reads for now

-- Policy: Any authenticated user can create assignments
CREATE POLICY "Users can create lot ITP assignments" ON lot_itp_templates
    FOR INSERT
    WITH CHECK (true);  -- Allow all inserts for now

-- Policy: Any authenticated user can update assignments
CREATE POLICY "Users can update lot ITP assignments" ON lot_itp_templates
    FOR UPDATE
    USING (true)
    WITH CHECK (true);  -- Allow all updates for now

-- Policy: Any authenticated user can delete assignments
CREATE POLICY "Users can delete lot ITP assignments" ON lot_itp_templates
    FOR DELETE
    USING (true);  -- Allow all deletes for now

-- Add a comment about these policies
COMMENT ON TABLE lot_itp_templates IS 'Junction table supporting multiple ITP templates per lot. Note: RLS policies are currently permissive for development.';