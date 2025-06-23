-- =====================================================
-- ADD ATTACHMENTS SUPPORT TO ITP SYSTEM
-- =====================================================

-- 1. Create attachments table for inspection records
CREATE TABLE itp_inspection_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    inspection_record_id UUID NOT NULL REFERENCES itp_inspection_records(id) ON DELETE CASCADE,
    
    -- File details
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    file_size BIGINT NOT NULL, -- in bytes
    storage_path TEXT NOT NULL, -- S3/Supabase Storage path
    
    -- Metadata
    attachment_type VARCHAR(50) DEFAULT 'photo', -- 'photo', 'document', 'video'
    description TEXT,
    
    -- Location data (for photos taken in field)
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    altitude DECIMAL(8, 2),
    accuracy DECIMAL(5, 2), -- GPS accuracy in meters
    
    -- Device info
    device_info JSONB, -- {device: "iPhone 14", os: "iOS 17.2", app_version: "1.0.0"}
    
    -- Upload details
    uploaded_by UUID NOT NULL, -- REFERENCES auth.users(id)
    uploaded_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Thumbnail for images
    thumbnail_path TEXT,
    width INTEGER,
    height INTEGER,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Add attachment support to non-conformances (update existing column type)
ALTER TABLE non_conformances 
DROP COLUMN IF EXISTS attachments;

-- Create a separate table for NC attachments
CREATE TABLE nc_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    non_conformance_id UUID NOT NULL REFERENCES non_conformances(id) ON DELETE CASCADE,
    
    -- File details
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    file_size BIGINT NOT NULL,
    storage_path TEXT NOT NULL,
    
    -- Metadata
    attachment_type VARCHAR(50) DEFAULT 'photo',
    description TEXT,
    
    -- Upload details
    uploaded_by UUID NOT NULL,
    uploaded_at TIMESTAMPTZ DEFAULT NOW(),
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create storage buckets (run in Supabase dashboard)
-- Note: These are SQL comments as bucket creation is done via Supabase dashboard
-- CREATE STORAGE BUCKET 'itp-inspection-photos' WITH PUBLIC = false;
-- CREATE STORAGE BUCKET 'itp-inspection-documents' WITH PUBLIC = false;
-- CREATE STORAGE BUCKET 'nc-attachments' WITH PUBLIC = false;

-- 4. Storage policies (example - adjust based on your auth setup)
-- These would be created in Supabase dashboard for the storage buckets
/*
-- Allow authenticated users to upload
CREATE POLICY "Users can upload inspection attachments"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id IN ('itp-inspection-photos', 'itp-inspection-documents'));

-- Allow users to view their organization's attachments
CREATE POLICY "Users can view inspection attachments"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id IN ('itp-inspection-photos', 'itp-inspection-documents'));
*/

-- 5. Add attachment count columns for quick reference
ALTER TABLE itp_inspection_records
ADD COLUMN IF NOT EXISTS attachment_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS has_photos BOOLEAN DEFAULT false;

ALTER TABLE non_conformances
ADD COLUMN IF NOT EXISTS attachment_count INTEGER DEFAULT 0;

