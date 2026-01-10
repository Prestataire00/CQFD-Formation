import type { Express } from "express";
import { type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { setupAuth, isAuthenticated } from "./replit_integrations/auth";
import { requirePermission, requireRole } from "./middleware/rbac";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  await setupAuth(app);

  // ==================== STATS ====================
  app.get(api.stats.get.path, isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const userDetails = await storage.getUser(user.claims.sub);
      const stats = await storage.getStats(userDetails?.id, userDetails?.role);
      res.json(stats);
    } catch (error) {
      console.error('Stats error:', error);
      res.status(500).json({ message: 'Erreur serveur' });
    }
  });

  // ==================== USERS ====================
  app.get(api.users.list.path, isAuthenticated, requirePermission('users:read'), async (req, res) => {
    const users = await storage.getUsers();
    res.json(users);
  });

  app.get(api.users.trainers.path, isAuthenticated, async (req, res) => {
    const trainers = await storage.getTrainers();
    res.json(trainers);
  });

  app.get(api.users.get.path, isAuthenticated, async (req, res) => {
    const user = await storage.getUser(req.params.id);
    if (!user) {
      res.status(404).json({ message: "Utilisateur non trouvé" });
      return;
    }
    res.json(user);
  });

  app.put(api.users.update.path, isAuthenticated, requirePermission('users:update'), async (req, res) => {
    try {
      const input = api.users.update.input.parse(req.body);
      const user = await storage.updateUser(req.params.id, input);
      if (!user) {
        res.status(404).json({ message: "Utilisateur non trouvé" });
        return;
      }
      res.json(user);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
        return;
      }
      throw err;
    }
  });

  // ==================== CLIENTS ====================
  app.get(api.clients.list.path, isAuthenticated, requirePermission('clients:read'), async (req, res) => {
    const clients = await storage.getClients();
    res.json(clients);
  });

  app.get(api.clients.get.path, isAuthenticated, requirePermission('clients:read'), async (req, res) => {
    const client = await storage.getClient(Number(req.params.id));
    if (!client) {
      res.status(404).json({ message: "Client non trouvé" });
      return;
    }
    res.json(client);
  });

  app.post(api.clients.create.path, isAuthenticated, requirePermission('clients:create'), async (req, res) => {
    try {
      const input = api.clients.create.input.parse(req.body);
      const client = await storage.createClient(input);
      res.status(201).json(client);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
        return;
      }
      throw err;
    }
  });

  app.put(api.clients.update.path, isAuthenticated, requirePermission('clients:update'), async (req, res) => {
    try {
      const input = api.clients.update.input.parse(req.body);
      const client = await storage.updateClient(Number(req.params.id), input);
      if (!client) {
        res.status(404).json({ message: "Client non trouvé" });
        return;
      }
      res.json(client);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
        return;
      }
      throw err;
    }
  });

  // ==================== TRAINING PROGRAMS ====================
  app.get(api.programs.list.path, isAuthenticated, async (req, res) => {
    const programs = await storage.getTrainingPrograms();
    res.json(programs);
  });

  app.get(api.programs.get.path, isAuthenticated, async (req, res) => {
    const program = await storage.getTrainingProgram(Number(req.params.id));
    if (!program) {
      res.status(404).json({ message: "Programme non trouvé" });
      return;
    }
    res.json(program);
  });

  app.post(api.programs.create.path, isAuthenticated, requirePermission('programs:create'), async (req, res) => {
    try {
      const input = api.programs.create.input.parse(req.body);
      const program = await storage.createTrainingProgram(input);
      res.status(201).json(program);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
        return;
      }
      throw err;
    }
  });

  app.put(api.programs.update.path, isAuthenticated, requirePermission('programs:update'), async (req, res) => {
    try {
      const input = api.programs.update.input.parse(req.body);
      const program = await storage.updateTrainingProgram(Number(req.params.id), input);
      if (!program) {
        res.status(404).json({ message: "Programme non trouvé" });
        return;
      }
      res.json(program);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
        return;
      }
      throw err;
    }
  });

  // ==================== MISSIONS ====================
  app.get(api.missions.list.path, isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const userDetails = await storage.getUser(user.claims.sub);

      let missions;
      if (userDetails?.role === 'admin') {
        missions = await storage.getMissions();
      } else {
        missions = await storage.getMissionsByTrainer(userDetails?.id || '');
      }
      res.json(missions);
    } catch (error) {
      console.error('Missions list error:', error);
      res.status(500).json({ message: 'Erreur serveur' });
    }
  });

  app.get(api.missions.get.path, isAuthenticated, async (req, res) => {
    const mission = await storage.getMission(Number(req.params.id));
    if (!mission) {
      res.status(404).json({ message: "Mission non trouvée" });
      return;
    }
    res.json(mission);
  });

  app.post(api.missions.create.path, isAuthenticated, requirePermission('missions:create'), async (req, res) => {
    try {
      const input = api.missions.create.input.parse(req.body);
      const mission = await storage.createMission(input);
      res.status(201).json(mission);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
        return;
      }
      throw err;
    }
  });

  app.put(api.missions.update.path, isAuthenticated, requirePermission('missions:update'), async (req, res) => {
    try {
      const input = api.missions.update.input.parse(req.body);
      const mission = await storage.updateMission(Number(req.params.id), input);
      if (!mission) {
        res.status(404).json({ message: "Mission non trouvée" });
        return;
      }
      res.json(mission);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
        return;
      }
      throw err;
    }
  });

  app.patch(api.missions.updateStatus.path, isAuthenticated, async (req, res) => {
    try {
      const input = api.missions.updateStatus.input.parse(req.body);
      const mission = await storage.updateMissionStatus(Number(req.params.id), input.status);
      if (!mission) {
        res.status(404).json({ message: "Mission non trouvée" });
        return;
      }
      res.json(mission);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
        return;
      }
      throw err;
    }
  });

  // Mission Sessions
  app.get(api.missions.sessions.list.path, isAuthenticated, async (req, res) => {
    const sessions = await storage.getMissionSessions(Number(req.params.id));
    res.json(sessions);
  });

  app.post(api.missions.sessions.create.path, isAuthenticated, async (req, res) => {
    try {
      const input = api.missions.sessions.create.input.parse(req.body);
      const session = await storage.createMissionSession({
        ...input,
        missionId: Number(req.params.id),
      });
      res.status(201).json(session);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
        return;
      }
      throw err;
    }
  });

  // Mission Participants
  app.get(api.missions.participants.list.path, isAuthenticated, async (req, res) => {
    const participants = await storage.getMissionParticipants(Number(req.params.id));
    res.json(participants);
  });

  app.post(api.missions.participants.add.path, isAuthenticated, async (req, res) => {
    try {
      const input = api.missions.participants.add.input.parse(req.body);
      const result = await storage.addParticipantToMission({
        missionId: Number(req.params.id),
        participantId: input.participantId,
      });
      res.status(201).json(result);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
        return;
      }
      throw err;
    }
  });

  app.delete(api.missions.participants.remove.path, isAuthenticated, async (req, res) => {
    await storage.removeParticipantFromMission(
      Number(req.params.missionId),
      Number(req.params.participantId)
    );
    res.json({ success: true });
  });

  // Mission Attendance
  app.get(api.missions.attendance.list.path, isAuthenticated, async (req, res) => {
    const records = await storage.getAttendanceRecords(Number(req.params.id));
    res.json(records);
  });

  app.post(api.missions.attendance.create.path, isAuthenticated, async (req, res) => {
    try {
      const input = api.missions.attendance.create.input.parse(req.body);
      const record = await storage.createAttendanceRecord({
        ...input,
        missionId: Number(req.params.id),
      });
      res.status(201).json(record);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
        return;
      }
      throw err;
    }
  });

  // Mission Documents
  app.get(api.missions.documents.list.path, isAuthenticated, async (req, res) => {
    const docs = await storage.getDocumentsByMission(Number(req.params.id));
    res.json(docs);
  });

  // Mission Evaluations
  app.get(api.missions.evaluations.list.path, isAuthenticated, async (req, res) => {
    const evals = await storage.getEvaluationsByMission(Number(req.params.id));
    res.json(evals);
  });

  // Mission Messages
  app.get(api.messages.byMission.path, isAuthenticated, async (req, res) => {
    const messages = await storage.getMessagesByMission(Number(req.params.id));
    res.json(messages);
  });

  // ==================== PARTICIPANTS ====================
  app.get(api.participants.list.path, isAuthenticated, async (req, res) => {
    const participants = await storage.getParticipants();
    res.json(participants);
  });

  app.get(api.participants.get.path, isAuthenticated, async (req, res) => {
    const participant = await storage.getParticipant(Number(req.params.id));
    if (!participant) {
      res.status(404).json({ message: "Participant non trouvé" });
      return;
    }
    res.json(participant);
  });

  app.post(api.participants.create.path, isAuthenticated, requirePermission('participants:create'), async (req, res) => {
    try {
      const input = api.participants.create.input.parse(req.body);
      const participant = await storage.createParticipant(input);
      res.status(201).json(participant);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
        return;
      }
      throw err;
    }
  });

  app.put(api.participants.update.path, isAuthenticated, async (req, res) => {
    try {
      const input = api.participants.update.input.parse(req.body);
      const participant = await storage.updateParticipant(Number(req.params.id), input);
      if (!participant) {
        res.status(404).json({ message: "Participant non trouvé" });
        return;
      }
      res.json(participant);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
        return;
      }
      throw err;
    }
  });

  // ==================== ATTENDANCE ====================
  app.put(api.attendance.update.path, isAuthenticated, async (req, res) => {
    try {
      const input = api.attendance.update.input.parse(req.body);
      const record = await storage.updateAttendanceRecord(Number(req.params.id), input);
      if (!record) {
        res.status(404).json({ message: "Enregistrement non trouvé" });
        return;
      }
      res.json(record);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
        return;
      }
      throw err;
    }
  });

  // ==================== EVALUATIONS ====================
  app.post(api.evaluations.create.path, isAuthenticated, async (req, res) => {
    try {
      const input = api.evaluations.create.input.parse(req.body);
      const evaluation = await storage.createEvaluation(input);
      res.status(201).json(evaluation);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
        return;
      }
      throw err;
    }
  });

  app.get(api.evaluations.get.path, isAuthenticated, async (req, res) => {
    const evaluation = await storage.getEvaluation(Number(req.params.id));
    if (!evaluation) {
      res.status(404).json({ message: "Évaluation non trouvée" });
      return;
    }
    res.json(evaluation);
  });

  // ==================== INVOICES ====================
  app.get(api.invoices.list.path, isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const userDetails = await storage.getUser(user.claims.sub);

      let invoices;
      if (userDetails?.role === 'admin') {
        invoices = await storage.getInvoices();
      } else {
        invoices = await storage.getInvoicesByUser(userDetails?.id || '');
      }
      res.json(invoices);
    } catch (error) {
      console.error('Invoices list error:', error);
      res.status(500).json({ message: 'Erreur serveur' });
    }
  });

  app.get(api.invoices.get.path, isAuthenticated, async (req, res) => {
    const invoice = await storage.getInvoice(Number(req.params.id));
    if (!invoice) {
      res.status(404).json({ message: "Facture non trouvée" });
      return;
    }
    res.json(invoice);
  });

  app.post(api.invoices.create.path, isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const userDetails = await storage.getUser(user.claims.sub);

      const input = api.invoices.create.input.parse(req.body);
      const invoice = await storage.createInvoice({
        ...input,
        userId: userDetails?.id,
        status: 'submitted',
      });
      res.status(201).json(invoice);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
        return;
      }
      throw err;
    }
  });

  app.put(api.invoices.update.path, isAuthenticated, async (req, res) => {
    try {
      const input = api.invoices.update.input.parse(req.body);
      const invoice = await storage.updateInvoice(Number(req.params.id), input);
      if (!invoice) {
        res.status(404).json({ message: "Facture non trouvée" });
        return;
      }
      res.json(invoice);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
        return;
      }
      throw err;
    }
  });

  app.patch(api.invoices.approve.path, isAuthenticated, requirePermission('invoices:approve'), async (req, res) => {
    const invoice = await storage.updateInvoiceStatus(Number(req.params.id), 'approved');
    if (!invoice) {
      res.status(404).json({ message: "Facture non trouvée" });
      return;
    }
    res.json(invoice);
  });

  app.patch(api.invoices.reject.path, isAuthenticated, requirePermission('invoices:approve'), async (req, res) => {
    try {
      const input = api.invoices.reject.input.parse(req.body);
      const invoice = await storage.updateInvoiceStatus(Number(req.params.id), 'rejected', input.reason);
      if (!invoice) {
        res.status(404).json({ message: "Facture non trouvée" });
        return;
      }
      res.json(invoice);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
        return;
      }
      throw err;
    }
  });

  app.patch(api.invoices.markPaid.path, isAuthenticated, requirePermission('invoices:approve'), async (req, res) => {
    const invoice = await storage.updateInvoiceStatus(Number(req.params.id), 'paid');
    if (!invoice) {
      res.status(404).json({ message: "Facture non trouvée" });
      return;
    }
    res.json(invoice);
  });

  // ==================== DOCUMENTS ====================
  app.get(api.documents.list.path, isAuthenticated, async (req, res) => {
    const documents = await storage.getDocuments();
    res.json(documents);
  });

  app.get(api.documents.get.path, isAuthenticated, async (req, res) => {
    const doc = await storage.getDocument(Number(req.params.id));
    if (!doc) {
      res.status(404).json({ message: "Document non trouvé" });
      return;
    }
    res.json(doc);
  });

  app.post(api.documents.create.path, isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const userDetails = await storage.getUser(user.claims.sub);

      const input = api.documents.create.input.parse(req.body);
      const doc = await storage.createDocument({
        ...input,
        userId: userDetails?.id,
      });
      res.status(201).json(doc);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
        return;
      }
      throw err;
    }
  });

  app.delete(api.documents.delete.path, isAuthenticated, requirePermission('documents:delete'), async (req, res) => {
    await storage.deleteDocument(Number(req.params.id));
    res.json({ success: true });
  });

  // ==================== MESSAGES ====================
  app.get(api.messages.list.path, isAuthenticated, async (req, res) => {
    const messages = await storage.getMessages();
    res.json(messages);
  });

  app.post(api.messages.create.path, isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const userDetails = await storage.getUser(user.claims.sub);

      const input = api.messages.create.input.parse(req.body);
      const message = await storage.createMessage({
        ...input,
        senderId: userDetails?.id,
      });
      res.status(201).json(message);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
        return;
      }
      throw err;
    }
  });

  // ==================== LEGACY ENDPOINTS ====================
  app.get(api.projects.list.path, async (req, res) => {
    const projects = await storage.getProjects();
    res.json(projects);
  });

  app.post(api.projects.create.path, async (req, res) => {
    try {
      const input = api.projects.create.input.parse(req.body);
      const project = await storage.createProject(input);
      res.status(201).json(project);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
        return;
      }
      throw err;
    }
  });

  app.get(api.projects.get.path, async (req, res) => {
    const project = await storage.getProject(Number(req.params.id));
    if (!project) {
      res.status(404).json({ message: "Project not found" });
      return;
    }
    res.json(project);
  });

  app.get(api.tasks.list.path, async (req, res) => {
    const tasks = await storage.getTasks();
    res.json(tasks);
  });

  app.post(api.tasks.create.path, async (req, res) => {
    try {
      const input = api.tasks.create.input.parse(req.body);
      const task = await storage.createTask(input);
      res.status(201).json(task);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
        return;
      }
      throw err;
    }
  });

  // Seed Data
  await seedDatabase();

  return httpServer;
}

