-- Migration: Add mission_trainers table for multi-trainer support
-- This table allows assigning multiple trainers to a mission

CREATE TABLE IF NOT EXISTS mission_trainers (
  id SERIAL PRIMARY KEY,
  mission_id INTEGER NOT NULL REFERENCES missions(id) ON DELETE CASCADE,
  trainer_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(mission_id, trainer_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_mission_trainers_mission_id ON mission_trainers(mission_id);
CREATE INDEX IF NOT EXISTS idx_mission_trainers_trainer_id ON mission_trainers(trainer_id);
