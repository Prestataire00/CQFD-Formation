/**
 * Seed default document templates for automatic attachment based on trainer status
 *
 * - Formateur Salarié: Consignes (Consignes_formateurs.pdf)
 * - Prestataire Indépendant: Cahier des charges + Bonnes pratiques
 */

import { db } from "./db";
import { documentTemplates } from "@shared/schema";
import { eq, and } from "drizzle-orm";

interface DefaultTemplate {
  title: string;
  type: string;
  forRole: "formateur" | "prestataire";
  description: string;
  filename: string;
}

// Default templates to be created
const DEFAULT_TEMPLATES: DefaultTemplate[] = [
  {
    title: "Consignes formateurs",
    type: "consignes_formateurs",
    forRole: "formateur",
    description: "Document de consignes destiné aux formateurs salariés. Contient les règles et procédures internes.",
    filename: "Consignes_formateurs.pdf",
  },
  {
    title: "Cahier des charges prestataire",
    type: "cahier_charges",
    forRole: "prestataire",
    description: "Cahier des charges à respecter par les prestataires indépendants.",
    filename: "PRESTATAIRE_CAHIER_DES_CHARGES.pdf",
  },
  {
    title: "Bonnes pratiques prestataire",
    type: "bonnes_pratiques",
    forRole: "prestataire",
    description: "Guide des bonnes pratiques pour les prestataires indépendants.",
    filename: "prestataires_bonnes_pratiques.pdf",
  },
];

/**
 * Check if a default template already exists
 */
async function templateExists(type: string, forRole: string): Promise<boolean> {
  const existing = await db.select()
    .from(documentTemplates)
    .where(
      and(
        eq(documentTemplates.type, type),
        eq(documentTemplates.forRole, forRole),
        eq(documentTemplates.isActive, true)
      )
    )
    .limit(1);

  return existing.length > 0;
}

/**
 * Create a default template if it doesn't exist
 */
async function createDefaultTemplate(template: DefaultTemplate): Promise<void> {
  const exists = await templateExists(template.type, template.forRole);

  if (exists) {
    console.log(`[seed-templates] Template "${template.title}" already exists, skipping...`);
    return;
  }

  // URL will point to the templates folder - admin will need to upload the actual file
  const url = `/uploads/templates/${template.filename}`;

  await db.insert(documentTemplates).values({
    title: template.title,
    type: template.type,
    forRole: template.forRole,
    url: url,
    description: template.description,
    version: 1,
    clientId: null, // Global template (for all clients)
    isActive: true,
  });

  console.log(`[seed-templates] Created template "${template.title}" for role "${template.forRole}"`);
}

/**
 * Initialize default templates on server startup
 * This ensures the required templates exist for automatic document attachment
 */
export async function seedDefaultTemplates(): Promise<void> {
  console.log("[seed-templates] Checking default document templates...");

  try {
    for (const template of DEFAULT_TEMPLATES) {
      await createDefaultTemplate(template);
    }

    console.log("[seed-templates] Default templates initialization complete.");
    console.log("[seed-templates] NOTE: Ensure the following PDF files are present in /uploads/templates/:");
    console.log("[seed-templates]   - Consignes_formateurs.pdf (for Formateurs Salariés)");
    console.log("[seed-templates]   - PRESTATAIRE_CAHIER_DES_CHARGES.pdf (for Prestataires)");
    console.log("[seed-templates]   - prestataires_bonnes_pratiques.pdf (for Prestataires)");
  } catch (error) {
    console.error("[seed-templates] Error initializing default templates:", error);
  }
}
