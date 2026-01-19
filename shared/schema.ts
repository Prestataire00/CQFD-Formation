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
  passwordHash: varchar("password_hash"),
  profileImageUrl: varchar("profile_image_url"),
  role: text("role").default("subcontractor").notNull(), // admin, formateur, prestataire
  status: text("status").default("active").notNull(), // active, inactive, deleted
  phone: varchar("phone"),
  address: text("address"),
  siret: varchar("siret"), // For prestataires (subcontractors)
  specialties: jsonb("specialties").$type<string[]>(), // Training domains
  dailyRate: integer("daily_rate"), // in cents, for prestataires
  // Gamification fields
  currentLevel: integer("current_level").default(1),
  totalXP: integer("total_xp").default(0),
  streakDays: integer("streak_days").default(0),
  lastActivityDate: timestamp("last_activity_date"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Password reset tokens
export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  token: varchar("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  used: boolean("used").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// --- CRM MODELS ---
export type MissionStatus = 'draft' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
export type InvoiceStatus = 'draft' | 'submitted' | 'paid' | 'rejected';
export type StepStatus = 'todo' | 'priority' | 'late' | 'done' | 'na';
export type LocationType = 'presentiel' | 'distanciel' | 'hybride';

export type ClientContractStatus = 'negotiation' | 'acquired';

export const clients = pgTable("clients", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").default("entreprise").notNull(), // entreprise, opco, particulier, institution
  contractStatus: text("contract_status").default("negotiation").notNull(), // negotiation, acquired
  contractAmount: integer("contract_amount").default(0), // Montant du contrat en centimes
  assignedTrainerId: text("assigned_trainer_id"), // Formateur assigné à ce client
  siret: text("siret"),
  email: text("email"),
  phone: text("phone"),
  address: text("address"),
  city: text("city"),
  postalCode: text("postal_code"),
  contactName: text("contact_name"),
  contactEmail: text("contact_email"),
  contactPhone: text("contact_phone"),
  demand: text("demand"),
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
  reference: text("reference"), // Référence unique de la mission (ex: MISS-2024-001)
  title: text("title").notNull(),
  description: text("description"), // Description de la mission
  status: text("status").default("confirmed").notNull(),
  typology: text("typology").notNull(), // Intra, Inter, Conseil, Conférence
  locationType: text("location_type").default("presentiel"), // presentiel, distanciel, hybride
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  totalHours: integer("total_hours"), // Nombre total d'heures de formation
  location: text("location"),
  trainerId: varchar("trainer_id").references(() => users.id),
  clientId: integer("client_id").references(() => clients.id),
  programId: integer("program_id").references(() => trainingPrograms.id),
  // Multi-trainer duplication fields
  parentMissionId: integer("parent_mission_id"), // Reference to original mission if this is a copy
  isOriginal: boolean("is_original").default(true).notNull(), // true = original, false = copy
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Table de liaison pour les clients multiples par mission
export const missionClients = pgTable("mission_clients", {
  id: serial("id").primaryKey(),
  missionId: integer("mission_id").references(() => missions.id).notNull(),
  clientId: integer("client_id").references(() => clients.id).notNull(),
  isPrimary: boolean("is_primary").default(false).notNull(), // Client principal
  createdAt: timestamp("created_at").defaultNow(),
});

// Table de liaison pour les formateurs multiples par mission
export const missionTrainers = pgTable("mission_trainers", {
  id: serial("id").primaryKey(),
  missionId: integer("mission_id").references(() => missions.id).notNull(),
  trainerId: varchar("trainer_id").references(() => users.id).notNull(),
  isPrimary: boolean("is_primary").default(false).notNull(), // Formateur principal
  createdAt: timestamp("created_at").defaultNow(),
});

export const missionSteps = pgTable("mission_steps", {
  id: serial("id").primaryKey(),
  missionId: integer("mission_id").references(() => missions.id).notNull(),
  title: text("title").notNull(),
  status: text("status").default("todo").notNull(), // todo, priority, late, done, na
  isCompleted: boolean("is_completed").default(false).notNull(),
  order: integer("order").notNull(),
  dueDate: timestamp("due_date"),
  assigneeId: varchar("assignee_id").references(() => users.id),
  comment: text("comment"),
  commentAuthorId: varchar("comment_author_id").references(() => users.id),
  commentUpdatedAt: timestamp("comment_updated_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const stepTasks = pgTable("step_tasks", {
  id: serial("id").primaryKey(),
  stepId: integer("step_id").references(() => missionSteps.id).notNull(),
  title: text("title").notNull(),
  isCompleted: boolean("is_completed").default(false).notNull(),
  comment: text("comment"),
  order: integer("order").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
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
  phone: text("phone"),
  company: text("company"), // Entreprise du participant
  function: text("function"), // Poste/fonction du participant
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
  // Document tracking fields
  positioningQuestionnaireSentAt: timestamp("positioning_questionnaire_sent_at"),
  positioningQuestionnaireReceivedAt: timestamp("positioning_questionnaire_received_at"),
  evaluationSentAt: timestamp("evaluation_sent_at"),
  evaluationReceivedAt: timestamp("evaluation_received_at"),
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
  vatAmount: integer("vat_amount"), // Montant TVA en centimes
  invoiceDate: timestamp("invoice_date"), // Date de la facture
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
  templateId: integer("template_id"), // Reference to document template if this is an auto-attached doc
  createdAt: timestamp("created_at").defaultNow(),
});

// Table pour les templates de documents (documents automatiques)
export const documentTemplates = pgTable("document_templates", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  type: text("type").notNull(), // 'consignes_formateurs', 'cahier_charges', 'bonnes_pratiques'
  forRole: text("for_role").notNull(), // 'formateur' (salarié) ou 'prestataire'
  url: text("url").notNull(), // URL de la dernière version du document
  description: text("description"),
  version: integer("version").default(1).notNull(), // Numéro de version
  clientId: integer("client_id"), // Si null, template global. Si rempli, template custom pour un client
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Table pour l'historique des versions de templates
export const documentTemplateVersions = pgTable("document_template_versions", {
  id: serial("id").primaryKey(),
  templateId: integer("template_id").notNull().references(() => documentTemplates.id, { onDelete: 'cascade' }),
  version: integer("version").notNull(),
  url: text("url").notNull(),
  uploadedBy: varchar("uploaded_by").references(() => users.id),
  changeNotes: text("change_notes"), // Notes sur les changements
  createdAt: timestamp("created_at").defaultNow(),
});

// Table pour les notifications de mise à jour de templates
export const templateNotifications = pgTable("template_notifications", {
  id: serial("id").primaryKey(),
  templateId: integer("template_id").notNull().references(() => documentTemplates.id, { onDelete: 'cascade' }),
  userId: varchar("user_id").notNull().references(() => users.id),
  isRead: boolean("is_read").default(false).notNull(),
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

// --- GAMIFICATION TABLES ---
export type BadgeRarity = 'common' | 'rare' | 'epic' | 'legendary';
export type XPActionType = 'task_completed' | 'mission_completed' | 'five_star_evaluation' | 'document_uploaded' | 'streak_7' | 'streak_30' | 'badge_unlock' | 'bonus';

export const xpTransactions = pgTable("xp_transactions", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  amount: integer("amount").notNull(),
  actionType: text("action_type").notNull(), // task_completed, mission_completed, etc.
  reason: text("reason").notNull(),
  entityType: text("entity_type"), // mission, task, document, etc.
  entityId: integer("entity_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const badges = pgTable("badges", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  icon: text("icon").notNull(), // Emoji or icon name
  category: text("category").notNull(), // missions, tasks, quality, streaks, special
  rarity: text("rarity").default("common").notNull(), // common, rare, epic, legendary
  condition: text("condition").notNull(), // Description of how to unlock
  conditionType: text("condition_type").notNull(), // missions_count, tasks_count, streak_days, etc.
  conditionValue: integer("condition_value").notNull(), // Threshold value
  xpReward: integer("xp_reward").default(0), // XP awarded when unlocked
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const userBadges = pgTable("user_badges", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  badgeId: integer("badge_id").notNull().references(() => badges.id),
  unlockedAt: timestamp("unlocked_at").defaultNow(),
  notified: boolean("notified").default(false).notNull(), // Has user seen the unlock notification?
});

// --- LEGACY MODELS (for backward compatibility) ---
export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  status: text("status").default("active").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  status: text("status").default("pending").notNull(),
  projectId: integer("project_id").references(() => projects.id),
  assigneeId: varchar("assignee_id").references(() => users.id),
  dueDate: timestamp("due_date"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// --- REMINDER SYSTEM ---
// Types de rappels: mission_start (debut formation), task_deadline (deadline tache)
export const reminderSettings = pgTable("reminder_settings", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(), // Ex: "Rappel J-30", "Rappel J-7"
  reminderType: text("reminder_type").notNull(), // mission_start, task_deadline, admin_summary
  daysBefore: integer("days_before").notNull(), // Nombre de jours avant l'evenement
  isActive: boolean("is_active").default(true).notNull(),
  emailSubject: text("email_subject"), // Sujet personnalise
  emailTemplate: text("email_template"), // Template personnalise
  notifyAdmin: boolean("notify_admin").default(false).notNull(),
  notifyTrainer: boolean("notify_trainer").default(false).notNull(),
  notifyClient: boolean("notify_client").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const reminders = pgTable("reminders", {
  id: serial("id").primaryKey(),
  settingId: integer("setting_id").references(() => reminderSettings.id),
  missionId: integer("mission_id").references(() => missions.id),
  taskId: integer("task_id").references(() => missionSteps.id),
  scheduledDate: timestamp("scheduled_date").notNull(), // Date prevue d'envoi
  sentAt: timestamp("sent_at"), // Date d'envoi effectif (null si pas encore envoye)
  status: text("status").default("pending").notNull(), // pending, sent, failed, cancelled
  recipientType: text("recipient_type").notNull(), // admin, trainer, client
  recipientEmail: text("recipient_email"),
  recipientName: text("recipient_name"),
  errorMessage: text("error_message"), // En cas d'echec
  createdAt: timestamp("created_at").defaultNow(),
});

// --- SCHEMAS ---
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true, updatedAt: true });
export const insertClientSchema = createInsertSchema(clients).omit({ id: true, createdAt: true, updatedAt: true });
export const insertTrainingProgramSchema = createInsertSchema(trainingPrograms).omit({ id: true, createdAt: true, updatedAt: true });
export const insertMissionSchema = createInsertSchema(missions).omit({ id: true, createdAt: true, updatedAt: true });
export const insertMissionClientSchema = createInsertSchema(missionClients).omit({ id: true, createdAt: true });
export const insertMissionTrainerSchema = createInsertSchema(missionTrainers).omit({ id: true, createdAt: true });
export const insertMissionStepSchema = createInsertSchema(missionSteps).omit({ id: true, updatedAt: true });
export const insertStepTaskSchema = createInsertSchema(stepTasks).omit({ id: true, createdAt: true, updatedAt: true });
export const insertMissionSessionSchema = createInsertSchema(missionSessions).omit({ id: true });
export const insertParticipantSchema = createInsertSchema(participants).omit({ id: true, createdAt: true, updatedAt: true });
export const insertMissionParticipantSchema = createInsertSchema(missionParticipants).omit({ id: true });
export const insertAttendanceRecordSchema = createInsertSchema(attendanceRecords).omit({ id: true });
export const insertEvaluationSchema = createInsertSchema(evaluations).omit({ id: true, createdAt: true });
export const insertInvoiceSchema = createInsertSchema(invoices).omit({ id: true, createdAt: true, updatedAt: true });
export const insertDocumentSchema = createInsertSchema(documents).omit({ id: true, createdAt: true });
export const insertDocumentTemplateSchema = createInsertSchema(documentTemplates).omit({ id: true, createdAt: true, updatedAt: true });
export const insertDocumentTemplateVersionSchema = createInsertSchema(documentTemplateVersions).omit({ id: true, createdAt: true });
export const insertTemplateNotificationSchema = createInsertSchema(templateNotifications).omit({ id: true, createdAt: true });
export const insertMessageSchema = createInsertSchema(messages).omit({ id: true, createdAt: true });
export const insertAuditLogSchema = createInsertSchema(auditLogs).omit({ id: true, createdAt: true });
export const insertProjectSchema = createInsertSchema(projects).omit({ id: true, createdAt: true, updatedAt: true });
export const insertTaskSchema = createInsertSchema(tasks).omit({ id: true, createdAt: true, updatedAt: true });
export const insertReminderSettingSchema = createInsertSchema(reminderSettings).omit({ id: true, createdAt: true, updatedAt: true });
export const insertReminderSchema = createInsertSchema(reminders).omit({ id: true, createdAt: true });
export const insertXPTransactionSchema = createInsertSchema(xpTransactions).omit({ id: true, createdAt: true });
export const insertBadgeSchema = createInsertSchema(badges).omit({ id: true, createdAt: true });
export const insertUserBadgeSchema = createInsertSchema(userBadges).omit({ id: true, unlockedAt: true });

// --- TYPES ---
export type User = typeof users.$inferSelect;
export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;
export type Client = typeof clients.$inferSelect;
export type TrainingProgram = typeof trainingPrograms.$inferSelect;
export type Mission = typeof missions.$inferSelect;
export type MissionClient = typeof missionClients.$inferSelect;
export type MissionTrainer = typeof missionTrainers.$inferSelect;
export type MissionStep = typeof missionSteps.$inferSelect;
export type StepTask = typeof stepTasks.$inferSelect;
export type MissionSession = typeof missionSessions.$inferSelect;
export type Participant = typeof participants.$inferSelect;
export type MissionParticipant = typeof missionParticipants.$inferSelect;
export type AttendanceRecord = typeof attendanceRecords.$inferSelect;
export type Evaluation = typeof evaluations.$inferSelect;
export type AuditLog = typeof auditLogs.$inferSelect;
export type Invoice = typeof invoices.$inferSelect;
export type Document = typeof documents.$inferSelect;
export type DocumentTemplate = typeof documentTemplates.$inferSelect;
export type DocumentTemplateVersion = typeof documentTemplateVersions.$inferSelect;
export type TemplateNotification = typeof templateNotifications.$inferSelect;
export type Message = typeof messages.$inferSelect;
export type Project = typeof projects.$inferSelect;
export type Task = typeof tasks.$inferSelect;
export type ReminderSetting = typeof reminderSettings.$inferSelect;
export type Reminder = typeof reminders.$inferSelect;
export type XPTransaction = typeof xpTransactions.$inferSelect;
export type Badge = typeof badges.$inferSelect;
export type UserBadge = typeof userBadges.$inferSelect;

export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertClient = z.infer<typeof insertClientSchema>;
export type InsertTrainingProgram = z.infer<typeof insertTrainingProgramSchema>;
export type InsertMission = z.infer<typeof insertMissionSchema>;
export type InsertMissionClient = z.infer<typeof insertMissionClientSchema>;
export type InsertMissionTrainer = z.infer<typeof insertMissionTrainerSchema>;
export type InsertMissionStep = z.infer<typeof insertMissionStepSchema>;
export type InsertStepTask = z.infer<typeof insertStepTaskSchema>;
export type InsertMissionSession = z.infer<typeof insertMissionSessionSchema>;
export type InsertParticipant = z.infer<typeof insertParticipantSchema>;
export type InsertMissionParticipant = z.infer<typeof insertMissionParticipantSchema>;
export type InsertAttendanceRecord = z.infer<typeof insertAttendanceRecordSchema>;
export type InsertEvaluation = z.infer<typeof insertEvaluationSchema>;
export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type InsertDocumentTemplate = z.infer<typeof insertDocumentTemplateSchema>;
export type InsertDocumentTemplateVersion = z.infer<typeof insertDocumentTemplateVersionSchema>;
export type InsertTemplateNotification = z.infer<typeof insertTemplateNotificationSchema>;
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type InsertTask = z.infer<typeof insertTaskSchema>;
export type InsertReminderSetting = z.infer<typeof insertReminderSettingSchema>;
export type InsertReminder = z.infer<typeof insertReminderSchema>;
export type InsertXPTransaction = z.infer<typeof insertXPTransactionSchema>;
export type InsertBadge = z.infer<typeof insertBadgeSchema>;
export type InsertUserBadge = z.infer<typeof insertUserBadgeSchema>;
