import {
  users, clients, trainingPrograms, missions, missionSteps, missionSessions,
  participants, missionParticipants, attendanceRecords, evaluations, auditLogs,
  invoices, documents, messages,
  type User, type Client, type TrainingProgram, type Mission, type MissionStep,
  type MissionSession, type Participant, type MissionParticipant,
  type AttendanceRecord, type Evaluation, type AuditLog, type Invoice,
  type Document, type Message,
  type InsertClient, type InsertTrainingProgram, type InsertMission,
  type InsertMissionStep, type InsertMissionSession, type InsertParticipant,
  type InsertMissionParticipant, type InsertAttendanceRecord,
  type InsertEvaluation, type InsertInvoice, type InsertDocument,
  type InsertAuditLog, type InsertMessage,
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
  getUsers(): Promise<User[]>;
  getTrainers(): Promise<User[]>;
  updateUser(id: string, data: Partial<User>): Promise<User | undefined>;

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
  updateMissionStatus(id: number, status: MissionStatus): Promise<Mission | undefined>;

  // Mission Steps
  getMissionSteps(missionId: number): Promise<MissionStep[]>;
  createMissionStep(step: InsertMissionStep): Promise<MissionStep>;
  updateMissionStep(id: number, data: Partial<MissionStep>): Promise<MissionStep | undefined>;

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
  deleteDocument(id: number): Promise<boolean>;

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

  async deleteDocument(id: number): Promise<boolean> {
    await db.delete(documents).where(eq(documents.id, id));
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
}

export const storage = new DatabaseStorage();
