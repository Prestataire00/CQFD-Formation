import type { Express } from "express";
import express from "express";
import { type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { setupLocalAuth, setupAuthRoutes, isAuthenticated } from "./auth";
import { requirePermission, requireRole } from "./middleware/rbac";
import { sendMissionAssignmentEmail, sendReminderEmail, sendAdminFormationReminderEmail, notifyOtherParty } from "./email";
import { gamificationService, XP_CONFIG, LEVELS, DEFAULT_BADGES } from "./gamification";
import { registerFeedbackRoutes } from "./feedback";
import documentsRouter from "./documents";
import { seedDefaultTemplates } from "./seed-templates";
import multer from "multer";
import path from "path";
import fs from "fs";

// Configuration de multer pour l'upload de fichiers
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Create templates directory for automatic document attachments
const templatesDir = path.join(uploadDir, "templates");
if (!fs.existsSync(templatesDir)) {
  fs.mkdirSync(templatesDir, { recursive: true });
}

const storageConfig = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({
  storage: storageConfig,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
});

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Setup local authentication
  setupLocalAuth(app);
  setupAuthRoutes(app);

  // Serve uploaded files statically
  app.use('/uploads', (req, res, next) => {
    if (!req.isAuthenticated || !req.isAuthenticated()) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    next();
  });
  app.use('/uploads', express.static(uploadDir));

  // ==================== STATS ====================
  app.get(api.stats.get.path, isAuthenticated, async (req, res) => {
    try {
      const user = req.user!;
      const stats = await storage.getStats(user.id, user.role);
      res.json(stats);
    } catch (error) {
      console.error('Stats error:', error);
      res.status(500).json({ message: 'Erreur serveur' });
    }
  });

  // Helper to strip passwordHash from user objects
  const stripPassword = (user: any) => {
    const { passwordHash, ...userWithoutPassword } = user;
    return userWithoutPassword;
  };

  // ==================== USERS ====================
  app.get(api.users.list.path, isAuthenticated, requirePermission('users:read'), async (req, res) => {
    const users = await storage.getUsers();
    res.json(users.map(stripPassword));
  });

  app.get(api.users.trainers.path, isAuthenticated, async (req, res) => {
    const trainers = await storage.getTrainers();
    res.json(trainers.map(stripPassword));
  });

  app.get(api.users.get.path, isAuthenticated, async (req, res) => {
    const user = await storage.getUser(req.params.id);
    if (!user) {
      res.status(404).json({ message: "Utilisateur non trouvé" });
      return;
    }
    res.json(stripPassword(user));
  });

  app.post(api.users.create.path, isAuthenticated, requirePermission('users:create'), async (req, res) => {
    try {
      const input = api.users.create.input.parse(req.body);
      const { password, ...userData } = input;
      const user = await storage.createUser(userData, password);
      // Remove passwordHash from response
      const { passwordHash, ...userWithoutPassword } = user as any;
      res.status(201).json(userWithoutPassword);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
        return;
      }
      if ((err as any).code === '23505') {
        res.status(400).json({ message: "Cet email est déjà utilisé" });
        return;
      }
      throw err;
    }
  });

  app.put(api.users.update.path, isAuthenticated, requirePermission('users:update'), async (req, res) => {
    try {
      const targetUserId = req.params.id;
      // Empêcher la désactivation ou le changement de rôle de l'admin principal
      if (targetUserId === 'fc6c33f9-0245-4b10-856c-3f4daa45b6b6' || targetUserId === 'admin-001') {
        const input = req.body;
        if (input.status && input.status !== 'ACTIF') {
          return res.status(403).json({ message: "L'administrateur principal ne peut pas être désactivé" });
        }
        if (input.role && input.role !== 'admin') {
          return res.status(403).json({ message: "Le rôle de l'administrateur principal ne peut pas être modifié" });
        }
      }

      const input = api.users.update.input.parse(req.body);
      const { password, ...updateData } = input;
      const user = await storage.updateUserWithPassword(req.params.id, updateData, password);
      if (!user) {
        res.status(404).json({ message: "Utilisateur non trouvé" });
        return;
      }
      // Remove passwordHash from response
      const { passwordHash, ...userWithoutPassword } = user as any;
      res.json(userWithoutPassword);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
        return;
      }
      throw err;
    }
  });

  app.delete(api.users.delete.path, isAuthenticated, requirePermission('users:delete'), async (req, res) => {
    try {
      const targetUserId = req.params.id;
      // Empêcher la suppression de l'admin principal
      if (targetUserId === 'fc6c33f9-0245-4b10-856c-3f4daa45b6b6' || targetUserId === 'admin-001') {
        return res.status(403).json({ message: "L'administrateur principal ne peut pas être supprimé" });
      }

      const success = await storage.softDeleteUser(req.params.id);
      if (!success) {
        res.status(404).json({ message: "Utilisateur non trouvé" });
        return;
      }
      res.json({ success: true });
    } catch (err) {
      throw err;
    }
  });

  // ==================== CLIENTS ====================
  app.get(api.clients.list.path, isAuthenticated, requirePermission('clients:read'), async (req, res) => {
    const clients = await storage.getClients();
    res.json(clients);
  });

  app.get(api.clients.get.path, isAuthenticated, requirePermission('clients:read'), async (req, res) => {
    const client = await storage.getClient(Number(req.params.id));
    if (!client) {
      res.status(404).json({ message: "Client non trouvé" });
      return;
    }
    res.json(client);
  });

  app.post(api.clients.create.path, isAuthenticated, requirePermission('clients:create'), async (req, res) => {
    try {
      const input = api.clients.create.input.parse(req.body);
      const client = await storage.createClient(input);
      res.status(201).json(client);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
        return;
      }
      throw err;
    }
  });

  app.put(api.clients.update.path, isAuthenticated, requirePermission('clients:update'), async (req, res) => {
    try {
      console.log('[SERVER] Client update - Raw body:', req.body);
      const input = api.clients.update.input.parse(req.body);
      console.log('[SERVER] Client update - Parsed input:', input);
      const client = await storage.updateClient(Number(req.params.id), input);
      console.log('[SERVER] Client update - Result:', client);
      if (!client) {
        res.status(404).json({ message: "Client non trouvé" });
        return;
      }
      res.json(client);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
        return;
      }
      throw err;
    }
  });

  // ==================== TRAINING PROGRAMS ====================
  app.get(api.programs.list.path, isAuthenticated, async (req, res) => {
    const programs = await storage.getTrainingPrograms();
    res.json(programs);
  });

  app.get(api.programs.get.path, isAuthenticated, async (req, res) => {
    const program = await storage.getTrainingProgram(Number(req.params.id));
    if (!program) {
      res.status(404).json({ message: "Programme non trouvé" });
      return;
    }
    res.json(program);
  });

  app.post(api.programs.create.path, isAuthenticated, requirePermission('programs:create'), async (req, res) => {
    try {
      const input = api.programs.create.input.parse(req.body);
      const program = await storage.createTrainingProgram(input);
      res.status(201).json(program);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
        return;
      }
      throw err;
    }
  });

  app.put(api.programs.update.path, isAuthenticated, requirePermission('programs:update'), async (req, res) => {
    try {
      const input = api.programs.update.input.parse(req.body);
      const program = await storage.updateTrainingProgram(Number(req.params.id), input);
      if (!program) {
        res.status(404).json({ message: "Programme non trouvé" });
        return;
      }
      res.json(program);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
        return;
      }
      throw err;
    }
  });

  // ==================== MISSIONS ====================
  app.get(api.missions.list.path, isAuthenticated, async (req, res) => {
    try {
      const user = req.user!;

      let missions;
      if (user.role === 'admin') {
        missions = await storage.getMissions();
      } else {
        missions = await storage.getMissionsByTrainer(user.id);
      }
      res.json(missions);
    } catch (error) {
      console.error('Missions list error:', error);
      res.status(500).json({ message: 'Erreur serveur' });
    }
  });

  app.get(api.missions.get.path, isAuthenticated, async (req, res) => {
    const mission = await storage.getMission(Number(req.params.id));
    if (!mission) {
      res.status(404).json({ message: "Mission non trouvée" });
      return;
    }
    res.json(mission);
  });

  app.post(api.missions.create.path, isAuthenticated, requirePermission('missions:create'), async (req, res) => {
    try {
      // Convert date strings to Date objects
      const body = {
        ...req.body,
        startDate: req.body.startDate ? new Date(req.body.startDate) : undefined,
        endDate: req.body.endDate ? new Date(req.body.endDate) : undefined,
      };
      const input = api.missions.create.input.parse(body);
      const mission = await storage.createMission(input);

      // Envoyer un email au formateur si assigné à la création
      if (mission.trainerId) {
        const trainer = await storage.getUser(mission.trainerId);
        if (trainer) {
          // 1. Notification interne (toujours)
          await storage.createInAppNotification({
            userId: trainer.id,
            type: 'mission_assignment',
            title: 'Nouvelle mission assignée',
            message: `Vous avez été assigné à la mission : ${mission.title}`,
            missionId: mission.id,
          });

          // 2. Email (si configuré)
          if (trainer.email) {
            const documents = await storage.getDocumentsByMission(mission.id);
            const trainerDocuments = documents.filter(doc => doc.userId === mission.trainerId);
            await sendMissionAssignmentEmail(trainer, mission, trainerDocuments);
          }
        }
      }

      res.status(201).json(mission);
    } catch (err) {
      console.error('Mission creation error:', err);
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message, errors: err.errors });
        return;
      }
      throw err;
    }
  });

  app.put(api.missions.update.path, isAuthenticated, requirePermission('missions:update'), async (req, res) => {
    try {
      // Convert date strings to Date objects
      const body = {
        ...req.body,
        startDate: req.body.startDate ? new Date(req.body.startDate) : undefined,
        endDate: req.body.endDate ? new Date(req.body.endDate) : undefined,
      };
      const input = api.missions.update.input.parse(body);
      const mission = await storage.updateMission(Number(req.params.id), input);
      if (!mission) {
        res.status(404).json({ message: "Mission non trouvée" });
        return;
      }

      // Envoyer notification par email à l'autre partie
      try {
        const currentUser = req.user!;
        const modifiedBy = await storage.getUser(currentUser.id);
        const trainer = mission.trainerId ? await storage.getUser(mission.trainerId) : null;
        const admins = await storage.getUsersByRole('admin');
        const client = mission.clientId ? await storage.getClient(mission.clientId) : null;

        if (modifiedBy) {
          await notifyOtherParty(
            mission,
            modifiedBy,
            trainer || null,
            admins,
            client || null,
            'update',
            { changeDetails: 'Les informations de la mission ont été mises à jour.' }
          );
        }
      } catch (emailErr) {
        console.error('[Email] Erreur notification mission update:', emailErr);
        // Ne pas bloquer la réponse si l'email échoue
      }

      res.json(mission);
    } catch (err) {
      console.error('Mission update error:', err);
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message, errors: err.errors });
        return;
      }
      throw err;
    }
  });

  app.patch(api.missions.updateStatus.path, isAuthenticated, async (req, res) => {
    try {
      const input = api.missions.updateStatus.input.parse(req.body);
      const mission = await storage.updateMissionStatus(Number(req.params.id), input.status);
      if (!mission) {
        res.status(404).json({ message: "Mission non trouvée" });
        return;
      }

      // Award XP for completing a mission
      if (input.status === 'completed') {
        const user = req.user!;
        await gamificationService.awardXP(
          user.id,
          XP_CONFIG.MISSION_COMPLETED,
          'mission_completed',
          `Mission complétée: ${mission.title}`,
          'mission',
          mission.id
        );
        
        // Check for new badges
        await gamificationService.checkMissionBadges(user.id);
      }

      res.json(mission);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
        return;
      }
      throw err;
    }
  });

  app.delete(api.missions.delete.path, isAuthenticated, requirePermission('missions:delete'), async (req, res) => {
    try {
      const success = await storage.deleteMission(Number(req.params.id));
      if (!success) {
        res.status(404).json({ message: "Mission non trouvée" });
        return;
      }
      res.json({ success: true });
    } catch (err) {
      console.error('Mission deletion error:', err);
      res.status(500).json({ message: 'Erreur lors de la suppression de la mission' });
    }
  });

  // Mission Clients (multi-clients support)
  app.get('/api/missions/:id/clients', isAuthenticated, async (req, res) => {
    const missionClients = await storage.getMissionClients(Number(req.params.id));
    res.json(missionClients);
  });

  app.post('/api/missions/:id/clients', isAuthenticated, requirePermission('missions:update'), async (req, res) => {
    try {
      const { clientId, isPrimary } = req.body;
      if (!clientId) {
        res.status(400).json({ message: 'clientId is required' });
        return;
      }
      const result = await storage.addClientToMission({
        missionId: Number(req.params.id),
        clientId: Number(clientId),
        isPrimary: isPrimary || false,
      });
      res.status(201).json(result);
    } catch (err: any) {
      if (err.code === '23505') {
        res.status(400).json({ message: 'Ce client est déjà associé à cette mission' });
        return;
      }
      throw err;
    }
  });

  app.delete('/api/missions/:missionId/clients/:clientId', isAuthenticated, requirePermission('missions:update'), async (req, res) => {
    await storage.removeClientFromMission(
      Number(req.params.missionId),
      Number(req.params.clientId)
    );
    res.json({ success: true });
  });

  app.patch('/api/missions/:missionId/clients/:clientId/primary', isAuthenticated, requirePermission('missions:update'), async (req, res) => {
    await storage.setMissionPrimaryClient(
      Number(req.params.missionId),
      Number(req.params.clientId)
    );
    res.json({ success: true });
  });

  // Mission Trainers (multi-trainers support)
  app.get('/api/missions/:id/trainers', isAuthenticated, async (req, res) => {
    const missionTrainers = await storage.getMissionTrainers(Number(req.params.id));
    // Strip password from trainer objects
    const sanitized = missionTrainers.map(mt => ({
      ...mt,
      trainer: stripPassword(mt.trainer),
    }));
    res.json(sanitized);
  });

  app.post('/api/missions/:id/trainers', isAuthenticated, requirePermission('missions:update'), async (req, res) => {
    try {
      const { trainerId, isPrimary } = req.body;
      if (!trainerId) {
        res.status(400).json({ message: 'trainerId is required' });
        return;
      }
      const missionId = Number(req.params.id);
      const result = await storage.addTrainerToMission({
        missionId,
        trainerId: trainerId,
        isPrimary: isPrimary || false,
      });

      // Envoyer une notification au formateur
      const trainer = await storage.getUser(trainerId);
      const mission = await storage.getMission(missionId);
      if (trainer && mission) {
        // 1. Notification interne
        await storage.createInAppNotification({
          userId: trainer.id,
          type: 'mission_assignment',
          title: 'Nouvelle mission assignée',
          message: `Vous avez été assigné à la mission : ${mission.title}`,
          missionId: mission.id,
        });

        // 2. Email (si configuré)
        if (trainer.email) {
          const documents = await storage.getDocumentsByMission(missionId);
          // Filtrer les documents appartenant à ce formateur
          const trainerDocuments = documents.filter(doc => doc.userId === trainerId);
          await sendMissionAssignmentEmail(trainer, mission, trainerDocuments);
        }
      }

      res.status(201).json(result);
    } catch (err: any) {
      if (err.code === '23505') {
        res.status(400).json({ message: 'Ce formateur est déjà associé à cette mission' });
        return;
      }
      throw err;
    }
  });

  // Assigner plusieurs formateurs à une mission (sans créer de copies)
  app.post('/api/missions/:id/assign-trainers', isAuthenticated, requirePermission('missions:update'), async (req, res) => {
    try {
      const { trainerIds } = req.body;
      if (!trainerIds || !Array.isArray(trainerIds) || trainerIds.length === 0) {
        res.status(400).json({ message: 'trainerIds est requis et doit être un tableau non vide' });
        return;
      }

      const missionId = Number(req.params.id);
      const mission = await storage.getMission(missionId);
      if (!mission) {
        res.status(404).json({ message: 'Mission non trouvée' });
        return;
      }

      const results = {
        assigned: [] as string[],
        errors: [] as { trainerId: string; error: string }[],
      };

      for (const trainerId of trainerIds) {
        try {
          // Ajouter le formateur à la mission (cela attache aussi les documents)
          await storage.addTrainerToMission({
            missionId,
            trainerId,
            isPrimary: false,
          });

          // Envoyer une notification au formateur
          const trainer = await storage.getUser(trainerId);
          if (trainer) {
            // 1. Notification interne
            await storage.createInAppNotification({
              userId: trainer.id,
              type: 'mission_assignment',
              title: 'Nouvelle mission assignée',
              message: `Vous avez été assigné à la mission : ${mission.title}`,
              missionId: mission.id,
            });

            // 2. Email (si configuré)
            if (trainer.email) {
              const documents = await storage.getDocumentsByMission(missionId);
              const trainerDocuments = documents.filter(doc => doc.userId === trainerId);
              await sendMissionAssignmentEmail(trainer, mission, trainerDocuments);
            }
          }

          results.assigned.push(trainerId);
        } catch (err: any) {
          if (err.code === '23505') {
            results.errors.push({ trainerId, error: 'Ce formateur est déjà assigné à cette mission' });
          } else {
            results.errors.push({ trainerId, error: err.message || 'Erreur inconnue' });
          }
        }
      }

      res.status(200).json(results);
    } catch (err: any) {
      console.error('Error assigning trainers:', err);
      res.status(500).json({ message: 'Erreur lors de l\'assignation des formateurs' });
    }
  });

  app.delete('/api/missions/:missionId/trainers/:trainerId', isAuthenticated, requirePermission('missions:update'), async (req, res) => {
    await storage.removeTrainerFromMission(
      Number(req.params.missionId),
      req.params.trainerId
    );
    res.json({ success: true });
  });

  app.patch('/api/missions/:missionId/trainers/:trainerId/primary', isAuthenticated, requirePermission('missions:update'), async (req, res) => {
    await storage.setMissionPrimaryTrainer(
      Number(req.params.missionId),
      req.params.trainerId
    );
    res.json({ success: true });
  });

  // Mission Steps (étapes chronologiques)
  app.get(api.missions.steps.list.path, isAuthenticated, async (req, res) => {
    const steps = await storage.getMissionSteps(Number(req.params.id));
    res.json(steps);
  });

  app.post(api.missions.steps.create.path, isAuthenticated, async (req, res) => {
    try {
      const input = api.missions.steps.create.input.parse(req.body);
      const step = await storage.createMissionStep({
        ...input,
        missionId: Number(req.params.id),
      });
      res.status(201).json(step);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
        return;
      }
      throw err;
    }
  });

  app.put(api.missions.steps.update.path, isAuthenticated, async (req, res) => {
    try {
      const input = api.missions.steps.update.input.parse(req.body);
      const step = await storage.updateMissionStep(Number(req.params.stepId), {
        ...input,
        dueDate: input.dueDate ? new Date(input.dueDate) : undefined,
      });
      if (!step) {
        res.status(404).json({ message: "Étape non trouvée" });
        return;
      }
      res.json(step);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
        return;
      }
      throw err;
    }
  });

  app.delete(api.missions.steps.delete.path, isAuthenticated, async (req, res) => {
    await storage.deleteMissionStep(Number(req.params.stepId));
    res.json({ success: true });
  });

  // Step Tasks (taches des etapes)
  app.get(api.missions.steps.tasks.list.path, isAuthenticated, async (req, res) => {
    const tasks = await storage.getStepTasks(Number(req.params.stepId));
    res.json(tasks);
  });

  app.post(api.missions.steps.tasks.create.path, isAuthenticated, async (req, res) => {
    try {
      const input = api.missions.steps.tasks.create.input.parse(req.body);
      const task = await storage.createStepTask({
        ...input,
        stepId: Number(req.params.stepId),
      });
      res.status(201).json(task);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
        return;
      }
      throw err;
    }
  });

  app.put(api.missions.steps.tasks.update.path, isAuthenticated, async (req, res) => {
    try {
      const input = api.missions.steps.tasks.update.input.parse(req.body);
      const task = await storage.updateStepTask(Number(req.params.taskId), input);
      if (!task) {
        res.status(404).json({ message: "Tache non trouvee" });
        return;
      }
      res.json(task);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
        return;
      }
      throw err;
    }
  });

  app.delete(api.missions.steps.tasks.delete.path, isAuthenticated, async (req, res) => {
    await storage.deleteStepTask(Number(req.params.taskId));
    res.json({ success: true });
  });

  // Mission Sessions
  app.get(api.missions.sessions.list.path, isAuthenticated, async (req, res) => {
    const sessions = await storage.getMissionSessions(Number(req.params.id));
    res.json(sessions);
  });

  app.post(api.missions.sessions.create.path, isAuthenticated, async (req, res) => {
    try {
      const input = api.missions.sessions.create.input.parse(req.body);
      const session = await storage.createMissionSession({
        ...input,
        missionId: Number(req.params.id),
      });
      res.status(201).json(session);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
        return;
      }
      throw err;
    }
  });

  // Mission Participants
  app.get(api.missions.participants.list.path, isAuthenticated, async (req, res) => {
    const participants = await storage.getMissionParticipants(Number(req.params.id));
    res.json(participants);
  });

  app.post(api.missions.participants.add.path, isAuthenticated, async (req, res) => {
    try {
      const input = api.missions.participants.add.input.parse(req.body);
      const result = await storage.addParticipantToMission({
        missionId: Number(req.params.id),
        participantId: input.participantId,
      });
      res.status(201).json(result);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
        return;
      }
      throw err;
    }
  });

  app.patch(api.missions.participants.update.path, isAuthenticated, async (req, res) => {
    try {
      const { missionId, participantId } = req.params;
      const input = api.missions.participants.update.input.parse(req.body);
      
      // Get mission participant record first
      const mps = await storage.getMissionParticipants(Number(missionId));
      const mp = mps.find(p => p.participantId === Number(participantId));
      
      if (!mp) {
        res.status(404).json({ message: "Participant non trouvé dans cette mission" });
        return;
      }

      const updated = await storage.updateMissionParticipant(mp.id, {
        ...input,
        convocationSentAt: input.convocationSentAt ? new Date(input.convocationSentAt) : input.convocationSentAt === null ? null : undefined,
        certificateGeneratedAt: input.certificateGeneratedAt ? new Date(input.certificateGeneratedAt) : input.certificateGeneratedAt === null ? null : undefined,
        positioningQuestionnaireSentAt: input.positioningQuestionnaireSentAt ? new Date(input.positioningQuestionnaireSentAt) : input.positioningQuestionnaireSentAt === null ? null : undefined,
        positioningQuestionnaireReceivedAt: input.positioningQuestionnaireReceivedAt ? new Date(input.positioningQuestionnaireReceivedAt) : input.positioningQuestionnaireReceivedAt === null ? null : undefined,
        evaluationSentAt: input.evaluationSentAt ? new Date(input.evaluationSentAt) : input.evaluationSentAt === null ? null : undefined,
        evaluationReceivedAt: input.evaluationReceivedAt ? new Date(input.evaluationReceivedAt) : input.evaluationReceivedAt === null ? null : undefined,
      } as any);

      res.json(updated);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
        return;
      }
      throw err;
    }
  });

  app.delete(api.missions.participants.remove.path, isAuthenticated, async (req, res) => {
    await storage.removeParticipantFromMission(
      Number(req.params.missionId),
      Number(req.params.participantId)
    );
    res.json({ success: true });
  });

  // Mission Attendance
  app.get(api.missions.attendance.list.path, isAuthenticated, async (req, res) => {
    const records = await storage.getAttendanceRecords(Number(req.params.id));
    res.json(records);
  });

  app.post(api.missions.attendance.create.path, isAuthenticated, async (req, res) => {
    try {
      const input = api.missions.attendance.create.input.parse(req.body);
      const record = await storage.createAttendanceRecord({
        ...input,
        missionId: Number(req.params.id),
      });
      res.status(201).json(record);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
        return;
      }
      throw err;
    }
  });

  // Mission Documents
  app.get(api.missions.documents.list.path, isAuthenticated, async (req, res) => {
    const docs = await storage.getDocumentsByMission(Number(req.params.id));
    res.json(docs);
  });

  // Mission Evaluations
  app.get(api.missions.evaluations.list.path, isAuthenticated, async (req, res) => {
    const evals = await storage.getEvaluationsByMission(Number(req.params.id));
    res.json(evals);
  });

  // Mission Messages
  app.get(api.messages.byMission.path, isAuthenticated, async (req, res) => {
    const messages = await storage.getMessagesByMission(Number(req.params.id));
    res.json(messages);
  });

  // ==================== PARTICIPANTS ====================
  app.get(api.participants.list.path, isAuthenticated, async (req, res) => {
    const participants = await storage.getParticipants();
    res.json(participants);
  });

  app.get(api.participants.get.path, isAuthenticated, async (req, res) => {
    const participant = await storage.getParticipant(Number(req.params.id));
    if (!participant) {
      res.status(404).json({ message: "Participant non trouvé" });
      return;
    }
    res.json(participant);
  });

  app.post(api.participants.create.path, isAuthenticated, requirePermission('participants:create'), async (req, res) => {
    try {
      const input = api.participants.create.input.parse(req.body);
      const participant = await storage.createParticipant(input);
      res.status(201).json(participant);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
        return;
      }
      throw err;
    }
  });

  app.put(api.participants.update.path, isAuthenticated, async (req, res) => {
    try {
      const input = api.participants.update.input.parse(req.body);
      const participant = await storage.updateParticipant(Number(req.params.id), input);
      if (!participant) {
        res.status(404).json({ message: "Participant non trouvé" });
        return;
      }
      res.json(participant);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
        return;
      }
      throw err;
    }
  });

  // ==================== ATTENDANCE ====================
  app.put(api.attendance.update.path, isAuthenticated, async (req, res) => {
    try {
      const input = api.attendance.update.input.parse(req.body);
      const record = await storage.updateAttendanceRecord(Number(req.params.id), input);
      if (!record) {
        res.status(404).json({ message: "Enregistrement non trouvé" });
        return;
      }
      res.json(record);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
        return;
      }
      throw err;
    }
  });

  // ==================== EVALUATIONS ====================
  app.post(api.evaluations.create.path, isAuthenticated, async (req, res) => {
    try {
      const input = api.evaluations.create.input.parse(req.body);
      const evaluation = await storage.createEvaluation(input);
      res.status(201).json(evaluation);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
        return;
      }
      throw err;
    }
  });

  app.get(api.evaluations.get.path, isAuthenticated, async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ message: "ID invalide" });
      return;
    }
    const evaluation = await storage.getEvaluation(id);
    if (!evaluation) {
      res.status(404).json({ message: "Évaluation non trouvée" });
      return;
    }
    res.json(evaluation);
  });

  // ==================== INVOICES ====================
  app.get(api.invoices.list.path, isAuthenticated, async (req, res) => {
    try {
      const user = req.user!;

      let invoices;
      if (user.role === 'admin') {
        invoices = await storage.getInvoices();
      } else {
        invoices = await storage.getInvoicesByUser(user.id);
      }
      res.json(invoices);
    } catch (error) {
      console.error('Invoices list error:', error);
      res.status(500).json({ message: 'Erreur serveur' });
    }
  });

  app.get(api.invoices.get.path, isAuthenticated, async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ message: "ID invalide" });
      return;
    }
    const invoice = await storage.getInvoice(id);
    if (!invoice) {
      res.status(404).json({ message: "Facture non trouvée" });
      return;
    }
    res.json(invoice);
  });

  app.post(api.invoices.create.path, isAuthenticated, async (req, res) => {
    try {
      const user = req.user!;

      const input = api.invoices.create.input.parse(req.body);
      const invoice = await storage.createInvoice({
        ...input,
        userId: user.id,
        status: 'submitted',
      });
      res.status(201).json(invoice);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
        return;
      }
      throw err;
    }
  });

  app.put(api.invoices.update.path, isAuthenticated, async (req, res) => {
    try {
      const input = api.invoices.update.input.parse(req.body);
      const invoice = await storage.updateInvoice(Number(req.params.id), input);
      if (!invoice) {
        res.status(404).json({ message: "Facture non trouvée" });
        return;
      }
      res.json(invoice);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
        return;
      }
      throw err;
    }
  });

  app.patch(api.invoices.approve.path, isAuthenticated, requirePermission('invoices:approve'), async (req, res) => {
    const invoice = await storage.updateInvoiceStatus(Number(req.params.id), 'paid');
    if (!invoice) {
      res.status(404).json({ message: "Facture non trouvée" });
      return;
    }
    res.json(invoice);
  });

  app.patch(api.invoices.reject.path, isAuthenticated, requirePermission('invoices:approve'), async (req, res) => {
    try {
      const input = api.invoices.reject.input.parse(req.body);
      const invoice = await storage.updateInvoiceStatus(Number(req.params.id), 'rejected', input.reason);
      if (!invoice) {
        res.status(404).json({ message: "Facture non trouvée" });
        return;
      }
      res.json(invoice);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
        return;
      }
      throw err;
    }
  });

  app.patch(api.invoices.markPaid.path, isAuthenticated, requirePermission('invoices:approve'), async (req, res) => {
    const invoice = await storage.updateInvoiceStatus(Number(req.params.id), 'paid');
    if (!invoice) {
      res.status(404).json({ message: "Facture non trouvée" });
      return;
    }
    res.json(invoice);
  });

  // ==================== DOCUMENTS ====================
  app.get(api.documents.list.path, isAuthenticated, async (req, res) => {
    const documents = await storage.getDocuments();
    res.json(documents);
  });

  app.get(api.documents.get.path, isAuthenticated, async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ message: "ID invalide" });
      return;
    }
    const doc = await storage.getDocument(id);
    if (!doc) {
      res.status(404).json({ message: "Document non trouvé" });
      return;
    }
    res.json(doc);
  });

  app.post(api.documents.create.path, isAuthenticated, async (req, res) => {
    try {
      const user = req.user!;

      const input = api.documents.create.input.parse(req.body);
      const doc = await storage.createDocument({
        ...input,
        userId: user.id,
      });

      // Envoyer notification par email à l'autre partie
      if (input.missionId) {
        try {
          const mission = await storage.getMission(input.missionId);
          if (mission) {
            const modifiedBy = await storage.getUser(user.id);
            const trainer = mission.trainerId ? await storage.getUser(mission.trainerId) : null;
            const admins = await storage.getUsersByRole('admin');
            const client = mission.clientId ? await storage.getClient(mission.clientId) : null;

            if (modifiedBy) {
              await notifyOtherParty(
                mission,
                modifiedBy,
                trainer || null,
                admins,
                client || null,
                'document',
                { documentTitle: input.title }
              );
            }
          }
        } catch (emailErr) {
          console.error('[Email] Erreur notification document:', emailErr);
        }
      }

      res.status(201).json(doc);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
        return;
      }
      throw err;
    }
  });

  app.delete(api.documents.delete.path, isAuthenticated, requirePermission('documents:delete'), async (req, res) => {
    await storage.deleteDocument(Number(req.params.id));
    res.json({ success: true });
  });

  // Upload file for a document
  app.post('/api/documents/:id/upload', isAuthenticated, upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        res.status(400).json({ message: 'No file uploaded' });
        return;
      }

      const documentId = Number(req.params.id);
      const fileUrl = `/uploads/${req.file.filename}`;

      const updatedDoc = await storage.updateDocument(documentId, { url: fileUrl });
      if (!updatedDoc) {
        res.status(404).json({ message: "Document not found" });
        return;
      }

      res.json(updatedDoc);
    } catch (err) {
      console.error('Upload error:', err);
      res.status(500).json({ message: 'Upload failed' });
    }
  });

  // Update document (title, etc.)
  app.put('/api/documents/:id', isAuthenticated, async (req, res) => {
    try {
      const documentId = Number(req.params.id);
      const { title, type } = req.body;

      const updatedDoc = await storage.updateDocument(documentId, { title, type });
      if (!updatedDoc) {
        res.status(404).json({ message: "Document not found" });
        return;
      }

      res.json(updatedDoc);
    } catch (err) {
      console.error('Update document error:', err);
      res.status(500).json({ message: 'Update failed' });
    }
  });

  // ==================== MESSAGES ====================
  app.get(api.messages.list.path, isAuthenticated, async (req, res) => {
    const messages = await storage.getMessages();
    res.json(messages);
  });

  app.post(api.messages.create.path, isAuthenticated, async (req, res) => {
    try {
      const user = req.user!;

      const input = api.messages.create.input.parse(req.body);
      const message = await storage.createMessage({
        ...input,
        senderId: user.id,
      });

      // Envoyer notification par email à l'autre partie
      if (input.missionId) {
        try {
          const mission = await storage.getMission(input.missionId);
          if (mission) {
            const modifiedBy = await storage.getUser(user.id);
            const trainer = mission.trainerId ? await storage.getUser(mission.trainerId) : null;
            const admins = await storage.getUsersByRole('admin');
            const client = mission.clientId ? await storage.getClient(mission.clientId) : null;

            if (modifiedBy) {
              await notifyOtherParty(
                mission,
                modifiedBy,
                trainer || null,
                admins,
                client || null,
                'comment',
                { commentContent: input.content }
              );
            }
          }
        } catch (emailErr) {
          console.error('[Email] Erreur notification message:', emailErr);
        }
      }

      res.status(201).json(message);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
        return;
      }
      throw err;
    }
  });

  // ==================== LEGACY ENDPOINTS ====================
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

  // ==================== REMINDER SETTINGS ====================
  app.get(api.reminderSettings.list.path, isAuthenticated, async (req, res) => {
    const settings = await storage.getReminderSettings();
    res.json(settings);
  });

  app.get(api.reminderSettings.get.path, isAuthenticated, async (req, res) => {
    const setting = await storage.getReminderSetting(Number(req.params.id));
    if (!setting) {
      res.status(404).json({ message: "Parametre non trouve" });
      return;
    }
    res.json(setting);
  });

  app.post(api.reminderSettings.create.path, isAuthenticated, async (req, res) => {
    try {
      const input = api.reminderSettings.create.input.parse(req.body);
      const setting = await storage.createReminderSetting(input);
      res.status(201).json(setting);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
        return;
      }
      throw err;
    }
  });

  app.put(api.reminderSettings.update.path, isAuthenticated, async (req, res) => {
    try {
      const input = api.reminderSettings.update.input.parse(req.body);
      const setting = await storage.updateReminderSetting(Number(req.params.id), input);
      if (!setting) {
        res.status(404).json({ message: "Parametre non trouve" });
        return;
      }
      res.json(setting);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
        return;
      }
      throw err;
    }
  });

  app.delete(api.reminderSettings.delete.path, isAuthenticated, async (req, res) => {
    await storage.deleteReminderSetting(Number(req.params.id));
    res.json({ success: true });
  });

  // ==================== REMINDERS ====================
  app.get(api.reminders.list.path, isAuthenticated, async (req, res) => {
    const reminders = await storage.getReminders();
    res.json(reminders);
  });

  app.get(api.reminders.pending.path, isAuthenticated, async (req, res) => {
    const reminders = await storage.getPendingReminders();
    res.json(reminders);
  });

  app.get(api.reminders.byMission.path, isAuthenticated, async (req, res) => {
    const reminders = await storage.getRemindersByMission(Number(req.params.id));
    res.json(reminders);
  });

  app.post(api.reminders.create.path, isAuthenticated, async (req, res) => {
    try {
      const input = api.reminders.create.input.parse(req.body);
      const reminder = await storage.createReminder({
        ...input,
        scheduledDate: new Date(input.scheduledDate),
      });
      res.status(201).json(reminder);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
        return;
      }
      throw err;
    }
  });

  app.put(api.reminders.update.path, isAuthenticated, async (req, res) => {
    try {
      const input = api.reminders.update.input.parse(req.body);
      const updateData: any = { ...input };
      if (input.scheduledDate) {
        updateData.scheduledDate = new Date(input.scheduledDate);
      }
      if (input.sentAt) {
        updateData.sentAt = new Date(input.sentAt);
      }
      const reminder = await storage.updateReminder(Number(req.params.id), updateData);
      if (!reminder) {
        res.status(404).json({ message: "Rappel non trouve" });
        return;
      }
      res.json(reminder);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
        return;
      }
      throw err;
    }
  });

  app.delete(api.reminders.delete.path, isAuthenticated, async (req, res) => {
    await storage.deleteReminder(Number(req.params.id));
    res.json({ success: true });
  });

  // Generate reminders for a mission based on active settings
  app.post(api.reminders.generateForMission.path, isAuthenticated, async (req, res) => {
    try {
      const missionId = Number(req.params.id);
      const mission = await storage.getMission(missionId);
      if (!mission || !mission.startDate) {
        res.status(404).json({ message: "Mission non trouvee ou sans date de debut" });
        return;
      }

      const settings = await storage.getReminderSettings();
      const activeSettings = settings.filter(s => s.isActive);
      let created = 0;

      for (const setting of activeSettings) {
        const missionDate = new Date(mission.startDate);
        const scheduledDate = new Date(missionDate);
        scheduledDate.setDate(scheduledDate.getDate() - setting.daysBefore);

        // Skip if scheduled date is in the past
        if (scheduledDate < new Date()) continue;

        // Create reminders based on notification settings
        const recipients: { type: string; email?: string; name?: string }[] = [];

        if (setting.notifyAdmin) {
          const admins = await storage.getUsers();
          const adminUsers = admins.filter(u => u.role === 'admin');
          for (const admin of adminUsers) {
            recipients.push({
              type: 'admin',
              email: admin.email ?? undefined,
              name: `${admin.firstName} ${admin.lastName}`,
            });
          }
        }

        if (setting.notifyTrainer && mission.trainerId) {
          const trainer = await storage.getUser(mission.trainerId);
          if (trainer) {
            recipients.push({
              type: 'trainer',
              email: trainer.email ?? undefined,
              name: `${trainer.firstName} ${trainer.lastName}`,
            });
          }
        }

        if (setting.notifyClient && mission.clientId) {
          const client = await storage.getClient(mission.clientId);
          if (client && client.contactEmail) {
            recipients.push({
              type: 'client',
              email: client.contactEmail,
              name: client.contactName || client.name,
            });
          }
        }

        for (const recipient of recipients) {
          await storage.createReminder({
            settingId: setting.id,
            missionId,
            scheduledDate,
            recipientType: recipient.type,
            recipientEmail: recipient.email,
            recipientName: recipient.name,
            status: 'pending',
          });
          created++;
        }
      }

      res.json({ created });
    } catch (err) {
      console.error('Error generating reminders:', err);
      res.status(500).json({ message: "Erreur lors de la generation des rappels" });
    }
  });

  // Process pending reminders (to be called by cron job)
  app.post(api.reminders.process.path, isAuthenticated, async (req, res) => {
    try {
      const pendingReminders = await storage.getPendingReminders();
      const now = new Date();
      let processed = 0;
      let sent = 0;
      let failed = 0;

      for (const reminder of pendingReminders) {
        if (new Date(reminder.scheduledDate) <= now) {
          processed++;
          try {
            // Récupérer les informations nécessaires pour l'email
            const mission = reminder.missionId ? await storage.getMission(reminder.missionId) : null;
            if (!mission) {
              throw new Error('Mission non trouvée');
            }

            const trainer = mission.trainerId ? await storage.getUser(mission.trainerId) : null;
            const client = mission.clientId ? await storage.getClient(mission.clientId) : null;

            // Récupérer le setting pour avoir les jours avant
            const setting = reminder.settingId ? await storage.getReminderSetting(reminder.settingId) : null;
            const daysBefore = setting?.daysBefore || 0;

            // Envoyer l'email
            const emailSent = await sendReminderEmail({
              recipientEmail: reminder.recipientEmail || '',
              recipientName: reminder.recipientName || 'Destinataire',
              recipientType: (reminder.recipientType as 'admin' | 'trainer' | 'client') || 'admin',
              mission,
              trainer,
              client,
              daysBefore,
              customSubject: setting?.emailSubject || undefined,
            });

            if (emailSent) {
              await storage.updateReminder(reminder.id, {
                status: 'sent',
                sentAt: now,
              });
              sent++;
            } else {
              throw new Error('Échec de l\'envoi de l\'email');
            }
          } catch (err) {
            await storage.updateReminder(reminder.id, {
              status: 'failed',
              errorMessage: err instanceof Error ? err.message : 'Unknown error',
            });
            failed++;
          }
        }
      }

      res.json({ processed, sent, failed });
    } catch (err) {
      console.error('Error processing reminders:', err);
      res.status(500).json({ message: "Erreur lors du traitement des rappels" });
    }
  });

  // Generate reminders for ALL active missions based on settings
  app.post('/api/reminders/generate-all', isAuthenticated, async (req, res) => {
    try {
      const missions = await storage.getMissions();
      const settings = await storage.getReminderSettings();
      const activeSettings = settings.filter(s => s.isActive);
      const admins = (await storage.getUsers()).filter(u => u.role === 'admin' && u.status === 'ACTIF');

      let created = 0;
      let skipped = 0;

      // Filtrer les missions actives (pas annulées, pas terminées, avec une date de début future)
      const activeMissions = missions.filter(m =>
        m.status !== 'cancelled' &&
        m.status !== 'completed' &&
        m.startDate &&
        new Date(m.startDate) > new Date()
      );

      for (const mission of activeMissions) {
        for (const setting of activeSettings) {
          // Calculer la date d'envoi
          const missionStartDate = new Date(mission.startDate!);
          const scheduledDate = new Date(missionStartDate);
          scheduledDate.setDate(scheduledDate.getDate() - setting.daysBefore);

          // Ignorer si la date est dans le passé
          if (scheduledDate < new Date()) {
            skipped++;
            continue;
          }

          // Récupérer les infos du formateur et client
          const trainer = mission.trainerId ? await storage.getUser(mission.trainerId) : null;
          const client = mission.clientId ? await storage.getClient(mission.clientId) : null;

          // Créer les rappels pour chaque destinataire
          const recipients: { type: string; email?: string; name?: string }[] = [];

          if (setting.notifyAdmin) {
            for (const admin of admins) {
              if (admin.email) {
                recipients.push({
                  type: 'admin',
                  email: admin.email,
                  name: `${admin.firstName || ''} ${admin.lastName || ''}`.trim() || 'Admin',
                });
              }
            }
          }

          if (setting.notifyTrainer && trainer?.email) {
            recipients.push({
              type: 'trainer',
              email: trainer.email,
              name: `${trainer.firstName || ''} ${trainer.lastName || ''}`.trim() || 'Formateur',
            });
          }

          if (setting.notifyClient && client?.contactEmail) {
            recipients.push({
              type: 'client',
              email: client.contactEmail,
              name: client.contactName || client.name || 'Client',
            });
          }

          for (const recipient of recipients) {
            // Vérifier si ce rappel existe déjà
            const existingReminders = await storage.getRemindersByMission(mission.id);
            const alreadyExists = existingReminders.some(r =>
              r.settingId === setting.id &&
              r.recipientEmail === recipient.email &&
              r.status === 'pending'
            );

            if (!alreadyExists) {
              await storage.createReminder({
                settingId: setting.id,
                missionId: mission.id,
                scheduledDate,
                status: 'pending',
                recipientEmail: recipient.email,
                recipientName: recipient.name,
                recipientType: recipient.type,
              });
              created++;
            } else {
              skipped++;
            }
          }
        }

        // Ajouter le rappel admin J-2 systématique (si pas déjà créé)
        const j2Date = new Date(mission.startDate!);
        j2Date.setDate(j2Date.getDate() - 2);

        if (j2Date > new Date()) {
          for (const admin of admins) {
            if (admin.email) {
              const existingReminders = await storage.getRemindersByMission(mission.id);
              const j2Exists = existingReminders.some(r =>
                r.recipientEmail === admin.email &&
                r.recipientType === 'admin' &&
                r.status === 'pending' &&
                Math.abs(new Date(r.scheduledDate).getTime() - j2Date.getTime()) < 86400000 // Même jour
              );

              if (!j2Exists) {
                await storage.createReminder({
                  settingId: null,
                  missionId: mission.id,
                  scheduledDate: j2Date,
                  status: 'pending',
                  recipientEmail: admin.email,
                  recipientName: `${admin.firstName || ''} ${admin.lastName || ''}`.trim() || 'Admin',
                  recipientType: 'admin',
                });
                created++;
              }
            }
          }
        }
      }

      res.json({ created, skipped, missionsProcessed: activeMissions.length });
    } catch (err) {
      console.error('Error generating all reminders:', err);
      res.status(500).json({ message: "Erreur lors de la génération des rappels" });
    }
  });

  // ==================== DOCUMENT TEMPLATES ====================
  app.get('/api/document-templates', isAuthenticated, requireRole('admin'), async (req, res) => {
    const templates = await storage.getDocumentTemplates();
    res.json(templates);
  });

  app.get('/api/document-templates/:id', isAuthenticated, requireRole('admin'), async (req, res) => {
    const template = await storage.getDocumentTemplate(Number(req.params.id));
    if (!template) {
      res.status(404).json({ message: "Template non trouvé" });
      return;
    }
    res.json(template);
  });

  app.post('/api/document-templates', isAuthenticated, requireRole('admin'), upload.single('file'), async (req, res) => {
    try {
      const { title, type, forRole, description } = req.body;

      if (!title || !type || !forRole) {
        res.status(400).json({ message: 'Champs manquants' });
        return;
      }

      const fileUrl = req.file ? `/uploads/${req.file.filename}` : '';

      const template = await storage.createDocumentTemplate({
        title,
        type,
        forRole,
        url: fileUrl,
        description: description || null,
        isActive: true,
      });

      res.status(201).json(template);
    } catch (err) {
      console.error('Template creation error:', err);
      res.status(500).json({ message: 'Erreur lors de la création du template' });
    }
  });

  app.put('/api/document-templates/:id', isAuthenticated, requireRole('admin'), upload.single('file'), async (req, res) => {
    try {
      const templateId = Number(req.params.id);
      const { title, type, forRole, description, isActive, clientId, changeNotes } = req.body;
      const user = req.user!;

      const updateData: any = {};
      if (title) updateData.title = title;
      if (type) updateData.type = type;
      if (forRole) updateData.forRole = forRole;
      if (description !== undefined) updateData.description = description;
      if (isActive !== undefined) updateData.isActive = isActive === 'true' || isActive === true;
      if (clientId !== undefined) updateData.clientId = clientId ? Number(clientId) : null;
      if (req.file) updateData.url = `/uploads/${req.file.filename}`;

      // The storage method now handles versioning and notifications automatically
      const updated = await storage.updateDocumentTemplate(
        templateId,
        updateData,
        user.id,
        changeNotes || undefined
      );

      if (!updated) {
        res.status(404).json({ message: "Template non trouvé" });
        return;
      }

      res.json(updated);
    } catch (err) {
      console.error('Template update error:', err);
      res.status(500).json({ message: 'Erreur lors de la mise à jour du template' });
    }
  });

  app.delete('/api/document-templates/:id', isAuthenticated, requireRole('admin'), async (req, res) => {
    await storage.deleteDocumentTemplate(Number(req.params.id));
    res.json({ success: true });
  });

  // Get template versions history
  app.get('/api/document-templates/:id/versions', isAuthenticated, requireRole('admin'), async (req, res) => {
    const versions = await storage.getTemplateVersions(Number(req.params.id));
    res.json(versions);
  });

  // Get unread notifications for current user
  app.get('/api/notifications/templates', isAuthenticated, async (req, res) => {
    const user = req.user!;
    const notifications = await storage.getUnreadNotifications(user.id);
    res.json(notifications);
  });

  // Mark notification as read
  app.patch('/api/notifications/:id/read', isAuthenticated, async (req, res) => {
    await storage.markNotificationAsRead(Number(req.params.id));
    res.json({ success: true });
  });

  // Mark all notifications as read
  app.patch('/api/notifications/read-all', isAuthenticated, async (req, res) => {
    const user = req.user!;
    await storage.markAllNotificationsAsRead(user.id);
    res.json({ success: true });
  });

  // ==================== IN-APP NOTIFICATIONS ====================
  // Get all in-app notifications for current user
  app.get('/api/in-app-notifications', isAuthenticated, async (req, res) => {
    try {
      const user = req.user!;
      const notifications = await storage.getInAppNotifications(user.id);
      res.json(notifications);
    } catch (err) {
      console.error('Error fetching in-app notifications:', err);
      res.status(500).json({ message: 'Erreur serveur' });
    }
  });

  // Get unread in-app notifications only
  app.get('/api/in-app-notifications/unread', isAuthenticated, async (req, res) => {
    try {
      const user = req.user!;
      const notifications = await storage.getUnreadInAppNotifications(user.id);
      res.json(notifications);
    } catch (err) {
      console.error('Error fetching unread notifications:', err);
      res.status(500).json({ message: 'Erreur serveur' });
    }
  });

  // Get unread notification count
  app.get('/api/in-app-notifications/unread-count', isAuthenticated, async (req, res) => {
    try {
      const user = req.user!;
      const count = await storage.getUnreadInAppNotificationCount(user.id);
      res.json({ count });
    } catch (err) {
      console.error('Error fetching notification count:', err);
      res.status(500).json({ message: 'Erreur serveur' });
    }
  });

  // Mark a notification as read
  app.patch('/api/in-app-notifications/:id/read', isAuthenticated, async (req, res) => {
    try {
      const notification = await storage.markInAppNotificationAsRead(Number(req.params.id));
      if (!notification) {
        res.status(404).json({ message: 'Notification non trouvée' });
        return;
      }
      res.json(notification);
    } catch (err) {
      console.error('Error marking notification as read:', err);
      res.status(500).json({ message: 'Erreur serveur' });
    }
  });

  // Mark all notifications as read
  app.patch('/api/in-app-notifications/read-all', isAuthenticated, async (req, res) => {
    try {
      const user = req.user!;
      await storage.markAllInAppNotificationsAsRead(user.id);
      res.json({ success: true });
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
      res.status(500).json({ message: 'Erreur serveur' });
    }
  });

  // Create a test notification (for testing purposes)
  app.post('/api/in-app-notifications/test', isAuthenticated, async (req, res) => {
    try {
      const user = req.user!;
      const notification = await storage.createInAppNotification({
        userId: user.id,
        type: 'reminder',
        title: 'Rappel J-7 : Formation Test',
        message: 'Formation "React Avancé" prévue dans 7 jours',
        missionId: null,
        reminderId: null,
        metadata: {
          daysBefore: 7,
          trainerName: 'Jean Dupont',
          location: 'Paris',
          startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        },
      });
      res.status(201).json(notification);
    } catch (err) {
      console.error('Error creating test notification:', err);
      res.status(500).json({ message: 'Erreur serveur' });
    }
  });

  // Duplicate mission for another trainer
  app.post('/api/missions/:id/duplicate', isAuthenticated, requirePermission('missions:create'), async (req, res) => {
    try {
      const { trainerId } = req.body;
      if (!trainerId) {
        res.status(400).json({ message: 'trainerId requis' });
        return;
      }

      const duplicated = await storage.duplicateMissionForTrainer(Number(req.params.id), trainerId);
      if (!duplicated) {
        res.status(404).json({ message: "Mission non trouvée" });
        return;
      }

      res.status(201).json(duplicated);
    } catch (err) {
      console.error('Mission duplication error:', err);
      res.status(500).json({ message: 'Erreur lors de la duplication de la mission' });
    }
  });

  // ==================== MULTI-TRAINER DUPLICATION ====================
  // Duplicate mission for multiple trainers at once
  app.post('/api/missions/:id/duplicate-multi', isAuthenticated, requirePermission('missions:create'), async (req, res) => {
    try {
      const { trainerIds } = req.body;
      if (!trainerIds || !Array.isArray(trainerIds) || trainerIds.length === 0) {
        res.status(400).json({ message: 'trainerIds requis (tableau non vide)' });
        return;
      }

      const result = await storage.duplicateMissionForMultipleTrainers(Number(req.params.id), trainerIds);
      res.status(201).json(result);
    } catch (err) {
      console.error('Multi-trainer duplication error:', err);
      res.status(500).json({ message: err instanceof Error ? err.message : 'Erreur lors de la duplication' });
    }
  });

  // Get child missions (copies) of a parent mission
  app.get('/api/missions/:id/children', isAuthenticated, async (req, res) => {
    try {
      const children = await storage.getChildMissions(Number(req.params.id));
      res.json(children);
    } catch (err) {
      console.error('Get children error:', err);
      res.status(500).json({ message: 'Erreur serveur' });
    }
  });

  // Get parent mission of a copy
  app.get('/api/missions/:id/parent', isAuthenticated, async (req, res) => {
    try {
      const parent = await storage.getParentMission(Number(req.params.id));
      if (!parent) {
        res.status(404).json({ message: 'Mission parente non trouvée' });
        return;
      }
      res.json(parent);
    } catch (err) {
      console.error('Get parent error:', err);
      res.status(500).json({ message: 'Erreur serveur' });
    }
  });

  // Sync parent mission info to all children
  app.patch('/api/missions/:id/sync-children', isAuthenticated, requirePermission('missions:update'), async (req, res) => {
    try {
      const { fields } = req.body;
      const synced = await storage.syncParentToChildren(Number(req.params.id), fields);
      res.json({ synced });
    } catch (err) {
      console.error('Sync children error:', err);
      res.status(500).json({ message: 'Erreur lors de la synchronisation' });
    }
  });

  // ==================== GAMIFICATION ====================
  // Get gamification profile for current user
  app.get('/api/gamification/profile', isAuthenticated, async (req, res) => {
    try {
      const user = req.user!;
      const profile = await gamificationService.getUserProfile(user.id);
      res.json(profile);
    } catch (err) {
      console.error('Gamification profile error:', err);
      res.status(500).json({ message: 'Erreur lors de la récupération du profil' });
    }
  });

  // Get gamification profile for specific user (admin only)
  app.get('/api/gamification/profile/:userId', isAuthenticated, async (req, res) => {
    try {
      const profile = await gamificationService.getUserProfile(req.params.userId);
      res.json(profile);
    } catch (err) {
      console.error('Gamification profile error:', err);
      res.status(500).json({ message: 'Erreur lors de la récupération du profil' });
    }
  });

  // Get all badges
  app.get('/api/gamification/badges', isAuthenticated, async (req, res) => {
    try {
      const badges = await storage.getBadges();
      res.json(badges);
    } catch (err) {
      console.error('Get badges error:', err);
      res.status(500).json({ message: 'Erreur lors de la récupération des badges' });
    }
  });

  // Get user badges
  app.get('/api/gamification/user-badges', isAuthenticated, async (req, res) => {
    try {
      const user = req.user!;
      const userBadges = await storage.getUserBadges(user.id);
      res.json(userBadges);
    } catch (err) {
      console.error('Get user badges error:', err);
      res.status(500).json({ message: 'Erreur lors de la récupération des badges' });
    }
  });

  // Get unnotified badges (for celebration modals)
  app.get('/api/gamification/unnotified-badges', isAuthenticated, async (req, res) => {
    try {
      const user = req.user!;
      const badges = await gamificationService.getUnnotifiedBadges(user.id);
      res.json(badges);
    } catch (err) {
      console.error('Get unnotified badges error:', err);
      res.status(500).json({ message: 'Erreur' });
    }
  });

  // Mark badge as notified
  app.patch('/api/gamification/badges/:id/notified', isAuthenticated, async (req, res) => {
    try {
      await gamificationService.markBadgeNotified(Number(req.params.id));
      res.json({ success: true });
    } catch (err) {
      console.error('Mark badge notified error:', err);
      res.status(500).json({ message: 'Erreur' });
    }
  });

  // Award XP (internal use or admin)
  app.post('/api/gamification/award-xp', isAuthenticated, async (req, res) => {
    try {
      const user = req.user!;
      const { userId, amount, actionType, reason, entityType, entityId } = req.body;

      // Only allow awarding XP to self or if admin
      const targetUserId = userId || user.id;
      if (targetUserId !== user.id && user.role !== 'admin') {
        res.status(403).json({ message: 'Non autorisé' });
        return;
      }

      const result = await gamificationService.awardXP(
        targetUserId,
        amount,
        actionType,
        reason,
        entityType,
        entityId
      );
      res.json(result);
    } catch (err) {
      console.error('Award XP error:', err);
      res.status(500).json({ message: 'Erreur lors de l\'attribution des XP' });
    }
  });

  // Get XP transactions for current user
  app.get('/api/gamification/xp-history', isAuthenticated, async (req, res) => {
    try {
      const user = req.user!;
      const transactions = await storage.getXPTransactions(user.id);
      res.json(transactions);
    } catch (err) {
      console.error('Get XP history error:', err);
      res.status(500).json({ message: 'Erreur' });
    }
  });

  // Get level configuration
  app.get('/api/gamification/levels', isAuthenticated, async (req, res) => {
    res.json(LEVELS);
  });

  // Get XP configuration
  app.get('/api/gamification/xp-config', isAuthenticated, async (req, res) => {
    res.json(XP_CONFIG);
  });

  // Register Feedback routes
  registerFeedbackRoutes(app);

  // Register Documents routes (contracts, invoices)
  app.use('/api/documents', isAuthenticated, documentsRouter);

  // Seed Data
  await seedDatabase().catch(err => console.error('Error seeding database:', err));
  await seedBadges().catch(err => console.error('Error seeding badges:', err));
  await seedDefaultTemplates().catch(err => console.error('Error seeding default templates:', err));

  return httpServer;
}

