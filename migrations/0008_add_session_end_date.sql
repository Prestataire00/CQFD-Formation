-- Add end_date column to mission_sessions table to support date ranges
ALTER TABLE mission_sessions ADD COLUMN IF NOT EXISTS end_date TIMESTAMP;
