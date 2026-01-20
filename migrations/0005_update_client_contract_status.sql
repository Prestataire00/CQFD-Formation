-- Migration: Update client contract status from old to new values
-- Old values: negotiation, acquired
-- New values: prospect, negotiation, lost, client

-- Update 'acquired' to 'client'
UPDATE clients SET contract_status = 'client' WHERE contract_status = 'acquired';

-- Update empty or null values to 'prospect'
UPDATE clients SET contract_status = 'prospect' WHERE contract_status IS NULL OR contract_status = '';
