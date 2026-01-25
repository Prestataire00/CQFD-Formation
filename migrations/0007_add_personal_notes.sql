-- Add personal notes table for users
CREATE TABLE IF NOT EXISTS "personal_notes" (
  "id" serial PRIMARY KEY,
  "user_id" varchar NOT NULL REFERENCES "users"("id"),
  "title" text NOT NULL,
  "content" text,
  "color" text DEFAULT 'default',
  "is_pinned" boolean DEFAULT false NOT NULL,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);

-- Index for faster lookups by user
CREATE INDEX IF NOT EXISTS "personal_notes_user_id_idx" ON "personal_notes"("user_id");
