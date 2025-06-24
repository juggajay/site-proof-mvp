-- =====================================================
-- PERFORMANCE OPTIMIZATION - MISSING INDEXES
-- =====================================================
-- This migration adds critical missing indexes identified during performance audit
-- These indexes will significantly improve query performance, especially for:
-- 1. ITP assignment lookups
-- 2. Inspection record queries
-- 3. Foreign key relationships
-- 4. Status filtering

-- 1. Composite indexes for frequently queried combinations
-- These are critical for the ITP assignment flow
CREATE INDEX IF NOT EXISTS idx_lot_itp_assignments_composite 
    ON lot_itp_assignments(lot_id, template_id);

CREATE INDEX IF NOT EXISTS idx_itp_inspection_records_composite 
    ON itp_inspection_records(assignment_id, template_item_id);

-- 2. Missing foreign key indexes (PostgreSQL doesn't auto-create these)
-- These will speed up JOIN operations significantly
CREATE INDEX IF NOT EXISTS idx_lots_project_id_fk 
    ON lots(project_id);

CREATE INDEX IF NOT EXISTS idx_lots_assigned_inspector_fk 
    ON lots(assigned_inspector_id);

CREATE INDEX IF NOT EXISTS idx_conformance_records_lot_id_fk 
    ON conformance_records(lot_id);

CREATE INDEX IF NOT EXISTS idx_conformance_records_itp_item_id_fk 
    ON conformance_records(itp_item_id);

CREATE INDEX IF NOT EXISTS idx_daily_labour_lot_id_fk 
    ON daily_labour(lot_id);

CREATE INDEX IF NOT EXISTS idx_daily_plant_lot_id_fk 
    ON daily_plant(lot_id);

CREATE INDEX IF NOT EXISTS idx_daily_materials_lot_id_fk 
    ON daily_materials(lot_id);

CREATE INDEX IF NOT EXISTS idx_daily_events_lot_id_fk 
    ON daily_events(lot_id);

-- 3. Status and date indexes for filtering
-- These help with dashboard queries and status filtering
CREATE INDEX IF NOT EXISTS idx_lots_status_date 
    ON lots(status, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_lot_itp_assignments_status_date 
    ON lot_itp_assignments(status, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_itp_inspection_records_status_inspected 
    ON itp_inspection_records(status, inspected_at DESC);

-- 4. Partial indexes for common queries
-- These are especially efficient for filtering active records
CREATE INDEX IF NOT EXISTS idx_lot_itp_assignments_active 
    ON lot_itp_assignments(lot_id, template_id) 
    WHERE status != 'completed';

CREATE INDEX IF NOT EXISTS idx_itp_templates_active_org 
    ON itp_templates(organization_id, category) 
    WHERE is_active = true;

-- 5. Covering indexes for common query patterns
-- Include all columns needed to avoid table lookups
CREATE INDEX IF NOT EXISTS idx_lots_overview 
    ON lots(project_id, status, lot_number, updated_at DESC)
    INCLUDE (description, location_description);

-- 6. BRIN indexes for large tables with sequential data
-- More efficient than B-tree for timestamp columns
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp_brin 
    ON audit_logs USING BRIN (changed_at);

-- 7. Text search indexes if needed
-- Uncomment if you implement search functionality
-- CREATE INDEX IF NOT EXISTS idx_lots_search 
--     ON lots USING GIN(to_tsvector('english', lot_number || ' ' || COALESCE(description, '')));

-- Analyze tables after creating indexes to update statistics
ANALYZE lot_itp_assignments;
ANALYZE itp_inspection_records;
ANALYZE lots;
ANALYZE conformance_records;
ANALYZE itp_templates;

-- Add comments for documentation
COMMENT ON INDEX idx_lot_itp_assignments_composite IS 'Composite index for ITP assignment lookups - critical for performance';
COMMENT ON INDEX idx_itp_inspection_records_composite IS 'Composite index for inspection record queries - prevents N+1 queries';
COMMENT ON INDEX idx_lots_status_date IS 'Index for dashboard queries filtering by status and sorting by date';