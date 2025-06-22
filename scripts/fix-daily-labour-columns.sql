-- Fix missing task_description column in daily_labour table
-- This script adds the task_description column if it doesn't exist

-- Add task_description column to daily_labour if it doesn't exist
ALTER TABLE daily_labour 
ADD COLUMN IF NOT EXISTS task_description TEXT;

-- Also ensure daily_plant has task_description column
ALTER TABLE daily_plant
ADD COLUMN IF NOT EXISTS task_description TEXT;

-- Update the view to ensure it references the correct column
-- The view should already be correct, but let's make sure
COMMENT ON COLUMN daily_labour.task_description IS 'Description of tasks performed during the work period';
COMMENT ON COLUMN daily_plant.task_description IS 'Description of tasks performed with the equipment';