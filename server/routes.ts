import type { Express } from "express";
import express from "express";
import { type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import type { User } from "@shared/schema";
import { z } from "zod";
import { setupLocalAuth, setupAuthRoutes, isAuthenticated, setupGoogleAuth, setupGoogleAuthRoutes } from "./auth";
import { requirePermission, requireRole } from "./middleware/rbac";
import { sendMissionAssignmentEmail, sendReminderEmail, sendAdminFormationReminderEmail, notifyOtherParty, sendWelcomeEmail, sendStepLinkEmail, sendDailyExportEmail } from "./email";
import { gamificationService, XP_CONFIG, LEVELS, DEFAULT_BADGES } from "./gamification";
import { syncMissionToCalendar, deleteMissionFromCalendar, getGoogleAdminUserId } from "./google";
import { registerFeedbackRoutes } from "./feedback";
import documentsRouter from "./documents";
import { seedDefaultTemplates } from "./seed-templates";
import { generateMissionsExcel, listExports, getLatestExport } from "./excel-export";
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

// Sanitize filename: remove accents, replace spaces/special chars with dashes
function sanitizeFilename(name: string): string {
  const ext = path.extname(name);
  const base = path.basename(name, ext);
  const sanitized = base
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // remove accents
    .replace(/[^a-zA-Z0-9._-]/g, '-') // replace special chars
    .replace(/-+/g, '-') // collapse consecutive dashes
    .replace(/^-|-$/g, ''); // trim dashes
  return (sanitized || 'file') + ext.toLowerCase();
}

const storageConfig = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + sanitizeFilename(file.originalname));
  }
});

const upload = multer({
  storage: storageConfig,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
});