async function seedDatabase() {
  // Check if we already have data
  const existingMissions = await storage.getMissions();
  if (existingMissions.length > 0) {
    return; // Already seeded
  }

  // Create admin user with password
  const admin = await storage.createUser({
    email: 'admin@cqfd-formation.fr',
    firstName: 'Marie',
    lastName: 'Dupont',
    role: 'admin',
  }, 'admin123');

  // Create formateur with password
  const formateur = await storage.createUser({
    email: 'formateur@cqfd-formation.fr',
    firstName: 'Pierre',
    lastName: 'Martin',
    role: 'formateur',
    phone: '06 12 34 56 78',
    specialties: ['Management', 'Communication'],
  }, 'formateur123');

  // Create prestataire with password
  const prestataire = await storage.createUser({
    email: 'prestataire@example.com',
    firstName: 'Jean',
    lastName: 'Bernard',
    role: 'prestataire',
    phone: '06 98 76 54 32',
    siret: '12345678901234',
    dailyRate: 50000, // 500€
    specialties: ['Sécurité', 'Gestion de projet'],
  }, 'prestataire123');

  // Create clients
  const client1 = await storage.createClient({
    name: 'TechCorp SAS',
    type: 'entreprise',
    siret: '98765432109876',
    address: '15 rue de la Tech',
    city: 'Paris',
    postalCode: '75001',
    contactName: 'Sophie Leroy',
    contactEmail: 'sophie.leroy@techcorp.fr',
    contactPhone: '01 23 45 67 89',
  });

  const client2 = await storage.createClient({
    name: 'OPCO Commerce',
    type: 'opco',
    address: '50 avenue des OPCO',
    city: 'Lyon',
    postalCode: '69001',
    contactName: 'Marc Durand',
    contactEmail: 'marc.durand@opco-commerce.fr',
  });

  // Create training programs
  const program1 = await storage.createTrainingProgram({
    code: 'MGMT-001',
    title: 'Management d\'équipe',
    type: 'Intra',
    description: 'Formation aux fondamentaux du management',
    objectives: 'Développer son leadership, Gérer les conflits, Motiver son équipe',
    duration: '14 heures (2 jours)',
    recommendedParticipants: 12,
  });

  const program2 = await storage.createTrainingProgram({
    code: 'SEC-001',
    title: 'Sécurité informatique',
    type: 'Inter',
    description: 'Sensibilisation à la cybersécurité',
    objectives: 'Identifier les menaces, Appliquer les bonnes pratiques, Réagir en cas d\'incident',
    duration: '7 heures (1 jour)',
    recommendedParticipants: 15,
  });

  // Create missions
  const mission1 = await storage.createMission({
    reference: 'MIS-2024-001',
    title: 'Formation Management TechCorp',
    typology: 'Intra',
    status: 'confirmed',
    programId: program1.id,
    clientId: client1.id,
    trainerId: formateur.id,
    startDate: new Date('2024-02-15'),
    endDate: new Date('2024-02-16'),
    totalHours: 14,
    locationType: 'presentiel',
    location: '15 rue de la Tech, Paris',
  });

  const mission2 = await storage.createMission({
    reference: 'MIS-2024-002',
    title: 'Cybersécurité OPCO Commerce',
    typology: 'Inter',
    status: 'draft',
    programId: program2.id,
    clientId: client2.id,
    trainerId: prestataire.id,
    startDate: new Date('2024-03-10'),
    endDate: new Date('2024-03-10'),
    totalHours: 7,
    locationType: 'distanciel',
    location: 'En ligne',
  });

  // Create sessions for mission 1
  await storage.createMissionSession({
    missionId: mission1.id,
    sessionDate: new Date('2024-02-15'),
    startTime: '09:00',
    endTime: '17:00',
  });

  await storage.createMissionSession({
    missionId: mission1.id,
    sessionDate: new Date('2024-02-16'),
    startTime: '09:00',
    endTime: '17:00',
  });

  // Create participants
  const participant1 = await storage.createParticipant({
    firstName: 'Alice',
    lastName: 'Moreau',
    email: 'alice.moreau@techcorp.fr',
    phone: '06 11 22 33 44',
    company: 'TechCorp SAS',
    function: 'Chef de projet',
  });

  const participant2 = await storage.createParticipant({
    firstName: 'Bruno',
    lastName: 'Petit',
    email: 'bruno.petit@techcorp.fr',
    phone: '06 55 66 77 88',
    company: 'TechCorp SAS',
    function: 'Responsable équipe',
  });

  // Add participants to mission 1
  await storage.addParticipantToMission({
    missionId: mission1.id,
    participantId: participant1.id,
    status: 'confirmed',
  });

  await storage.addParticipantToMission({
    missionId: mission1.id,
    participantId: participant2.id,
    status: 'confirmed',
  });

  // Create a sample invoice
  await storage.createInvoice({
    invoiceNumber: 'FAC-2024-001',
    amount: 50000, // 500€
    vatAmount: 10000, // 100€ TVA
    status: 'submitted',
    userId: prestataire.id,
    missionId: mission2.id,
    invoiceDate: new Date(),
  });

  console.log('Database seeded with CQFD Formation demo data');
}

// Seed default badges for gamification
async function seedBadges() {
  try {
    const existingBadges = await storage.getBadges();
    if (existingBadges.length > 0) {
      return; // Already seeded
    }

    console.log('Seeding default badges...');
    for (const badge of DEFAULT_BADGES) {
      await storage.createBadge(badge);
    }
    console.log(`Seeded ${DEFAULT_BADGES.length} badges`);
  } catch (err) {
    console.error('Error seeding badges:', err);
  }
}
