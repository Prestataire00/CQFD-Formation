import { storage } from "../server/storage";

async function initializeDocuments() {
  try {
    console.log("Initializing documents for existing missions...");

    const missions = await storage.getMissions();
    let initialized = 0;

    for (const mission of missions) {
      const existingDocs = await storage.getDocumentsByMission(mission.id);
      if (existingDocs.length === 0) {
        console.log(`Initializing documents for mission ${mission.id}: ${mission.title}`);
        await storage.initializeMissionDocuments(mission.id);
        initialized++;
      }
    }

    console.log(`✓ Initialized documents for ${initialized} missions`);
    process.exit(0);
  } catch (error) {
    console.error("Error initializing documents:", error);
    process.exit(1);
  }
}

initializeDocuments();
