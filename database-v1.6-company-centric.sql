-- Civil-Q Database Schema v1.6 - Company-Centric Resource Management
-- This migration refactors the resource management to be company-centric

-- =====================================================
-- 1. CREATE COMPANIES TABLE
-- =====================================================

-- Companies table (for both subcontractors and plant suppliers)
CREATE TABLE IF NOT EXISTS companies (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    company_name TEXT NOT NULL,
    company_type TEXT NOT NULL CHECK (company_type IN ('subcontractor', 'plant_supplier', 'both')),
    contact_person TEXT,
    phone TEXT,
    email TEXT,
    address TEXT,
    abn TEXT, -- Australian Business Number
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(organization_id, company_name)
);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_companies_org_type ON companies(organization_id, company_type);

-- =====================================================
-- 2. REFACTOR PLANT_PROFILES TABLE
-- =====================================================

-- Add company_id to plant_profiles
ALTER TABLE plant_profiles 
ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id) ON DELETE CASCADE;

-- Create index for plant profiles by company
CREATE INDEX IF NOT EXISTS idx_plant_profiles_company ON plant_profiles(company_id);

-- =====================================================
-- 3. REFACTOR SUBCONTRACTORS TABLE
-- =====================================================

-- Add company_id to subcontractors
ALTER TABLE subcontractors 
ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id) ON DELETE CASCADE;

-- =====================================================
-- 4. DATA MIGRATION
-- =====================================================

-- Migrate existing subcontractors to companies table
INSERT INTO companies (
    organization_id,
    company_name,
    company_type,
    contact_person,
    phone,
    email,
    address,
    abn,
    created_at,
    updated_at
)
SELECT 
    organization_id,
    company_name,
    'subcontractor',
    contact_person,
    phone,
    email,
    address,
    abn,
    created_at,
    updated_at
FROM subcontractors
WHERE NOT EXISTS (
    SELECT 1 FROM companies c 
    WHERE c.organization_id = subcontractors.organization_id 
    AND c.company_name = subcontractors.company_name
);

-- Update subcontractors with company_id
UPDATE subcontractors s
SET company_id = c.id
FROM companies c
WHERE s.organization_id = c.organization_id
AND s.company_name = c.company_name
AND s.company_id IS NULL;

-- Migrate plant suppliers from plant_profiles
INSERT INTO companies (
    organization_id,
    company_name,
    company_type,
    created_at,
    updated_at
)
SELECT DISTINCT
    organization_id,
    supplier,
    'plant_supplier',
    MIN(created_at),
    MAX(updated_at)
FROM plant_profiles
WHERE supplier IS NOT NULL
AND supplier != ''
AND NOT EXISTS (
    SELECT 1 FROM companies c 
    WHERE c.organization_id = plant_profiles.organization_id 
    AND c.company_name = plant_profiles.supplier
)
GROUP BY organization_id, supplier;

-- Update plant_profiles with company_id
UPDATE plant_profiles p
SET company_id = c.id
FROM companies c
WHERE p.organization_id = c.organization_id
AND p.supplier = c.company_name
AND p.company_id IS NULL;

-- =====================================================
-- 5. CREATE VIEWS FOR EASIER ACCESS
-- =====================================================

-- View for plant profiles with company details
CREATE OR REPLACE VIEW v_plant_profiles_with_company AS
SELECT 
    p.*,
    c.company_name,
    c.contact_person,
    c.phone AS company_phone,
    c.email AS company_email,
    c.abn
FROM plant_profiles p
LEFT JOIN companies c ON p.company_id = c.id;

-- View for subcontractor employees with company details
CREATE OR REPLACE VIEW v_subcontractor_employees_with_company AS
SELECT 
    e.*,
    s.company_name,
    c.contact_person,
    c.phone AS company_phone,
    c.email AS company_email,
    c.abn
FROM subcontractor_employees e
JOIN subcontractors s ON e.subcontractor_id = s.id
LEFT JOIN companies c ON s.company_id = c.id;

-- =====================================================
-- 6. UPDATE RLS POLICIES
-- =====================================================

-- Enable RLS on companies table
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for companies
CREATE POLICY "Users can view companies in their organization" ON companies
    FOR SELECT
    USING (organization_id IN (
        SELECT organization_id FROM user_organizations 
        WHERE user_id = auth.uid()
    ));

CREATE POLICY "Users can insert companies in their organization" ON companies
    FOR INSERT
    WITH CHECK (organization_id IN (
        SELECT organization_id FROM user_organizations 
        WHERE user_id = auth.uid()
    ));

CREATE POLICY "Users can update companies in their organization" ON companies
    FOR UPDATE
    USING (organization_id IN (
        SELECT organization_id FROM user_organizations 
        WHERE user_id = auth.uid()
    ));

CREATE POLICY "Users can delete companies in their organization" ON companies
    FOR DELETE
    USING (organization_id IN (
        SELECT organization_id FROM user_organizations 
        WHERE user_id = auth.uid()
    ));

-- =====================================================
-- 7. UPDATE TRIGGER FOR UPDATED_AT
-- =====================================================

-- Create trigger for companies table
CREATE TRIGGER update_companies_updated_at
    BEFORE UPDATE ON companies
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();