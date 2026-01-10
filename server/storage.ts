import { 
  users, projects, tasks, invoices, documents, messages,
  type User, type InsertUser, type Project, type InsertProject,
  type Task, type InsertTask, type Invoice, type InsertInvoice,
  type Document, type InsertDocument, type Message, type InsertMessage
} from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  getProjects(): Promise<Project[]>;
  createProject(project: InsertProject): Promise<Project>;
  getProject(id: number): Promise<Project | undefined>;

  getTasks(): Promise<Task[]>;
  createTask(task: InsertTask): Promise<Task>;

  getInvoices(): Promise<Invoice[]>;
  createInvoice(invoice: InsertInvoice): Promise<Invoice>;

  getDocuments(): Promise<Document[]>;
  createDocument(doc: InsertDocument): Promise<Document>;

  getMessages(): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getProjects(): Promise<Project[]> {
    return await db.select().from(projects);
  }

  async createProject(project: InsertProject): Promise<Project> {
    const [newProject] = await db.insert(projects).values(project).returning();
    return newProject;
  }

  async getProject(id: number): Promise<Project | undefined> {
    const [project] = await db.select().from(projects).where(eq(projects.id, id));
    return project;
  }

  async getTasks(): Promise<Task[]> {
    return await db.select().from(tasks);
  }

  async createTask(task: InsertTask): Promise<Task> {
    const [newTask] = await db.insert(tasks).values(task).returning();
    return newTask;
  }

  async getInvoices(): Promise<Invoice[]> {
    return await db.select().from(invoices);
  }

  async createInvoice(invoice: InsertInvoice): Promise<Invoice> {
    const [newInvoice] = await db.insert(invoices).values(invoice).returning();
    return newInvoice;
  }

  async getDocuments(): Promise<Document[]> {
    return await db.select().from(documents);
  }

  async createDocument(doc: InsertDocument): Promise<Document> {
    const [newDoc] = await db.insert(documents).values(doc).returning();
    return newDoc;
  }

  async getMessages(): Promise<Message[]> {
    return await db.select().from(messages);
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const [newMessage] = await db.insert(messages).values(message).returning();
    return newMessage;
  }
}

export const storage = new DatabaseStorage();
