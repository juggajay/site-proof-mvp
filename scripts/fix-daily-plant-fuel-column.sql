-- Fix missing fuel_consumed column in daily_plant table
-- This script adds the fuel_consumed column if it doesn't exist

-- Add fuel_consumed column to daily_plant if it doesn't exist
ALTER TABLE daily_plant 
ADD COLUMN IF NOT EXISTS fuel_consumed NUMERIC(10,2);

-- Add comment for clarity
COMMENT ON COLUMN daily_plant.fuel_consumed IS 'Amount of fuel consumed by the equipment in liters';