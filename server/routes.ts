import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { setupAuth } from "./replit_integrations/auth";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  await setupAuth(app);

  // Stats Endpoint
  app.get(api.stats.get.path, async (req, res) => {
    // Mock stats for now or calculate from DB
    const projects = await storage.getProjects();
    const tasks = await storage.getTasks();
    
    const activeProjects = projects.filter(p => p.status === 'active').length;
    const tasksInProgress = tasks.filter(t => t.status === 'in_progress').length;
    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    const missions = projects.length; // Assuming missions are projects for now

    res.json({
      activeProjects,
      tasksInProgress,
      completedTasks,
      missions
    });
  });

  // Projects
  app.get(api.projects.list.path, async (req, res) => {
    const projects = await storage.getProjects();
    res.json(projects);
  });

  app.post(api.projects.create.path, async (req, res) => {
    try {
      const input = api.projects.create.input.parse(req.body);
      const project = await storage.createProject(input);
      res.status(201).json(project);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
        return;
      }
      throw err;
    }
  });

  app.get(api.projects.get.path, async (req, res) => {
    const project = await storage.getProject(Number(req.params.id));
    if (!project) {
      res.status(404).json({ message: "Project not found" });
      return;
    }
    res.json(project);
  });

  // Tasks
  app.get(api.tasks.list.path, async (req, res) => {
    const tasks = await storage.getTasks();
    res.json(tasks);
  });

  app.post(api.tasks.create.path, async (req, res) => {
    try {
      const input = api.tasks.create.input.parse(req.body);
      const task = await storage.createTask(input);
      res.status(201).json(task);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
        return;
      }
      throw err;
    }
  });

  // Invoices
  app.get(api.invoices.list.path, async (req, res) => {
    const invoices = await storage.getInvoices();
    res.json(invoices);
  });

  // Documents
  app.get(api.documents.list.path, async (req, res) => {
    const documents = await storage.getDocuments();
    res.json(documents);
  });

  // Messages
  app.get(api.messages.list.path, async (req, res) => {
    const messages = await storage.getMessages();
    res.json(messages);
  });

  // Seed Data function
  await seedDatabase();

  return httpServer;
}

async function seedDatabase() {
  const users = await storage.getUserByEmail("demo@example.com");
  if (!users) {
    const user = await storage.createUser({
      email: "demo@example.com",
      firstName: "Demo",
      lastName: "User",
      role: "subcontractor"
    });

    // Seed Projects
    const p1 = await storage.createProject({
      title: "Refonte Site Web",
      description: "Refonte complète du site corporate",
      status: "active",
      userId: user.id
    });

    const p2 = await storage.createProject({
      title: "Application Mobile",
      description: "Développement de l'application iOS",
      status: "active",
      userId: user.id
    });

    // Seed Tasks
    await storage.createTask({
      title: "Maquettes UI",
      status: "in_progress",
      projectId: p1.id,
      assignedTo: user.id
    });

    await storage.createTask({
      title: "API Backend",
      status: "pending",
      projectId: p1.id,
      assignedTo: user.id
    });

     await storage.createTask({
      title: "Tests unitaires",
      status: "completed",
      projectId: p2.id,
      assignedTo: user.id
    });

    // Seed Invoices
    await storage.createInvoice({
      invoiceNumber: "INV-2024-001",
      amount: 150000, // 1500.00
      status: "paid",
      userId: user.id
    });

    await storage.createInvoice({
      invoiceNumber: "INV-2024-002",
      amount: 250000,
      status: "pending",
      userId: user.id
    });

    // Seed Documents
    await storage.createDocument({
      title: "Contrat de prestation",
      type: "contract",
      url: "/documents/contract.pdf",
      userId: user.id
    });

    await storage.createDocument({
      title: "Cahier des charges",
      type: "spec",
      url: "/documents/specs.pdf",
      userId: user.id
    });

    // Seed Messages
    await storage.createMessage({
      content: "Bonjour, avez-vous pu avancer sur les maquettes ?",
      senderId: user.id,
      projectId: p1.id
    });
  }
}
