import {
  users, clients, trainingPrograms, missions, missionClients, missionTrainers, missionSteps, stepTasks, missionSessions,
  participants, missionParticipants, attendanceRecords, evaluations, auditLogs,
  invoices, documents, documentTemplates, documentTemplateVersions, templateNotifications,
  messages, projects, tasks, reminderSettings, reminders, passwordResetTokens,
  xpTransactions, badges, userBadges, inAppNotifications,
  feedbackQuestionnaires, feedbackQuestions, feedbackResponseTokens, feedbackResponses,
  companySettings, clientContracts, clientInvoices, taskDeadlineDefaults, personalNotes,
  type User, type PasswordResetToken, type Client, type TrainingProgram, type Mission, type MissionClient, type MissionTrainer, type MissionStep,
  type StepTask, type MissionSession, type Participant, type MissionParticipant,
  type AttendanceRecord, type Evaluation, type AuditLog, type Invoice,
  type Document, type DocumentTemplate, type DocumentTemplateVersion, type TemplateNotification,
  type Message, type Project, type Task,
  type ReminderSetting, type Reminder, type InAppNotification,
  type XPTransaction, type Badge, type UserBadge,
  type FeedbackQuestionnaire, type FeedbackQuestion, type FeedbackResponseToken, type FeedbackResponse,
  type CompanySettings, type ClientContract, type ClientInvoice, type TaskDeadlineDefault, type PersonalNote,
  type InsertClient, type InsertTrainingProgram, type InsertMission,
  type InsertMissionClient, type InsertMissionTrainer, type InsertMissionStep, type InsertStepTask, type InsertMissionSession, type InsertParticipant,
  type InsertMissionParticipant, type InsertAttendanceRecord,
  type InsertEvaluation, type InsertInvoice, type InsertDocument, type InsertDocumentTemplate,
  type InsertDocumentTemplateVersion, type InsertTemplateNotification,
  type InsertAuditLog, type InsertMessage, type InsertProject, type InsertTask,
  type InsertReminderSetting, type InsertReminder, type InsertInAppNotification,
  type InsertXPTransaction, type InsertBadge, type InsertUserBadge,
  type InsertFeedbackQuestionnaire, type InsertFeedbackQuestion, type InsertFeedbackResponseToken, type InsertFeedbackResponse,
  type InsertCompanySettings, type InsertClientContract, type InsertClientInvoice, type InsertTaskDeadlineDefault, type InsertPersonalNote,
  type MissionStatus, type InvoiceStatus, type StepStatus
} from "@shared/schema";
import type { UpsertUser } from "@shared/models/auth";
import { db } from "./db";
import { eq, and, desc, sql } from "drizzle-orm";
import fs from "fs";
import path from "path";

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
  getUsersByRole(role: string): Promise<User[]>;
  updateUser(id: string, data: Partial<User>): Promise<User | undefined>;

  // Password Reset Tokens
  createPasswordResetToken(userId: string, ttlMs?: number): Promise<PasswordResetToken>;
  getPasswordResetToken(token: string): Promise<PasswordResetToken | undefined>;
  markTokenAsUsed(token: string): Promise<void>;
  deleteExpiredTokens(): Promise<void>;

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
  getAllMissionSessions(): Promise<MissionSession[]>;
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
  getMissionParticipantsByParticipant(participantId: number): Promise<MissionParticipant[]>;
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

  // Gamification - XP Transactions
  createXPTransaction(transaction: InsertXPTransaction): Promise<XPTransaction>;
  getXPTransactions(userId: string): Promise<XPTransaction[]>;
  getRecentXPTransactions(userId: string, limit: number): Promise<XPTransaction[]>;

  // Gamification - Badges
  getBadges(): Promise<Badge[]>;
  getBadge(id: number): Promise<Badge | undefined>;
  createBadge(badge: InsertBadge): Promise<Badge>;
  updateBadge(id: number, data: Partial<Badge>): Promise<Badge | undefined>;

  // Gamification - User Badges
  getUserBadges(userId: string): Promise<(UserBadge & { badge: Badge })[]>;
  unlockBadge(userId: string, badgeId: number): Promise<UserBadge>;
  getUnnotifiedBadges(userId: string): Promise<(UserBadge & { badge: Badge })[]>;
  markBadgeNotified(userBadgeId: number): Promise<void>;

  // Gamification - Stats
  getUserGamificationStats(userId: string): Promise<{
    completedMissions: number;
    completedTasks: number;
    fiveStarEvaluations: number;
    documentsUploaded: number;
  }>;

  // In-App Notifications
  getInAppNotifications(userId: string): Promise<InAppNotification[]>;
  getUnreadInAppNotifications(userId: string): Promise<InAppNotification[]>;
  getUnreadInAppNotificationCount(userId: string): Promise<number>;
  createInAppNotification(notification: InsertInAppNotification): Promise<InAppNotification>;
  markInAppNotificationAsRead(id: number): Promise<InAppNotification | undefined>;
  markAllInAppNotificationsAsRead(userId: string): Promise<boolean>;

  // Feedback Questionnaires
  getFeedbackQuestionnaire(id: number): Promise<FeedbackQuestionnaire | undefined>;
  getFeedbackQuestionnaireByMission(missionId: number): Promise<FeedbackQuestionnaire | undefined>;
  createFeedbackQuestionnaire(questionnaire: InsertFeedbackQuestionnaire): Promise<FeedbackQuestionnaire>;
  updateFeedbackQuestionnaire(id: number, data: Partial<FeedbackQuestionnaire>): Promise<FeedbackQuestionnaire | undefined>;

  // Feedback Questions
  getFeedbackQuestions(questionnaireId: number): Promise<FeedbackQuestion[]>;
  createFeedbackQuestion(question: InsertFeedbackQuestion): Promise<FeedbackQuestion>;
  deleteFeedbackQuestions(questionnaireId: number): Promise<void>;

  // Feedback Response Tokens
  getFeedbackResponseTokenByToken(token: string): Promise<FeedbackResponseToken | undefined>;
  getFeedbackTokenByParticipant(questionnaireId: number, participantId: number): Promise<FeedbackResponseToken | undefined>;
  getFeedbackTokensByQuestionnaire(questionnaireId: number): Promise<FeedbackResponseToken[]>;
  createFeedbackResponseToken(token: InsertFeedbackResponseToken): Promise<FeedbackResponseToken>;
  updateFeedbackResponseToken(id: number, data: Partial<FeedbackResponseToken>): Promise<FeedbackResponseToken | undefined>;

  // Feedback Responses
  getFeedbackResponsesByToken(tokenId: number): Promise<FeedbackResponse[]>;
  getFeedbackResponsesByQuestion(questionId: number): Promise<FeedbackResponse[]>;
  createFeedbackResponse(response: InsertFeedbackResponse): Promise<FeedbackResponse>;

  // Personal Notes
  // Task Deadline Defaults
  getTaskDeadlineDefaults(): Promise<TaskDeadlineDefault[]>;
  getTaskDeadlineDefaultByTitle(taskTitle: string): Promise<TaskDeadlineDefault | undefined>;
  createTaskDeadlineDefault(data: InsertTaskDeadlineDefault): Promise<TaskDeadlineDefault>;
  updateTaskDeadlineDefault(id: number, data: Partial<TaskDeadlineDefault>): Promise<TaskDeadlineDefault | undefined>;
  deleteTaskDeadlineDefault(id: number): Promise<boolean>;

  getPersonalNotes(userId: string): Promise<PersonalNote[]>;
  getPersonalNote(id: number): Promise<PersonalNote | undefined>;
  createPersonalNote(note: InsertPersonalNote): Promise<PersonalNote>;
  updatePersonalNote(id: number, data: Partial<PersonalNote>): Promise<PersonalNote | undefined>;
  deletePersonalNote(id: number): Promise<boolean>;

  // Task Alerts (admin dashboard - late + priority tasks)
  getTaskAlerts(): Promise<{
    lateTasks: Array<{
      stepId: number;
      stepTitle: string;
      stepStatus: string;
      dueDate: string | null;
      missionId: number;
      missionTitle: string;
      assigneeId: string;
      assigneeFirstName: string | null;
      assigneeLastName: string | null;
      assigneeRole: string;
      daysOverdue: number;
    }>;
    priorityTasks: Array<{
      stepId: number;
      stepTitle: string;
      stepStatus: string;
      dueDate: string | null;
      missionId: number;
      missionTitle: string;
      assigneeId: string;
      assigneeFirstName: string | null;
      assigneeLastName: string | null;
      assigneeRole: string;
      daysOverdue: number;
    }>;
    missingDocuments: Array<{
      documentId: number;
      documentTitle: string;
      documentType: string;
      missionId: number;
      missionTitle: string;
      trainerId: string;
      trainerFirstName: string | null;
      trainerLastName: string | null;
      templateTitle: string;
    }>;
  }>;

  getMissionTasksProgress(): Promise<Array<{
    missionId: number;
    missionTitle: string;
    assigneeFirstName: string | null;
    assigneeLastName: string | null;
    assigneeRole: string;
    totalSteps: number;
    completedSteps: number;
    progress: number;
    updatedAt: string | null;
  }>>;

  // Trainer Delays (admin dashboard)
  getTrainerDelays(): Promise<{
    lateSteps: Array<{
      stepId: number;
      stepTitle: string;
      missionId: number;
      missionTitle: string;
      trainerId: string;
      trainerFirstName: string | null;
      trainerLastName: string | null;
      dueDate: string;
      daysOverdue: number;
    }>;
    missingDocuments: Array<{
      documentId: number;
      documentTitle: string;
      documentType: string;
      missionId: number;
      missionTitle: string;
      trainerId: string;
      trainerFirstName: string | null;
      trainerLastName: string | null;
      templateTitle: string;
    }>;
  }>;
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
      .where(sql`${users.role} IN ('formateur', 'prestataire') AND ${users.status} = 'ACTIF'`)
      .orderBy(users.lastName);
  }

  async getUsersByRole(role: string): Promise<User[]> {
    return await db.select().from(users)
      .where(sql`${users.role} = ${role} AND ${users.status} = 'ACTIF'`)
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
      status: userData.status || 'ACTIF',
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

  async updateUserStreak(userId: string, streakDays: number, lastActivityDate: Date): Promise<User | undefined> {
    const [updated] = await db.update(users)
      .set({
        streakDays,
        lastActivityDate,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId))
      .returning();
    return updated;
  }

  // ==================== PASSWORD RESET TOKENS ====================
  async createPasswordResetToken(userId: string, ttlMs: number = 60 * 60 * 1000): Promise<PasswordResetToken> {
    const crypto = await import('crypto');
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + ttlMs);

    // Delete any existing tokens for this user
    await db.delete(passwordResetTokens).where(eq(passwordResetTokens.userId, userId));

    const [newToken] = await db.insert(passwordResetTokens).values({
      userId,
      token,
      expiresAt,
    }).returning();

    return newToken;
  }

  async getPasswordResetToken(token: string): Promise<PasswordResetToken | undefined> {
    const [resetToken] = await db.select()
      .from(passwordResetTokens)
      .where(eq(passwordResetTokens.token, token));
    return resetToken;
  }

  async markTokenAsUsed(token: string): Promise<void> {
    await db.update(passwordResetTokens)
      .set({ used: true })
      .where(eq(passwordResetTokens.token, token));
  }

  async deleteExpiredTokens(): Promise<void> {
    await db.delete(passwordResetTokens)
      .where(sql`${passwordResetTokens.expiresAt} < NOW() OR ${passwordResetTokens.used} = true`);
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
    // Récupérer les missions où le formateur est assigné directement (trainerId)
    // OU via la table missionTrainers (multi-formateurs)
    const directMissions = await db.select().from(missions)
      .where(eq(missions.trainerId, trainerId));

    const linkedMissions = await db.select({ mission: missions })
      .from(missionTrainers)
      .innerJoin(missions, eq(missionTrainers.missionId, missions.id))
      .where(eq(missionTrainers.trainerId, trainerId));

    // Combiner et dédupliquer les missions
    const allMissions = [
      ...directMissions,
      ...linkedMissions.map(m => m.mission)
    ];

    // Dédupliquer par ID
    const uniqueMissions = Array.from(
      new Map(allMissions.map(m => [m.id, m])).values()
    );

    // Trier par date de début (plus récent en premier)
    return uniqueMissions.sort((a, b) => {
      const dateA = a.startDate ? new Date(a.startDate).getTime() : 0;
      const dateB = b.startDate ? new Date(b.startDate).getTime() : 0;
      return dateB - dateA;
    });
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
    const result = await this.duplicateMissionForMultipleTrainers(originalMissionId, [newTrainerId]);
    if (result.created.length > 0) {
      return result.created[0];
    }
    if (result.errors.length > 0) {
      throw new Error(result.errors[0].error);
    }
    return undefined;
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

        const [newMission] = await db.insert(missions).values({
          ...missionData,
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

        // Copy all sessions
        const originalSessions = await this.getMissionSessions(originalMissionId);
        for (const session of originalSessions) {
          const { id: sessionId, missionId: sessionMissionId, ...sessionData } = session;
          await this.createMissionSession({
            ...sessionData,
            missionId: newMission.id,
          });
        }

        // Copy all participants
        const originalParticipants = await this.getMissionParticipants(originalMissionId);
        for (const mp of originalParticipants) {
          await this.addParticipantToMission({
            missionId: newMission.id,
            participantId: mp.participantId,
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

  // Helper: delete uploaded files from disk
  private deleteUploadedFile(fileUrl: string) {
    if (!fileUrl || !fileUrl.startsWith('/uploads/')) return;
    try {
      const filePath = path.join(process.cwd(), fileUrl);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (err) {
      console.error(`[storage] Failed to delete file ${fileUrl}:`, err);
    }
  }

  async deleteMission(id: number): Promise<boolean> {
    // Delete all related records before deleting the mission itself
    // Order matters: delete child tables before parent tables to avoid FK constraint violations.

    // inAppNotifications references reminders, so delete first
    await db.delete(inAppNotifications).where(eq(inAppNotifications.missionId, id));
    // reminders references missionSteps (taskId), so delete before missionSteps
    await db.delete(reminders).where(eq(reminders.missionId, id));

    // attendanceRecords references missionSessions (sessionId), so delete before missionSessions
    await db.delete(attendanceRecords).where(eq(attendanceRecords.missionId, id));
    await db.delete(missionSessions).where(eq(missionSessions.missionId, id));

    // Steps and their tasks
    const steps = await this.getMissionSteps(id);
    for (const step of steps) {
      await db.delete(stepTasks).where(eq(stepTasks.stepId, step.id));
    }
    await db.delete(missionSteps).where(eq(missionSteps.missionId, id));

    await db.delete(missionClients).where(eq(missionClients.missionId, id));
    await db.delete(missionTrainers).where(eq(missionTrainers.missionId, id));
    await db.delete(missionParticipants).where(eq(missionParticipants.missionId, id));
    await db.delete(evaluations).where(eq(evaluations.missionId, id));
    await db.delete(invoices).where(eq(invoices.missionId, id));

    // Delete uploaded files from disk before removing document records
    const missionDocs = await this.getDocumentsByMission(id);
    for (const doc of missionDocs) {
      this.deleteUploadedFile(doc.url);
    }
    await db.delete(documents).where(eq(documents.missionId, id));
    await db.delete(messages).where(eq(messages.missionId, id));
    await db.delete(clientInvoices).where(eq(clientInvoices.missionId, id));

    // Feedback: responses -> tokens -> questions -> questionnaires
    const questionnaires = await db.select().from(feedbackQuestionnaires)
      .where(eq(feedbackQuestionnaires.missionId, id));
    for (const q of questionnaires) {
      const tokens = await db.select().from(feedbackResponseTokens)
        .where(eq(feedbackResponseTokens.questionnaireId, q.id));
      for (const t of tokens) {
        await db.delete(feedbackResponses).where(eq(feedbackResponses.tokenId, t.id));
      }
      await db.delete(feedbackResponseTokens).where(eq(feedbackResponseTokens.questionnaireId, q.id));
      await db.delete(feedbackQuestions).where(eq(feedbackQuestions.questionnaireId, q.id));
    }
    await db.delete(feedbackQuestionnaires).where(eq(feedbackQuestionnaires.missionId, id));

    // Delete child missions (duplications)
    const children = await db.select().from(missions).where(eq(missions.parentMissionId, id));
    for (const child of children) {
      await this.deleteMission(child.id);
    }

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

    // Auto-attach template documents to the new trainer
    await this.attachTemplateDocumentsToMission(data.missionId, data.trainerId);

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
    // First delete all reminders referencing this step
    await db.delete(reminders).where(eq(reminders.taskId, id));
    // Then delete all tasks associated with this step
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
  async getAllMissionSessions(): Promise<MissionSession[]> {
    return await db.select().from(missionSessions)
      .orderBy(missionSessions.sessionDate);
  }

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
      positioningQuestionnaireSentAt: missionParticipants.positioningQuestionnaireSentAt,
      positioningQuestionnaireReceivedAt: missionParticipants.positioningQuestionnaireReceivedAt,
      evaluationSentAt: missionParticipants.evaluationSentAt,
      evaluationReceivedAt: missionParticipants.evaluationReceivedAt,
      participant: participants,
    })
      .from(missionParticipants)
      .innerJoin(participants, eq(missionParticipants.participantId, participants.id))
      .where(eq(missionParticipants.missionId, missionId));

    return results;
  }

  async getMissionParticipantsByParticipant(participantId: number): Promise<MissionParticipant[]> {
    return await db.select()
      .from(missionParticipants)
      .where(eq(missionParticipants.participantId, participantId));
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
    const doc = await this.getDocument(id);
    if (doc?.url) {
      this.deleteUploadedFile(doc.url);
    }
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

  async getActiveDocumentTemplatesByRole(role: string, clientId?: number, typology?: string): Promise<DocumentTemplate[]> {
    // Build typology filter: match templates with forTypology NULL (global) or equal to the mission's typology
    const typologyFilter = typology
      ? sql`(${documentTemplates.forTypology} IS NULL OR ${documentTemplates.forTypology} = ${typology})`
      : sql`${documentTemplates.forTypology} IS NULL`;

    // If clientId is provided, get both global templates and templates for that client
    if (clientId) {
      return await db.select().from(documentTemplates)
        .where(and(
          eq(documentTemplates.isActive, true),
          eq(documentTemplates.forRole, role),
          sql`(${documentTemplates.clientId} IS NULL OR ${documentTemplates.clientId} = ${clientId})`,
          typologyFilter
        ));
    }

    // Otherwise, get only global templates (clientId is null)
    return await db.select().from(documentTemplates)
      .where(and(
        eq(documentTemplates.isActive, true),
        eq(documentTemplates.forRole, role),
        sql`${documentTemplates.clientId} IS NULL`,
        typologyFilter
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
      const uniqueUserIds = Array.from(new Set(affectedUserIds));
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

    // Get appropriate templates based on trainer role, client, and mission typology
    const typology = mission?.typology || undefined;
    const templates = await this.getActiveDocumentTemplatesByRole(trainer.role, clientId || undefined, typology);

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

  // ==================== GAMIFICATION - XP TRANSACTIONS ====================
  async createXPTransaction(transaction: InsertXPTransaction): Promise<XPTransaction> {
    const [newTransaction] = await db.insert(xpTransactions).values(transaction).returning();
    return newTransaction;
  }

  async getXPTransactions(userId: string): Promise<XPTransaction[]> {
    return await db.select().from(xpTransactions)
      .where(eq(xpTransactions.userId, userId))
      .orderBy(desc(xpTransactions.createdAt));
  }

  async getRecentXPTransactions(userId: string, limit: number): Promise<XPTransaction[]> {
    return await db.select().from(xpTransactions)
      .where(eq(xpTransactions.userId, userId))
      .orderBy(desc(xpTransactions.createdAt))
      .limit(limit);
  }

  // ==================== GAMIFICATION - BADGES ====================
  async getBadges(): Promise<Badge[]> {
    return await db.select().from(badges)
      .where(eq(badges.isActive, true))
      .orderBy(badges.category, badges.conditionValue);
  }

  async getBadge(id: number): Promise<Badge | undefined> {
    const [badge] = await db.select().from(badges).where(eq(badges.id, id));
    return badge;
  }

  async createBadge(badge: InsertBadge): Promise<Badge> {
    const [newBadge] = await db.insert(badges).values(badge).returning();
    return newBadge;
  }

  async updateBadge(id: number, data: Partial<Badge>): Promise<Badge | undefined> {
    const [updated] = await db.update(badges)
      .set(data)
      .where(eq(badges.id, id))
      .returning();
    return updated;
  }

  // ==================== GAMIFICATION - USER BADGES ====================
  async getUserBadges(userId: string): Promise<(UserBadge & { badge: Badge })[]> {
    const results = await db.select({
      id: userBadges.id,
      userId: userBadges.userId,
      badgeId: userBadges.badgeId,
      unlockedAt: userBadges.unlockedAt,
      notified: userBadges.notified,
      badge: badges,
    })
      .from(userBadges)
      .innerJoin(badges, eq(userBadges.badgeId, badges.id))
      .where(eq(userBadges.userId, userId))
      .orderBy(desc(userBadges.unlockedAt));
    return results;
  }

  async unlockBadge(userId: string, badgeId: number): Promise<UserBadge> {
    const [userBadge] = await db.insert(userBadges).values({
      userId,
      badgeId,
      notified: false,
    }).returning();
    return userBadge;
  }

  async getUnnotifiedBadges(userId: string): Promise<(UserBadge & { badge: Badge })[]> {
    const results = await db.select({
      id: userBadges.id,
      userId: userBadges.userId,
      badgeId: userBadges.badgeId,
      unlockedAt: userBadges.unlockedAt,
      notified: userBadges.notified,
      badge: badges,
    })
      .from(userBadges)
      .innerJoin(badges, eq(userBadges.badgeId, badges.id))
      .where(and(
        eq(userBadges.userId, userId),
        eq(userBadges.notified, false)
      ))
      .orderBy(desc(userBadges.unlockedAt));
    return results;
  }

  async markBadgeNotified(userBadgeId: number): Promise<void> {
    await db.update(userBadges)
      .set({ notified: true })
      .where(eq(userBadges.id, userBadgeId));
  }

  // ==================== GAMIFICATION - STATS ====================
  async getUserGamificationStats(userId: string): Promise<{
    completedMissions: number;
    completedTasks: number;
    fiveStarEvaluations: number;
    documentsUploaded: number;
  }> {
    // Count completed missions
    const completedMissions = await db.select()
      .from(missions)
      .where(and(
        eq(missions.trainerId, userId),
        eq(missions.status, 'completed')
      ));

    // Count completed tasks (steps)
    const completedTasks = await db.select()
      .from(missionSteps)
      .innerJoin(missions, eq(missionSteps.missionId, missions.id))
      .where(and(
        eq(missions.trainerId, userId),
        eq(missionSteps.isCompleted, true)
      ));

    // Count 5-star evaluations
    const fiveStarEvaluations = await db.select()
      .from(evaluations)
      .where(eq(evaluations.overallRating, 5));

    // Count documents uploaded by user
    const documentsUploaded = await db.select()
      .from(documents)
      .where(eq(documents.userId, userId));

    return {
      completedMissions: completedMissions.length,
      completedTasks: completedTasks.length,
      fiveStarEvaluations: fiveStarEvaluations.length,
      documentsUploaded: documentsUploaded.length,
    };
  }

  // ==================== IN-APP NOTIFICATIONS ====================
  async getInAppNotifications(userId: string): Promise<InAppNotification[]> {
    return await db.select().from(inAppNotifications)
      .where(eq(inAppNotifications.userId, userId))
      .orderBy(desc(inAppNotifications.createdAt));
  }

  async getUnreadInAppNotifications(userId: string): Promise<InAppNotification[]> {
    return await db.select().from(inAppNotifications)
      .where(and(
        eq(inAppNotifications.userId, userId),
        eq(inAppNotifications.isRead, false)
      ))
      .orderBy(desc(inAppNotifications.createdAt));
  }

  async getUnreadInAppNotificationCount(userId: string): Promise<number> {
    const result = await db.select({ count: sql<number>`count(*)` })
      .from(inAppNotifications)
      .where(and(
        eq(inAppNotifications.userId, userId),
        eq(inAppNotifications.isRead, false)
      ));
    return result[0]?.count || 0;
  }

  async createInAppNotification(notification: InsertInAppNotification): Promise<InAppNotification> {
    const [newNotification] = await db.insert(inAppNotifications).values(notification).returning();
    return newNotification;
  }

  async markInAppNotificationAsRead(id: number): Promise<InAppNotification | undefined> {
    const [updated] = await db.update(inAppNotifications)
      .set({ isRead: true, readAt: new Date() })
      .where(eq(inAppNotifications.id, id))
      .returning();
    return updated;
  }

  async markAllInAppNotificationsAsRead(userId: string): Promise<boolean> {
    await db.update(inAppNotifications)
      .set({ isRead: true, readAt: new Date() })
      .where(and(
        eq(inAppNotifications.userId, userId),
        eq(inAppNotifications.isRead, false)
      ));
    return true;
  }

  // ==================== FEEDBACK QUESTIONNAIRES ====================
  async getFeedbackQuestionnaire(id: number): Promise<FeedbackQuestionnaire | undefined> {
    const [questionnaire] = await db.select().from(feedbackQuestionnaires).where(eq(feedbackQuestionnaires.id, id));
    return questionnaire;
  }

  async getFeedbackQuestionnaireByMission(missionId: number): Promise<FeedbackQuestionnaire | undefined> {
    const [questionnaire] = await db.select().from(feedbackQuestionnaires).where(eq(feedbackQuestionnaires.missionId, missionId));
    return questionnaire;
  }

  async createFeedbackQuestionnaire(questionnaire: InsertFeedbackQuestionnaire): Promise<FeedbackQuestionnaire> {
    const [created] = await db.insert(feedbackQuestionnaires).values(questionnaire).returning();
    return created;
  }

  async updateFeedbackQuestionnaire(id: number, data: Partial<FeedbackQuestionnaire>): Promise<FeedbackQuestionnaire | undefined> {
    const [updated] = await db.update(feedbackQuestionnaires)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(feedbackQuestionnaires.id, id))
      .returning();
    return updated;
  }

  // ==================== FEEDBACK QUESTIONS ====================
  async getFeedbackQuestions(questionnaireId: number): Promise<FeedbackQuestion[]> {
    return await db.select().from(feedbackQuestions)
      .where(eq(feedbackQuestions.questionnaireId, questionnaireId))
      .orderBy(feedbackQuestions.order);
  }

  async createFeedbackQuestion(question: InsertFeedbackQuestion): Promise<FeedbackQuestion> {
    const [created] = await db.insert(feedbackQuestions).values({
      ...question,
      options: question.options ? [...question.options] : null,
    }).returning();
    return created;
  }

  async deleteFeedbackQuestions(questionnaireId: number): Promise<void> {
    await db.delete(feedbackQuestions).where(eq(feedbackQuestions.questionnaireId, questionnaireId));
  }

  // ==================== FEEDBACK RESPONSE TOKENS ====================
  async getFeedbackResponseTokenByToken(token: string): Promise<FeedbackResponseToken | undefined> {
    const [responseToken] = await db.select().from(feedbackResponseTokens).where(eq(feedbackResponseTokens.token, token));
    return responseToken;
  }

  async getFeedbackTokenByParticipant(questionnaireId: number, participantId: number): Promise<FeedbackResponseToken | undefined> {
    const [token] = await db.select().from(feedbackResponseTokens)
      .where(and(
        eq(feedbackResponseTokens.questionnaireId, questionnaireId),
        eq(feedbackResponseTokens.participantId, participantId)
      ));
    return token;
  }

  async getFeedbackTokensByQuestionnaire(questionnaireId: number): Promise<FeedbackResponseToken[]> {
    return await db.select().from(feedbackResponseTokens)
      .where(eq(feedbackResponseTokens.questionnaireId, questionnaireId));
  }

  async createFeedbackResponseToken(token: InsertFeedbackResponseToken): Promise<FeedbackResponseToken> {
    const [created] = await db.insert(feedbackResponseTokens).values(token).returning();
    return created;
  }

  async updateFeedbackResponseToken(id: number, data: Partial<FeedbackResponseToken>): Promise<FeedbackResponseToken | undefined> {
    const [updated] = await db.update(feedbackResponseTokens)
      .set(data)
      .where(eq(feedbackResponseTokens.id, id))
      .returning();
    return updated;
  }

  // ==================== FEEDBACK RESPONSES ====================
  async getFeedbackResponsesByToken(tokenId: number): Promise<FeedbackResponse[]> {
    return await db.select().from(feedbackResponses).where(eq(feedbackResponses.tokenId, tokenId));
  }

  async getFeedbackResponsesByQuestion(questionId: number): Promise<FeedbackResponse[]> {
    return await db.select().from(feedbackResponses).where(eq(feedbackResponses.questionId, questionId));
  }

  async createFeedbackResponse(response: InsertFeedbackResponse): Promise<FeedbackResponse> {
    const [created] = await db.insert(feedbackResponses).values({
      ...response,
      selectedOptions: response.selectedOptions ? [...response.selectedOptions] : null,
    }).returning();
    return created;
  }

  // ==================== COMPANY SETTINGS ====================
  async getCompanySettings(): Promise<CompanySettings | undefined> {
    const [settings] = await db.select().from(companySettings).limit(1);
    return settings;
  }

  async updateCompanySettings(data: Partial<CompanySettings>): Promise<CompanySettings> {
    const existing = await this.getCompanySettings();
    if (existing) {
      const [updated] = await db.update(companySettings)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(companySettings.id, existing.id))
        .returning();
      return updated;
    } else {
      const [created] = await db.insert(companySettings)
        .values(data as InsertCompanySettings)
        .returning();
      return created;
    }
  }

  // ==================== CLIENT CONTRACTS ====================
  async getClientContracts(): Promise<ClientContract[]> {
    return await db.select().from(clientContracts).orderBy(desc(clientContracts.createdAt));
  }

  async getClientContractsByClient(clientId: number): Promise<ClientContract[]> {
    return await db.select().from(clientContracts)
      .where(eq(clientContracts.clientId, clientId))
      .orderBy(desc(clientContracts.createdAt));
  }

  async getClientContract(id: number): Promise<ClientContract | undefined> {
    const [contract] = await db.select().from(clientContracts).where(eq(clientContracts.id, id));
    return contract;
  }

  async createClientContract(contract: InsertClientContract): Promise<ClientContract> {
    const [created] = await db.insert(clientContracts).values(contract).returning();
    return created;
  }

  async updateClientContract(id: number, data: Partial<ClientContract>): Promise<ClientContract | undefined> {
    const [updated] = await db.update(clientContracts)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(clientContracts.id, id))
      .returning();
    return updated;
  }

  async deleteClientContract(id: number): Promise<boolean> {
    await db.delete(clientContracts).where(eq(clientContracts.id, id));
    return true;
  }

  async getNextContractNumber(): Promise<string> {
    const settings = await this.getCompanySettings();
    const prefix = settings?.contractPrefix || 'CTR';
    const year = new Date().getFullYear();

    const contracts = await db.select().from(clientContracts)
      .where(sql`EXTRACT(YEAR FROM ${clientContracts.createdAt}) = ${year}`)
      .orderBy(desc(clientContracts.id));

    const nextNumber = (contracts.length + 1).toString().padStart(4, '0');
    return `${prefix}-${year}-${nextNumber}`;
  }

  // ==================== CLIENT INVOICES ====================
  async getClientInvoices(): Promise<ClientInvoice[]> {
    return await db.select().from(clientInvoices).orderBy(desc(clientInvoices.createdAt));
  }

  async getClientInvoicesByClient(clientId: number): Promise<ClientInvoice[]> {
    return await db.select().from(clientInvoices)
      .where(eq(clientInvoices.clientId, clientId))
      .orderBy(desc(clientInvoices.createdAt));
  }

  async getClientInvoice(id: number): Promise<ClientInvoice | undefined> {
    const [invoice] = await db.select().from(clientInvoices).where(eq(clientInvoices.id, id));
    return invoice;
  }

  async createClientInvoice(invoice: InsertClientInvoice): Promise<ClientInvoice> {
    const [created] = await db.insert(clientInvoices).values(invoice as any).returning();
    return created;
  }

  async updateClientInvoice(id: number, data: Partial<ClientInvoice>): Promise<ClientInvoice | undefined> {
    const [updated] = await db.update(clientInvoices)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(clientInvoices.id, id))
      .returning();
    return updated;
  }

  async deleteClientInvoice(id: number): Promise<boolean> {
    await db.delete(clientInvoices).where(eq(clientInvoices.id, id));
    return true;
  }

  async getNextInvoiceNumber(): Promise<string> {
    const settings = await this.getCompanySettings();
    const prefix = settings?.invoicePrefix || 'FAC';
    const year = new Date().getFullYear();

    const invoicesList = await db.select().from(clientInvoices)
      .where(sql`EXTRACT(YEAR FROM ${clientInvoices.createdAt}) = ${year}`)
      .orderBy(desc(clientInvoices.id));

    const nextNumber = (invoicesList.length + 1).toString().padStart(4, '0');
    return `${prefix}-${year}-${nextNumber}`;
  }

  // ==================== PERSONAL NOTES ====================
  // ==================== TASK DEADLINE DEFAULTS ====================
  async getTaskDeadlineDefaults(): Promise<TaskDeadlineDefault[]> {
    return await db.select().from(taskDeadlineDefaults).orderBy(taskDeadlineDefaults.category, taskDeadlineDefaults.taskTitle);
  }

  async getTaskDeadlineDefaultByTitle(taskTitle: string): Promise<TaskDeadlineDefault | undefined> {
    const [result] = await db.select().from(taskDeadlineDefaults).where(eq(taskDeadlineDefaults.taskTitle, taskTitle));
    return result;
  }

  async createTaskDeadlineDefault(data: InsertTaskDeadlineDefault): Promise<TaskDeadlineDefault> {
    const [created] = await db.insert(taskDeadlineDefaults).values(data).returning();
    return created;
  }

  async updateTaskDeadlineDefault(id: number, data: Partial<TaskDeadlineDefault>): Promise<TaskDeadlineDefault | undefined> {
    const [updated] = await db.update(taskDeadlineDefaults)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(taskDeadlineDefaults.id, id))
      .returning();
    return updated;
  }

  async deleteTaskDeadlineDefault(id: number): Promise<boolean> {
    await db.delete(taskDeadlineDefaults).where(eq(taskDeadlineDefaults.id, id));
    return true;
  }

  // ==================== PERSONAL NOTES ====================
  async getPersonalNotes(userId: string): Promise<PersonalNote[]> {
    return db.select()
      .from(personalNotes)
      .where(eq(personalNotes.userId, userId))
      .orderBy(desc(personalNotes.isPinned), desc(personalNotes.updatedAt));
  }

  async getPersonalNote(id: number): Promise<PersonalNote | undefined> {
    const [note] = await db.select().from(personalNotes).where(eq(personalNotes.id, id));
    return note;
  }

  async createPersonalNote(note: InsertPersonalNote): Promise<PersonalNote> {
    const [created] = await db.insert(personalNotes).values(note).returning();
    return created;
  }

  async updatePersonalNote(id: number, data: Partial<PersonalNote>): Promise<PersonalNote | undefined> {
    const [updated] = await db.update(personalNotes)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(personalNotes.id, id))
      .returning();
    return updated;
  }

  async deletePersonalNote(id: number): Promise<boolean> {
    await db.delete(personalNotes).where(eq(personalNotes.id, id));
    return true;
  }

  // ==================== TASK ALERTS (ADMIN DASHBOARD) ====================
  async getTaskAlerts(): Promise<{
    lateTasks: Array<{
      stepId: number;
      stepTitle: string;
      stepStatus: string;
      dueDate: string | null;
      missionId: number;
      missionTitle: string;
      assigneeId: string;
      assigneeFirstName: string | null;
      assigneeLastName: string | null;
      assigneeRole: string;
      daysOverdue: number;
    }>;
    priorityTasks: Array<{
      stepId: number;
      stepTitle: string;
      stepStatus: string;
      dueDate: string | null;
      missionId: number;
      missionTitle: string;
      assigneeId: string;
      assigneeFirstName: string | null;
      assigneeLastName: string | null;
      assigneeRole: string;
      daysOverdue: number;
    }>;
    missingDocuments: Array<{
      documentId: number;
      documentTitle: string;
      documentType: string;
      missionId: number;
      missionTitle: string;
      trainerId: string;
      trainerFirstName: string | null;
      trainerLastName: string | null;
      templateTitle: string;
    }>;
  }> {
    // Query: All late + priority tasks with assignee info
    const tasksResult = await db.execute(sql`
      SELECT
        ms.id AS "stepId",
        ms.title AS "stepTitle",
        ms.status AS "stepStatus",
        ms.due_date AS "dueDate",
        m.id AS "missionId",
        m.title AS "missionTitle",
        COALESCE(u.id, t.id) AS "assigneeId",
        COALESCE(u.first_name, t.first_name) AS "assigneeFirstName",
        COALESCE(u.last_name, t.last_name) AS "assigneeLastName",
        COALESCE(u.role, t.role) AS "assigneeRole",
        CASE WHEN ms.due_date < NOW() THEN EXTRACT(DAY FROM NOW() - ms.due_date)::int ELSE 0 END AS "daysOverdue"
      FROM mission_steps ms
      JOIN missions m ON ms.mission_id = m.id
      LEFT JOIN users u ON ms.assignee_id = u.id
      LEFT JOIN users t ON m.trainer_id = t.id
      WHERE ms.is_completed = false
        AND ms.status NOT IN ('done', 'na')
        AND (ms.status IN ('late', 'priority') OR ms.due_date < NOW())
        AND m.status NOT IN ('draft', 'cancelled', 'completed')
      ORDER BY
        CASE WHEN ms.status = 'late' OR ms.due_date < NOW() THEN 1 ELSE 2 END,
        ms.due_date ASC NULLS LAST
      LIMIT 50
    `);

    // Query: Missing documents (same as getTrainerDelays)
    const missingDocsResult = await db.execute(sql`
      SELECT
        d.id AS "documentId",
        d.title AS "documentTitle",
        d.type AS "documentType",
        m.id AS "missionId",
        m.title AS "missionTitle",
        u.id AS "trainerId",
        u.first_name AS "trainerFirstName",
        u.last_name AS "trainerLastName",
        dt.title AS "templateTitle"
      FROM documents d
      JOIN document_templates dt ON d.template_id = dt.id
      JOIN missions m ON d.mission_id = m.id
      JOIN users u ON m.trainer_id = u.id
      WHERE d.template_id IS NOT NULL
        AND d.url = dt.url
        AND m.status NOT IN ('draft', 'cancelled', 'completed')
      ORDER BY m.title ASC
      LIMIT 50
    `);

    const rows = (tasksResult.rows || []) as any[];
    const lateTasks = rows
      .filter((r: any) => r.stepStatus === 'late' || (r.dueDate && new Date(r.dueDate) < new Date()))
      .map((row: any) => ({
        stepId: row.stepId,
        stepTitle: row.stepTitle,
        stepStatus: row.stepStatus,
        dueDate: row.dueDate,
        missionId: row.missionId,
        missionTitle: row.missionTitle,
        assigneeId: row.assigneeId,
        assigneeFirstName: row.assigneeFirstName,
        assigneeLastName: row.assigneeLastName,
        assigneeRole: row.assigneeRole,
        daysOverdue: row.daysOverdue,
      }));

    const priorityTasks = rows
      .filter((r: any) => r.stepStatus === 'priority' && !(r.dueDate && new Date(r.dueDate) < new Date()))
      .map((row: any) => ({
        stepId: row.stepId,
        stepTitle: row.stepTitle,
        stepStatus: row.stepStatus,
        dueDate: row.dueDate,
        missionId: row.missionId,
        missionTitle: row.missionTitle,
        assigneeId: row.assigneeId,
        assigneeFirstName: row.assigneeFirstName,
        assigneeLastName: row.assigneeLastName,
        assigneeRole: row.assigneeRole,
        daysOverdue: row.daysOverdue,
      }));

    return {
      lateTasks,
      priorityTasks,
      missingDocuments: (missingDocsResult.rows || []).map((row: any) => ({
        documentId: row.documentId,
        documentTitle: row.documentTitle,
        documentType: row.documentType,
        missionId: row.missionId,
        missionTitle: row.missionTitle,
        trainerId: row.trainerId,
        trainerFirstName: row.trainerFirstName,
        trainerLastName: row.trainerLastName,
        templateTitle: row.templateTitle,
      })),
    };
  }

  // ==================== TRAINER DELAYS (ADMIN DASHBOARD) ====================
  async getTrainerDelays(): Promise<{
    lateSteps: Array<{
      stepId: number;
      stepTitle: string;
      missionId: number;
      missionTitle: string;
      trainerId: string;
      trainerFirstName: string | null;
      trainerLastName: string | null;
      dueDate: string;
      daysOverdue: number;
    }>;
    missingDocuments: Array<{
      documentId: number;
      documentTitle: string;
      documentType: string;
      missionId: number;
      missionTitle: string;
      trainerId: string;
      trainerFirstName: string | null;
      trainerLastName: string | null;
      templateTitle: string;
    }>;
  }> {
    // Query 1: Late steps (due_date < NOW(), not completed, not done/na, active mission)
    const lateStepsResult = await db.execute(sql`
      SELECT
        ms.id AS "stepId",
        ms.title AS "stepTitle",
        m.id AS "missionId",
        m.title AS "missionTitle",
        u.id AS "trainerId",
        u.first_name AS "trainerFirstName",
        u.last_name AS "trainerLastName",
        ms.due_date AS "dueDate",
        EXTRACT(DAY FROM NOW() - ms.due_date)::int AS "daysOverdue"
      FROM mission_steps ms
      JOIN missions m ON ms.mission_id = m.id
      JOIN users u ON m.trainer_id = u.id
      WHERE ms.due_date < NOW()
        AND ms.is_completed = false
        AND ms.status NOT IN ('done', 'na')
        AND m.status NOT IN ('draft', 'cancelled', 'completed')
      ORDER BY ms.due_date ASC
      LIMIT 50
    `);

    // Query 2: Missing documents (template attached but URL still matches template = not uploaded by trainer)
    const missingDocsResult = await db.execute(sql`
      SELECT
        d.id AS "documentId",
        d.title AS "documentTitle",
        d.type AS "documentType",
        m.id AS "missionId",
        m.title AS "missionTitle",
        u.id AS "trainerId",
        u.first_name AS "trainerFirstName",
        u.last_name AS "trainerLastName",
        dt.title AS "templateTitle"
      FROM documents d
      JOIN document_templates dt ON d.template_id = dt.id
      JOIN missions m ON d.mission_id = m.id
      JOIN users u ON m.trainer_id = u.id
      WHERE d.template_id IS NOT NULL
        AND d.url = dt.url
        AND m.status NOT IN ('draft', 'cancelled', 'completed')
      ORDER BY m.title ASC
      LIMIT 50
    `);

    return {
      lateSteps: (lateStepsResult.rows || []).map((row: any) => ({
        stepId: row.stepId,
        stepTitle: row.stepTitle,
        missionId: row.missionId,
        missionTitle: row.missionTitle,
        trainerId: row.trainerId,
        trainerFirstName: row.trainerFirstName,
        trainerLastName: row.trainerLastName,
        dueDate: row.dueDate,
        daysOverdue: row.daysOverdue,
      })),
      missingDocuments: (missingDocsResult.rows || []).map((row: any) => ({
        documentId: row.documentId,
        documentTitle: row.documentTitle,
        documentType: row.documentType,
        missionId: row.missionId,
        missionTitle: row.missionTitle,
        trainerId: row.trainerId,
        trainerFirstName: row.trainerFirstName,
        trainerLastName: row.trainerLastName,
        templateTitle: row.templateTitle,
      })),
    };
  }
  async getMissionTasksProgress(): Promise<Array<{
    missionId: number;
    missionTitle: string;
    assigneeFirstName: string | null;
    assigneeLastName: string | null;
    assigneeRole: string;
    totalSteps: number;
    completedSteps: number;
    progress: number;
    updatedAt: string | null;
  }>> {
    const result = await db.execute(sql`
      SELECT
        m.id AS "missionId",
        m.title AS "missionTitle",
        COALESCE(u.first_name, '') AS "assigneeFirstName",
        COALESCE(u.last_name, '') AS "assigneeLastName",
        COALESCE(u.role, 'formateur') AS "assigneeRole",
        COUNT(ms.id)::int AS "totalSteps",
        COUNT(CASE WHEN ms.is_completed = true OR ms.status = 'done' THEN 1 END)::int AS "completedSteps",
        CASE
          WHEN COUNT(ms.id) = 0 THEN 0
          ELSE ROUND((COUNT(CASE WHEN ms.is_completed = true OR ms.status = 'done' THEN 1 END)::numeric / COUNT(ms.id)::numeric) * 100)::int
        END AS "progress",
        MAX(ms.updated_at)::text AS "updatedAt"
      FROM missions m
      LEFT JOIN mission_steps ms ON ms.mission_id = m.id
      LEFT JOIN users u ON m.trainer_id = u.id
      WHERE m.status NOT IN ('cancelled')
      GROUP BY m.id, m.title, u.first_name, u.last_name, u.role
      HAVING COUNT(ms.id) > 0
      ORDER BY MAX(ms.updated_at) DESC NULLS LAST
      LIMIT 20
    `);

    return (result.rows || []).map((row: any) => ({
      missionId: row.missionId,
      missionTitle: row.missionTitle,
      assigneeFirstName: row.assigneeFirstName,
      assigneeLastName: row.assigneeLastName,
      assigneeRole: row.assigneeRole,
      totalSteps: row.totalSteps,
      completedSteps: row.completedSteps,
      progress: row.progress,
      updatedAt: row.updatedAt,
    }));
  }
}

export const storage = new DatabaseStorage();