-- 6. Function to handle attachment upload metadata
CREATE OR REPLACE FUNCTION add_inspection_attachment(
    p_inspection_record_id UUID,
    p_filename VARCHAR(255),
    p_original_filename VARCHAR(255),
    p_mime_type VARCHAR(100),
    p_file_size BIGINT,
    p_storage_path TEXT,
    p_attachment_type VARCHAR(50) DEFAULT 'photo',
    p_description TEXT DEFAULT NULL,
    p_latitude DECIMAL DEFAULT NULL,
    p_longitude DECIMAL DEFAULT NULL,
    p_device_info JSONB DEFAULT NULL,
    p_uploaded_by UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_attachment_id UUID;
BEGIN
    -- Insert attachment record
    INSERT INTO itp_inspection_attachments (
        inspection_record_id,
        filename,
        original_filename,
        mime_type,
        file_size,
        storage_path,
        attachment_type,
        description,
        latitude,
        longitude,
        device_info,
        uploaded_by
    ) VALUES (
        p_inspection_record_id,
        p_filename,
        p_original_filename,
        p_mime_type,
        p_file_size,
        p_storage_path,
        p_attachment_type,
        p_description,
        p_latitude,
        p_longitude,
        p_device_info,
        COALESCE(p_uploaded_by, auth.uid())
    ) RETURNING id INTO v_attachment_id;
    
    -- Update attachment count and photo flag
    UPDATE itp_inspection_records
    SET attachment_count = (
            SELECT COUNT(*) FROM itp_inspection_attachments 
            WHERE inspection_record_id = p_inspection_record_id
        ),
        has_photos = EXISTS (
            SELECT 1 FROM itp_inspection_attachments 
            WHERE inspection_record_id = p_inspection_record_id 
            AND attachment_type = 'photo'
        ),
        updated_at = NOW()
    WHERE id = p_inspection_record_id;
    
    RETURN v_attachment_id;
END;
$$ LANGUAGE plpgsql;

-- 7. Function to get attachment URLs with signed URLs
CREATE OR REPLACE FUNCTION get_inspection_attachments(p_inspection_record_id UUID)
RETURNS TABLE (
    id UUID,
    filename VARCHAR(255),
    original_filename VARCHAR(255),
    mime_type VARCHAR(100),
    file_size BIGINT,
    attachment_type VARCHAR(50),
    description TEXT,
    latitude DECIMAL,
    longitude DECIMAL,
    uploaded_by UUID,
    uploaded_at TIMESTAMPTZ,
    url TEXT,
    thumbnail_url TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.id,
        a.filename,
        a.original_filename,
        a.mime_type,
        a.file_size,
        a.attachment_type,
        a.description,
        a.latitude,
        a.longitude,
        a.uploaded_by,
        a.uploaded_at,
        -- Generate signed URL (adjust based on your storage setup)
        'https://your-project.supabase.co/storage/v1/object/public/itp-inspection-' || 
        CASE 
            WHEN a.attachment_type = 'photo' THEN 'photos'
            ELSE 'documents'
        END || '/' || a.storage_path as url,
        -- Thumbnail URL if available
        CASE 
            WHEN a.thumbnail_path IS NOT NULL THEN
                'https://your-project.supabase.co/storage/v1/object/public/itp-inspection-photos/' || a.thumbnail_path
            ELSE NULL
        END as thumbnail_url
    FROM itp_inspection_attachments a
    WHERE a.inspection_record_id = p_inspection_record_id
    ORDER BY a.uploaded_at DESC;
END;
$$ LANGUAGE plpgsql;

-- 8. Triggers to update attachment counts
CREATE OR REPLACE FUNCTION update_inspection_attachment_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' OR TG_OP = 'DELETE' THEN
        UPDATE itp_inspection_records
        SET attachment_count = (
                SELECT COUNT(*) FROM itp_inspection_attachments 
                WHERE inspection_record_id = COALESCE(NEW.inspection_record_id, OLD.inspection_record_id)
            ),
            has_photos = EXISTS (
                SELECT 1 FROM itp_inspection_attachments 
                WHERE inspection_record_id = COALESCE(NEW.inspection_record_id, OLD.inspection_record_id)
                AND attachment_type = 'photo'
            ),
            updated_at = NOW()
        WHERE id = COALESCE(NEW.inspection_record_id, OLD.inspection_record_id);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_inspection_attachment_count
AFTER INSERT OR DELETE ON itp_inspection_attachments
FOR EACH ROW
EXECUTE FUNCTION update_inspection_attachment_count();

-- Similar trigger for NC attachments
CREATE OR REPLACE FUNCTION update_nc_attachment_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' OR TG_OP = 'DELETE' THEN
        UPDATE non_conformances
        SET attachment_count = (
                SELECT COUNT(*) FROM nc_attachments 
                WHERE non_conformance_id = COALESCE(NEW.non_conformance_id, OLD.non_conformance_id)
            ),
            updated_at = NOW()
        WHERE id = COALESCE(NEW.non_conformance_id, OLD.non_conformance_id);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_nc_attachment_count
AFTER INSERT OR DELETE ON nc_attachments
FOR EACH ROW
EXECUTE FUNCTION update_nc_attachment_count();

-- Create indexes
CREATE INDEX idx_itp_inspection_attachments_record ON itp_inspection_attachments(inspection_record_id);
CREATE INDEX idx_itp_inspection_attachments_type ON itp_inspection_attachments(attachment_type);
CREATE INDEX idx_nc_attachments_nc ON nc_attachments(non_conformance_id);

-- Enable RLS
ALTER TABLE itp_inspection_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE nc_attachments ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view inspection attachments"
ON itp_inspection_attachments FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "Users can upload inspection attachments"
ON itp_inspection_attachments FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can view NC attachments"
ON nc_attachments FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "Users can upload NC attachments"
ON nc_attachments FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- Comments
COMMENT ON TABLE itp_inspection_attachments IS 'Photos and documents attached to inspection records';
COMMENT ON TABLE nc_attachments IS 'Attachments for non-conformance records';
COMMENT ON FUNCTION add_inspection_attachment IS 'Adds an attachment to an inspection record with metadata';