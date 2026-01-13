-- Add templateId field to documents table
ALTER TABLE "documents" ADD COLUMN "template_id" integer;

-- Create document_templates table
CREATE TABLE "document_templates" (
  "id" serial PRIMARY KEY NOT NULL,
  "title" text NOT NULL,
  "type" text NOT NULL,
  "for_role" text NOT NULL,
  "url" text NOT NULL,
  "description" text,
  "is_active" boolean DEFAULT true NOT NULL,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);

-- Insert default templates for formateurs (salariés)
INSERT INTO "document_templates" ("title", "type", "for_role", "url", "description", "is_active") VALUES
('Consignes formateurs', 'consignes_formateurs', 'formateur', '', 'Consignes pour les formateurs salariés', true);

-- Insert default templates for prestataires
INSERT INTO "document_templates" ("title", "type", "for_role", "url", "description", "is_active") VALUES
('Cahier des charges', 'cahier_charges', 'prestataire', '', 'Cahier des charges pour les prestataires', true),
('Bonnes pratiques', 'bonnes_pratiques', 'prestataire', '', 'Bonnes pratiques pour les prestataires', true);