// Helper: check if a non-admin user has access to a mission
async function canAccessMission(userId: string, userRole: string, missionId: number): Promise<boolean> {
  if (userRole === 'admin') return true;
  const mission = await storage.getMission(missionId);
  if (!mission) return false;
  if (mission.trainerId === userId) return true;
  const trainers = await storage.getMissionTrainers(missionId);
  return trainers.some(t => t.trainerId === userId);
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Setup local authentication
  setupLocalAuth(app);
  setupAuthRoutes(app);

  // Setup Google OAuth
  setupGoogleAuth(app);
  setupGoogleAuthRoutes(app);

  // Serve uploaded files statically
  app.use('/uploads', (req, res, next) => {
    if (!req.isAuthenticated || !req.isAuthenticated()) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    next();
  });
  app.use('/uploads', express.static(uploadDir), (req, res, next) => {
    // Fallback: try to find the file by decoding the URL (handles accented filenames)
    try {
      const decodedPath = decodeURIComponent(req.path);
      const filePath = path.join(uploadDir, decodedPath);
      // Prevent path traversal
      if (!filePath.startsWith(uploadDir)) {
        return next();
      }
      if (fs.existsSync(filePath)) {
        return res.sendFile(filePath);
      }
    } catch {}
    next();
  }, (req, res) => {
    // If file still not found, return a user-friendly 404 page
    res.status(404).send(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Fichier non trouvé</title>
<style>body{font-family:system-ui,sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;background:#f9fafb;color:#374151}
.box{text-align:center;padding:2rem}.icon{font-size:3rem;margin-bottom:1rem}h1{font-size:1.25rem;margin:0 0 .5rem}p{color:#6b7280;margin:0 0 1.5rem}
a{color:#2563eb;text-decoration:none;font-size:.875rem}</style></head>
<body><div class="box"><div class="icon">&#128196;</div><h1>Fichier non disponible</h1><p>Ce document n'a pas été trouvé sur le serveur.<br>Il doit être rechargé dans la mission.</p><a href="javascript:window.close()">Fermer cet onglet</a></div></body></html>`);
  });

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

  // Helper to strip sensitive fields from user objects
  const stripPassword = (user: any) => {
    const { passwordHash, googleAccessToken, googleRefreshToken, ...safeUser } = user;
    return safeUser;
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

      // Send welcome email with account setup link (72h TTL)
      if (user.email) {
        try {
          const TTL_72H = 72 * 60 * 60 * 1000;
          const resetToken = await storage.createPasswordResetToken(user.id, TTL_72H);
          const baseUrl = process.env.APP_URL || `${req.protocol}://${req.get('host')}`;
          await sendWelcomeEmail(
            user.email,
            user.firstName || '',
            user.lastName || '',
            resetToken.token,
            baseUrl
          );
          console.log(`[Welcome Email] Email de bienvenue envoyé à ${user.email}`);
        } catch (emailErr) {
          console.error(`[Welcome Email] Erreur lors de l'envoi de l'email de bienvenue à ${user.email}:`, emailErr);
        }
      }

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
      console.error("Route error:", err); res.status(500).json({ message: err instanceof Error ? err.message : "Erreur serveur" });
    }
  });

  app.put(api.users.update.path, isAuthenticated, requirePermission('users:update'), async (req, res) => {
    try {
      const targetUserId = req.params.id;
      // Empêcher la désactivation ou le changement de rôle de l'admin principal
      if (targetUserId === 'fc6c33f9-0245-4b10-856c-3f4daa45b6b6') {
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
      console.error("Route error:", err); res.status(500).json({ message: err instanceof Error ? err.message : "Erreur serveur" });
    }
  });

  app.delete(api.users.delete.path, isAuthenticated, requirePermission('users:delete'), async (req, res) => {
    try {
      const targetUserId = req.params.id;
      // Empêcher la suppression de l'admin principal
      if (targetUserId === 'fc6c33f9-0245-4b10-856c-3f4daa45b6b6') {
        return res.status(403).json({ message: "L'administrateur principal ne peut pas être supprimé" });
      }

      const success = await storage.hardDeleteUser(req.params.id);
      if (!success) {
        res.status(404).json({ message: "Utilisateur non trouvé" });
        return;
      }
      res.json({ success: true });
    } catch (err) {
      console.error('User deletion error:', err);
      res.status(500).json({ message: err instanceof Error ? err.message : "Erreur lors de la suppression de l'utilisateur" });
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
      console.error("Route error:", err); res.status(500).json({ message: err instanceof Error ? err.message : "Erreur serveur" });
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
      console.error("Route error:", err); res.status(500).json({ message: err instanceof Error ? err.message : "Erreur serveur" });
    }
  });

  app.delete('/api/clients/:id', isAuthenticated, requirePermission('clients:delete'), async (req, res) => {
    try {
      const id = Number(req.params.id);
      await storage.updateClient(id, { isActive: false } as any);
      res.json({ success: true });
    } catch (err) {
      console.error("Route error:", err); res.status(500).json({ message: err instanceof Error ? err.message : "Erreur serveur" });
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
      console.error("Route error:", err); res.status(500).json({ message: err instanceof Error ? err.message : "Erreur serveur" });
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
      console.error("Route error:", err); res.status(500).json({ message: err instanceof Error ? err.message : "Erreur serveur" });
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
    const missionId = Number(req.params.id);
    const user = req.user!;
    if (!(await canAccessMission(user.id, user.role, missionId))) {
      res.status(403).json({ message: "Accès non autorisé à cette mission" });
      return;
    }
    const mission = await storage.getMission(missionId);
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
            try {
              const documents = await storage.getDocumentsByMission(mission.id);
              const trainerDocuments = documents.filter(doc => doc.userId === mission.trainerId);
              await sendMissionAssignmentEmail(trainer, mission, trainerDocuments);
            } catch (emailErr) {
              console.error('[Email] Erreur envoi email assignation mission:', emailErr);
            }
          }
        }
      }

      // Sync to Google Calendar (non-blocking)
      try {
        const adminId = await getGoogleAdminUserId();
        if (adminId) {
          syncMissionToCalendar(mission.id, adminId).catch((e) =>
            console.error('[Calendar] Sync after create failed:', e)
          );
        }
      } catch (calErr) {
        console.error('[Calendar] Calendar sync error:', calErr);
      }

      res.status(201).json(mission);
    } catch (err) {
      console.error('Mission creation error:', err);
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message, errors: err.errors });
        return;
      }
      console.error("Route error:", err); res.status(500).json({ message: err instanceof Error ? err.message : "Erreur serveur" });
    }
  });

  app.put(api.missions.update.path, isAuthenticated, requirePermission('missions:update'), async (req, res) => {
    try {
      // Convert date strings to Date objects
      const body = {
        ...req.body,
        startDate: req.body.startDate ? new Date(req.body.startDate) : undefined,
      };
      const input = api.missions.update.input.parse(body);
      const mission = await storage.updateMission(Number(req.params.id), input);
      if (!mission) {
        res.status(404).json({ message: "Mission non trouvée" });
        return;
      }

      // Créer des notifications internes et emails
      try {
        const currentUser = req.user!;
        const modifiedBy = await storage.getUser(currentUser.id);
        const trainer = mission.trainerId ? await storage.getUser(mission.trainerId) : null;
        const admins = await storage.getUsersByRole('admin');
        const client = mission.clientId ? await storage.getClient(mission.clientId) : null;
        
        // Récupérer tous les formateurs assignés à cette mission
        const missionTrainers = await storage.getMissionTrainers(mission.id);
        const modifierName = modifiedBy ? `${modifiedBy.firstName || ''} ${modifiedBy.lastName || ''}`.trim() || modifiedBy.email : 'Un utilisateur';

        // 1. Notifications internes pour tous les formateurs assignés
        for (const mt of missionTrainers) {
          // Ne pas notifier le modificateur lui-même
          if (mt.trainerId !== currentUser.id) {
            await storage.createInAppNotification({
              userId: mt.trainerId,
              type: 'mission_update',
              title: 'Mission modifiée',
              message: `La mission "${mission.title}" a été modifiée par ${modifierName}`,
              missionId: mission.id,
            });
          }
        }

        // 2. Notifier les admins (sauf le modificateur)
        for (const admin of admins) {
          if (admin.id !== currentUser.id) {
            await storage.createInAppNotification({
              userId: admin.id,
              type: 'mission_update',
              title: 'Mission modifiée',
              message: `La mission "${mission.title}" a été modifiée par ${modifierName}`,
              missionId: mission.id,
            });
          }
        }

        // 3. Email (en complément des notifications internes)
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
        console.error('[Notification] Erreur notification mission update:', emailErr);
        // Ne pas bloquer la réponse si la notification échoue
      }

      // Sync to Google Calendar (non-blocking)
      try {
        const adminId = await getGoogleAdminUserId();
        if (adminId) {
          syncMissionToCalendar(mission.id, adminId).catch((e) =>
            console.error('[Calendar] Sync after update failed:', e)
          );
        }
      } catch (calErr) {
        console.error('[Calendar] Calendar sync error:', calErr);
      }

      res.json(mission);
    } catch (err) {
      console.error('Mission update error:', err);
      console.error('Mission update payload:', JSON.stringify(req.body));
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message, errors: err.errors });
        return;
      }
      res.status(500).json({ message: err instanceof Error ? err.message : "Erreur lors de la mise a jour de la mission" });
    }
  });

  // ==================== REATTACH TEMPLATE DOCUMENTS ====================
  app.post('/api/missions/:id/reattach-documents', isAuthenticated, requirePermission('missions:update'), async (req, res) => {
    try {
      const missionId = Number(req.params.id);
      const mission = await storage.getMission(missionId);
      if (!mission) {
        res.status(404).json({ message: "Mission non trouvée" });
        return;
      }

      console.log(`[reattach-documents] Mission ${missionId}, typology=${mission.typology}, trainerId=${mission.trainerId}`);

      const results: { trainerId: string; removed: number; added: number }[] = [];

      // Reattach for the primary trainer
      if (mission.trainerId) {
        const result = await storage.reattachTemplateDocumentsForMission(missionId, mission.trainerId);
        console.log(`[reattach-documents] Primary trainer ${mission.trainerId}: removed=${result.removed}, added=${result.added}`);
        results.push({ trainerId: mission.trainerId, ...result });
      }

      // Reattach for all additional trainers
      const missionTrainers = await storage.getMissionTrainers(missionId);
      for (const mt of missionTrainers) {
        // Skip the primary trainer (already handled above)
        if (mt.trainerId === mission.trainerId) continue;
        const result = await storage.reattachTemplateDocumentsForMission(missionId, mt.trainerId);
        console.log(`[reattach-documents] Additional trainer ${mt.trainerId}: removed=${result.removed}, added=${result.added}`);
        results.push({ trainerId: mt.trainerId, ...result });
      }

      res.json({ success: true, results });
    } catch (error) {
      console.error('Reattach documents error:', error);
      res.status(500).json({ message: 'Erreur lors du rechargement des documents' });
    }
  });

  app.patch(api.missions.updateStatus.path, isAuthenticated, async (req, res) => {
    try {
      const input = api.missions.updateStatus.input.parse(req.body);
      const missionIdParam = Number(req.params.id);

      // Block completion if dossier is incomplete
      if (input.status === 'completed') {
        const steps = await storage.getMissionSteps(missionIdParam);
        const incompleteTasks = steps.filter(s => s.status !== 'done' && s.status !== 'na' && !s.isCompleted);

        const docs = await storage.getDocumentsByMission(missionIdParam);
        const templates = await storage.getDocumentTemplates();
        // Documents linked to a template whose URL still matches the template = not uploaded
        const missingDocs: string[] = [];
        for (const doc of docs) {
          if (doc.templateId) {
            const template = templates.find(t => t.id === doc.templateId);
            if (template && doc.url === template.url) {
              missingDocs.push(doc.title);
            }
          }
        }

        const issues: string[] = [];
        if (incompleteTasks.length > 0) {
          issues.push(`${incompleteTasks.length} tache(s) non terminee(s) : ${incompleteTasks.map(t => t.title).join(', ')}`);
        }
        if (missingDocs.length > 0) {
          issues.push(`${missingDocs.length} document(s) non depose(s) : ${missingDocs.join(', ')}`);
        }

        if (issues.length > 0) {
          res.status(400).json({
            message: "Impossible de cloturer la mission : dossier incomplet",
            issues,
          });
          return;
        }
      }

      const mission = await storage.updateMissionStatus(missionIdParam, input.status);
      if (!mission) {
        res.status(404).json({ message: "Mission non trouvée" });
        return;
      }

      // Traduire les statuts en français pour les notifications
      const statusLabels: Record<string, string> = {
        'draft': 'Brouillon',
        'confirmed': 'Confirmée',
        'in_progress': 'En cours',
        'completed': 'Terminée',
        'cancelled': 'Annulée',
      };
      const statusLabel = statusLabels[input.status] || input.status;

      // Créer des notifications internes pour tous les formateurs et admins concernés
      try {
        const currentUser = req.user!;
        const modifiedBy = await storage.getUser(currentUser.id);
        const missionTrainers = await storage.getMissionTrainers(mission.id);
        const admins = await storage.getUsersByRole('admin');
        const modifierName = modifiedBy ? `${modifiedBy.firstName || ''} ${modifiedBy.lastName || ''}`.trim() || modifiedBy.email : 'Un utilisateur';

        // Notifier tous les formateurs assignés (sauf le modificateur)
        for (const mt of missionTrainers) {
          if (mt.trainerId !== currentUser.id) {
            await storage.createInAppNotification({
              userId: mt.trainerId,
              type: 'mission_update',
              title: `Statut mission: ${statusLabel}`,
              message: `La mission "${mission.title}" est maintenant "${statusLabel}" (modifié par ${modifierName})`,
              missionId: mission.id,
            });
          }
        }

        // Notifier les admins (sauf le modificateur)
        for (const admin of admins) {
          if (admin.id !== currentUser.id) {
            await storage.createInAppNotification({
              userId: admin.id,
              type: 'mission_update',
              title: `Statut mission: ${statusLabel}`,
              message: `La mission "${mission.title}" est maintenant "${statusLabel}" (modifié par ${modifierName})`,
              missionId: mission.id,
            });
          }
        }
      } catch (notifErr) {
        console.error('[Notification] Erreur notification changement statut:', notifErr);
      }

      // Annuler les rappels en attente si la mission est annulée ou terminée
      if (input.status === 'cancelled' || input.status === 'completed') {
        try {
          const pendingReminders = await storage.getRemindersByMission(mission.id);
          for (const reminder of pendingReminders) {
            if (reminder.status === 'pending') {
              await storage.updateReminder(reminder.id, { status: 'cancelled' });
            }
          }
        } catch (cancelErr) {
          console.error('[Reminders] Erreur annulation rappels:', cancelErr);
        }
      }

      // Sync to Google Calendar (non-blocking)
      try {
        const adminId = await getGoogleAdminUserId();
        if (adminId) {
          if (input.status === 'cancelled') {
            deleteMissionFromCalendar(mission.id, adminId).catch((e) =>
              console.error('[Calendar] Delete after cancel failed:', e)
            );
          } else {
            syncMissionToCalendar(mission.id, adminId).catch((e) =>
              console.error('[Calendar] Sync after status update failed:', e)
            );
          }
        }
      } catch (calErr) {
        console.error('[Calendar] Calendar sync error:', calErr);
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
      console.error("Route error:", err); res.status(500).json({ message: err instanceof Error ? err.message : "Erreur serveur" });
    }
  });

  app.delete(api.missions.delete.path, isAuthenticated, requirePermission('missions:delete'), async (req, res) => {
    try {
      const missionId = Number(req.params.id);

      // Annuler tous les rappels en attente pour cette mission
      try {
        const pendingReminders = await storage.getRemindersByMission(missionId);
        for (const reminder of pendingReminders) {
          if (reminder.status === 'pending') {
            await storage.updateReminder(reminder.id, { status: 'cancelled' });
          }
        }
      } catch (cancelErr) {
        console.error('[Reminders] Erreur annulation rappels avant suppression:', cancelErr);
      }

      // Delete from Google Calendar before deleting mission (non-blocking)
      try {
        const adminId = await getGoogleAdminUserId();
        if (adminId) {
          await deleteMissionFromCalendar(missionId, adminId);
        }
      } catch (calErr) {
        console.error('[Calendar] Calendar delete error:', calErr);
      }

      const success = await storage.deleteMission(missionId);
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
      console.error("Route error:", err); res.status(500).json({ message: err instanceof Error ? err.message : "Erreur serveur" });
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
          try {
            const documents = await storage.getDocumentsByMission(missionId);
            const trainerDocuments = documents.filter(doc => doc.userId === trainerId);
            await sendMissionAssignmentEmail(trainer, mission, trainerDocuments);
          } catch (emailErr) {
            console.error('[Email] Erreur envoi email assignation formateur:', emailErr);
          }
        }
      }

      res.status(201).json(result);
    } catch (err: any) {
      if (err.code === '23505') {
        res.status(400).json({ message: 'Ce formateur est déjà associé à cette mission' });
        return;
      }
      console.error("Route error:", err); res.status(500).json({ message: err instanceof Error ? err.message : "Erreur serveur" });
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
              try {
                const documents = await storage.getDocumentsByMission(missionId);
                const trainerDocuments = documents.filter(doc => doc.userId === trainerId);
                await sendMissionAssignmentEmail(trainer, mission, trainerDocuments);
              } catch (emailErr) {
                console.error('[Email] Erreur envoi email assignation bulk:', emailErr);
              }
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

  app.delete('/api/missions/:missionId/trainers/:trainerId', isAuthenticated, requireRole('admin'), async (req, res) => {
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
    try {
      const missionId = Number(req.params.id);
      const user = req.user!;
      if (!(await canAccessMission(user.id, user.role, missionId))) {
        res.status(403).json({ message: "Accès non autorisé" });
        return;
      }
      let steps = await storage.getMissionSteps(missionId);
      // Formateurs: ne voir que les tâches qui leur sont assignées
      if (user.role !== 'admin') {
        steps = steps.filter(s => s.assigneeId === user.id);
      }
      res.json(steps);
    } catch (error: any) {
      console.error('Mission steps error:', error);
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  app.post(api.missions.steps.create.path, isAuthenticated, async (req, res) => {
    try {
      // Convert date strings to Date objects before zod parsing (drizzle-zod expects Date, not string)
      const body = { ...req.body };
      if (body.dueDate && typeof body.dueDate === 'string') body.dueDate = new Date(body.dueDate);
      if (body.lateDate && typeof body.lateDate === 'string') body.lateDate = new Date(body.lateDate);
      const input = api.missions.steps.create.input.parse(body);
      const missionId = Number(req.params.id);
      const stepData = {
        ...input,
        missionId,
        createdBy: req.user?.id || null,
      };
      console.log('[create-step] Creating step with createdBy:', stepData.createdBy);
      const step = await storage.createMissionStep(stepData);
      console.log('[create-step] Created step:', step.id, 'createdBy:', step.createdBy);

      // Notify assignee if set at creation
      if (step.assigneeId) {
        try {
          const assignee = await storage.getUser(step.assigneeId);
          const mission = await storage.getMission(missionId);
          if (assignee && mission) {
            await storage.createInAppNotification({
              userId: assignee.id,
              type: 'task_assignment',
              title: 'Nouvelle tache assignee',
              message: `La tache "${step.title}" vous a ete assignee sur la mission : ${mission.title}`,
              missionId: mission.id,
            });
          }
        } catch (notifErr) {
          console.error('[Step Create] Error sending assignment notification:', notifErr);
        }
      }

      res.status(201).json(step);
    } catch (err) {
      console.error('Step create error:', err);
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
        return;
      }
      res.status(500).json({ message: err instanceof Error ? err.message : "Erreur lors de la creation de la tache" });
    }
  });

  app.put(api.missions.steps.update.path, isAuthenticated, async (req, res) => {
    try {
      const input = api.missions.steps.update.input.parse(req.body);
      const stepId = Number(req.params.stepId);
      const missionId = Number(req.params.missionId);
      if (isNaN(stepId) || isNaN(missionId)) {
        return res.status(400).json({ message: "ID invalide" });
      }
      const userRole = req.user?.role;

      // Get current step to detect assignee change
      const currentSteps = await storage.getMissionSteps(missionId);
      const currentStep = currentSteps.find(s => s.id === stepId);
      const previousAssigneeId = currentStep?.assigneeId || null;
      const newAssigneeId = input.assigneeId !== undefined ? input.assigneeId : previousAssigneeId;

      // Role-based restrictions: non-admin users cannot set 'na' status, assign tasks, or modify admin comments
      const updateData: any = { ...input };
      if (userRole !== 'admin') {
        if (updateData.status === 'na') {
          delete updateData.status;
        }
        delete updateData.assigneeId;
        delete updateData.comment;
        delete updateData.commentAuthorId;
      }

      // Recalculate status when dates are pushed to the future
      // If step is currently 'late' and the new due/late dates are in the future, reset to 'todo' or 'priority'
      if (currentStep?.status === 'late' && !updateData.status) {
        const now = new Date();
        const newDueDate = updateData.dueDate ? new Date(updateData.dueDate) : (updateData.dueDate === null ? null : (currentStep.dueDate ? new Date(currentStep.dueDate) : null));
        const newLateDate = updateData.lateDate ? new Date(updateData.lateDate) : (updateData.lateDate === null ? null : (currentStep.lateDate ? new Date(currentStep.lateDate) : null));

        // If late_date (deadline retard) is in the future, no longer late
        if (newLateDate && newLateDate > now) {
          // If due_date (deadline prioritaire) is in the future too, it's a normal todo
          // If due_date is passed but late_date isn't, it's priority
          if (newDueDate && newDueDate <= now) {
            updateData.status = 'priority';
          } else {
            updateData.status = 'todo';
          }
        } else if (!newLateDate && newDueDate && newDueDate > now) {
          updateData.status = 'todo';
        }
        // If only dueDate was pushed to the future but lateDate remains in the past (not explicitly updated)
        // Shift lateDate proportionally so the frontend getAutoStatus also sees future dates
        else if (newLateDate && newLateDate <= now && newDueDate && newDueDate > now && !updateData.lateDate && currentStep.dueDate) {
          const oldDue = new Date(currentStep.dueDate).getTime();
          const newDue = newDueDate.getTime();
          const shift = newDue - oldDue;
          if (shift > 0) {
            const shiftedLate = new Date(newLateDate.getTime() + shift);
            updateData.lateDate = shiftedLate.toISOString();
            // Recalculate status with the shifted lateDate
            if (shiftedLate > now) {
              if (newDueDate <= now) {
                updateData.status = 'priority';
              } else {
                updateData.status = 'todo';
              }
            }
          }
        }
      }

      const step = await storage.updateMissionStep(stepId, {
        ...updateData,
        dueDate: updateData.dueDate ? new Date(updateData.dueDate) : (updateData.dueDate === null ? null : undefined),
        lateDate: updateData.lateDate ? new Date(updateData.lateDate) : (updateData.lateDate === null ? null : undefined),
        trainerCommentUpdatedAt: updateData.trainerComment !== undefined ? new Date() : undefined,
        commentUpdatedAt: updateData.comment !== undefined ? new Date() : undefined,
      });
      if (!step) {
        res.status(404).json({ message: "Étape non trouvée" });
        return;
      }

      // If dueDate changed, cancel pending task_deadline reminders so they get recreated with the correct date
      if (updateData.dueDate !== undefined || updateData.dueDate === null) {
        try {
          const missionReminders = await storage.getRemindersByMission(missionId);
          const pendingTaskReminders = missionReminders.filter(r =>
            r.taskId === stepId && r.status === 'pending'
          );
          for (const reminder of pendingTaskReminders) {
            await storage.updateReminder(reminder.id, { status: 'cancelled' });
          }
          if (pendingTaskReminders.length > 0) {
            console.log(`[update-step] Cancelled ${pendingTaskReminders.length} pending reminder(s) for task ${stepId} (dueDate changed)`);
          }
        } catch (err) {
          console.error('[update-step] Error cancelling reminders:', err);
        }
      }

      // Notify assignee if changed (new assignee different from previous)
      if (newAssigneeId && newAssigneeId !== previousAssigneeId) {
        try {
          const assignee = await storage.getUser(newAssigneeId);
          const mission = await storage.getMission(missionId);
          if (assignee && mission) {
            // In-app notification
            await storage.createInAppNotification({
              userId: assignee.id,
              type: 'task_assignment',
              title: 'Nouvelle tache assignee',
              message: `La tache "${step.title}" vous a ete assignee sur la mission : ${mission.title}`,
              missionId: mission.id,
            });

          }
        } catch (notifErr) {
          console.error('[Step Update] Error sending assignment notification:', notifErr);
        }
      }

      res.json(step);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
        return;
      }
      console.error("Route error:", err); res.status(500).json({ message: err instanceof Error ? err.message : "Erreur serveur" });
    }
  });

  app.delete(api.missions.steps.delete.path, isAuthenticated, async (req, res) => {
    try {
      await storage.deleteMissionStep(Number(req.params.stepId));
      res.json({ success: true });
    } catch (error: any) {
      console.error("Delete step error:", error.message);
      res.status(500).json({ message: "Erreur lors de la suppression de l'étape" });
    }
  });

  // Bulk replace all steps for a mission (used when typology/trainer changes)
  app.post('/api/missions/:id/replace-steps', isAuthenticated, requirePermission('missions:update'), async (req, res) => {
    try {
      const missionId = Number(req.params.id);
      const { steps: newSteps } = req.body as { steps: Array<{ title: string; status: string; order: number; assigneeId?: string | null; dueDate?: string | null; lateDate?: string | null; link?: string | null }> };

      if (!Array.isArray(newSteps)) {
        res.status(400).json({ message: "steps doit être un tableau" });
        return;
      }

      console.log(`[replace-steps] Mission ${missionId}: replacing with ${newSteps.length} new steps`);

      // Delete all existing steps (with cascade: reminders, stepTasks)
      const existingSteps = await storage.getMissionSteps(missionId);
      for (const step of existingSteps) {
        try {
          await storage.deleteMissionStep(step.id);
        } catch (delErr: any) {
          console.error(`[replace-steps] Failed to delete step ${step.id}:`, delErr.message);
          throw delErr;
        }
      }

      // Create new steps
      const created = [];
      for (const stepData of newSteps) {
        try {
          const step = await storage.createMissionStep({
            missionId,
            title: stepData.title,
            status: stepData.status || 'todo',
            order: stepData.order,
            assigneeId: stepData.assigneeId || null,
            dueDate: stepData.dueDate ? new Date(stepData.dueDate) : null,
            lateDate: stepData.lateDate ? new Date(stepData.lateDate) : null,
            link: stepData.link || null,
            createdBy: req.user?.id || null,
          });
          created.push(step);
        } catch (createErr: any) {
          console.error(`[replace-steps] Failed to create step "${stepData.title}" (order ${stepData.order}):`, createErr.message);
          throw createErr;
        }
      }

      console.log(`[replace-steps] Mission ${missionId}: deleted ${existingSteps.length}, created ${created.length}`);
      res.json({ deleted: existingSteps.length, created: created.length, steps: created });
    } catch (error: any) {
      console.error("[replace-steps] Error:", error);
      res.status(500).json({ message: error.message || "Erreur lors du remplacement des tâches" });
    }
  });

  // Send step link by email
  app.post(api.missions.steps.sendLink.path, isAuthenticated, async (req, res) => {
    try {
      const missionId = Number(req.params.missionId);
      const stepId = Number(req.params.stepId);

      // Get the step and verify it has a link
      const steps = await storage.getMissionSteps(missionId);
      const step = steps.find(s => s.id === stepId);
      if (!step) {
        return res.status(404).json({ message: "Tache non trouvee" });
      }
      if (!step.link) {
        return res.status(400).json({ message: "Cette tache n'a pas de lien associe" });
      }

      // Get mission info
      const mission = await storage.getMission(missionId);
      if (!mission) {
        return res.status(404).json({ message: "Mission non trouvee" });
      }
      const missionTitle = mission.title || `Mission #${mission.id}`;

      // Collect recipients: client contactEmail + participant emails
      const recipients: { email: string; name: string }[] = [];

      // Client contact email
      if (mission.clientId) {
        const client = await storage.getClient(mission.clientId);
        if (client?.contactEmail) {
          recipients.push({
            email: client.contactEmail,
            name: client.contactName || client.name || 'Client',
          });
        }
      }

      // Mission participants
      const missionParticipants = await storage.getMissionParticipants(missionId);
      for (const mp of missionParticipants) {
        if (mp.participant?.email) {
          // Avoid duplicates
          if (!recipients.some(r => r.email === mp.participant.email)) {
            recipients.push({
              email: mp.participant.email,
              name: `${mp.participant.firstName || ''} ${mp.participant.lastName || ''}`.trim() || 'Participant',
            });
          }
        }
      }

      if (recipients.length === 0) {
        return res.json({ sent: 0 });
      }

      const sent = await sendStepLinkEmail(recipients, step.link, missionTitle, step.title);
      res.json({ sent });
    } catch (error) {
      console.error('[Send Link] Error:', error);
      res.status(500).json({ message: 'Erreur lors de l\'envoi du lien' });
    }
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
      console.error("Route error:", err); res.status(500).json({ message: err instanceof Error ? err.message : "Erreur serveur" });
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
      console.error("Route error:", err); res.status(500).json({ message: err instanceof Error ? err.message : "Erreur serveur" });
    }
  });

  app.delete(api.missions.steps.tasks.delete.path, isAuthenticated, async (req, res) => {
    await storage.deleteStepTask(Number(req.params.taskId));
    res.json({ success: true });
  });

  // All Mission Sessions (for calendar & cards)
  app.get('/api/sessions', isAuthenticated, async (req, res) => {
    const user = req.user!;
    let sessions = await storage.getAllMissionSessions();
    // Formateurs: filtrer pour ne voir que les sessions de leurs missions
    if (user.role !== 'admin') {
      const trainerMissions = await storage.getMissionsByTrainer(user.id);
      const trainerMissionIds = new Set(trainerMissions.map(m => m.id));
      sessions = sessions.filter(s => trainerMissionIds.has(s.missionId));
    }
    res.json(sessions);
  });

  // Mission Sessions
  app.get(api.missions.sessions.list.path, isAuthenticated, async (req, res) => {
    const missionId = Number(req.params.id);
    const user = req.user!;
    if (!(await canAccessMission(user.id, user.role, missionId))) {
      res.status(403).json({ message: "Accès non autorisé" });
      return;
    }
    const sessions = await storage.getMissionSessions(missionId);
    res.json(sessions);
  });

  app.post(api.missions.sessions.create.path, isAuthenticated, async (req, res) => {
    try {
      // Convertir les dates string en Date
      const body = {
        ...req.body,
        sessionDate: req.body.sessionDate ? new Date(req.body.sessionDate) : undefined,
      };
      const input = api.missions.sessions.create.input.parse(body);
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
      console.error("Route error:", err); res.status(500).json({ message: err instanceof Error ? err.message : "Erreur serveur" });
    }
  });

  app.put(api.missions.sessions.update.path, isAuthenticated, async (req, res) => {
    try {
      // Convertir les dates string en Date
      const body = {
        ...req.body,
        sessionDate: req.body.sessionDate ? new Date(req.body.sessionDate) : undefined,
      };
      const input = api.missions.sessions.update.input.parse(body);
      const session = await storage.updateMissionSession(Number(req.params.sessionId), input);
      if (!session) {
        res.status(404).json({ message: "Session not found" });
        return;
      }
      res.json(session);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
        return;
      }
      console.error("Route error:", err); res.status(500).json({ message: err instanceof Error ? err.message : "Erreur serveur" });
    }
  });

  app.delete(api.missions.sessions.delete.path, isAuthenticated, async (req, res) => {
    const deleted = await storage.deleteMissionSession(Number(req.params.sessionId));
    if (!deleted) {
      res.status(404).json({ message: "Session not found" });
      return;
    }
    res.json({ success: true });
  });

  // Mission Participants
  app.get(api.missions.participants.list.path, isAuthenticated, async (req, res) => {
    const missionId = Number(req.params.id);
    const user = req.user!;
    if (!(await canAccessMission(user.id, user.role, missionId))) {
      res.status(403).json({ message: "Accès non autorisé" });
      return;
    }
    const participants = await storage.getMissionParticipants(missionId);
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
      console.error("Route error:", err); res.status(500).json({ message: err instanceof Error ? err.message : "Erreur serveur" });
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
      console.error("Route error:", err); res.status(500).json({ message: err instanceof Error ? err.message : "Erreur serveur" });
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
    const missionId = Number(req.params.id);
    const user = req.user!;
    if (!(await canAccessMission(user.id, user.role, missionId))) {
      res.status(403).json({ message: "Accès non autorisé" });
      return;
    }
    const records = await storage.getAttendanceRecords(missionId);
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
      console.error("Route error:", err); res.status(500).json({ message: err instanceof Error ? err.message : "Erreur serveur" });
    }
  });

  // Mission Documents (avec contrôle d'accès)
  app.get(api.missions.documents.list.path, isAuthenticated, async (req, res) => {
    const missionId = Number(req.params.id);
    const user = req.user as User;
    
    // Vérifier que l'utilisateur a accès à cette mission
    const mission = await storage.getMission(missionId);
    if (!mission) {
      res.status(404).json({ message: "Mission non trouvée" });
      return;
    }
    
    // Les formateurs/prestataires ne peuvent voir que les documents de leurs missions
    if (user.role === 'formateur' || user.role === 'prestataire') {
      const missionTrainers = await storage.getMissionTrainers(missionId);
      const isAssigned = mission.trainerId === user.id || 
                         missionTrainers.some(mt => mt.trainerId === user.id);
      if (!isAssigned) {
        res.status(403).json({ message: "Accès non autorisé à cette mission" });
        return;
      }
    }
    
    const docs = await storage.getDocumentsByMission(missionId);

    // Le formateur/prestataire assigné voit tous les documents de la mission
    res.json(docs);
  });

  // Mission Evaluations
  app.get(api.missions.evaluations.list.path, isAuthenticated, async (req, res) => {
    const missionId = Number(req.params.id);
    const user = req.user!;
    if (!(await canAccessMission(user.id, user.role, missionId))) {
      res.status(403).json({ message: "Accès non autorisé" });
      return;
    }
    const evals = await storage.getEvaluationsByMission(missionId);
    res.json(evals);
  });

  // Mission Messages
  app.get(api.messages.byMission.path, isAuthenticated, async (req, res) => {
    const missionId = Number(req.params.id);
    const user = req.user!;
    if (!(await canAccessMission(user.id, user.role, missionId))) {
      res.status(403).json({ message: "Accès non autorisé" });
      return;
    }
    const messages = await storage.getMessagesByMission(missionId);
    res.json(messages);
  });

  // ==================== PARTICIPANTS ====================
  app.get(api.participants.list.path, isAuthenticated, async (req, res) => {
    try {
    const allParticipants = await storage.getParticipants();
    const enriched = await Promise.all(
      allParticipants.map(async (p) => {
        const mps = await storage.getMissionParticipantsByParticipant(p.id);
        return { ...p, missions: mps };
      })
    );
    res.json(enriched);
    } catch (error: any) {
      console.error("Participants list error:", error.message);
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  app.get(api.participants.get.path, isAuthenticated, async (req, res) => {
    try {
    const participant = await storage.getParticipant(Number(req.params.id));
    if (!participant) {
      res.status(404).json({ message: "Participant non trouvé" });
      return;
    }
    res.json(participant);
    } catch (error: any) {
      console.error("Participant get error:", error.message);
      res.status(500).json({ message: "Erreur serveur" });
    }
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
      console.error("Route error:", err); res.status(500).json({ message: err instanceof Error ? err.message : "Erreur serveur" });
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
      console.error("Route error:", err); res.status(500).json({ message: err instanceof Error ? err.message : "Erreur serveur" });
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
      console.error("Route error:", err); res.status(500).json({ message: err instanceof Error ? err.message : "Erreur serveur" });
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
      console.error("Route error:", err); res.status(500).json({ message: err instanceof Error ? err.message : "Erreur serveur" });
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
      console.error("Route error:", err); res.status(500).json({ message: err instanceof Error ? err.message : "Erreur serveur" });
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
      console.error("Route error:", err); res.status(500).json({ message: err instanceof Error ? err.message : "Erreur serveur" });
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
      console.error("Route error:", err); res.status(500).json({ message: err instanceof Error ? err.message : "Erreur serveur" });
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
      console.error("Route error:", err); res.status(500).json({ message: err instanceof Error ? err.message : "Erreur serveur" });
    }
  });

  app.delete(api.documents.delete.path, isAuthenticated, requirePermission('documents:delete'), async (req, res) => {
    const docId = Number(req.params.id);
    if (isNaN(docId)) {
      res.status(400).json({ message: "ID de document invalide" });
      return;
    }
    
    const user = req.user as User;
    
    // Vérifier que le document existe et récupérer la mission associée
    const document = await storage.getDocument(docId);
    if (!document) {
      res.status(404).json({ message: "Document non trouvé" });
      return;
    }
    
    // Pour les formateurs/prestataires, vérifier l'accès à la mission
    if (document.missionId && (user.role === 'formateur' || user.role === 'prestataire')) {
      const mission = await storage.getMission(document.missionId);
      if (mission) {
        const missionTrainers = await storage.getMissionTrainers(document.missionId);
        const isAssigned = mission.trainerId === user.id || 
                           missionTrainers.some(mt => mt.trainerId === user.id);
        if (!isAssigned) {
          res.status(403).json({ message: "Vous ne pouvez supprimer que les documents de vos missions" });
          return;
        }
      }
    }
    
    await storage.deleteDocument(docId);
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
      console.error("Route error:", err); res.status(500).json({ message: err instanceof Error ? err.message : "Erreur serveur" });
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
      console.error("Route error:", err); res.status(500).json({ message: err instanceof Error ? err.message : "Erreur serveur" });
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
      console.error("Route error:", err); res.status(500).json({ message: err instanceof Error ? err.message : "Erreur serveur" });
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
      console.error("Route error:", err); res.status(500).json({ message: err instanceof Error ? err.message : "Erreur serveur" });
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
      console.error("Route error:", err); res.status(500).json({ message: err instanceof Error ? err.message : "Erreur serveur" });
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
      console.error("Route error:", err); res.status(500).json({ message: err instanceof Error ? err.message : "Erreur serveur" });
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
      console.error("Route error:", err); res.status(500).json({ message: err instanceof Error ? err.message : "Erreur serveur" });
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

  // Générer les rappels pour une mission spécifique
  app.post('/api/missions/:id/generate-reminders', isAuthenticated, async (req, res) => {
    try {
      const missionId = Number(req.params.id);
      const mission = await storage.getMission(missionId);

      if (!mission) {
        res.status(404).json({ message: "Mission non trouvée" });
        return;
      }

      if (!mission.startDate) {
        res.status(400).json({ message: "La mission n'a pas de date de début" });
        return;
      }

      const settings = await storage.getReminderSettings();
      const activeSettings = settings.filter(s => s.isActive);
      const admins = (await storage.getUsers()).filter(u => u.role === 'admin' && u.status === 'ACTIF');

      let created = 0;
      let skipped = 0;

      // Récupérer les infos du formateur et client
      const trainer = mission.trainerId ? await storage.getUser(mission.trainerId) : null;
      const client = mission.clientId ? await storage.getClient(mission.clientId) : null;

      for (const setting of activeSettings) {
        // Calculer la date d'envoi basée sur le type de rappel
        let referenceDate: Date;
        referenceDate = new Date(mission.startDate);

        const scheduledDate = new Date(referenceDate);
        scheduledDate.setDate(scheduledDate.getDate() - setting.daysBefore);

        // Ignorer si la date est dans le passé
        if (scheduledDate < new Date()) {
          skipped++;
          continue;
        }

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

      res.json({ created, skipped, missionId });
    } catch (err) {
      console.error('Error generating reminders for mission:', err);
      res.status(500).json({ message: "Erreur lors de la génération des rappels" });
    }
  });

  // Créer un rappel simple pour une mission avec un J-X spécifique
  app.post('/api/missions/:id/create-reminder', isAuthenticated, async (req, res) => {
    try {
      const missionId = Number(req.params.id);
      const { daysBefore } = req.body;

      if (!daysBefore || daysBefore < 1) {
        res.status(400).json({ message: "daysBefore doit être un nombre positif" });
        return;
      }

      const mission = await storage.getMission(missionId);
      if (!mission) {
        res.status(404).json({ message: "Mission non trouvée" });
        return;
      }

      if (!mission.startDate) {
        res.status(400).json({ message: "La mission n'a pas de date de début" });
        return;
      }

      // Calculer la date d'envoi du rappel
      const scheduledDate = new Date(mission.startDate);
      scheduledDate.setDate(scheduledDate.getDate() - daysBefore);

      // Si la date est dans le passé, ne pas créer le rappel
      if (scheduledDate < new Date()) {
        res.json({ created: 0, message: "La date du rappel est déjà passée" });
        return;
      }

      // Récupérer les admins pour les notifier
      const admins = (await storage.getUsers()).filter(u => u.role === 'admin' && u.status === 'ACTIF');
      const trainer = mission.trainerId ? await storage.getUser(mission.trainerId) : null;
      const client = mission.clientId ? await storage.getClient(mission.clientId) : null;

      let created = 0;

      // Créer les rappels pour admin, formateur et client
      const recipients: { type: string; email?: string; name?: string }[] = [];

      // Admins
      for (const admin of admins) {
        if (admin.email) {
          recipients.push({
            type: 'admin',
            email: admin.email,
            name: `${admin.firstName || ''} ${admin.lastName || ''}`.trim() || 'Admin',
          });
        }
      }

      // Formateur
      if (trainer?.email) {
        recipients.push({
          type: 'trainer',
          email: trainer.email,
          name: `${trainer.firstName || ''} ${trainer.lastName || ''}`.trim() || 'Formateur',
        });
      }

      // Client
      if (client?.contactEmail) {
        recipients.push({
          type: 'client',
          email: client.contactEmail,
          name: client.contactName || client.name || 'Client',
        });
      }

      for (const recipient of recipients) {
        await storage.createReminder({
          settingId: null,
          missionId: mission.id,
          scheduledDate,
          status: 'pending',
          recipientEmail: recipient.email,
          recipientName: recipient.name,
          recipientType: recipient.type,
        });
        created++;
      }

      res.json({ created, daysBefore, scheduledDate });
    } catch (err) {
      console.error('Error creating reminder for mission:', err);
      res.status(500).json({ message: "Erreur lors de la création du rappel" });
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
      const { title, type, forRole, description, forTypology } = req.body;

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
        forTypology: forTypology || null,
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
      const { title, type, forRole, description, isActive, clientId, changeNotes, forTypology } = req.body;
      const user = req.user!;

      const updateData: any = {};
      if (title) updateData.title = title;
      if (type) updateData.type = type;
      if (forRole) updateData.forRole = forRole;
      if (description !== undefined) updateData.description = description;
      if (isActive !== undefined) updateData.isActive = isActive === 'true' || isActive === true;
      if (clientId !== undefined) updateData.clientId = clientId ? Number(clientId) : null;
      if (forTypology !== undefined) updateData.forTypology = forTypology || null;
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
        } as any,
      });
      res.status(201).json(notification);
    } catch (err) {
      console.error('Error creating test notification:', err);
      res.status(500).json({ message: 'Erreur serveur' });
    }
  });

  // ==================== TRAINER DELAYS (ADMIN DASHBOARD) ====================
  app.get('/api/admin/trainer-delays', isAuthenticated, requireRole('admin'), async (req, res) => {
    try {
      const delays = await storage.getTrainerDelays();
      res.json(delays);
    } catch (err) {
      console.error('Error fetching trainer delays:', err);
      res.status(500).json({ message: 'Erreur serveur' });
    }
  });

  // ==================== TASK ALERTS (ADMIN DASHBOARD) ====================
  app.get('/api/admin/task-alerts', isAuthenticated, requireRole('admin'), async (req, res) => {
    try {
      const alerts = await storage.getTaskAlerts();
      res.json(alerts);
    } catch (err) {
      console.error('Error fetching task alerts:', err);
      res.status(500).json({ message: 'Erreur serveur' });
    }
  });

  app.get('/api/admin/mission-tasks-progress', isAuthenticated, requireRole('admin'), async (req, res) => {
    try {
      const tasks = await storage.getMissionTasksProgress();
      res.json(tasks);
    } catch (err) {
      console.error('Error fetching mission tasks progress:', err);
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

      const originalMission = await storage.getMission(Number(req.params.id));
      const duplicated = await storage.duplicateMissionForTrainer(Number(req.params.id), trainerId);
      if (!duplicated) {
        res.status(404).json({ message: "Mission non trouvée" });
        return;
      }

      // Notify the trainer about the new mission assignment
      try {
        const trainer = await storage.getUser(trainerId);
        if (trainer) {
          await storage.createInAppNotification({
            userId: trainerId,
            type: 'mission_assignment',
            title: 'Nouvelle mission attribuée',
            message: `La mission "${duplicated.title}" vous a été attribuée.`,
            missionId: duplicated.id,
          });
        }
      } catch (notifErr) {
        console.error('Error sending duplication notification:', notifErr);
      }

      res.status(201).json(duplicated);
    } catch (err) {
      console.error('Mission duplication error:', err);
      res.status(500).json({ message: 'Erreur lors de la duplication de la mission' });
    }
  });

  // ==================== SIMPLE DUPLICATION (without trainer) ====================
  app.post('/api/missions/:id/duplicate-simple', isAuthenticated, requirePermission('missions:create'), async (req, res) => {
    try {
      const duplicated = await storage.duplicateMission(Number(req.params.id));
      if (!duplicated) {
        res.status(404).json({ message: "Mission non trouvée" });
        return;
      }
      res.status(201).json(duplicated);
    } catch (err) {
      console.error('Simple mission duplication error:', err);
      res.status(500).json({ message: err instanceof Error ? err.message : 'Erreur lors de la duplication de la mission' });
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

      // Notify each trainer about their new mission assignment
      for (const newMission of result.created) {
        if (newMission.trainerId) {
          try {
            await storage.createInAppNotification({
              userId: newMission.trainerId,
              type: 'mission_assignment',
              title: 'Nouvelle mission attribuée',
              message: `La mission "${newMission.title}" vous a été attribuée.`,
              missionId: newMission.id,
            });
          } catch (notifErr) {
            console.error('Error sending duplication notification:', notifErr);
          }
        }
      }

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

  // ==================== TASK DEADLINE DEFAULTS ====================
  app.get(api.taskDeadlineDefaults.list.path, isAuthenticated, async (req, res) => {
    try {
      const defaults = await storage.getTaskDeadlineDefaults();
      res.json(defaults);
    } catch (err) {
      console.error('Error fetching task deadline defaults:', err);
      res.json([]);
    }
  });

  app.post(api.taskDeadlineDefaults.create.path, isAuthenticated, requirePermission('missions:update'), async (req, res) => {
    try {
      const input = api.taskDeadlineDefaults.create.input.parse(req.body);
      if (typeof input.daysBefore !== 'number' || Number.isNaN(input.daysBefore)) input.daysBefore = 0;
      if (input.lateDaysBefore === undefined) { /* keep undefined */ }
      else if (input.lateDaysBefore === null || typeof input.lateDaysBefore !== 'number' || Number.isNaN(input.lateDaysBefore)) input.lateDaysBefore = null;
      const created = await storage.createTaskDeadlineDefault(input);
      res.status(201).json(created);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
        return;
      }
      console.error('Error creating task deadline default:', err);
      res.status(500).json({ message: "Erreur lors de la création" });
    }
  });

  // Upsert: create or update a deadline override by taskTitle + typology + trainerRole
  // MUST be before the :id route to avoid matching "upsert" as an :id parameter
  app.put('/api/task-deadline-defaults/upsert', isAuthenticated, requirePermission('missions:update'), async (req, res) => {
    try {
      const { taskTitle, typology, trainerRole } = req.body;
      const daysBefore = Number.isNaN(Number(req.body.daysBefore)) ? 0 : Number(req.body.daysBefore);
      const lateDaysBefore = req.body.lateDaysBefore == null || Number.isNaN(Number(req.body.lateDaysBefore)) ? null : Number(req.body.lateDaysBefore);
      if (!taskTitle || !typology || !trainerRole) {
        return res.status(400).json({ message: "Champs requis manquants" });
      }
      const all = await storage.getTaskDeadlineDefaults();
      const existing = all.find(d => d.taskTitle === taskTitle && d.typology === typology && d.trainerRole === trainerRole);
      if (existing) {
        const updated = await storage.updateTaskDeadlineDefault(existing.id, { daysBefore, lateDaysBefore });
        res.json(updated);
      } else {
        const created = await storage.createTaskDeadlineDefault({ taskTitle, typology, trainerRole, daysBefore, lateDaysBefore });
        res.status(201).json(created);
      }
    } catch (err) {
      console.error('Upsert deadline error:', err);
      res.status(500).json({ message: "Erreur lors de la sauvegarde" });
    }
  });

  app.put(api.taskDeadlineDefaults.update.path, isAuthenticated, requirePermission('missions:update'), async (req, res) => {
    try {
      const input = api.taskDeadlineDefaults.update.input.parse(req.body);
      // Sanitize NaN values before DB insert
      if (input.daysBefore !== undefined && (typeof input.daysBefore !== 'number' || Number.isNaN(input.daysBefore))) input.daysBefore = 0;
      if (input.lateDaysBefore === undefined) { /* keep undefined */ }
      else if (input.lateDaysBefore === null || typeof input.lateDaysBefore !== 'number' || Number.isNaN(input.lateDaysBefore)) input.lateDaysBefore = null;
      const updated = await storage.updateTaskDeadlineDefault(Number(req.params.id), input);
      if (!updated) {
        res.status(404).json({ message: "Parametre non trouve" });
        return;
      }
      res.json(updated);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
        return;
      }
      console.error('Error updating task deadline default:', err);
      res.status(500).json({ message: "Erreur lors de la mise à jour" });
    }
  });

  app.delete(api.taskDeadlineDefaults.delete.path, isAuthenticated, requirePermission('missions:update'), async (req, res) => {
    try {
      await storage.deleteTaskDeadlineDefault(Number(req.params.id));
      res.json({ success: true });
    } catch (err) {
      console.error('Error deleting task deadline default:', err);
      res.status(500).json({ message: "Erreur" });
    }
  });

  // ==================== TASK EXPLANATIONS (Consignes) ====================
  app.get(api.taskExplanations.list.path, isAuthenticated, async (req, res) => {
    const explanations = await storage.getTaskExplanations();
    res.json(explanations);
  });

  app.post(api.taskExplanations.create.path, isAuthenticated, requirePermission('missions:update'), async (req, res) => {
    try {
      const input = api.taskExplanations.create.input.parse(req.body);
      const created = await storage.createTaskExplanation(input);
      res.status(201).json(created);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
        return;
      }
      console.error("Route error:", err); res.status(500).json({ message: err instanceof Error ? err.message : "Erreur serveur" });
    }
  });

  app.put(api.taskExplanations.update.path, isAuthenticated, requirePermission('missions:update'), async (req, res) => {
    try {
      const input = api.taskExplanations.update.input.parse(req.body);
      const updated = await storage.updateTaskExplanation(Number(req.params.id), input);
      if (!updated) {
        res.status(404).json({ message: "Consigne non trouvee" });
        return;
      }
      res.json(updated);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
        return;
      }
      console.error("Route error:", err); res.status(500).json({ message: err instanceof Error ? err.message : "Erreur serveur" });
    }
  });

  app.delete(api.taskExplanations.delete.path, isAuthenticated, requirePermission('missions:update'), async (req, res) => {
    await storage.deleteTaskExplanation(Number(req.params.id));
    res.json({ success: true });
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

  // ==================== PERSONAL NOTES ====================
  // Get all notes for current user
  app.get('/api/personal-notes', isAuthenticated, async (req, res) => {
    try {
      const user = req.user!;
      const notes = await storage.getPersonalNotes(user.id);
      res.json(notes);
    } catch (err) {
      console.error('Error fetching personal notes:', err);
      res.status(500).json({ message: 'Erreur serveur' });
    }
  });

  // Get a single note
  app.get('/api/personal-notes/:id', isAuthenticated, async (req, res) => {
    try {
      const user = req.user!;
      const note = await storage.getPersonalNote(Number(req.params.id));
      if (!note) {
        res.status(404).json({ message: 'Note non trouvee' });
        return;
      }
      // Check ownership
      if (note.userId !== user.id) {
        res.status(403).json({ message: 'Acces refuse' });
        return;
      }
      res.json(note);
    } catch (err) {
      console.error('Error fetching personal note:', err);
      res.status(500).json({ message: 'Erreur serveur' });
    }
  });

  // Create a new note
  app.post('/api/personal-notes', isAuthenticated, async (req, res) => {
    try {
      const user = req.user!;
      const { title, content, color, isPinned } = req.body;

      if (!title || title.trim() === '') {
        res.status(400).json({ message: 'Le titre est requis' });
        return;
      }

      const note = await storage.createPersonalNote({
        userId: user.id,
        title: title.trim(),
        content: content || '',
        color: color || 'default',
        isPinned: isPinned || false,
      });
      res.status(201).json(note);
    } catch (err) {
      console.error('Error creating personal note:', err);
      res.status(500).json({ message: 'Erreur serveur' });
    }
  });

  // Update a note
  app.put('/api/personal-notes/:id', isAuthenticated, async (req, res) => {
    try {
      const user = req.user!;
      const noteId = Number(req.params.id);

      // Check ownership
      const existingNote = await storage.getPersonalNote(noteId);
      if (!existingNote) {
        res.status(404).json({ message: 'Note non trouvee' });
        return;
      }
      if (existingNote.userId !== user.id) {
        res.status(403).json({ message: 'Acces refuse' });
        return;
      }

      const { title, content, color, isPinned } = req.body;
      const updated = await storage.updatePersonalNote(noteId, {
        title: title !== undefined ? title : existingNote.title,
        content: content !== undefined ? content : existingNote.content,
        color: color !== undefined ? color : existingNote.color,
        isPinned: isPinned !== undefined ? isPinned : existingNote.isPinned,
      });
      res.json(updated);
    } catch (err) {
      console.error('Error updating personal note:', err);
      res.status(500).json({ message: 'Erreur serveur' });
    }
  });

  // Delete a note
  app.delete('/api/personal-notes/:id', isAuthenticated, async (req, res) => {
    try {
      const user = req.user!;
      const noteId = Number(req.params.id);

      // Check ownership
      const existingNote = await storage.getPersonalNote(noteId);
      if (!existingNote) {
        res.status(404).json({ message: 'Note non trouvee' });
        return;
      }
      if (existingNote.userId !== user.id) {
        res.status(403).json({ message: 'Acces refuse' });
        return;
      }

      await storage.deletePersonalNote(noteId);
      res.json({ success: true });
    } catch (err) {
      console.error('Error deleting personal note:', err);
      res.status(500).json({ message: 'Erreur serveur' });
    }
  });

  // Register Feedback routes
  registerFeedbackRoutes(app);

  // Register Documents routes (contracts, invoices)
  app.use('/api/documents', isAuthenticated, documentsRouter);

  // =============================================
  // Excel Export Routes
  // =============================================
  
  // List all available exports
  app.get('/api/exports', isAuthenticated, requireRole('admin'), async (req, res) => {
    try {
      const exports = listExports();
      const formattedExports = exports.map(exp => ({
        name: exp.name,
        date: exp.date.toISOString(),
        size: exp.size,
        downloadUrl: `/api/exports/download/${encodeURIComponent(exp.name)}`
      }));
      res.json(formattedExports);
    } catch (error) {
      console.error('[Export] Error listing exports:', error);
      res.status(500).json({ message: 'Erreur lors de la récupération des exports' });
    }
  });

  // Trigger manual export
  app.post('/api/exports/generate', isAuthenticated, requireRole('admin'), async (req, res) => {
    try {
      const filepath = await generateMissionsExcel();
      const filename = path.basename(filepath);
      res.json({
        success: true,
        message: 'Export généré avec succès',
        filename,
        downloadUrl: `/api/exports/download/${encodeURIComponent(filename)}`
      });
    } catch (error) {
      console.error('[Export] Error generating export:', error);
      res.status(500).json({ message: 'Erreur lors de la génération de l\'export' });
    }
  });

  // Generate export AND send by email (for testing the nightly job manually)
  app.post('/api/exports/generate-and-send', isAuthenticated, requireRole('admin'), async (req, res) => {
    try {
      const filepath = await generateMissionsExcel();
      const filename = path.basename(filepath);

      const allUsers = await storage.getUsers();
      const admins = allUsers.filter(u => u.role === 'admin' && u.status === 'ACTIF');

      if (admins.length === 0) {
        return res.json({
          success: false,
          message: `Aucun admin actif trouvé (${allUsers.filter(u => u.role === 'admin').length} admins au total). Vérifiez le champ status.`,
          filename,
        });
      }

      const results: Array<{ email: string; sent: boolean; error?: string }> = [];
      for (const admin of admins) {
        if (admin.email) {
          try {
            const adminName = `${admin.firstName || ''} ${admin.lastName || ''}`.trim() || 'Admin';
            const sent = await sendDailyExportEmail(admin.email, adminName, filepath, filename);
            results.push({ email: admin.email, sent });
          } catch (err) {
            results.push({ email: admin.email, sent: false, error: err instanceof Error ? err.message : 'Unknown' });
          }
        }
      }

      res.json({ success: true, filename, results });
    } catch (error) {
      console.error('[Export] Error generating+sending export:', error);
      res.status(500).json({ message: 'Erreur lors de l\'export', error: error instanceof Error ? error.message : 'Unknown' });
    }
  });

  // Download latest export
  app.get('/api/exports/latest', isAuthenticated, requireRole('admin'), async (req, res) => {
    try {
      const filepath = getLatestExport();
      if (!filepath || !fs.existsSync(filepath)) {
        return res.status(404).json({ message: 'Aucun export disponible' });
      }
      
      const filename = path.basename(filepath);
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.sendFile(filepath);
    } catch (error) {
      console.error('[Export] Error downloading latest export:', error);
      res.status(500).json({ message: 'Erreur lors du téléchargement' });
    }
  });

  // Download specific export by filename
  app.get('/api/exports/download/:filename', isAuthenticated, requireRole('admin'), async (req, res) => {
    try {
      const filename = decodeURIComponent(req.params.filename);
      
      // Security: only allow .xlsx files and prevent path traversal
      if (!filename.endsWith('.xlsx') || filename.includes('..') || filename.includes('/')) {
        return res.status(400).json({ message: 'Nom de fichier invalide' });
      }
      
      const exportsDir = path.join(process.cwd(), 'exports');
      const filepath = path.join(exportsDir, filename);
      
      if (!fs.existsSync(filepath)) {
        return res.status(404).json({ message: 'Fichier non trouvé' });
      }
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.sendFile(filepath);
    } catch (error) {
      console.error('[Export] Error downloading export:', error);
      res.status(500).json({ message: 'Erreur lors du téléchargement' });
    }
  });

  // Delete specific export
  app.delete('/api/exports/:filename', isAuthenticated, requireRole('admin'), async (req, res) => {
    try {
      const filename = decodeURIComponent(req.params.filename);

      // Security: only allow .xlsx files and prevent path traversal
      if (!filename.endsWith('.xlsx') || filename.includes('..') || filename.includes('/')) {
        return res.status(400).json({ message: 'Nom de fichier invalide' });
      }

      const exportsDir = path.join(process.cwd(), 'exports');
      const filepath = path.join(exportsDir, filename);

      if (!fs.existsSync(filepath)) {
        return res.status(404).json({ message: 'Fichier non trouvé' });
      }

      fs.unlinkSync(filepath);
      console.log(`[Export] Fichier supprimé: ${filename}`);
      res.json({ success: true, message: 'Export supprimé' });
    } catch (error) {
      console.error('[Export] Error deleting export:', error);
      res.status(500).json({ message: 'Erreur lors de la suppression' });
    }
  });

  // Delete all exports
  app.delete('/api/exports', isAuthenticated, requireRole('admin'), async (req, res) => {
    try {
      const exportsDir = path.join(process.cwd(), 'exports');
      const files = fs.readdirSync(exportsDir).filter(f => f.endsWith('.xlsx'));

      for (const file of files) {
        fs.unlinkSync(path.join(exportsDir, file));
      }

      console.log(`[Export] ${files.length} fichiers supprimés`);
      res.json({ success: true, message: `${files.length} export(s) supprimé(s)` });
    } catch (error) {
      console.error('[Export] Error deleting all exports:', error);
      res.status(500).json({ message: 'Erreur lors de la suppression' });
    }
  });

  // ==================== GOOGLE INTEGRATION ====================

  // Manual sync a single mission to Google Calendar
  app.post('/api/missions/:id/sync-calendar', isAuthenticated, requireRole('admin'), async (req, res) => {
    try {
      const missionId = Number(req.params.id);
      const adminId = await getGoogleAdminUserId();
      if (!adminId) {
        return res.status(400).json({ message: 'Aucun compte Google connecté' });
      }
      const eventId = await syncMissionToCalendar(missionId, adminId);
      if (eventId) {
        res.json({ success: true, eventId });
      } else {
        res.status(500).json({ message: 'Échec de la synchronisation' });
      }
    } catch (error) {
      console.error('Calendar sync error:', error);
      res.status(500).json({ message: 'Erreur serveur' });
    }
  });

  // Sync all active missions to Google Calendar
  app.post('/api/calendar/sync-all', isAuthenticated, requireRole('admin'), async (req, res) => {
    try {
      const adminId = await getGoogleAdminUserId();
      if (!adminId) {
        return res.status(400).json({ message: 'Aucun compte Google connecté' });
      }
      const missions = await storage.getMissions();
      const activeMissions = missions.filter(m => m.status !== 'cancelled');
      let synced = 0;
      let failed = 0;
      for (const mission of activeMissions) {
        try {
          const eventId = await syncMissionToCalendar(mission.id, adminId);
          if (eventId) synced++;
          else failed++;
        } catch {
          failed++;
        }
      }
      res.json({ success: true, synced, failed, total: activeMissions.length });
    } catch (error) {
      console.error('Calendar sync-all error:', error);
      res.status(500).json({ message: 'Erreur serveur' });
    }
  });

  // Google connection status
  app.get('/api/google/status', isAuthenticated, requireRole('admin'), async (req, res) => {
    try {
      const allUsers = await storage.getUsers();
      const adminWithGoogle = allUsers.find(u => u.role === 'admin' && u.googleRefreshToken);
      if (adminWithGoogle) {
        res.json({
          connected: true,
          email: adminWithGoogle.email,
          userId: adminWithGoogle.id,
        });
      } else {
        res.json({ connected: false });
      }
    } catch (error) {
      res.status(500).json({ message: 'Erreur serveur' });
    }
  });

  // Disconnect Google account
  app.post('/api/google/disconnect', isAuthenticated, requireRole('admin'), async (req, res) => {
    try {
      const user = req.user!;
      await storage.updateUser(user.id, {
        googleId: null,
        googleAccessToken: null,
        googleRefreshToken: null,
      } as any);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: 'Erreur serveur' });
    }
  });

  // Auto-migrate: add missing columns to task_deadline_defaults
  await (async () => {
    try {
      const { pool } = await import("./db");
      await pool.query(`
        ALTER TABLE task_deadline_defaults ADD COLUMN IF NOT EXISTS typology text NOT NULL DEFAULT 'Intra';
        ALTER TABLE task_deadline_defaults ADD COLUMN IF NOT EXISTS trainer_role text NOT NULL DEFAULT 'prestataire';
        ALTER TABLE task_deadline_defaults ADD COLUMN IF NOT EXISTS late_days_before integer;
      `);
    } catch (err) {
      console.error('Auto-migrate task_deadline_defaults:', err);
    }
  })();

  // Seed Data
  await seedBadges().catch(err => console.error('Error seeding badges:', err));
  await seedDefaultTemplates().catch(err => console.error('Error seeding default templates:', err));

  return httpServer;
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

// Seed default task deadline defaults
async function seedTaskDeadlineDefaults() {
  try {
    const existing = await storage.getTaskDeadlineDefaults();
    if (existing.length > 0) {
      return; // Already seeded
    }

    console.log('Seeding default task deadline defaults...');

    const defaults = [
      // Avant la formation (positive = before 1st session)
      { taskTitle: "Envoyer la convocation", daysBefore: 14, category: "Avant la formation" },
      { taskTitle: "Envoyer le questionnaire de positionnement", daysBefore: 21, category: "Avant la formation" },
      { taskTitle: "Valider le programme avec le client", daysBefore: 30, category: "Avant la formation" },
      { taskTitle: "Reserver la salle", daysBefore: 30, category: "Avant la formation" },
      { taskTitle: "Preparer les supports de formation", daysBefore: 7, category: "Avant la formation" },
      { taskTitle: "Envoyer les consignes au formateur", daysBefore: 7, category: "Avant la formation" },
      // Pendant la formation (0 = day of session)
      { taskTitle: "Verifier les emargements", daysBefore: 0, category: "Pendant la formation" },
      { taskTitle: "Suivre le bon deroulement", daysBefore: 0, category: "Pendant la formation" },
      // Apres la formation (negative = after last session)
      { taskTitle: "Envoyer le questionnaire de satisfaction", daysBefore: -1, category: "Apres la formation" },
      { taskTitle: "Recuperer les emargements signes", daysBefore: -3, category: "Apres la formation" },
      { taskTitle: "Faire le bilan avec le formateur", daysBefore: -7, category: "Apres la formation" },
      { taskTitle: "Envoyer les attestations", daysBefore: -14, category: "Apres la formation" },
      { taskTitle: "Envoyer le compte-rendu au client", daysBefore: -14, category: "Apres la formation" },
      { taskTitle: "Facturer la mission", daysBefore: -30, category: "Apres la formation" },
    ];

    for (const d of defaults) {
      await storage.createTaskDeadlineDefault(d);
    }
    console.log(`Seeded ${defaults.length} task deadline defaults`);
  } catch (err) {
    console.error('Error seeding task deadline defaults:', err);
  }
}
