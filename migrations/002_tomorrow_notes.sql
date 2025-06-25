-- Migration: Add Tomorrow's Notes Feature
-- Description: Allows site foremen to create notes that appear on future dates in the daily diary

-- Create tomorrow_notes table
CREATE TABLE IF NOT EXISTS tomorrow_notes (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
    note_content TEXT NOT NULL,
    target_date DATE NOT NULL,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_displayed BOOLEAN DEFAULT FALSE,
    
    -- Index for efficient querying by project and date
    INDEX idx_tomorrow_notes_project_date (project_id, target_date),
    INDEX idx_tomorrow_notes_target_date (target_date)
);

-- Add trigger for updated_at
CREATE TRIGGER tomorrow_notes_updated_at BEFORE UPDATE ON tomorrow_notes 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add comment
COMMENT ON TABLE tomorrow_notes IS 'Stores notes that appear in the daily diary on future dates';
COMMENT ON COLUMN tomorrow_notes.target_date IS 'The date when this note should appear in the daily diary';
COMMENT ON COLUMN tomorrow_notes.is_displayed IS 'Track if the note has been displayed to prevent duplicates';