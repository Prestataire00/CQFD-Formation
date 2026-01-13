import {
  users, clients, trainingPrograms, missions, missionClients, missionTrainers, missionSteps, stepTasks, missionSessions,
  participants, missionParticipants, attendanceRecords, evaluations, auditLogs,
  invoices, documents, documentTemplates, documentTemplateVersions, templateNotifications,
  messages, projects, tasks, reminderSettings, reminders,
  type User, type Client, type TrainingProgram, type Mission, type MissionClient, type MissionTrainer, type MissionStep,
  type StepTask, type MissionSession, type Participant, type MissionParticipant,
  type AttendanceRecord, type Evaluation, type AuditLog, type Invoice,
  type Document, type DocumentTemplate, type DocumentTemplateVersion, type TemplateNotification,
  type Message, type Project, type Task,
  type ReminderSetting, type Reminder,
  type InsertClient, type InsertTrainingProgram, type InsertMission,
  type InsertMissionClient, type InsertMissionTrainer, type InsertMissionStep, type InsertStepTask, type InsertMissionSession, type InsertParticipant,
  type InsertMissionParticipant, type InsertAttendanceRecord,
  type InsertEvaluation, type InsertInvoice, type InsertDocument, type InsertDocumentTemplate,
  type InsertDocumentTemplateVersion, type InsertTemplateNotification,
  type InsertAuditLog, type InsertMessage, type InsertProject, type InsertTask,
  type InsertReminderSetting, type InsertReminder,
  type MissionStatus, type InvoiceStatus, type StepStatus
} from "@shared/schema";
import type { UpsertUser } from "@shared/models/auth";
import { db } from "./db";
import { eq, and, desc, sql } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  createUser(userData: Partial<User>, password: string): Promise<User>;
  updateUserWithPassword(id: string, data: Partial<User>, password?: string): Promise<User | undefined>;
  softDeleteUser(id: string): Promise<boolean>;
  getUsers(): Promise<User[]>;
  getTrainers(): Promise<User[]>;
  updateUser(id: string, data: Partial<User>): Promise<User | undefined>;

  // Projects
  getProjects(): Promise<Project[]>;
  getProject(id: number): Promise<Project | undefined>;
  createProject(project: InsertProject): Promise<Project>;

  // Tasks
  getTasks(): Promise<Task[]>;
  createTask(task: InsertTask): Promise<Task>;

  // Clients
  getClients(): Promise<Client[]>;
  getClient(id: number): Promise<Client | undefined>;
  createClient(client: InsertClient): Promise<Client>;
  updateClient(id: number, data: Partial<Client>): Promise<Client | undefined>;

  // Training Programs
  getTrainingPrograms(): Promise<TrainingProgram[]>;
  getTrainingProgram(id: number): Promise<TrainingProgram | undefined>;
  createTrainingProgram(program: InsertTrainingProgram): Promise<TrainingProgram>;
  updateTrainingProgram(id: number, data: Partial<TrainingProgram>): Promise<TrainingProgram | undefined>;

  // Missions
  getMissions(): Promise<Mission[]>;
  getMissionsByTrainer(trainerId: string): Promise<Mission[]>;
  getMission(id: number): Promise<Mission | undefined>;
  createMission(mission: InsertMission): Promise<Mission>;
  updateMission(id: number, data: Partial<Mission>): Promise<Mission | undefined>;
  deleteMission(id: number): Promise<boolean>;
  updateMissionStatus(id: number, status: MissionStatus): Promise<Mission | undefined>;
  duplicateMissionForTrainer(originalMissionId: number, newTrainerId: string): Promise<Mission | undefined>;

  // Multi-trainer duplication
  duplicateMissionForMultipleTrainers(originalMissionId: number, trainerIds: string[]): Promise<{ created: Mission[]; errors: { trainerId: string; error: string }[] }>;
  getChildMissions(parentMissionId: number): Promise<Mission[]>;
  getParentMission(missionId: number): Promise<Mission | undefined>;
  syncParentToChildren(parentMissionId: number, fields?: ('title' | 'description' | 'startDate' | 'endDate' | 'location' | 'locationType')[]): Promise<number>;

  // Mission Clients
  getMissionClients(missionId: number): Promise<(MissionClient & { client: Client })[]>;
  addClientToMission(data: InsertMissionClient): Promise<MissionClient>;
  removeClientFromMission(missionId: number, clientId: number): Promise<boolean>;
  setMissionPrimaryClient(missionId: number, clientId: number): Promise<boolean>;

  // Mission Trainers
  getMissionTrainers(missionId: number): Promise<(MissionTrainer & { trainer: User })[]>;
  addTrainerToMission(data: InsertMissionTrainer): Promise<MissionTrainer>;
  removeTrainerFromMission(missionId: number, trainerId: string): Promise<boolean>;
  setMissionPrimaryTrainer(missionId: number, trainerId: string): Promise<boolean>;

  // Mission Steps
  getMissionSteps(missionId: number): Promise<MissionStep[]>;
  createMissionStep(step: InsertMissionStep): Promise<MissionStep>;
  updateMissionStep(id: number, data: Partial<MissionStep>): Promise<MissionStep | undefined>;
  deleteMissionStep(id: number): Promise<boolean>;

  // Step Tasks
  getStepTasks(stepId: number): Promise<StepTask[]>;
  createStepTask(task: InsertStepTask): Promise<StepTask>;
  updateStepTask(id: number, data: Partial<StepTask>): Promise<StepTask | undefined>;
  deleteStepTask(id: number): Promise<boolean>;

  // Mission Sessions
  getMissionSessions(missionId: number): Promise<MissionSession[]>;
  createMissionSession(session: InsertMissionSession): Promise<MissionSession>;
  updateMissionSession(id: number, data: Partial<MissionSession>): Promise<MissionSession | undefined>;
  deleteMissionSession(id: number): Promise<boolean>;

  // Participants
  getParticipants(): Promise<Participant[]>;
  getParticipant(id: number): Promise<Participant | undefined>;
  createParticipant(participant: InsertParticipant): Promise<Participant>;
  updateParticipant(id: number, data: Partial<Participant>): Promise<Participant | undefined>;

  // Mission Participants
  getMissionParticipants(missionId: number): Promise<(MissionParticipant & { participant: Participant })[]>;
  addParticipantToMission(data: InsertMissionParticipant): Promise<MissionParticipant>;
  removeParticipantFromMission(missionId: number, participantId: number): Promise<boolean>;
  updateMissionParticipant(id: number, data: Partial<MissionParticipant>): Promise<MissionParticipant | undefined>;

  // Attendance
  getAttendanceRecords(missionId: number): Promise<AttendanceRecord[]>;
  getAttendanceBySession(sessionId: number): Promise<AttendanceRecord[]>;
  createAttendanceRecord(record: InsertAttendanceRecord): Promise<AttendanceRecord>;
  updateAttendanceRecord(id: number, data: Partial<AttendanceRecord>): Promise<AttendanceRecord | undefined>;

  // Evaluations
  getEvaluationsByMission(missionId: number): Promise<Evaluation[]>;
  createEvaluation(evaluation: InsertEvaluation): Promise<Evaluation>;
  getEvaluation(id: number): Promise<Evaluation | undefined>;

  // Invoices
  getInvoices(): Promise<Invoice[]>;
  getInvoicesByUser(userId: string): Promise<Invoice[]>;
  getInvoice(id: number): Promise<Invoice | undefined>;
  createInvoice(invoice: InsertInvoice): Promise<Invoice>;
  updateInvoice(id: number, data: Partial<Invoice>): Promise<Invoice | undefined>;
  updateInvoiceStatus(id: number, status: InvoiceStatus, rejectionReason?: string): Promise<Invoice | undefined>;

  // Documents
  getDocuments(): Promise<Document[]>;
  getDocumentsByMission(missionId: number): Promise<Document[]>;
  getDocument(id: number): Promise<Document | undefined>;
  createDocument(doc: InsertDocument): Promise<Document>;
  updateDocument(id: number, data: Partial<Document>): Promise<Document | undefined>;
  deleteDocument(id: number): Promise<boolean>;
  initializeMissionDocuments(missionId: number): Promise<void>;

  // Document Templates
  getDocumentTemplates(): Promise<DocumentTemplate[]>;
  getActiveDocumentTemplatesByRole(role: string, clientId?: number): Promise<DocumentTemplate[]>;
  getDocumentTemplate(id: number): Promise<DocumentTemplate | undefined>;
  createDocumentTemplate(template: InsertDocumentTemplate): Promise<DocumentTemplate>;
  updateDocumentTemplate(id: number, data: Partial<DocumentTemplate>, uploadedBy?: string, changeNotes?: string): Promise<DocumentTemplate | undefined>;
  deleteDocumentTemplate(id: number): Promise<boolean>;
  attachTemplateDocumentsToMission(missionId: number, trainerId: string): Promise<void>;

  // Template Versions
  getTemplateVersions(templateId: number): Promise<DocumentTemplateVersion[]>;
  createTemplateVersion(version: InsertDocumentTemplateVersion): Promise<DocumentTemplateVersion>;

  // Template Notifications
  getUnreadNotifications(userId: string): Promise<TemplateNotification[]>;
  createNotificationForTemplate(templateId: number, userIds: string[]): Promise<void>;
  markNotificationAsRead(notificationId: number): Promise<boolean>;
  markAllNotificationsAsRead(userId: string): Promise<boolean>;

  // Audit Logs
  createAuditLog(log: InsertAuditLog): Promise<AuditLog>;

  // Messages
  getMessages(): Promise<Message[]>;
  getMessagesByMission(missionId: number): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;

  // Stats
  getStats(userId?: string, role?: string): Promise<{
    totalMissions: number;
    activeMissions: number;
    completedMissions: number;
    totalParticipants: number;
    pendingInvoices: number;
    averageRating: number;
  }>;

  // Reminder Settings
  getReminderSettings(): Promise<ReminderSetting[]>;
  getReminderSetting(id: number): Promise<ReminderSetting | undefined>;
  createReminderSetting(setting: InsertReminderSetting): Promise<ReminderSetting>;
  updateReminderSetting(id: number, data: Partial<ReminderSetting>): Promise<ReminderSetting | undefined>;
  deleteReminderSetting(id: number): Promise<boolean>;

  // Reminders
  getReminders(): Promise<Reminder[]>;
  getRemindersByMission(missionId: number): Promise<Reminder[]>;
  getPendingReminders(): Promise<Reminder[]>;
  createReminder(reminder: InsertReminder): Promise<Reminder>;
  updateReminder(id: number, data: Partial<Reminder>): Promise<Reminder | undefined>;
  deleteReminder(id: number): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  // ==================== USERS ====================
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          profileImageUrl: userData.profileImageUrl,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async getUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(users.lastName);
  }

  async getTrainers(): Promise<User[]> {
    return await db.select().from(users)
      .where(sql`${users.role} IN ('formateur', 'prestataire')`)
      .orderBy(users.lastName);
  }

  async updateUser(id: string, data: Partial<User>): Promise<User | undefined> {
    const [updated] = await db.update(users)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return updated;
  }

  async createUser(userData: Partial<User>, password: string): Promise<User> {
    const bcrypt = await import('bcrypt');
    const passwordHash = await bcrypt.hash(password, 10);
    const [newUser] = await db.insert(users).values({
      ...userData,
      passwordHash,
    } as any).returning();
    return newUser;
  }

  async updateUserWithPassword(id: string, data: Partial<User>, password?: string): Promise<User | undefined> {
    const updateData: any = { ...data, updatedAt: new Date() };
    if (password) {
      const bcrypt = await import('bcrypt');
      updateData.passwordHash = await bcrypt.hash(password, 10);
    }
    const [updated] = await db.update(users)
      .set(updateData)
      .where(eq(users.id, id))
      .returning();
    return updated;
  }

  async softDeleteUser(id: string): Promise<boolean> {
    const [updated] = await db.update(users)
      .set({ status: 'SUPPRIME', updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return !!updated;
  }

  // ==================== PROJECTS ====================
  async getProjects(): Promise<Project[]> {
    return await db.select().from(projects).orderBy(desc(projects.createdAt));
  }

  async getProject(id: number): Promise<Project | undefined> {
    const [project] = await db.select().from(projects).where(eq(projects.id, id));
    return project;
  }

  async createProject(project: InsertProject): Promise<Project> {
    const [newProject] = await db.insert(projects).values(project).returning();
    return newProject;
  }

  // ==================== TASKS ====================
  async getTasks(): Promise<Task[]> {
    return await db.select().from(tasks).orderBy(desc(tasks.createdAt));
  }

  async createTask(task: InsertTask): Promise<Task> {
    const [newTask] = await db.insert(tasks).values(task).returning();
    return newTask;
  }

  // ==================== CLIENTS ====================
  async getClients(): Promise<Client[]> {
    return await db.select().from(clients).where(eq(clients.isActive, true)).orderBy(clients.name);
  }

  async getClient(id: number): Promise<Client | undefined> {
    const [client] = await db.select().from(clients).where(eq(clients.id, id));
    return client;
  }

  async createClient(client: InsertClient): Promise<Client> {
    const [newClient] = await db.insert(clients).values(client).returning();
    return newClient;
  }

  async updateClient(id: number, data: Partial<Client>): Promise<Client | undefined> {
    const [updated] = await db.update(clients)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(clients.id, id))
      .returning();
    return updated;
  }

  // ==================== TRAINING PROGRAMS ====================
  async getTrainingPrograms(): Promise<TrainingProgram[]> {
    return await db.select().from(trainingPrograms)
      .where(eq(trainingPrograms.isActive, true))
      .orderBy(trainingPrograms.title);
  }

  async getTrainingProgram(id: number): Promise<TrainingProgram | undefined> {
    const [program] = await db.select().from(trainingPrograms).where(eq(trainingPrograms.id, id));
    return program;
  }

  async createTrainingProgram(program: InsertTrainingProgram): Promise<TrainingProgram> {
    const [newProgram] = await db.insert(trainingPrograms).values(program).returning();
    return newProgram;
  }

  async updateTrainingProgram(id: number, data: Partial<TrainingProgram>): Promise<TrainingProgram | undefined> {
    const [updated] = await db.update(trainingPrograms)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(trainingPrograms.id, id))
      .returning();
    return updated;
  }

  // ==================== MISSIONS ====================
  async getMissions(): Promise<Mission[]> {
    return await db.select().from(missions).orderBy(desc(missions.startDate));
  }

  async getMissionsByTrainer(trainerId: string): Promise<Mission[]> {
    return await db.select().from(missions)
      .where(eq(missions.trainerId, trainerId))
      .orderBy(desc(missions.startDate));
  }

  async getMission(id: number): Promise<Mission | undefined> {
    const [mission] = await db.select().from(missions).where(eq(missions.id, id));
    return mission;
  }

  async createMission(mission: InsertMission): Promise<Mission> {
    const [newMission] = await db.insert(missions).values(mission).returning();

    // Auto-attach template documents if trainer is assigned
    if (newMission.trainerId) {
      await this.attachTemplateDocumentsToMission(newMission.id, newMission.trainerId);
    }

    return newMission;
  }

  async updateMission(id: number, data: Partial<Mission>): Promise<Mission | undefined> {
    const [updated] = await db.update(missions)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(missions.id, id))
      .returning();
    return updated;
  }

  async updateMissionStatus(id: number, status: MissionStatus): Promise<Mission | undefined> {
    const [updated] = await db.update(missions)
      .set({ status, updatedAt: new Date() })
      .where(eq(missions.id, id))
      .returning();
    return updated;
  }

  async duplicateMissionForTrainer(originalMissionId: number, newTrainerId: string): Promise<Mission | undefined> {
    // Get the original mission
    const originalMission = await this.getMission(originalMissionId);
    if (!originalMission) return undefined;

    // Create a copy of the mission for the new trainer
    const { id, createdAt, updatedAt, ...missionData } = originalMission;
    const [duplicatedMission] = await db.insert(missions).values({
      ...missionData,
      trainerId: newTrainerId,
      title: `${missionData.title} (Copie)`,
    }).returning();

    // Attach template documents for the new trainer
    if (newTrainerId) {
      await this.attachTemplateDocumentsToMission(duplicatedMission.id, newTrainerId);
    }

    // Copy steps (tâches)
    const originalSteps = await this.getMissionSteps(originalMissionId);
    for (const step of originalSteps) {
      const { id, missionId, createdAt, updatedAt, ...stepData } = step;
      await this.createMissionStep({
        ...stepData,
        missionId: duplicatedMission.id,
      });
    }

    return duplicatedMission;
  }

  // ==================== MULTI-TRAINER DUPLICATION ====================
  async duplicateMissionForMultipleTrainers(
    originalMissionId: number,
    trainerIds: string[]
  ): Promise<{ created: Mission[]; errors: { trainerId: string; error: string }[] }> {
    const created: Mission[] = [];
    const errors: { trainerId: string; error: string }[] = [];

    const originalMission = await this.getMission(originalMissionId);
    if (!originalMission) {
      throw new Error("Mission originale non trouvée");
    }

    // Mark original as original if not already
    if (!originalMission.isOriginal) {
      await this.updateMission(originalMissionId, { isOriginal: true });
    }

    for (const trainerId of trainerIds) {
      try {
        // Check if trainer already has a copy
        const existingCopies = await db.select().from(missions)
          .where(and(
            eq(missions.parentMissionId, originalMissionId),
            eq(missions.trainerId, trainerId)
          ));

        if (existingCopies.length > 0) {
          errors.push({ trainerId, error: "Le formateur a déjà une copie de cette mission" });
          continue;
        }

        // Get trainer to determine role
        const trainer = await this.getUser(trainerId);
        if (!trainer) {
          errors.push({ trainerId, error: "Formateur non trouvé" });
          continue;
        }

        // Create mission copy
        const { id, createdAt, updatedAt, isOriginal, parentMissionId, ...missionData } = originalMission;

        // Generate new reference with trainer suffix
        const trainerSuffix = trainer.lastName?.toUpperCase().slice(0, 3) || trainerId.slice(0, 3);
        const newReference = `${missionData.reference || 'MISS'}-${trainerSuffix}`;

        const [newMission] = await db.insert(missions).values({
          ...missionData,
          reference: newReference,
          trainerId,
          parentMissionId: originalMissionId,
          isOriginal: false,
        }).returning();

        // Copy all mission steps (tasks)
        const originalSteps = await this.getMissionSteps(originalMissionId);
        for (const step of originalSteps) {
          const { id: stepId, missionId, createdAt: stepCreatedAt, updatedAt: stepUpdatedAt, ...stepData } = step;
          await this.createMissionStep({
            ...stepData,
            missionId: newMission.id,
            // Reset completion status for new trainer
            isCompleted: false,
            status: 'todo',
          });
        }

        // Attach role-specific document templates
        await this.attachTemplateDocumentsToMission(newMission.id, trainerId);

        created.push(newMission);
      } catch (err) {
        errors.push({
          trainerId,
          error: err instanceof Error ? err.message : "Erreur inconnue"
        });
      }
    }

    return { created, errors };
  }

  async getChildMissions(parentMissionId: number): Promise<Mission[]> {
    return await db.select().from(missions)
      .where(eq(missions.parentMissionId, parentMissionId))
      .orderBy(desc(missions.createdAt));
  }

  async getParentMission(missionId: number): Promise<Mission | undefined> {
    const mission = await this.getMission(missionId);
    if (!mission || !mission.parentMissionId) return undefined;
    return await this.getMission(mission.parentMissionId);
  }

  async syncParentToChildren(
    parentMissionId: number,
    fields?: ('title' | 'description' | 'startDate' | 'endDate' | 'location' | 'locationType')[]
  ): Promise<number> {
    const parent = await this.getMission(parentMissionId);
    if (!parent || !parent.isOriginal) {
      return 0;
    }

    const defaultFields: ('title' | 'description' | 'startDate' | 'endDate' | 'location' | 'locationType')[] =
      ['title', 'description', 'startDate', 'endDate', 'location', 'locationType'];
    const fieldsToSync = fields || defaultFields;

    // Build update object from parent
    const updateData: Partial<Mission> = {};
    for (const field of fieldsToSync) {
      (updateData as any)[field] = (parent as any)[field];
    }
    updateData.updatedAt = new Date();

    // Update all children
    const result = await db.update(missions)
      .set(updateData)
      .where(eq(missions.parentMissionId, parentMissionId))
      .returning();

    return result.length;
  }

  async deleteMission(id: number): Promise<boolean> {
    // We should delete related records first or ensure they have CASCADE
    // Based on the schema, many tables have references to missions.id
    // mission_clients, mission_trainers, mission_steps -> step_tasks, mission_sessions, mission_participants, attendance_records, evaluations, invoices, documents, messages, reminders
    
    // In a real app, we might use a soft delete or rely on DB cascades if configured.
    // Since I can't easily check all foreign key constraints for ON DELETE CASCADE right now, 
    // I'll perform manual deletion of related records to be safe.

    await db.delete(missionClients).where(eq(missionClients.missionId, id));
    await db.delete(missionTrainers).where(eq(missionTrainers.missionId, id));
    
    const steps = await this.getMissionSteps(id);
    for (const step of steps) {
      await db.delete(stepTasks).where(eq(stepTasks.stepId, step.id));
    }
    await db.delete(missionSteps).where(eq(missionSteps.missionId, id));
    await db.delete(missionSessions).where(eq(missionSessions.missionId, id));
    await db.delete(missionParticipants).where(eq(missionParticipants.missionId, id));
    await db.delete(attendanceRecords).where(eq(attendanceRecords.missionId, id));
    await db.delete(evaluations).where(eq(evaluations.missionId, id));
    await db.delete(invoices).where(eq(invoices.missionId, id));
    await db.delete(documents).where(eq(documents.missionId, id));
    await db.delete(messages).where(eq(messages.missionId, id));
    await db.delete(reminders).where(eq(reminders.missionId, id));

    const [deleted] = await db.delete(missions).where(eq(missions.id, id)).returning();
    return !!deleted;
  }

  // ==================== MISSION CLIENTS ====================
  async getMissionClients(missionId: number): Promise<(MissionClient & { client: Client })[]> {
    const results = await db.select({
      id: missionClients.id,
      missionId: missionClients.missionId,
      clientId: missionClients.clientId,
      isPrimary: missionClients.isPrimary,
      createdAt: missionClients.createdAt,
      client: clients,
    })
      .from(missionClients)
      .innerJoin(clients, eq(missionClients.clientId, clients.id))
      .where(eq(missionClients.missionId, missionId));
    return results;
  }

  async addClientToMission(data: InsertMissionClient): Promise<MissionClient> {
    const [newMissionClient] = await db.insert(missionClients).values(data).returning();
    return newMissionClient;
  }

  async removeClientFromMission(missionId: number, clientId: number): Promise<boolean> {
    const result = await db.delete(missionClients)
      .where(and(
        eq(missionClients.missionId, missionId),
        eq(missionClients.clientId, clientId)
      ));
    return true;
  }

  async setMissionPrimaryClient(missionId: number, clientId: number): Promise<boolean> {
    // Remove primary flag from all clients of this mission
    await db.update(missionClients)
      .set({ isPrimary: false })
      .where(eq(missionClients.missionId, missionId));
    // Set primary flag on the specified client
    await db.update(missionClients)
      .set({ isPrimary: true })
      .where(and(
        eq(missionClients.missionId, missionId),
        eq(missionClients.clientId, clientId)
      ));
    return true;
  }

  // ==================== MISSION TRAINERS ====================
  async getMissionTrainers(missionId: number): Promise<(MissionTrainer & { trainer: User })[]> {
    const results = await db.select({
      id: missionTrainers.id,
      missionId: missionTrainers.missionId,
      trainerId: missionTrainers.trainerId,
      isPrimary: missionTrainers.isPrimary,
      createdAt: missionTrainers.createdAt,
      trainer: users,
    })
      .from(missionTrainers)
      .innerJoin(users, eq(missionTrainers.trainerId, users.id))
      .where(eq(missionTrainers.missionId, missionId));
    return results;
  }

  async addTrainerToMission(data: InsertMissionTrainer): Promise<MissionTrainer> {
    const [newMissionTrainer] = await db.insert(missionTrainers).values(data).returning();
    return newMissionTrainer;
  }

  async removeTrainerFromMission(missionId: number, trainerId: string): Promise<boolean> {
    await db.delete(missionTrainers)
      .where(and(
        eq(missionTrainers.missionId, missionId),
        eq(missionTrainers.trainerId, trainerId)
      ));
    return true;
  }

  async setMissionPrimaryTrainer(missionId: number, trainerId: string): Promise<boolean> {
    // Remove primary flag from all trainers of this mission
    await db.update(missionTrainers)
      .set({ isPrimary: false })
      .where(eq(missionTrainers.missionId, missionId));
    // Set primary flag on the specified trainer
    await db.update(missionTrainers)
      .set({ isPrimary: true })
      .where(and(
        eq(missionTrainers.missionId, missionId),
        eq(missionTrainers.trainerId, trainerId)
      ));
    return true;
  }

  // ==================== MISSION STEPS ====================
  async getMissionSteps(missionId: number): Promise<MissionStep[]> {
    return await db.select().from(missionSteps)
      .where(eq(missionSteps.missionId, missionId))
      .orderBy(missionSteps.order);
  }

  async createMissionStep(step: InsertMissionStep): Promise<MissionStep> {
    const [newStep] = await db.insert(missionSteps).values(step).returning();
    return newStep;
  }

  async updateMissionStep(id: number, data: Partial<MissionStep>): Promise<MissionStep | undefined> {
    const [updated] = await db.update(missionSteps)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(missionSteps.id, id))
      .returning();
    return updated;
  }

  async deleteMissionStep(id: number): Promise<boolean> {
    // First delete all tasks associated with this step
    await db.delete(stepTasks).where(eq(stepTasks.stepId, id));
    await db.delete(missionSteps).where(eq(missionSteps.id, id));
    return true;
  }

  // ==================== STEP TASKS ====================
  async getStepTasks(stepId: number): Promise<StepTask[]> {
    return await db.select().from(stepTasks)
      .where(eq(stepTasks.stepId, stepId))
      .orderBy(stepTasks.order);
  }

  async createStepTask(task: InsertStepTask): Promise<StepTask> {
    const [newTask] = await db.insert(stepTasks).values(task).returning();
    return newTask;
  }

  async updateStepTask(id: number, data: Partial<StepTask>): Promise<StepTask | undefined> {
    const [updated] = await db.update(stepTasks)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(stepTasks.id, id))
      .returning();
    return updated;
  }

  async deleteStepTask(id: number): Promise<boolean> {
    await db.delete(stepTasks).where(eq(stepTasks.id, id));
    return true;
  }

  // ==================== MISSION SESSIONS ====================
  async getMissionSessions(missionId: number): Promise<MissionSession[]> {
    return await db.select().from(missionSessions)
      .where(eq(missionSessions.missionId, missionId))
      .orderBy(missionSessions.sessionDate);
  }

  async createMissionSession(session: InsertMissionSession): Promise<MissionSession> {
    const [newSession] = await db.insert(missionSessions).values(session).returning();
    return newSession;
  }

  async updateMissionSession(id: number, data: Partial<MissionSession>): Promise<MissionSession | undefined> {
    const [updated] = await db.update(missionSessions)
      .set(data)
      .where(eq(missionSessions.id, id))
      .returning();
    return updated;
  }

  async deleteMissionSession(id: number): Promise<boolean> {
    await db.delete(missionSessions).where(eq(missionSessions.id, id));
    return true;
  }

  // ==================== PARTICIPANTS ====================
  async getParticipants(): Promise<Participant[]> {
    return await db.select().from(participants).orderBy(participants.lastName);
  }

  async getParticipant(id: number): Promise<Participant | undefined> {
    const [participant] = await db.select().from(participants).where(eq(participants.id, id));
    return participant;
  }

  async createParticipant(participant: InsertParticipant): Promise<Participant> {
    const [newParticipant] = await db.insert(participants).values(participant).returning();
    return newParticipant;
  }

  async updateParticipant(id: number, data: Partial<Participant>): Promise<Participant | undefined> {
    const [updated] = await db.update(participants)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(participants.id, id))
      .returning();
    return updated;
  }

  // ==================== MISSION PARTICIPANTS ====================
  async getMissionParticipants(missionId: number): Promise<(MissionParticipant & { participant: Participant })[]> {
    const results = await db.select({
      id: missionParticipants.id,
      missionId: missionParticipants.missionId,
      participantId: missionParticipants.participantId,
      status: missionParticipants.status,
      registeredAt: missionParticipants.registeredAt,
      convocationSentAt: missionParticipants.convocationSentAt,
      attendanceValidated: missionParticipants.attendanceValidated,
      certificateGeneratedAt: missionParticipants.certificateGeneratedAt,
      participant: participants,
    })
      .from(missionParticipants)
      .innerJoin(participants, eq(missionParticipants.participantId, participants.id))
      .where(eq(missionParticipants.missionId, missionId));

    return results;
  }

  async addParticipantToMission(data: InsertMissionParticipant): Promise<MissionParticipant> {
    const [result] = await db.insert(missionParticipants).values(data).returning();
    return result;
  }

  async removeParticipantFromMission(missionId: number, participantId: number): Promise<boolean> {
    await db.delete(missionParticipants)
      .where(and(
        eq(missionParticipants.missionId, missionId),
        eq(missionParticipants.participantId, participantId)
      ));
    return true;
  }

  async updateMissionParticipant(id: number, data: Partial<MissionParticipant>): Promise<MissionParticipant | undefined> {
    const [updated] = await db.update(missionParticipants)
      .set(data)
      .where(eq(missionParticipants.id, id))
      .returning();
    return updated;
  }

  // ==================== ATTENDANCE ====================
  async getAttendanceRecords(missionId: number): Promise<AttendanceRecord[]> {
    return await db.select().from(attendanceRecords)
      .where(eq(attendanceRecords.missionId, missionId));
  }

  async getAttendanceBySession(sessionId: number): Promise<AttendanceRecord[]> {
    return await db.select().from(attendanceRecords)
      .where(eq(attendanceRecords.sessionId, sessionId));
  }

  async createAttendanceRecord(record: InsertAttendanceRecord): Promise<AttendanceRecord> {
    const [newRecord] = await db.insert(attendanceRecords).values(record).returning();
    return newRecord;
  }

  async updateAttendanceRecord(id: number, data: Partial<AttendanceRecord>): Promise<AttendanceRecord | undefined> {
    const [updated] = await db.update(attendanceRecords)
      .set(data)
      .where(eq(attendanceRecords.id, id))
      .returning();
    return updated;
  }

  // ==================== EVALUATIONS ====================
  async getEvaluationsByMission(missionId: number): Promise<Evaluation[]> {
    return await db.select().from(evaluations)
      .where(eq(evaluations.missionId, missionId));
  }

  async createEvaluation(evaluation: InsertEvaluation): Promise<Evaluation> {
    const [newEval] = await db.insert(evaluations).values(evaluation).returning();
    return newEval;
  }

  async getEvaluation(id: number): Promise<Evaluation | undefined> {
    const [evaluation] = await db.select().from(evaluations).where(eq(evaluations.id, id));
    return evaluation;
  }

  // ==================== INVOICES ====================
  async getInvoices(): Promise<Invoice[]> {
    return await db.select().from(invoices).orderBy(desc(invoices.createdAt));
  }

  async getInvoicesByUser(userId: string): Promise<Invoice[]> {
    return await db.select().from(invoices)
      .where(eq(invoices.userId, userId))
      .orderBy(desc(invoices.createdAt));
  }

  async getInvoice(id: number): Promise<Invoice | undefined> {
    const [invoice] = await db.select().from(invoices).where(eq(invoices.id, id));
    return invoice;
  }

  async createInvoice(invoice: InsertInvoice): Promise<Invoice> {
    const [newInvoice] = await db.insert(invoices).values(invoice).returning();
    return newInvoice;
  }

  async updateInvoice(id: number, data: Partial<Invoice>): Promise<Invoice | undefined> {
    const [updated] = await db.update(invoices)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(invoices.id, id))
      .returning();
    return updated;
  }

  async updateInvoiceStatus(id: number, status: InvoiceStatus, rejectionReason?: string): Promise<Invoice | undefined> {
    const updateData: Partial<Invoice> = { status, updatedAt: new Date() };
    if (status === 'rejected' && rejectionReason) {
      updateData.rejectionReason = rejectionReason;
    }
    if (status === 'paid') {
      updateData.paidDate = new Date();
    }
    const [updated] = await db.update(invoices)
      .set(updateData)
      .where(eq(invoices.id, id))
      .returning();
    return updated;
  }

  // ==================== DOCUMENTS ====================
  async getDocuments(): Promise<Document[]> {
    return await db.select().from(documents).orderBy(desc(documents.createdAt));
  }

  async getDocumentsByMission(missionId: number): Promise<Document[]> {
    return await db.select().from(documents)
      .where(eq(documents.missionId, missionId))
      .orderBy(desc(documents.createdAt));
  }

  async getDocument(id: number): Promise<Document | undefined> {
    const [doc] = await db.select().from(documents).where(eq(documents.id, id));
    return doc;
  }

  async createDocument(doc: InsertDocument): Promise<Document> {
    const [newDoc] = await db.insert(documents).values(doc).returning();
    return newDoc;
  }

  async updateDocument(id: number, data: Partial<Document>): Promise<Document | undefined> {
    const [updated] = await db.update(documents)
      .set(data)
      .where(eq(documents.id, id))
      .returning();
    return updated;
  }

  async deleteDocument(id: number): Promise<boolean> {
    await db.delete(documents).where(eq(documents.id, id));
    return true;
  }

  // No longer used - keeping for reference
  async initializeMissionDocuments(missionId: number): Promise<void> {
    // Documents are now created on-demand by the user
  }

  // ==================== DOCUMENT TEMPLATES ====================
  async getDocumentTemplates(): Promise<DocumentTemplate[]> {
    return await db.select().from(documentTemplates).orderBy(desc(documentTemplates.createdAt));
  }

  async getActiveDocumentTemplatesByRole(role: string, clientId?: number): Promise<DocumentTemplate[]> {
    // Get both global and client-specific templates
    const conditions: any[] = [
      eq(documentTemplates.isActive, true),
      eq(documentTemplates.forRole, role)
    ];

    // If clientId is provided, get both global templates and templates for that client
    if (clientId) {
      return await db.select().from(documentTemplates)
        .where(and(
          eq(documentTemplates.isActive, true),
          eq(documentTemplates.forRole, role),
          sql`(${documentTemplates.clientId} IS NULL OR ${documentTemplates.clientId} = ${clientId})`
        ));
    }

    // Otherwise, get only global templates (clientId is null)
    return await db.select().from(documentTemplates)
      .where(and(
        eq(documentTemplates.isActive, true),
        eq(documentTemplates.forRole, role),
        sql`${documentTemplates.clientId} IS NULL`
      ));
  }

  async getDocumentTemplate(id: number): Promise<DocumentTemplate | undefined> {
    const [template] = await db.select().from(documentTemplates).where(eq(documentTemplates.id, id));
    return template;
  }

  async createDocumentTemplate(template: InsertDocumentTemplate): Promise<DocumentTemplate> {
    const [newTemplate] = await db.insert(documentTemplates).values(template).returning();

    // Create first version in history
    if (newTemplate.url) {
      await this.createTemplateVersion({
        templateId: newTemplate.id,
        version: 1,
        url: newTemplate.url,
        uploadedBy: null,
        changeNotes: 'Version initiale',
      });
    }

    return newTemplate;
  }

  async updateDocumentTemplate(id: number, data: Partial<DocumentTemplate>, uploadedBy?: string, changeNotes?: string): Promise<DocumentTemplate | undefined> {
    const currentTemplate = await this.getDocumentTemplate(id);
    if (!currentTemplate) return undefined;

    // If URL is being updated, increment version and create a new version in history
    if (data.url && data.url !== currentTemplate.url) {
      const newVersion = (currentTemplate.version || 1) + 1;
      data.version = newVersion;

      // Save the new version to history
      await this.createTemplateVersion({
        templateId: id,
        version: newVersion,
        url: data.url,
        uploadedBy: uploadedBy || null,
        changeNotes: changeNotes || `Mise à jour vers version ${newVersion}`,
      });

      // Update all documents linked to this template with the new URL
      const allDocuments = await this.getDocuments();
      const linkedDocs = allDocuments.filter((doc: Document) => doc.templateId === id);

      // Notify affected users
      const affectedUserIds = linkedDocs.map((doc: Document) => doc.userId).filter(Boolean) as string[];
      const uniqueUserIds = [...new Set(affectedUserIds)];
      if (uniqueUserIds.length > 0) {
        await this.createNotificationForTemplate(id, uniqueUserIds);
      }

      // Update the documents
      for (const doc of linkedDocs) {
        await this.updateDocument(doc.id, { url: data.url });
      }
    }

    const [updated] = await db.update(documentTemplates)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(documentTemplates.id, id))
      .returning();
    return updated;
  }

  async deleteDocumentTemplate(id: number): Promise<boolean> {
    await db.delete(documentTemplates).where(eq(documentTemplates.id, id));
    return true;
  }

  async attachTemplateDocumentsToMission(missionId: number, trainerId: string): Promise<void> {
    // Get trainer to determine their role
    const trainer = await this.getUser(trainerId);
    if (!trainer) return;

    // Get the mission to check for client-specific templates
    const mission = await this.getMission(missionId);
    const clientId = mission?.clientId;

    // Get appropriate templates based on trainer role and client
    const templates = await this.getActiveDocumentTemplatesByRole(trainer.role, clientId);

    // Attach each template document to the mission
    for (const template of templates) {
      await db.insert(documents).values({
        title: template.title,
        type: template.type,
        url: template.url, // Reference to the latest version
        missionId: missionId,
        userId: trainerId,
        templateId: template.id,
      });
    }
  }

  // ==================== TEMPLATE VERSIONS ====================
  async getTemplateVersions(templateId: number): Promise<DocumentTemplateVersion[]> {
    return await db.select().from(documentTemplateVersions)
      .where(eq(documentTemplateVersions.templateId, templateId))
      .orderBy(desc(documentTemplateVersions.version));
  }

  async createTemplateVersion(version: InsertDocumentTemplateVersion): Promise<DocumentTemplateVersion> {
    const [newVersion] = await db.insert(documentTemplateVersions).values(version).returning();
    return newVersion;
  }

  // ==================== TEMPLATE NOTIFICATIONS ====================
  async getUnreadNotifications(userId: string): Promise<TemplateNotification[]> {
    return await db.select().from(templateNotifications)
      .where(and(
        eq(templateNotifications.userId, userId),
        eq(templateNotifications.isRead, false)
      ))
      .orderBy(desc(templateNotifications.createdAt));
  }

  async createNotificationForTemplate(templateId: number, userIds: string[]): Promise<void> {
    for (const userId of userIds) {
      await db.insert(templateNotifications).values({
        templateId,
        userId,
        isRead: false,
      });
    }
  }

  async markNotificationAsRead(notificationId: number): Promise<boolean> {
    await db.update(templateNotifications)
      .set({ isRead: true })
      .where(eq(templateNotifications.id, notificationId));
    return true;
  }

  async markAllNotificationsAsRead(userId: string): Promise<boolean> {
    await db.update(templateNotifications)
      .set({ isRead: true })
      .where(eq(templateNotifications.userId, userId));
    return true;
  }

  // ==================== AUDIT LOGS ====================
  async createAuditLog(log: InsertAuditLog): Promise<AuditLog> {
    const [newLog] = await db.insert(auditLogs).values(log).returning();
    return newLog;
  }

  // ==================== MESSAGES ====================
  async getMessages(): Promise<Message[]> {
    return await db.select().from(messages).orderBy(desc(messages.createdAt));
  }

  async getMessagesByMission(missionId: number): Promise<Message[]> {
    return await db.select().from(messages)
      .where(eq(messages.missionId, missionId))
      .orderBy(messages.createdAt);
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const [newMessage] = await db.insert(messages).values(message).returning();
    return newMessage;
  }

  // ==================== STATS ====================
  async getStats(userId?: string, role?: string): Promise<{
    totalMissions: number;
    activeMissions: number;
    completedMissions: number;
    totalParticipants: number;
    pendingInvoices: number;
    averageRating: number;
  }> {
    // Get missions based on role
    let missionQuery = db.select().from(missions);
    if (role !== 'admin' && userId) {
      missionQuery = db.select().from(missions).where(eq(missions.trainerId, userId)) as typeof missionQuery;
    }
    const allMissions = await missionQuery;

    const totalMissions = allMissions.length;
    const activeMissions = allMissions.filter(m => m.status === 'in_progress' || m.status === 'confirmed').length;
    const completedMissions = allMissions.filter(m => m.status === 'completed').length;

    // Get participants count
    const allParticipants = await db.select().from(participants);
    const totalParticipants = allParticipants.length;

    // Get pending invoices based on role
    let invoiceQuery = db.select().from(invoices).where(eq(invoices.status, 'submitted'));
    if (role === 'prestataire' && userId) {
      invoiceQuery = db.select().from(invoices)
        .where(and(eq(invoices.userId, userId), eq(invoices.status, 'submitted'))) as typeof invoiceQuery;
    }
    const pendingInvoicesList = await invoiceQuery;
    const pendingInvoices = pendingInvoicesList.length;

    // Calculate average rating from evaluations
    const allEvaluations = await db.select().from(evaluations);
    const ratingsWithValues = allEvaluations.filter(e => e.overallRating !== null);
    const averageRating = ratingsWithValues.length > 0
      ? ratingsWithValues.reduce((sum, e) => sum + (e.overallRating || 0), 0) / ratingsWithValues.length
      : 0;

    return {
      totalMissions,
      activeMissions,
      completedMissions,
      totalParticipants,
      pendingInvoices,
      averageRating: Math.round(averageRating * 10) / 10,
    };
  }

  // ==================== REMINDER SETTINGS ====================
  async getReminderSettings(): Promise<ReminderSetting[]> {
    return await db.select().from(reminderSettings).orderBy(reminderSettings.daysBefore);
  }

  async getReminderSetting(id: number): Promise<ReminderSetting | undefined> {
    const [setting] = await db.select().from(reminderSettings).where(eq(reminderSettings.id, id));
    return setting;
  }

  async createReminderSetting(setting: InsertReminderSetting): Promise<ReminderSetting> {
    const [newSetting] = await db.insert(reminderSettings).values(setting).returning();
    return newSetting;
  }

  async updateReminderSetting(id: number, data: Partial<ReminderSetting>): Promise<ReminderSetting | undefined> {
    const [updated] = await db.update(reminderSettings)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(reminderSettings.id, id))
      .returning();
    return updated;
  }

  async deleteReminderSetting(id: number): Promise<boolean> {
    await db.delete(reminderSettings).where(eq(reminderSettings.id, id));
    return true;
  }

  // ==================== REMINDERS ====================
  async getReminders(): Promise<Reminder[]> {
    return await db.select().from(reminders).orderBy(desc(reminders.scheduledDate));
  }

  async getRemindersByMission(missionId: number): Promise<Reminder[]> {
    return await db.select().from(reminders)
      .where(eq(reminders.missionId, missionId))
      .orderBy(reminders.scheduledDate);
  }

  async getPendingReminders(): Promise<Reminder[]> {
    return await db.select().from(reminders)
      .where(eq(reminders.status, 'pending'))
      .orderBy(reminders.scheduledDate);
  }

  async createReminder(reminder: InsertReminder): Promise<Reminder> {
    const [newReminder] = await db.insert(reminders).values(reminder).returning();
    return newReminder;
  }

  async updateReminder(id: number, data: Partial<Reminder>): Promise<Reminder | undefined> {
    const [updated] = await db.update(reminders)
      .set(data)
      .where(eq(reminders.id, id))
      .returning();
    return updated;
  }

  async deleteReminder(id: number): Promise<boolean> {
    await db.delete(reminders).where(eq(reminders.id, id));
    return true;
  }
}

export const storage = new DatabaseStorage();
