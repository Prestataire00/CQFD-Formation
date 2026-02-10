-- Add missing columns to missions table
ALTER TABLE "missions" ADD COLUMN IF NOT EXISTS "video_link" text;
ALTER TABLE "missions" ADD COLUMN IF NOT EXISTS "expected_participants" integer;
ALTER TABLE "missions" ADD COLUMN IF NOT EXISTS "participants_list" text;
ALTER TABLE "missions" ADD COLUMN IF NOT EXISTS "has_disability" boolean DEFAULT false;
ALTER TABLE "missions" ADD COLUMN IF NOT EXISTS "disability_details" text;
ALTER TABLE "missions" ADD COLUMN IF NOT EXISTS "rate_base" text;
ALTER TABLE "missions" ADD COLUMN IF NOT EXISTS "financial_terms" text;
