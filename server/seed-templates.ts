/**
 * Seed default document templates for automatic attachment based on trainer status
 *
 * NOTE: The old removeOldTemplates() function was removed because it deleted
 * user-created templates on every server restart. The types it removed
 * ("consignes_formateurs", "cahier_charges", "bonnes_pratiques") are valid
 * types used by admins to create templates via the UI.
 */

/**
 * Initialize default templates on server startup
 */
export async function seedDefaultTemplates(): Promise<void> {
  console.log("[seed-templates] Document templates check complete (no-op).");
}
