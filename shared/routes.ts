import { z } from 'zod';
import {
  insertClientSchema,
  insertTrainingProgramSchema,
  insertMissionSchema,
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
  clients,
  trainingPrograms,
  missions,
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
  users,
} from './schema';

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
    update: {
      method: 'PUT' as const,
      path: '/api/users/:id',
      input: z.object({
        firstName: z.string().optional(),
        lastName: z.string().optional(),
        phone: z.string().optional(),
        address: z.string().optional(),
        siret: z.string().optional(),
        specialties: z.array(z.string()).optional(),
        dailyRate: z.number().optional(),
        role: z.enum(['admin', 'formateur', 'prestataire']).optional(),
        isActive: z.boolean().optional(),
      }),
      responses: {
        200: z.custom<typeof users.$inferSelect>(),
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
