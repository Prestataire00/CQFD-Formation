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
  status: text("status").default("ACTIF").notNull(), // ACTIF, INACTIF, SUPPRIME
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

export type ClientContractStatus = 'prospect' | 'negotiation' | 'lost' | 'client';

export const clients = pgTable("clients", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").default(""), // privé, public, particulier
  contractStatus: text("contract_status").default("prospect").notNull(), // prospect, negotiation, lost, client
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
  billingAddress: text("billing_address"),
  billingPostalCode: text("billing_postal_code"),
  billingCity: text("billing_city"),
  trainingAddress: text("training_address"),
  trainingPostalCode: text("training_postal_code"),
  trainingCity: text("training_city"),
  origine: text("origine"),
  socialMedia: text("social_media"),
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
  title: text("title").notNull(),
  description: text("description"), // Description de la mission
  status: text("status").default("confirmed").notNull(),
  typology: text("typology").notNull(), // Intra, Inter, Conseil, Conférence
  locationType: text("location_type").default("presentiel"), // presentiel, distanciel, hybride
  videoLink: text("video_link"), // Lien visioconference (Teams, Zoom, etc.)
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  totalHours: integer("total_hours"), // Nombre total d'heures de formation
  location: text("location"),
  trainerId: varchar("trainer_id").references(() => users.id),
  clientId: integer("client_id").references(() => clients.id),
  programId: integer("program_id").references(() => trainingPrograms.id),
  programTitle: text("program_title"), // Titre du programme en texte libre
  expectedParticipants: integer("expected_participants"), // Nombre de participants prévus
  participantsList: text("participants_list"), // Liste des participants (texte libre)
  hasDisability: boolean("has_disability").default(false), // Situation de handicap signalée
  disabilityDetails: text("disability_details"), // Détails sur la situation de handicap
  rateBase: text("rate_base"), // Base tarifaire (saisie libre)
  financialTerms: text("financial_terms"), // Modalité financière (saisie libre)
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
  lateDate: timestamp("late_date"),
  assigneeId: varchar("assignee_id").references(() => users.id),
  comment: text("comment"),
  commentAuthorId: varchar("comment_author_id").references(() => users.id),
  commentUpdatedAt: timestamp("comment_updated_at"),
  trainerComment: text("trainer_comment"),
  trainerCommentAuthorId: varchar("trainer_comment_author_id").references(() => users.id),
  trainerCommentUpdatedAt: timestamp("trainer_comment_updated_at"),
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
  sessionDate: timestamp("session_date").notNull(), // Date de la session
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

// --- COMPANY SETTINGS (for invoices/contracts) ---
export const companySettings = pgTable("company_settings", {
  id: serial("id").primaryKey(),
  companyName: text("company_name").notNull(),
  legalForm: text("legal_form"), // SARL, SAS, EURL, etc.
  siret: text("siret"),
  tvaNumber: text("tva_number"), // Numéro de TVA intracommunautaire
  address: text("address"),
  city: text("city"),
  postalCode: text("postal_code"),
  phone: text("phone"),
  email: text("email"),
  website: text("website"),
  bankName: text("bank_name"),
  iban: text("iban"),
  bic: text("bic"),
  logoUrl: text("logo_url"),
  invoicePrefix: text("invoice_prefix").default("FAC"),
  contractPrefix: text("contract_prefix").default("CTR"),
  invoiceFooter: text("invoice_footer"), // Mentions légales facture
  contractFooter: text("contract_footer"), // Mentions légales contrat
  updatedAt: timestamp("updated_at").defaultNow(),
});

// --- CLIENT CONTRACTS ---
export type ContractStatus = 'draft' | 'sent' | 'signed' | 'cancelled';

export const clientContracts = pgTable("client_contracts", {
  id: serial("id").primaryKey(),
  contractNumber: text("contract_number").notNull(),
  clientId: integer("client_id").references(() => clients.id).notNull(),
  title: text("title").notNull(),
  description: text("description"),
  content: text("content"), // Contenu du contrat (texte modifiable)
  amount: integer("amount").notNull(), // Montant HT en centimes
  vatRate: integer("vat_rate").default(20), // Taux de TVA en pourcentage
  vatAmount: integer("vat_amount"), // Montant TVA en centimes
  totalAmount: integer("total_amount"), // Montant TTC en centimes
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  status: text("status").default("draft").notNull(), // draft, sent, signed, cancelled
  signedAt: timestamp("signed_at"),
  pdfUrl: text("pdf_url"), // URL du PDF généré
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// --- CLIENT INVOICES (enhanced version) ---
export const clientInvoices = pgTable("client_invoices", {
  id: serial("id").primaryKey(),
  invoiceNumber: text("invoice_number").notNull(),
  clientId: integer("client_id").references(() => clients.id).notNull(),
  contractId: integer("contract_id").references(() => clientContracts.id),
  missionId: integer("mission_id").references(() => missions.id),
  title: text("title").notNull(),
  description: text("description"),
  // Lignes de facturation stockées en JSON
  lineItems: jsonb("line_items").$type<InvoiceLineItem[]>(),
  subtotal: integer("subtotal").notNull(), // Montant HT en centimes
  vatRate: integer("vat_rate").default(20), // Taux de TVA
  vatAmount: integer("vat_amount"), // Montant TVA
  totalAmount: integer("total_amount").notNull(), // Montant TTC
  invoiceDate: timestamp("invoice_date").defaultNow(),
  dueDate: timestamp("due_date"), // Date d'échéance
  status: text("status").default("draft").notNull(), // draft, sent, paid, overdue, cancelled
  paidAt: timestamp("paid_at"),
  paymentMethod: text("payment_method"), // virement, chèque, CB, etc.
  paymentReference: text("payment_reference"),
  pdfUrl: text("pdf_url"),
  notes: text("notes"), // Notes additionnelles
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Type pour les lignes de facture
export interface InvoiceLineItem {
  description: string;
  quantity: number;
  unitPrice: number; // en centimes
  total: number; // en centimes
}

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

// --- IN-APP NOTIFICATIONS ---
export type InAppNotificationType = 'reminder' | 'admin_alert' | 'mission_assignment' | 'template_update';

export const inAppNotifications = pgTable("in_app_notifications", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  type: text("type").notNull(), // reminder, admin_alert, mission_assignment, template_update
  title: text("title").notNull(),
  message: text("message").notNull(),
  missionId: integer("mission_id").references(() => missions.id),
  reminderId: integer("reminder_id").references(() => reminders.id),
  isRead: boolean("is_read").default(false).notNull(),
  readAt: timestamp("read_at"),
  metadata: jsonb("metadata").$type<Record<string, any>>(),
  createdAt: timestamp("created_at").defaultNow(),
});

// --- FEEDBACK QUESTIONNAIRES ---
export type QuestionType = 'rating' | 'text' | 'multiple_choice' | 'yes_no';
export type FeedbackQuestionnaireStatus = 'draft' | 'active' | 'closed';

export const feedbackQuestionnaires = pgTable("feedback_questionnaires", {
  id: serial("id").primaryKey(),
  missionId: integer("mission_id").references(() => missions.id).notNull(),
  title: text("title").notNull(),
  description: text("description"),
  status: text("status").default("draft").notNull(), // draft, active, closed
  generatedByAI: boolean("generated_by_ai").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const feedbackQuestions = pgTable("feedback_questions", {
  id: serial("id").primaryKey(),
  questionnaireId: integer("questionnaire_id").references(() => feedbackQuestionnaires.id).notNull(),
  questionText: text("question_text").notNull(),
  questionType: text("question_type").default("rating").notNull(), // rating, text, multiple_choice, yes_no
  options: jsonb("options").$type<string[]>(), // For multiple choice questions
  order: integer("order").notNull(),
  isRequired: boolean("is_required").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const feedbackResponseTokens = pgTable("feedback_response_tokens", {
  id: serial("id").primaryKey(),
  questionnaireId: integer("questionnaire_id").references(() => feedbackQuestionnaires.id).notNull(),
  participantId: integer("participant_id").references(() => participants.id).notNull(),
  token: varchar("token").notNull().unique(),
  sentAt: timestamp("sent_at"),
  sentVia: text("sent_via"), // email, qr_code
  completedAt: timestamp("completed_at"),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const feedbackResponses = pgTable("feedback_responses", {
  id: serial("id").primaryKey(),
  tokenId: integer("token_id").references(() => feedbackResponseTokens.id).notNull(),
  questionId: integer("question_id").references(() => feedbackQuestions.id).notNull(),
  ratingValue: integer("rating_value"), // For rating questions (1-5)
  textValue: text("text_value"), // For text questions
  selectedOptions: jsonb("selected_options").$type<string[]>(), // For multiple choice
  booleanValue: boolean("boolean_value"), // For yes/no questions
  createdAt: timestamp("created_at").defaultNow(),
});

// --- TASK DEADLINE DEFAULTS ---
// Defines default deadlines (relative to 1st training session) for each task type
export const taskDeadlineDefaults = pgTable("task_deadline_defaults", {
  id: serial("id").primaryKey(),
  taskTitle: text("task_title").notNull().unique(), // Title matching quick action or manual task
  daysBefore: integer("days_before").notNull(), // Positive = before 1st session, negative = after
  category: text("category"), // "Avant la formation", "Pendant la formation", "Apres la formation"
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// --- PERSONAL NOTES ---
export const personalNotes = pgTable("personal_notes", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  content: text("content"),
  color: text("color").default("default"), // default, yellow, green, blue, pink, purple
  isPinned: boolean("is_pinned").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
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
export const insertInAppNotificationSchema = createInsertSchema(inAppNotifications).omit({ id: true, createdAt: true });
export const insertXPTransactionSchema = createInsertSchema(xpTransactions).omit({ id: true, createdAt: true });
export const insertBadgeSchema = createInsertSchema(badges).omit({ id: true, createdAt: true });
export const insertUserBadgeSchema = createInsertSchema(userBadges).omit({ id: true, unlockedAt: true });
export const insertFeedbackQuestionnaireSchema = createInsertSchema(feedbackQuestionnaires).omit({ id: true, createdAt: true, updatedAt: true });
export const insertFeedbackQuestionSchema = createInsertSchema(feedbackQuestions).omit({ id: true, createdAt: true });
export const insertFeedbackResponseTokenSchema = createInsertSchema(feedbackResponseTokens).omit({ id: true, createdAt: true });
export const insertFeedbackResponseSchema = createInsertSchema(feedbackResponses).omit({ id: true, createdAt: true });
export const insertCompanySettingsSchema = createInsertSchema(companySettings).omit({ id: true, updatedAt: true });
export const insertClientContractSchema = createInsertSchema(clientContracts).omit({ id: true, createdAt: true, updatedAt: true });
export const insertClientInvoiceSchema = createInsertSchema(clientInvoices).omit({ id: true, createdAt: true, updatedAt: true });
export const insertTaskDeadlineDefaultSchema = createInsertSchema(taskDeadlineDefaults).omit({ id: true, createdAt: true, updatedAt: true });
export const insertPersonalNoteSchema = createInsertSchema(personalNotes).omit({ id: true, createdAt: true, updatedAt: true });

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
export type InAppNotification = typeof inAppNotifications.$inferSelect;
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
export type InsertInAppNotification = z.infer<typeof insertInAppNotificationSchema>;
export type InsertXPTransaction = z.infer<typeof insertXPTransactionSchema>;
export type InsertBadge = z.infer<typeof insertBadgeSchema>;
export type InsertUserBadge = z.infer<typeof insertUserBadgeSchema>;
export type FeedbackQuestionnaire = typeof feedbackQuestionnaires.$inferSelect;
export type FeedbackQuestion = typeof feedbackQuestions.$inferSelect;
export type FeedbackResponseToken = typeof feedbackResponseTokens.$inferSelect;
export type FeedbackResponse = typeof feedbackResponses.$inferSelect;
export type InsertFeedbackQuestionnaire = z.infer<typeof insertFeedbackQuestionnaireSchema>;
export type InsertFeedbackQuestion = z.infer<typeof insertFeedbackQuestionSchema>;
export type InsertFeedbackResponseToken = z.infer<typeof insertFeedbackResponseTokenSchema>;
export type InsertFeedbackResponse = z.infer<typeof insertFeedbackResponseSchema>;
export type CompanySettings = typeof companySettings.$inferSelect;
export type ClientContract = typeof clientContracts.$inferSelect;
export type ClientInvoice = typeof clientInvoices.$inferSelect;
export type InsertCompanySettings = z.infer<typeof insertCompanySettingsSchema>;
export type InsertClientContract = z.infer<typeof insertClientContractSchema>;
export type InsertClientInvoice = z.infer<typeof insertClientInvoiceSchema>;
export type TaskDeadlineDefault = typeof taskDeadlineDefaults.$inferSelect;
export type InsertTaskDeadlineDefault = z.infer<typeof insertTaskDeadlineDefaultSchema>;
export type PersonalNote = typeof personalNotes.$inferSelect;
export type InsertPersonalNote = z.infer<typeof insertPersonalNoteSchema>;
