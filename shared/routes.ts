import { z } from 'zod';
import { 
  insertUserSchema, 
  insertProjectSchema, 
  insertTaskSchema,
  insertInvoiceSchema,
  insertDocumentSchema,
  insertMessageSchema,
  users,
  projects,
  tasks,
  invoices,
  documents,
  messages
} from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

export const api = {
  stats: {
    get: {
      method: 'GET' as const,
      path: '/api/stats',
      responses: {
        200: z.object({
          activeProjects: z.number(),
          tasksInProgress: z.number(),
          completedTasks: z.number(),
          missions: z.number(),
        }),
      },
    },
  },
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
  invoices: {
    list: {
      method: 'GET' as const,
      path: '/api/invoices',
      responses: {
        200: z.array(z.custom<typeof invoices.$inferSelect>()),
      },
    },
  },
  documents: {
    list: {
      method: 'GET' as const,
      path: '/api/documents',
      responses: {
        200: z.array(z.custom<typeof documents.$inferSelect>()),
      },
    },
  },
  messages: {
    list: {
      method: 'GET' as const,
      path: '/api/messages',
      responses: {
        200: z.array(z.custom<typeof messages.$inferSelect>()),
      },
    },
  }
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
