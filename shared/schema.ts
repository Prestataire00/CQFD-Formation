import { pgTable, text, serial, integer, boolean, timestamp, jsonb, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { sql } from "drizzle-orm";

// --- AUTH MODELS ---
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  }
);

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: text("role").default("subcontractor").notNull(), // admin, formateur, prestataire
  status: text("status").default("active").notNull(), // active, inactive, deleted
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// --- CRM MODELS ---
export type MissionStatus = 'draft' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
export type InvoiceStatus = 'draft' | 'submitted' | 'paid' | 'rejected';
export type StepStatus = 'todo' | 'priority' | 'late' | 'done' | 'na';

export const clients = pgTable("clients", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone"),
  address: text("address"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const trainingPrograms = pgTable("training_programs", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  code: text("code"),
  type: text("type").notNull(), // Intra, Inter, Conseil, Conférence
  description: text("description"),
  objectives: text("objectives"),
  targetPublic: text("target_public"),
  prerequisites: text("prerequisites"),
  skills: text("skills"),
  pedagogicalMethods: text("pedagogical_methods"),
  duration: text("duration"),
  recommendedParticipants: integer("recommended_participants"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const missions = pgTable("missions", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  status: text("status").default("confirmed").notNull(),
  typology: text("typology").notNull(), // Intra, Inter, Conseil, Conférence
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  location: text("location"),
  trainerId: varchar("trainer_id").references(() => users.id),
  clientId: integer("client_id").references(() => clients.id),
  programId: integer("program_id").references(() => trainingPrograms.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const missionSteps = pgTable("mission_steps", {
  id: serial("id").primaryKey(),
  missionId: integer("mission_id").references(() => missions.id).notNull(),
  title: text("title").notNull(),
  status: text("status").default("todo").notNull(), // todo, priority, late, done, na
  order: integer("order").notNull(),
  dueDate: timestamp("due_date"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const missionSessions = pgTable("mission_sessions", {
  id: serial("id").primaryKey(),
  missionId: integer("mission_id").references(() => missions.id).notNull(),
  sessionDate: timestamp("session_date").notNull(),
  startTime: text("start_time"),
  endTime: text("end_time"),
  location: text("location"),
});

export const participants = pgTable("participants", {
  id: serial("id").primaryKey(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull(),
  function: text("function"),
  clientId: integer("client_id").references(() => clients.id),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const missionParticipants = pgTable("mission_participants", {
  id: serial("id").primaryKey(),
  missionId: integer("mission_id").references(() => missions.id).notNull(),
  participantId: integer("participant_id").references(() => participants.id).notNull(),
  status: text("status").default("registered").notNull(), // registered, attending, completed, absent, abandoned
  registeredAt: timestamp("registered_at").defaultNow(),
  convocationSentAt: timestamp("convocation_sent_at"),
  attendanceValidated: boolean("attendance_validated").default(false),
  certificateGeneratedAt: timestamp("certificate_generated_at"),
});

export const attendanceRecords = pgTable("attendance_records", {
  id: serial("id").primaryKey(),
  missionId: integer("mission_id").references(() => missions.id).notNull(),
  sessionId: integer("session_id").references(() => missionSessions.id).notNull(),
  participantId: integer("participant_id").references(() => participants.id).notNull(),
  isPresent: boolean("is_present").default(false).notNull(),
  signedAt: timestamp("signed_at"),
});

export const evaluations = pgTable("evaluations", {
  id: serial("id").primaryKey(),
  missionId: integer("mission_id").references(() => missions.id).notNull(),
  participantId: integer("participant_id").references(() => participants.id),
  evaluatorId: varchar("evaluator_id").references(() => users.id),
  overallRating: integer("overall_rating"),
  comments: text("comments"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const invoices = pgTable("invoices", {
  id: serial("id").primaryKey(),
  invoiceNumber: text("invoice_number").notNull(),
  amount: integer("amount").notNull(),
  status: text("status").default("draft").notNull(),
  rejectionReason: text("rejection_reason"),
  paidDate: timestamp("paid_date"),
  userId: varchar("user_id").references(() => users.id),
  missionId: integer("mission_id").references(() => missions.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  type: text("type").notNull(), // Programme, Séquençage, Compte rendu, etc.
  url: text("url").notNull(),
  missionId: integer("mission_id").references(() => missions.id).notNull(),
  userId: varchar("user_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  content: text("content").notNull(),
  senderId: varchar("sender_id").references(() => users.id),
  missionId: integer("mission_id").references(() => missions.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id),
  action: text("action").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: text("entity_id"),
  details: jsonb("details"),
  createdAt: timestamp("created_at").defaultNow(),
});

// --- SCHEMAS ---
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true, updatedAt: true });
export const insertClientSchema = createInsertSchema(clients).omit({ id: true, createdAt: true, updatedAt: true });
export const insertTrainingProgramSchema = createInsertSchema(trainingPrograms).omit({ id: true, createdAt: true, updatedAt: true });
export const insertMissionSchema = createInsertSchema(missions).omit({ id: true, createdAt: true, updatedAt: true });
export const insertMissionStepSchema = createInsertSchema(missionSteps).omit({ id: true, updatedAt: true });
export const insertMissionSessionSchema = createInsertSchema(missionSessions).omit({ id: true });
export const insertParticipantSchema = createInsertSchema(participants).omit({ id: true, createdAt: true, updatedAt: true });
export const insertMissionParticipantSchema = createInsertSchema(missionParticipants).omit({ id: true });
export const insertAttendanceRecordSchema = createInsertSchema(attendanceRecords).omit({ id: true });
export const insertEvaluationSchema = createInsertSchema(evaluations).omit({ id: true, createdAt: true });
export const insertInvoiceSchema = createInsertSchema(invoices).omit({ id: true, createdAt: true, updatedAt: true });
export const insertDocumentSchema = createInsertSchema(documents).omit({ id: true, createdAt: true });
export const insertMessageSchema = createInsertSchema(messages).omit({ id: true, createdAt: true });
export const insertAuditLogSchema = createInsertSchema(auditLogs).omit({ id: true, createdAt: true });

// --- TYPES ---
export type User = typeof users.$inferSelect;
export type Client = typeof clients.$inferSelect;
export type TrainingProgram = typeof trainingPrograms.$inferSelect;
export type Mission = typeof missions.$inferSelect;
export type MissionStep = typeof missionSteps.$inferSelect;
export type MissionSession = typeof missionSessions.$inferSelect;
export type Participant = typeof participants.$inferSelect;
export type MissionParticipant = typeof missionParticipants.$inferSelect;
export type AttendanceRecord = typeof attendanceRecords.$inferSelect;
export type Evaluation = typeof evaluations.$inferSelect;
export type AuditLog = typeof auditLogs.$inferSelect;
export type Invoice = typeof invoices.$inferSelect;
export type Document = typeof documents.$inferSelect;
export type Message = typeof messages.$inferSelect;

export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertClient = z.infer<typeof insertClientSchema>;
export type InsertTrainingProgram = z.infer<typeof insertTrainingProgramSchema>;
export type InsertMission = z.infer<typeof insertMissionSchema>;
export type InsertMissionStep = z.infer<typeof insertMissionStepSchema>;
export type InsertMissionSession = z.infer<typeof insertMissionSessionSchema>;
export type InsertParticipant = z.infer<typeof insertParticipantSchema>;
export type InsertMissionParticipant = z.infer<typeof insertMissionParticipantSchema>;
export type InsertAttendanceRecord = z.infer<typeof insertAttendanceRecordSchema>;
export type InsertEvaluation = z.infer<typeof insertEvaluationSchema>;
export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
