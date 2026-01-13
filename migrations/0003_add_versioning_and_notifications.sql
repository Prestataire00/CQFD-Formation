-- Add version and clientId fields to document_templates table
ALTER TABLE "document_templates" ADD COLUMN "version" integer DEFAULT 1 NOT NULL;
ALTER TABLE "document_templates" ADD COLUMN "client_id" integer;

-- Create document_template_versions table
CREATE TABLE "document_template_versions" (
  "id" serial PRIMARY KEY NOT NULL,
  "template_id" integer NOT NULL,
  "version" integer NOT NULL,
  "url" text NOT NULL,
  "uploaded_by" varchar,
  "change_notes" text,
  "created_at" timestamp DEFAULT now(),
  FOREIGN KEY ("template_id") REFERENCES "document_templates"("id") ON DELETE CASCADE,
  FOREIGN KEY ("uploaded_by") REFERENCES "users"("id")
);

-- Create template_notifications table
CREATE TABLE "template_notifications" (
  "id" serial PRIMARY KEY NOT NULL,
  "template_id" integer NOT NULL,
  "user_id" varchar NOT NULL,
  "is_read" boolean DEFAULT false NOT NULL,
  "created_at" timestamp DEFAULT now(),
  FOREIGN KEY ("template_id") REFERENCES "document_templates"("id") ON DELETE CASCADE,
  FOREIGN KEY ("user_id") REFERENCES "users"("id")
);

-- Add foreign key constraint for client_id in document_templates
ALTER TABLE "document_templates" ADD CONSTRAINT "document_templates_client_id_fkey"
  FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE CASCADE;
