/**
 * Seed default document templates for automatic attachment based on trainer status
 */

import { db } from "./db";
import { documentTemplates } from "@shared/schema";
import { eq, or } from "drizzle-orm";

// Templates to remove (broken downloads)
const TEMPLATES_TO_REMOVE = [
  "consignes_formateurs",
  "cahier_charges",
  "bonnes_pratiques",
];

/**
 * Remove broken templates from the database
 */
async function removeOldTemplates(): Promise<void> {
  for (const type of TEMPLATES_TO_REMOVE) {
    const deleted = await db.delete(documentTemplates)
      .where(eq(documentTemplates.type, type))
      .returning();

    if (deleted.length > 0) {
      console.log(`[seed-templates] Removed template of type "${type}"`);
    }
  }
}

/**
 * Initialize default templates on server startup
 */
export async function seedDefaultTemplates(): Promise<void> {
  console.log("[seed-templates] Checking document templates...");

  try {
    // Remove old broken templates
    await removeOldTemplates();

    console.log("[seed-templates] Templates cleanup complete.");
  } catch (error) {
    console.error("[seed-templates] Error managing templates:", error);
  }
}
