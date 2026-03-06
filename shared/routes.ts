import { z } from 'zod';
import {
  insertClientSchema,
  insertTrainingProgramSchema,
  insertMissionSchema,
  insertMissionStepSchema,
  insertStepTaskSchema,
  insertMissionSessionSchema,
  insertParticipantSchema,
  insertMissionParticipantSchema,
  insertAttendanceRecordSchema,
  insertEvaluationSchema,
  insertInvoiceSchema,
  insertDocumentSchema,
  insertMessageSchema,
  insertProjectSchema,
  insertTaskSchema,
  insertReminderSettingSchema,
  insertReminderSchema,
  taskDeadlineDefaults,
  taskExplanations,
  clients,
  trainingPrograms,
  missions,
  missionSteps,
  stepTasks,
  missionSessions,
  participants,
  missionParticipants,
  attendanceRecords,
  evaluations,
  invoices,
  documents,
  messages,
  projects,
  tasks,
  reminderSettings,
  reminders,
  users,
  type InsertProject,
  type InsertTask,
} from './schema';

// Re-export types for client use
export type { InsertProject, InsertTask };

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  unauthorized: z.object({
    message: z.string(),
  }),
  forbidden: z.object({
    message: z.string(),
    requiredPermission: z.string().optional(),
    userRole: z.string().optional(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

export const api = {
  // ==================== STATS ====================
  stats: {
    get: {
      method: 'GET' as const,
      path: '/api/stats',
      responses: {
        200: z.object({
          totalMissions: z.number(),
          activeMissions: z.number(),
          completedMissions: z.number(),
          totalParticipants: z.number(),
          pendingInvoices: z.number(),
          averageRating: z.number(),
        }),
      },
    },
  },

  // ==================== AUTH ====================
  auth: {
    login: {
      method: 'POST' as const,
      path: '/api/auth/login',
      input: z.object({
        email: z.string().email(),
        password: z.string().min(1),
      }),
      responses: {
        200: z.object({
          user: z.custom<typeof users.$inferSelect>(),
        }),
        401: errorSchemas.unauthorized,
      },
    },
    logout: {
      method: 'POST' as const,
      path: '/api/auth/logout',
      responses: {
        200: z.object({ success: z.boolean() }),
      },
    },
    me: {
      method: 'GET' as const,
      path: '/api/auth/me',
      responses: {
        200: z.custom<typeof users.$inferSelect>(),
        401: errorSchemas.unauthorized,
      },
    },
  },

  // ==================== USERS ====================
  users: {
    list: {
      method: 'GET' as const,
      path: '/api/users',
      responses: {
        200: z.array(z.custom<typeof users.$inferSelect>()),
      },
    },
    trainers: {
      method: 'GET' as const,
      path: '/api/users/trainers',
      responses: {
        200: z.array(z.custom<typeof users.$inferSelect>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/users/:id',
      responses: {
        200: z.custom<typeof users.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/users',
      input: z.object({
        email: z.string().email(),
        firstName: z.string().min(1),
        lastName: z.string().min(1),
        password: z.string().min(8),
        role: z.enum(['admin', 'formateur', 'prestataire']),
        phone: z.string().optional(),
        address: z.string().optional(),
        siret: z.string().optional(),
        specialties: z.array(z.string()).optional(),
        dailyRate: z.number().optional(),
      }),
      responses: {
        201: z.custom<typeof users.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/users/:id',
      input: z.object({
        firstName: z.string().optional(),
        lastName: z.string().optional(),
        password: z.string().min(8).optional(),
        phone: z.string().optional(),
        address: z.string().optional(),
        siret: z.string().optional(),
        specialties: z.array(z.string()).optional(),
        dailyRate: z.number().optional(),
        role: z.enum(['admin', 'formateur', 'prestataire']).optional(),
        status: z.enum(['ACTIF', 'INACTIF', 'SUPPRIME']).optional(),
      }),
      responses: {
        200: z.custom<typeof users.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/users/:id',
      responses: {
        200: z.object({ success: z.boolean() }),
        404: errorSchemas.notFound,
      },
    },
  },

  // ==================== CLIENTS ====================
  clients: {
    list: {
      method: 'GET' as const,
      path: '/api/clients',
      responses: {
        200: z.array(z.custom<typeof clients.$inferSelect>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/clients/:id',
      responses: {
        200: z.custom<typeof clients.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/clients',
      input: insertClientSchema,
      responses: {
        201: z.custom<typeof clients.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/clients/:id',
      input: insertClientSchema.partial(),
      responses: {
        200: z.custom<typeof clients.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
  },

  // ==================== TRAINING PROGRAMS ====================
  programs: {
    list: {
      method: 'GET' as const,
      path: '/api/programs',
      responses: {
        200: z.array(z.custom<typeof trainingPrograms.$inferSelect>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/programs/:id',
      responses: {
        200: z.custom<typeof trainingPrograms.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/programs',
      input: insertTrainingProgramSchema,
      responses: {
        201: z.custom<typeof trainingPrograms.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/programs/:id',
      input: insertTrainingProgramSchema.partial(),
      responses: {
        200: z.custom<typeof trainingPrograms.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
  },

  // ==================== MISSIONS ====================
  missions: {
    list: {
      method: 'GET' as const,
      path: '/api/missions',
      responses: {
        200: z.array(z.custom<typeof missions.$inferSelect>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/missions/:id',
      responses: {
        200: z.custom<typeof missions.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/missions',
      input: insertMissionSchema,
      responses: {
        201: z.custom<typeof missions.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/missions/:id',
      input: insertMissionSchema.partial(),
      responses: {
        200: z.custom<typeof missions.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    updateStatus: {
      method: 'PATCH' as const,
      path: '/api/missions/:id/status',
      input: z.object({
        status: z.enum(['draft', 'confirmed', 'in_progress', 'completed', 'cancelled']),
      }),
      responses: {
        200: z.custom<typeof missions.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/missions/:id',
      responses: {
        200: z.object({ success: z.boolean() }),
        404: errorSchemas.notFound,
      },
    },
    // Mission Steps (étapes chronologiques)
    steps: {
      list: {
        method: 'GET' as const,
        path: '/api/missions/:id/steps',
        responses: {
          200: z.array(z.custom<typeof missionSteps.$inferSelect>()),
        },
      },
      create: {
        method: 'POST' as const,
        path: '/api/missions/:id/steps',
        input: insertMissionStepSchema.omit({ missionId: true }),
        responses: {
          201: z.custom<typeof missionSteps.$inferSelect>(),
          400: errorSchemas.validation,
        },
      },
      update: {
        method: 'PUT' as const,
        path: '/api/missions/:missionId/steps/:stepId',
        input: z.object({
          title: z.string().optional(),
          status: z.enum(['todo', 'priority', 'late', 'done', 'na']).optional(),
          isCompleted: z.boolean().optional(),
          order: z.number().optional(),
          dueDate: z.string().nullable().optional(),
          lateDate: z.string().nullable().optional(),
          link: z.string().nullable().optional(),
          assigneeId: z.string().nullable().optional(),
          comment: z.string().nullable().optional(),
          commentAuthorId: z.string().nullable().optional(),
          trainerComment: z.string().nullable().optional(),
          trainerCommentAuthorId: z.string().nullable().optional(),
        }),
        responses: {
          200: z.custom<typeof missionSteps.$inferSelect>(),
          404: errorSchemas.notFound,
        },
      },
      delete: {
        method: 'DELETE' as const,
        path: '/api/missions/:missionId/steps/:stepId',
        responses: {
          200: z.object({ success: z.boolean() }),
        },
      },
      sendLink: {
        method: 'POST' as const,
        path: '/api/missions/:missionId/steps/:stepId/send-link',
        responses: {
          200: z.object({ sent: z.number() }),
        },
      },
      // Step Tasks (taches des etapes)
      tasks: {
        list: {
          method: 'GET' as const,
          path: '/api/steps/:stepId/tasks',
          responses: {
            200: z.array(z.custom<typeof stepTasks.$inferSelect>()),
          },
        },
        create: {
          method: 'POST' as const,
          path: '/api/steps/:stepId/tasks',
          input: insertStepTaskSchema.omit({ stepId: true }),
          responses: {
            201: z.custom<typeof stepTasks.$inferSelect>(),
            400: errorSchemas.validation,
          },
        },
        update: {
          method: 'PUT' as const,
          path: '/api/steps/:stepId/tasks/:taskId',
          input: z.object({
            title: z.string().optional(),
            isCompleted: z.boolean().optional(),
            comment: z.string().nullable().optional(),
            order: z.number().optional(),
          }),
          responses: {
            200: z.custom<typeof stepTasks.$inferSelect>(),
            404: errorSchemas.notFound,
          },
        },
        delete: {
          method: 'DELETE' as const,
          path: '/api/steps/:stepId/tasks/:taskId',
          responses: {
            200: z.object({ success: z.boolean() }),
          },
        },
      },
    },
    // Mission Sessions
    sessions: {
      list: {
        method: 'GET' as const,
        path: '/api/missions/:id/sessions',
        responses: {
          200: z.array(z.custom<typeof missionSessions.$inferSelect>()),
        },
      },
      create: {
        method: 'POST' as const,
        path: '/api/missions/:id/sessions',
        input: insertMissionSessionSchema.omit({ missionId: true }),
        responses: {
          201: z.custom<typeof missionSessions.$inferSelect>(),
          400: errorSchemas.validation,
        },
      },
      update: {
        method: 'PUT' as const,
        path: '/api/missions/:id/sessions/:sessionId',
        input: insertMissionSessionSchema.omit({ missionId: true }).partial(),
        responses: {
          200: z.custom<typeof missionSessions.$inferSelect>(),
          400: errorSchemas.validation,
          404: errorSchemas.notFound,
        },
      },
      delete: {
        method: 'DELETE' as const,
        path: '/api/missions/:id/sessions/:sessionId',
        responses: {
          200: z.object({ success: z.boolean() }),
          404: errorSchemas.notFound,
        },
      },
    },
    // Mission Participants
    participants: {
      list: {
        method: 'GET' as const,
        path: '/api/missions/:id/participants',
        responses: {
          200: z.array(z.object({
            id: z.number(),
            missionId: z.number(),
            participantId: z.number(),
            status: z.string().nullable(),
            registeredAt: z.date().nullable(),
            convocationSentAt: z.date().nullable(),
            attendanceValidated: z.boolean().nullable(),
            certificateGeneratedAt: z.date().nullable(),
            positioningQuestionnaireSentAt: z.date().nullable(),
            positioningQuestionnaireReceivedAt: z.date().nullable(),
            evaluationSentAt: z.date().nullable(),
            evaluationReceivedAt: z.date().nullable(),
            participant: z.custom<typeof participants.$inferSelect>(),
          })),
        },
      },
      add: {
        method: 'POST' as const,
        path: '/api/missions/:id/participants',
        input: z.object({
          participantId: z.number(),
        }),
        responses: {
          201: z.custom<typeof missionParticipants.$inferSelect>(),
          400: errorSchemas.validation,
        },
      },
      update: {
        method: 'PATCH' as const,
        path: '/api/missions/:missionId/participants/:participantId',
        input: z.object({
          status: z.string().optional(),
          convocationSentAt: z.string().nullable().optional(),
          attendanceValidated: z.boolean().optional(),
          certificateGeneratedAt: z.string().nullable().optional(),
          positioningQuestionnaireSentAt: z.string().nullable().optional(),
          positioningQuestionnaireReceivedAt: z.string().nullable().optional(),
          evaluationSentAt: z.string().nullable().optional(),
          evaluationReceivedAt: z.string().nullable().optional(),
        }),
        responses: {
          200: z.custom<typeof missionParticipants.$inferSelect>(),
          404: errorSchemas.notFound,
        },
      },
      remove: {
        method: 'DELETE' as const,
        path: '/api/missions/:missionId/participants/:participantId',
        responses: {
          200: z.object({ success: z.boolean() }),
        },
      },
    },
    // Mission Attendance
    attendance: {
      list: {
        method: 'GET' as const,
        path: '/api/missions/:id/attendance',
        responses: {
          200: z.array(z.custom<typeof attendanceRecords.$inferSelect>()),
        },
      },
      create: {
        method: 'POST' as const,
        path: '/api/missions/:id/attendance',
        input: insertAttendanceRecordSchema.omit({ missionId: true }),
        responses: {
          201: z.custom<typeof attendanceRecords.$inferSelect>(),
          400: errorSchemas.validation,
        },
      },
    },
    // Mission Documents
    documents: {
      list: {
        method: 'GET' as const,
        path: '/api/missions/:id/documents',
        responses: {
          200: z.array(z.custom<typeof documents.$inferSelect>()),
        },
      },
    },
    // Mission Evaluations
    evaluations: {
      list: {
        method: 'GET' as const,
        path: '/api/missions/:id/evaluations',
        responses: {
          200: z.array(z.custom<typeof evaluations.$inferSelect>()),
        },
      },
    },
  },

  // ==================== PARTICIPANTS ====================
  participants: {
    list: {
      method: 'GET' as const,
      path: '/api/participants',
      responses: {
        200: z.array(z.custom<typeof participants.$inferSelect>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/participants/:id',
      responses: {
        200: z.custom<typeof participants.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/participants',
      input: insertParticipantSchema,
      responses: {
        201: z.custom<typeof participants.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/participants/:id',
      input: insertParticipantSchema.partial(),
      responses: {
        200: z.custom<typeof participants.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
  },

  // ==================== ATTENDANCE ====================
  attendance: {
    update: {
      method: 'PUT' as const,
      path: '/api/attendance/:id',
      input: z.object({
        status: z.enum(['present', 'absent', 'late', 'excused']).optional(),
        signatureUrl: z.string().optional(),
        signedAt: z.date().optional(),
        notes: z.string().optional(),
      }),
      responses: {
        200: z.custom<typeof attendanceRecords.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
  },

  // ==================== EVALUATIONS ====================
  evaluations: {
    create: {
      method: 'POST' as const,
      path: '/api/evaluations',
      input: insertEvaluationSchema,
      responses: {
        201: z.custom<typeof evaluations.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/evaluations/:id',
      responses: {
        200: z.custom<typeof evaluations.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
  },

  // ==================== INVOICES ====================
  invoices: {
    list: {
      method: 'GET' as const,
      path: '/api/invoices',
      responses: {
        200: z.array(z.custom<typeof invoices.$inferSelect>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/invoices/:id',
      responses: {
        200: z.custom<typeof invoices.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/invoices',
      input: insertInvoiceSchema,
      responses: {
        201: z.custom<typeof invoices.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/invoices/:id',
      input: insertInvoiceSchema.partial(),
      responses: {
        200: z.custom<typeof invoices.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    approve: {
      method: 'PATCH' as const,
      path: '/api/invoices/:id/approve',
      responses: {
        200: z.custom<typeof invoices.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    reject: {
      method: 'PATCH' as const,
      path: '/api/invoices/:id/reject',
      input: z.object({
        reason: z.string(),
      }),
      responses: {
        200: z.custom<typeof invoices.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    markPaid: {
      method: 'PATCH' as const,
      path: '/api/invoices/:id/mark-paid',
      responses: {
        200: z.custom<typeof invoices.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
  },

  // ==================== DOCUMENTS ====================
  documents: {
    list: {
      method: 'GET' as const,
      path: '/api/documents',
      responses: {
        200: z.array(z.custom<typeof documents.$inferSelect>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/documents/:id',
      responses: {
        200: z.custom<typeof documents.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/documents',
      input: insertDocumentSchema,
      responses: {
        201: z.custom<typeof documents.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/documents/:id',
      responses: {
        200: z.object({ success: z.boolean() }),
      },
    },
  },

  // ==================== MESSAGES ====================
  messages: {
    list: {
      method: 'GET' as const,
      path: '/api/messages',
      responses: {
        200: z.array(z.custom<typeof messages.$inferSelect>()),
      },
    },
    byMission: {
      method: 'GET' as const,
      path: '/api/missions/:id/messages',
      responses: {
        200: z.array(z.custom<typeof messages.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/messages',
      input: insertMessageSchema,
      responses: {
        201: z.custom<typeof messages.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
  },

  // ==================== LEGACY (for backward compatibility) ====================
  projects: {
    list: {
      method: 'GET' as const,
      path: '/api/projects',
      responses: {
        200: z.array(z.custom<typeof projects.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/projects',
      input: insertProjectSchema,
      responses: {
        201: z.custom<typeof projects.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/projects/:id',
      responses: {
        200: z.custom<typeof projects.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
  },
  tasks: {
    list: {
      method: 'GET' as const,
      path: '/api/tasks',
      responses: {
        200: z.array(z.custom<typeof tasks.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/tasks',
      input: insertTaskSchema,
      responses: {
        201: z.custom<typeof tasks.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
  },

  // ==================== REMINDER SETTINGS ====================
  reminderSettings: {
    list: {
      method: 'GET' as const,
      path: '/api/reminder-settings',
      responses: {
        200: z.array(z.custom<typeof reminderSettings.$inferSelect>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/reminder-settings/:id',
      responses: {
        200: z.custom<typeof reminderSettings.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/reminder-settings',
      input: z.object({
        name: z.string().min(1),
        reminderType: z.enum(['mission_start', 'task_deadline', 'admin_summary']),
        daysBefore: z.number().min(0),
        isActive: z.boolean().optional(),
        emailSubject: z.string().optional(),
        emailTemplate: z.string().optional(),
        notifyAdmin: z.boolean().optional(),
        notifyTrainer: z.boolean().optional(),
        notifyClient: z.boolean().optional(),
      }),
      responses: {
        201: z.custom<typeof reminderSettings.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/reminder-settings/:id',
      input: z.object({
        name: z.string().optional(),
        reminderType: z.enum(['mission_start', 'task_deadline', 'admin_summary']).optional(),
        daysBefore: z.number().min(0).optional(),
        isActive: z.boolean().optional(),
        emailSubject: z.string().nullable().optional(),
        emailTemplate: z.string().nullable().optional(),
        notifyAdmin: z.boolean().optional(),
        notifyTrainer: z.boolean().optional(),
        notifyClient: z.boolean().optional(),
      }),
      responses: {
        200: z.custom<typeof reminderSettings.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/reminder-settings/:id',
      responses: {
        200: z.object({ success: z.boolean() }),
      },
    },
  },

  // ==================== REMINDERS ====================
  reminders: {
    list: {
      method: 'GET' as const,
      path: '/api/reminders',
      responses: {
        200: z.array(z.custom<typeof reminders.$inferSelect>()),
      },
    },
    pending: {
      method: 'GET' as const,
      path: '/api/reminders/pending',
      responses: {
        200: z.array(z.custom<typeof reminders.$inferSelect>()),
      },
    },
    byMission: {
      method: 'GET' as const,
      path: '/api/missions/:id/reminders',
      responses: {
        200: z.array(z.custom<typeof reminders.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/reminders',
      input: z.object({
        settingId: z.number().optional(),
        missionId: z.number().optional(),
        taskId: z.number().optional(),
        scheduledDate: z.string(),
        recipientType: z.enum(['admin', 'trainer', 'client']),
        recipientEmail: z.string().optional(),
        recipientName: z.string().optional(),
      }),
      responses: {
        201: z.custom<typeof reminders.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/reminders/:id',
      input: z.object({
        scheduledDate: z.string().optional(),
        status: z.enum(['pending', 'sent', 'failed', 'cancelled']).optional(),
        sentAt: z.string().nullable().optional(),
        errorMessage: z.string().nullable().optional(),
      }),
      responses: {
        200: z.custom<typeof reminders.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/reminders/:id',
      responses: {
        200: z.object({ success: z.boolean() }),
      },
    },
    // Process pending reminders (cron endpoint)
    process: {
      method: 'POST' as const,
      path: '/api/reminders/process',
      responses: {
        200: z.object({
          processed: z.number(),
          sent: z.number(),
          failed: z.number(),
        }),
      },
    },
    // Generate reminders for a mission
    generateForMission: {
      method: 'POST' as const,
      path: '/api/missions/:id/generate-reminders',
      responses: {
        200: z.object({
          created: z.number(),
        }),
      },
    },
  },

  // ==================== TASK DEADLINE DEFAULTS ====================
  taskDeadlineDefaults: {
    list: {
      method: 'GET' as const,
      path: '/api/task-deadline-defaults',
      responses: {
        200: z.array(z.custom<typeof taskDeadlineDefaults.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/task-deadline-defaults',
      input: z.object({
        taskTitle: z.string().min(1),
        typology: z.string().min(1),
        trainerRole: z.string().min(1),
        daysBefore: z.preprocess((v) => (v === null || v === undefined || v === '' || Number.isNaN(Number(v)) ? 0 : Number(v)), z.number()),
        lateDaysBefore: z.preprocess((v) => (v === null || v === undefined || v === '' || Number.isNaN(Number(v)) ? null : Number(v)), z.number().nullable().optional()),
        category: z.string().optional(),
        isActive: z.boolean().optional(),
      }),
      responses: {
        201: z.custom<typeof taskDeadlineDefaults.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/task-deadline-defaults/:id',
      input: z.object({
        taskTitle: z.string().optional(),
        typology: z.string().optional(),
        trainerRole: z.string().optional(),
        daysBefore: z.preprocess((v) => (v === null || v === undefined || v === '' || Number.isNaN(Number(v)) ? undefined : Number(v)), z.number().optional()),
        lateDaysBefore: z.preprocess((v) => (v === null || v === undefined || v === '' || Number.isNaN(Number(v)) ? null : Number(v)), z.number().nullable().optional()),
        category: z.string().optional(),
        isActive: z.boolean().optional(),
      }),
      responses: {
        200: z.custom<typeof taskDeadlineDefaults.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/task-deadline-defaults/:id',
      responses: {
        200: z.object({ success: z.boolean() }),
      },
    },
  },

  // ==================== TASK EXPLANATIONS (Consignes) ====================
  taskExplanations: {
    list: {
      method: 'GET' as const,
      path: '/api/task-explanations',
      responses: {
        200: z.array(z.custom<typeof taskExplanations.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/task-explanations',
      input: z.object({
        taskName: z.string().min(1),
        explanation: z.string().min(1),
        typology: z.string().nullable().optional(),
        trainerRole: z.string().nullable().optional(),
      }),
      responses: {
        201: z.custom<typeof taskExplanations.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/task-explanations/:id',
      input: z.object({
        taskName: z.string().optional(),
        explanation: z.string().optional(),
        typology: z.string().nullable().optional(),
        trainerRole: z.string().nullable().optional(),
      }),
      responses: {
        200: z.custom<typeof taskExplanations.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/task-explanations/:id',
      responses: {
        200: z.object({ success: z.boolean() }),
      },
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