async function seedDatabase() {
  // Check if we already have data
  const existingMissions = await storage.getMissions();
  if (existingMissions.length > 0) {
    return; // Already seeded
  }

  // Create admin user
  const admin = await storage.upsertUser({
    id: 'admin-001',
    email: 'admin@cqfd-formation.fr',
    firstName: 'Marie',
    lastName: 'Dupont',
    role: 'admin',
  });

  // Create formateur
  const formateur = await storage.upsertUser({
    id: 'formateur-001',
    email: 'formateur@cqfd-formation.fr',
    firstName: 'Pierre',
    lastName: 'Martin',
    role: 'formateur',
    phone: '06 12 34 56 78',
    specialties: ['Management', 'Communication'],
  });

  // Create prestataire
  const prestataire = await storage.upsertUser({
    id: 'prestataire-001',
    email: 'prestataire@example.com',
    firstName: 'Jean',
    lastName: 'Bernard',
    role: 'prestataire',
    phone: '06 98 76 54 32',
    siret: '12345678901234',
    dailyRate: 50000, // 500€
    specialties: ['Sécurité', 'Gestion de projet'],
  });

  // Create clients
  const client1 = await storage.createClient({
    name: 'TechCorp SAS',
    type: 'entreprise',
    siret: '98765432109876',
    address: '15 rue de la Tech',
    city: 'Paris',
    postalCode: '75001',
    contactName: 'Sophie Leroy',
    contactEmail: 'sophie.leroy@techcorp.fr',
    contactPhone: '01 23 45 67 89',
  });

  const client2 = await storage.createClient({
    name: 'OPCO Commerce',
    type: 'opco',
    address: '50 avenue des OPCO',
    city: 'Lyon',
    postalCode: '69001',
    contactName: 'Marc Durand',
    contactEmail: 'marc.durand@opco-commerce.fr',
  });

  // Create training programs
  const program1 = await storage.createTrainingProgram({
    code: 'MGMT-001',
    title: 'Management d\'équipe',
    description: 'Formation aux fondamentaux du management',
    objectives: ['Développer son leadership', 'Gérer les conflits', 'Motiver son équipe'],
    duration: 14, // 2 jours
    modality: 'presentiel',
    maxParticipants: 12,
    pricePerParticipant: 75000, // 750€
    category: 'Management',
  });

  const program2 = await storage.createTrainingProgram({
    code: 'SEC-001',
    title: 'Sécurité informatique',
    description: 'Sensibilisation à la cybersécurité',
    objectives: ['Identifier les menaces', 'Appliquer les bonnes pratiques', 'Réagir en cas d\'incident'],
    duration: 7, // 1 jour
    modality: 'hybride',
    maxParticipants: 15,
    pricePerParticipant: 45000, // 450€
    category: 'Informatique',
  });

  // Create missions
  const mission1 = await storage.createMission({
    reference: 'MIS-2024-001',
    title: 'Formation Management TechCorp',
    status: 'confirmed',
    programId: program1.id,
    clientId: client1.id,
    trainerId: formateur.id,
    startDate: new Date('2024-02-15'),
    endDate: new Date('2024-02-16'),
    totalHours: 14,
    locationType: 'presentiel',
    locationAddress: '15 rue de la Tech',
    locationCity: 'Paris',
    totalAmount: 900000, // 9000€
    trainerFee: 100000, // 1000€
  });

  const mission2 = await storage.createMission({
    reference: 'MIS-2024-002',
    title: 'Cybersécurité OPCO Commerce',
    status: 'draft',
    programId: program2.id,
    clientId: client2.id,
    trainerId: prestataire.id,
    startDate: new Date('2024-03-10'),
    endDate: new Date('2024-03-10'),
    totalHours: 7,
    locationType: 'distanciel',
    visioLink: 'https://meet.google.com/abc-defg-hij',
    totalAmount: 675000, // 6750€
    trainerFee: 50000, // 500€
  });

  // Create sessions for mission 1
  await storage.createMissionSession({
    missionId: mission1.id,
    sessionDate: new Date('2024-02-15'),
    startTime: '09:00',
    endTime: '17:00',
  });

  await storage.createMissionSession({
    missionId: mission1.id,
    sessionDate: new Date('2024-02-16'),
    startTime: '09:00',
    endTime: '17:00',
  });

  // Create participants
  const participant1 = await storage.createParticipant({
    firstName: 'Alice',
    lastName: 'Moreau',
    email: 'alice.moreau@techcorp.fr',
    phone: '06 11 22 33 44',
    company: 'TechCorp SAS',
    jobTitle: 'Chef de projet',
  });

  const participant2 = await storage.createParticipant({
    firstName: 'Bruno',
    lastName: 'Petit',
    email: 'bruno.petit@techcorp.fr',
    phone: '06 55 66 77 88',
    company: 'TechCorp SAS',
    jobTitle: 'Responsable équipe',
  });

  // Add participants to mission 1
  await storage.addParticipantToMission({
    missionId: mission1.id,
    participantId: participant1.id,
    status: 'confirmed',
  });

  await storage.addParticipantToMission({
    missionId: mission1.id,
    participantId: participant2.id,
    status: 'confirmed',
  });

  // Create a sample invoice
  await storage.createInvoice({
    invoiceNumber: 'FAC-2024-001',
    amount: 50000, // 500€
    vatAmount: 10000, // 100€ TVA
    status: 'submitted',
    userId: prestataire.id,
    missionId: mission2.id,
    invoiceDate: new Date(),
  });

  console.log('Database seeded with CQFD Formation demo data');
}
