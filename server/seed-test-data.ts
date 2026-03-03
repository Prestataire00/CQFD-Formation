import { db } from "./db";
import { users, clients, trainingPrograms, missions, participants, missionParticipants, missionSessions, missionSteps, missionClients, missionTrainers, attendanceRecords, evaluations, documents, invoices, stepTasks } from "@shared/schema";
import bcrypt from "bcrypt";
import { eq, sql, inArray } from "drizzle-orm";

const TEST_DATA_PREFIX = "[TEST]";

export async function seedTestData() {
  const results = {
    trainers: 0,
    clients: 0,
    programs: 0,
    missions: 0,
    participants: 0,
    sessions: 0,
    steps: 0,
  };

  const passwordHash = await bcrypt.hash("test1234", 12);

  const trainerData = [
    { firstName: "Sophie", lastName: "Martin", email: "sophie.martin@test.cqfd.fr", role: "formateur" as const, specialties: ["Management", "Leadership"], phone: "06 12 34 56 78" },
    { firstName: "Pierre", lastName: "Dubois", email: "pierre.dubois@test.cqfd.fr", role: "formateur" as const, specialties: ["Sécurité au travail", "Prévention des risques"], phone: "06 23 45 67 89" },
    { firstName: "Marie", lastName: "Bernard", email: "marie.bernard@test.cqfd.fr", role: "prestataire" as const, specialties: ["Communication", "Prise de parole"], phone: "06 34 56 78 90", siret: "12345678900028" },
    { firstName: "Luc", lastName: "Petit", email: "luc.petit@test.cqfd.fr", role: "prestataire" as const, specialties: ["Informatique", "Cybersécurité"], phone: "06 45 67 89 01", siret: "98765432100015" },
  ];

  const createdTrainers: any[] = [];
  for (const t of trainerData) {
    const existing = await db.select().from(users).where(eq(users.email, t.email));
    if (existing.length === 0) {
      const [created] = await db.insert(users).values({
        email: t.email,
        firstName: t.firstName,
        lastName: t.lastName,
        passwordHash,
        role: t.role,
        status: "ACTIF",
        phone: t.phone,
        specialties: t.specialties,
        siret: t.siret || null,
        dailyRate: t.role === "prestataire" ? 45000 : null,
        currentLevel: 1,
        totalXP: 0,
      }).returning();
      createdTrainers.push(created);
      results.trainers++;
    } else {
      createdTrainers.push(existing[0]);
    }
  }

  const clientData = [
    { name: `${TEST_DATA_PREFIX} Groupe Renault`, type: "privé", contractStatus: "client", email: "formation@renault.test.fr", phone: "01 23 45 67 89", city: "Boulogne-Billancourt", postalCode: "92100", contactName: "Jean Dupont", siret: "78012345600035" },
    { name: `${TEST_DATA_PREFIX} Mairie de Lyon`, type: "public", contractStatus: "client", email: "formation@lyon.test.fr", phone: "04 72 10 30 30", city: "Lyon", postalCode: "69001", contactName: "Claire Moreau", siret: "21690123400019" },
    { name: `${TEST_DATA_PREFIX} BNP Paribas`, type: "privé", contractStatus: "negotiation", email: "rh@bnp.test.fr", phone: "01 40 14 45 46", city: "Paris", postalCode: "75009", contactName: "Thomas Laurent", siret: "66210434700012" },
    { name: `${TEST_DATA_PREFIX} Hôpital Necker`, type: "public", contractStatus: "prospect", email: "formation@necker.test.fr", phone: "01 44 49 40 00", city: "Paris", postalCode: "75015", contactName: "Isabelle Roux", siret: "26750045200018" },
    { name: `${TEST_DATA_PREFIX} Startup TechVision`, type: "privé", contractStatus: "client", email: "contact@techvision.test.fr", phone: "06 99 88 77 66", city: "Bordeaux", postalCode: "33000", contactName: "Karim Ben Ali", siret: "90123456700028" },
    { name: `${TEST_DATA_PREFIX} SNCF Réseau`, type: "public", contractStatus: "client", email: "formation@sncf.test.fr", phone: "01 53 25 60 00", city: "Saint-Denis", postalCode: "93200", contactName: "Hélène Garnier", siret: "41234567800025" },
  ];

  const createdClients: any[] = [];
  for (const c of clientData) {
    const existing = await db.select().from(clients).where(eq(clients.name, c.name));
    if (existing.length === 0) {
      const [created] = await db.insert(clients).values({
        name: c.name,
        type: c.type,
        contractStatus: c.contractStatus,
        contractAmount: Math.floor(Math.random() * 5000000) + 500000,
        email: c.email,
        phone: c.phone,
        city: c.city,
        postalCode: c.postalCode,
        contactName: c.contactName,
        siret: c.siret,
        address: `${Math.floor(Math.random() * 200) + 1} rue de la Formation`,
        isActive: true,
      }).returning();
      createdClients.push(created);
      results.clients++;
    } else {
      createdClients.push(existing[0]);
    }
  }

  const programData = [
    { title: `${TEST_DATA_PREFIX} Management d'équipe - Niveau 1`, code: "MGT-001", type: "Intra", duration: "14h (2 jours)", description: "Formation aux fondamentaux du management d'équipe", objectives: "Comprendre les styles de management, Motiver son équipe, Gérer les conflits", recommendedParticipants: 12 },
    { title: `${TEST_DATA_PREFIX} Sécurité incendie - EPI`, code: "SEC-001", type: "Inter", duration: "7h (1 jour)", description: "Formation à la manipulation des extincteurs et évacuation", objectives: "Connaître les types de feu, Utiliser un extincteur, Organiser une évacuation", recommendedParticipants: 15 },
    { title: `${TEST_DATA_PREFIX} Prise de parole en public`, code: "COM-001", type: "Inter", duration: "21h (3 jours)", description: "Développer son aisance à l'oral en situation professionnelle", objectives: "Structurer son discours, Gérer le trac, Captiver son auditoire", recommendedParticipants: 10 },
    { title: `${TEST_DATA_PREFIX} Cybersécurité - Sensibilisation`, code: "IT-001", type: "Intra", duration: "7h (1 jour)", description: "Sensibilisation aux risques cyber pour les collaborateurs", objectives: "Identifier les menaces, Protéger ses données, Réagir en cas d'incident", recommendedParticipants: 20 },
    { title: `${TEST_DATA_PREFIX} Conseil RH - Transformation digitale`, code: "CON-001", type: "Conseil", duration: "35h (5 jours)", description: "Accompagnement à la transformation digitale des processus RH", objectives: "Auditer les processus existants, Proposer des solutions digitales, Accompagner le changement", recommendedParticipants: 5 },
  ];

  const createdPrograms: any[] = [];
  for (const p of programData) {
    const existing = await db.select().from(trainingPrograms).where(eq(trainingPrograms.title, p.title));
    if (existing.length === 0) {
      const [created] = await db.insert(trainingPrograms).values({
        title: p.title,
        code: p.code,
        type: p.type,
        duration: p.duration,
        description: p.description,
        objectives: p.objectives,
        recommendedParticipants: p.recommendedParticipants,
        isActive: true,
      }).returning();
      createdPrograms.push(created);
      results.programs++;
    } else {
      createdPrograms.push(existing[0]);
    }
  }

  const now = new Date();
  const addDays = (d: Date, n: number) => { const r = new Date(d); r.setDate(r.getDate() + n); return r; };

  const missionData = [
    { title: `${TEST_DATA_PREFIX} Management Renault - Mars`, status: "confirmed", typology: "Intra", locationType: "presentiel", startDate: addDays(now, 14), endDate: addDays(now, 15), totalHours: 14, trainerIdx: 0, clientIdx: 0, programIdx: 0, location: "Boulogne-Billancourt" },
    { title: `${TEST_DATA_PREFIX} Sécurité incendie - Inter Mars`, status: "confirmed", typology: "Inter", locationType: "presentiel", startDate: addDays(now, 7), endDate: addDays(now, 7), totalHours: 7, trainerIdx: 1, clientIdx: 1, programIdx: 1, location: "Lyon - Salle Bellecour" },
    { title: `${TEST_DATA_PREFIX} Prise de parole BNP`, status: "draft", typology: "Inter", locationType: "hybride", startDate: addDays(now, 30), endDate: addDays(now, 32), totalHours: 21, trainerIdx: 2, clientIdx: 2, programIdx: 2, location: "Paris 9ème", videoLink: "https://teams.microsoft.com/test" },
    { title: `${TEST_DATA_PREFIX} Cybersécurité SNCF`, status: "in_progress", typology: "Intra", locationType: "distanciel", startDate: addDays(now, -2), endDate: addDays(now, -2), totalHours: 7, trainerIdx: 3, clientIdx: 5, programIdx: 3, videoLink: "https://zoom.us/test" },
    { title: `${TEST_DATA_PREFIX} Conseil RH TechVision`, status: "confirmed", typology: "Conseil", locationType: "presentiel", startDate: addDays(now, 21), endDate: addDays(now, 25), totalHours: 35, trainerIdx: 0, clientIdx: 4, programIdx: 4, location: "Bordeaux - Locaux TechVision" },
    { title: `${TEST_DATA_PREFIX} Management Mairie Lyon`, status: "completed", typology: "Intra", locationType: "presentiel", startDate: addDays(now, -30), endDate: addDays(now, -29), totalHours: 14, trainerIdx: 0, clientIdx: 1, programIdx: 0, location: "Lyon - Mairie" },
    { title: `${TEST_DATA_PREFIX} Sécurité Necker - Avril`, status: "draft", typology: "Inter", locationType: "presentiel", startDate: addDays(now, 45), endDate: addDays(now, 45), totalHours: 7, trainerIdx: 1, clientIdx: 3, programIdx: 1, location: "Paris 15ème" },
    { title: `${TEST_DATA_PREFIX} Communication Renault`, status: "confirmed", typology: "Intra", locationType: "distanciel", startDate: addDays(now, 10), endDate: addDays(now, 12), totalHours: 21, trainerIdx: 2, clientIdx: 0, programIdx: 2, videoLink: "https://teams.microsoft.com/test2" },
  ];

  const createdMissions: any[] = [];
  for (const m of missionData) {
    const existing = await db.select().from(missions).where(eq(missions.title, m.title));
    if (existing.length === 0) {
      const trainer = createdTrainers[m.trainerIdx];
      const client = createdClients[m.clientIdx];
      const program = createdPrograms[m.programIdx];
      const [created] = await db.insert(missions).values({
        title: m.title,
        status: m.status,
        typology: m.typology,
        locationType: m.locationType,
        startDate: m.startDate,
        endDate: m.endDate,
        totalHours: m.totalHours,
        trainerId: trainer.id,
        clientId: client.id,
        programId: program.id,
        programTitle: program.title.replace(`${TEST_DATA_PREFIX} `, ""),
        location: m.location || null,
        videoLink: m.videoLink || null,
        expectedParticipants: program.recommendedParticipants,
        isOriginal: true,
      }).returning();
      createdMissions.push(created);
      results.missions++;
    } else {
      createdMissions.push(existing[0]);
    }
  }

  const participantNames = [
    { firstName: "Alice", lastName: "Leroy", company: "Groupe Renault" },
    { firstName: "Bruno", lastName: "Garcia", company: "Groupe Renault" },
    { firstName: "Camille", lastName: "Thomas", company: "Mairie de Lyon" },
    { firstName: "David", lastName: "Robert", company: "Mairie de Lyon" },
    { firstName: "Emma", lastName: "Richard", company: "BNP Paribas" },
    { firstName: "François", lastName: "Durand", company: "BNP Paribas" },
    { firstName: "Gabrielle", lastName: "Moreau", company: "Hôpital Necker" },
    { firstName: "Hugo", lastName: "Simon", company: "Hôpital Necker" },
    { firstName: "Inès", lastName: "Laurent", company: "Startup TechVision" },
    { firstName: "Jules", lastName: "Lefebvre", company: "Startup TechVision" },
    { firstName: "Léa", lastName: "Michel", company: "SNCF Réseau" },
    { firstName: "Maxime", lastName: "Fournier", company: "SNCF Réseau" },
    { firstName: "Nadia", lastName: "Girard", company: "Groupe Renault" },
    { firstName: "Olivier", lastName: "André", company: "Mairie de Lyon" },
    { firstName: "Pauline", lastName: "Mercier", company: "BNP Paribas" },
  ];

  const createdParticipants: any[] = [];
  for (const p of participantNames) {
    const email = `${p.firstName.toLowerCase()}.${p.lastName.toLowerCase()}@test.cqfd.fr`;
    const existing = await db.select().from(participants).where(eq(participants.email, email));
    if (existing.length === 0) {
      const [created] = await db.insert(participants).values({
        firstName: p.firstName,
        lastName: p.lastName,
        email,
        company: p.company,
        phone: `06 ${String(Math.floor(Math.random() * 90 + 10))} ${String(Math.floor(Math.random() * 90 + 10))} ${String(Math.floor(Math.random() * 90 + 10))} ${String(Math.floor(Math.random() * 90 + 10))}`,
        isActive: true,
      }).returning();
      createdParticipants.push(created);
      results.participants++;
    } else {
      createdParticipants.push(existing[0]);
    }
  }

  const missionParticipantAssignments = [
    { missionIdx: 0, participantIdxs: [0, 1, 12] },
    { missionIdx: 1, participantIdxs: [2, 3, 13] },
    { missionIdx: 2, participantIdxs: [4, 5, 14] },
    { missionIdx: 3, participantIdxs: [10, 11] },
    { missionIdx: 4, participantIdxs: [8, 9] },
    { missionIdx: 5, participantIdxs: [2, 3, 13] },
    { missionIdx: 6, participantIdxs: [6, 7] },
    { missionIdx: 7, participantIdxs: [0, 1, 12] },
  ];

  for (const assignment of missionParticipantAssignments) {
    const mission = createdMissions[assignment.missionIdx];
    if (!mission) continue;
    for (const pIdx of assignment.participantIdxs) {
      const participant = createdParticipants[pIdx];
      if (!participant) continue;
      const existing = await db.select().from(missionParticipants)
        .where(sql`${missionParticipants.missionId} = ${mission.id} AND ${missionParticipants.participantId} = ${participant.id}`);
      if (existing.length === 0) {
        await db.insert(missionParticipants).values({
          missionId: mission.id,
          participantId: participant.id,
          status: mission.status === "completed" ? "completed" : "registered",
        });
      }
    }
  }

  for (const mission of createdMissions) {
    const existingSessions = await db.select().from(missionSessions).where(eq(missionSessions.missionId, mission.id));
    if (existingSessions.length > 0) continue;

    const start = new Date(mission.startDate);
    const end = new Date(mission.endDate);
    const days = Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);

    for (let d = 0; d < days; d++) {
      const sessionDate = addDays(start, d);
      await db.insert(missionSessions).values({
        missionId: mission.id,
        sessionDate,
        startTime: "09:00",
        endTime: "17:00",
        location: mission.location,
      });
      results.sessions++;
    }
  }

  const stepTemplates = [
    { title: "Valider le programme avec le client", order: 1 },
    { title: "Envoyer la convocation", order: 2 },
    { title: "Envoyer le questionnaire de positionnement", order: 3 },
    { title: "Préparer les supports de formation", order: 4 },
    { title: "Réserver la salle", order: 5 },
    { title: "Envoyer les consignes au formateur", order: 6 },
    { title: "Vérifier les émargements", order: 7 },
    { title: "Envoyer le questionnaire de satisfaction", order: 8 },
    { title: "Récupérer les émargements signés", order: 9 },
    { title: "Envoyer les attestations", order: 10 },
    { title: "Facturer la mission", order: 11 },
  ];

  for (const mission of createdMissions) {
    const existingSteps = await db.select().from(missionSteps).where(eq(missionSteps.missionId, mission.id));
    if (existingSteps.length > 0) continue;

    for (const step of stepTemplates) {
      let status: string = "todo";
      if (mission.status === "completed") {
        status = "done";
      } else if (mission.status === "in_progress" && step.order <= 6) {
        status = "done";
      } else if (step.order <= 2 && mission.status === "confirmed") {
        status = Math.random() > 0.5 ? "done" : "priority";
      }

      await db.insert(missionSteps).values({
        missionId: mission.id,
        title: step.title,
        order: step.order,
        status,
        isCompleted: status === "done",
      });
      results.steps++;
    }
  }

  return results;
}

