import cron from 'node-cron';
import { storage } from './storage';
import { sendReminderEmail, sendAdminFormationReminderEmail } from './email';
import { log } from './index';
import { generateMissionsExcel, cleanOldExports } from './excel-export';

// Variable pour suivre si le scheduler est actif
let isSchedulerRunning = false;

/**
 * Génère les rappels pour toutes les missions actives basé sur les paramètres configurés
 */
async function generateRemindersForAllMissions(): Promise<{ created: number; skipped: number }> {
  const missions = await storage.getMissions();
  const settings = await storage.getReminderSettings();
  const activeSettings = settings.filter(s => s.isActive);
  const admins = (await storage.getUsers()).filter(u => u.role === 'admin' && u.status === 'ACTIF');

  let created = 0;
  let skipped = 0;

  // Filtrer les missions actives (pas annulées, pas terminées)
  const activeMissions = missions.filter(m =>
    m.status !== 'cancelled' &&
    m.status !== 'completed'
  );

  for (const mission of activeMissions) {
    // Générer les rappels configurés
    for (const setting of activeSettings) {
      // Déterminer la date de référence selon le type de rappel
      let referenceDate: Date | null = null;
      
      if (setting.reminderType === 'mission_end' && mission.endDate) {
        // Rappels de fin de mission basés sur endDate
        referenceDate = new Date(mission.endDate);
      } else if (setting.reminderType !== 'mission_end' && mission.startDate) {
        // Rappels de début de mission basés sur startDate
        referenceDate = new Date(mission.startDate);
      }
      
      // Ignorer si pas de date de référence
      if (!referenceDate) {
        skipped++;
        continue;
      }
      
      // Ignorer si la date de référence est dans le passé
      if (referenceDate < new Date()) {
        skipped++;
        continue;
      }

      const scheduledDate = new Date(referenceDate);
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

  return { created, skipped };
}

/**
 * Traite et envoie les rappels en attente dont la date est atteinte
 */
async function processPendingReminders(): Promise<{ processed: number; sent: number; failed: number }> {
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
        const daysBefore = setting?.daysBefore || 2; // Défaut à 2 pour J-2 admin

        // Déterminer si c'est un rappel J-2 admin spécial (sans settingId)
        const isJ2AdminReminder = !reminder.settingId && reminder.recipientType === 'admin';

        let emailSent = false;

        if (isJ2AdminReminder) {
          // Utiliser le template spécial J-2 admin
          emailSent = await sendAdminFormationReminderEmail(
            reminder.recipientEmail || '',
            reminder.recipientName || 'Admin',
            mission,
            trainer ?? null,
            client ?? null
          );
        } else {
          // Utiliser le template standard
          emailSent = await sendReminderEmail({
            recipientEmail: reminder.recipientEmail || '',
            recipientName: reminder.recipientName || 'Destinataire',
            recipientType: (reminder.recipientType as 'admin' | 'trainer' | 'client') || 'admin',
            mission,
            trainer,
            client,
            daysBefore,
            customSubject: setting?.emailSubject || undefined,
          });
        }

        if (emailSent) {
          await storage.updateReminder(reminder.id, {
            status: 'sent',
            sentAt: now,
          });
          sent++;

          // Create in-app notification for the recipient
          // Find the user ID based on the recipient type and email
          let userId: string | null = null;
          const formattedDate = mission.startDate
            ? new Date(mission.startDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
            : 'Date non définie';

          if (reminder.recipientType === 'trainer' && mission.trainerId) {
            userId = mission.trainerId;
          } else if (reminder.recipientType === 'admin') {
            // Find admin by email
            const users = await storage.getUsers();
            const adminUser = users.find(u => u.email === reminder.recipientEmail && u.role === 'admin');
            if (adminUser) {
              userId = adminUser.id;
            }
          }

          if (userId) {
            const notificationMetadata: Record<string, any> = {
              daysBefore,
              trainerName: trainer ? `${trainer.firstName || ''} ${trainer.lastName || ''}`.trim() : null,
              clientName: client?.name || null,
              location: mission.location || null,
              startDate: mission.startDate ? mission.startDate.toISOString() : null,
            };

            await storage.createInAppNotification({
              userId,
              type: isJ2AdminReminder ? 'admin_alert' : 'reminder',
              title: `Rappel J-${daysBefore} : ${mission.title}`,
              message: `Formation "${mission.title}" prévue le ${formattedDate}`,
              missionId: mission.id,
              reminderId: reminder.id,
              isRead: false,
              metadata: notificationMetadata,
            });
          }
        } else {
          throw new Error("Échec de l'envoi de l'email");
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

  return { processed, sent, failed };
}

/**
 * Tâche principale du scheduler qui génère et envoie les rappels
 */
async function runReminderTask(): Promise<void> {
  if (isSchedulerRunning) {
    log('[Scheduler] Tâche déjà en cours, ignorée', 'scheduler');
    return;
  }

  isSchedulerRunning = true;
  log('[Scheduler] Démarrage de la tâche de rappels', 'scheduler');

  try {
    // Étape 1: Générer les rappels pour les missions
    const generateResult = await generateRemindersForAllMissions();
    log(`[Scheduler] Rappels générés: ${generateResult.created} créés, ${generateResult.skipped} ignorés`, 'scheduler');

    // Étape 2: Traiter et envoyer les rappels en attente
    const processResult = await processPendingReminders();
    log(`[Scheduler] Rappels traités: ${processResult.processed} traités, ${processResult.sent} envoyés, ${processResult.failed} échoués`, 'scheduler');

  } catch (error) {
    log(`[Scheduler] Erreur lors de l'exécution: ${error instanceof Error ? error.message : 'Unknown error'}`, 'scheduler');
  } finally {
    isSchedulerRunning = false;
  }
}

/**
 * Génère l'export Excel quotidien des missions
 */
async function runDailyExportTask(): Promise<void> {
  log('[Scheduler] Démarrage de l\'export Excel quotidien', 'scheduler');
  
  try {
    const filepath = await generateMissionsExcel();
    log(`[Scheduler] Export Excel généré: ${filepath}`, 'scheduler');
    
    await cleanOldExports(7);
    log('[Scheduler] Nettoyage des anciens exports terminé', 'scheduler');
  } catch (error) {
    log(`[Scheduler] Erreur lors de l'export Excel: ${error instanceof Error ? error.message : 'Unknown error'}`, 'scheduler');
  }
}

/**
 * Initialise et démarre le scheduler de rappels
 * Exécute toutes les heures à la minute 0
 */
export function startReminderScheduler(): void {
  log('[Scheduler] Initialisation du scheduler de rappels', 'scheduler');

  // Exécuter toutes les heures à :00
  // Format cron: minute heure jour-du-mois mois jour-de-la-semaine
  cron.schedule('0 * * * *', async () => {
    await runReminderTask();
  });

  // Export Excel quotidien à 6h00 du matin
  cron.schedule('0 6 * * *', async () => {
    await runDailyExportTask();
  });

  // Exécuter immédiatement au démarrage (après un délai de 30 secondes pour laisser le serveur démarrer)
  setTimeout(async () => {
    log('[Scheduler] Exécution initiale après démarrage', 'scheduler');
    await runReminderTask();
    // Générer aussi un export initial
    await runDailyExportTask();
  }, 30000);

  log('[Scheduler] Scheduler démarré - rappels toutes les heures, export Excel à 6h00', 'scheduler');
}

/**
 * Exécute manuellement la tâche de rappels (pour tests ou déclenchement manuel)
 */
export async function runReminderTaskManually(): Promise<{
  generated: { created: number; skipped: number };
  processed: { processed: number; sent: number; failed: number };
}> {
  const generated = await generateRemindersForAllMissions();
  const processed = await processPendingReminders();
  return { generated, processed };
}
