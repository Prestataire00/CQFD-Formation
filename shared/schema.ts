import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { users } from "./models/auth";

export * from "./models/auth";

export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  status: text("status").default("active").notNull(), // active, completed, archived
  userId: text("user_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  status: text("status").default("pending").notNull(), // pending, in_progress, completed
  projectId: integer("project_id").references(() => projects.id),
  assignedTo: text("assigned_to").references(() => users.id),
  dueDate: timestamp("due_date"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const invoices = pgTable("invoices", {
  id: serial("id").primaryKey(),
  invoiceNumber: text("invoice_number").notNull(),
  amount: integer("amount").notNull(), // in cents
  status: text("status").default("pending").notNull(), // pending, paid, rejected
  userId: text("user_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  type: text("type").notNull(), // contract, invoice_file, spec, etc.
  url: text("url").notNull(),
  userId: text("user_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  content: text("content").notNull(),
  senderId: text("sender_id").references(() => users.id),
  projectId: integer("project_id").references(() => projects.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true, updatedAt: true });
export const insertProjectSchema = createInsertSchema(projects).omit({ id: true, createdAt: true });
export const insertTaskSchema = createInsertSchema(tasks).omit({ id: true, createdAt: true });
export const insertInvoiceSchema = createInsertSchema(invoices).omit({ id: true, createdAt: true });
export const insertDocumentSchema = createInsertSchema(documents).omit({ id: true, createdAt: true });
export const insertMessageSchema = createInsertSchema(messages).omit({ id: true, createdAt: true });

// Types
export type Project = typeof projects.$inferSelect;
export type Task = typeof tasks.$inferSelect;
export type Invoice = typeof invoices.$inferSelect;
export type Document = typeof documents.$inferSelect;
export type Message = typeof messages.$inferSelect;

export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type InsertTask = z.infer<typeof insertTaskSchema>;
export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