export async function clearTestData() {
  const testMissions = await db.select({ id: missions.id }).from(missions).where(sql`${missions.title} LIKE ${TEST_DATA_PREFIX + '%'}`);
  const testMissionIds = testMissions.map(m => m.id);

  if (testMissionIds.length > 0) {
    for (const mId of testMissionIds) {
      const steps = await db.select({ id: missionSteps.id }).from(missionSteps).where(eq(missionSteps.missionId, mId));
      if (steps.length > 0) {
        for (const s of steps) {
          await db.delete(stepTasks).where(eq(stepTasks.stepId, s.id));
        }
        await db.delete(missionSteps).where(eq(missionSteps.missionId, mId));
      }
      await db.delete(missionSessions).where(eq(missionSessions.missionId, mId));
      await db.delete(missionParticipants).where(eq(missionParticipants.missionId, mId));
      await db.delete(missionClients).where(eq(missionClients.missionId, mId));
      await db.delete(missionTrainers).where(eq(missionTrainers.missionId, mId));
      await db.delete(attendanceRecords).where(eq(attendanceRecords.missionId, mId));
      await db.delete(evaluations).where(eq(evaluations.missionId, mId));
      await db.delete(documents).where(eq(documents.missionId, mId));
      await db.delete(invoices).where(eq(invoices.missionId, mId));
    }
    await db.delete(missions).where(sql`${missions.title} LIKE ${TEST_DATA_PREFIX + '%'}`);
  }

  await db.delete(participants).where(sql`${participants.email} LIKE '%@test.cqfd.fr'`);
  await db.delete(trainingPrograms).where(sql`${trainingPrograms.title} LIKE ${TEST_DATA_PREFIX + '%'}`);
  await db.delete(clients).where(sql`${clients.name} LIKE ${TEST_DATA_PREFIX + '%'}`);
  await db.delete(users).where(sql`${users.email} LIKE '%@test.cqfd.fr'`);

  return { cleared: true };
}

export async function getTestDataStatus() {
  const testTrainers = await db.select({ id: users.id }).from(users).where(sql`${users.email} LIKE '%@test.cqfd.fr'`);
  const testClients = await db.select({ id: clients.id }).from(clients).where(sql`${clients.name} LIKE ${TEST_DATA_PREFIX + '%'}`);
  const testPrograms = await db.select({ id: trainingPrograms.id }).from(trainingPrograms).where(sql`${trainingPrograms.title} LIKE ${TEST_DATA_PREFIX + '%'}`);
  const testMissions = await db.select({ id: missions.id }).from(missions).where(sql`${missions.title} LIKE ${TEST_DATA_PREFIX + '%'}`);
  const testParticipants = await db.select({ id: participants.id }).from(participants).where(sql`${participants.email} LIKE '%@test.cqfd.fr'`);

  return {
    hasTestData: testTrainers.length > 0 || testClients.length > 0 || testMissions.length > 0,
    counts: {
      trainers: testTrainers.length,
      clients: testClients.length,
      programs: testPrograms.length,
      missions: testMissions.length,
      participants: testParticipants.length,
    }
  };
}
