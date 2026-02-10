import nodemailer from 'nodemailer';
import type { User, Mission, Document, Client, Reminder, ReminderSetting, Message } from '@shared/schema';

// Configuration du transporteur email
// Utilise les variables d'environnement pour la configuration SMTP
const createTransporter = () => {
  // Si pas de configuration SMTP, utiliser un mode développement (log uniquement)
  if (!process.env.SMTP_HOST) {
    console.log('[Email] Mode développement: les emails seront loggés mais non envoyés');
    return null;
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

const transporter = createTransporter();

interface EmailAttachment {
  filename: string;
  path: string;
}

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  attachments?: EmailAttachment[];
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  const fromEmail = process.env.SMTP_FROM || 'noreply@formation.local';

  if (!transporter) {
    // Mode développement: log l'email
    console.log('[Email] Envoi simulé:');
    console.log(`  De: ${fromEmail}`);
    console.log(`  À: ${options.to}`);
    console.log(`  Sujet: ${options.subject}`);
    console.log(`  Contenu HTML: ${options.html.substring(0, 200)}...`);
    if (options.attachments?.length) {
      console.log(`  Pièces jointes: ${options.attachments.map(a => a.filename).join(', ')}`);
    }
    return true;
  }

  try {
    await transporter.sendMail({
      from: fromEmail,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
      attachments: options.attachments,
    });
    console.log(`[Email] Email envoyé avec succès à ${options.to}`);
    return true;
  } catch (error) {
    console.error('[Email] Erreur lors de l\'envoi:', error);
    return false;
  }
}

// ==================== EXPORT QUOTIDIEN PAR EMAIL ====================

export async function sendDailyExportEmail(
  adminEmail: string,
  adminName: string,
  exportFilePath: string,
  exportFileName: string
): Promise<boolean> {
  if (!adminEmail) {
    console.log('[Email] Pas d\'email admin, export non envoyé');
    return false;
  }

  const now = new Date();
  const dateStr = now.toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #2563eb; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center; }
        .content { background-color: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
        .footer { background-color: #f3f4f6; padding: 15px; border-radius: 0 0 8px 8px; font-size: 12px; color: #6b7280; text-align: center; }
        h1 { margin: 0; font-size: 22px; }
        .info-box { background-color: white; border: 1px solid #e5e7eb; padding: 15px; border-radius: 8px; margin: 15px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Extraction quotidienne des missions</h1>
        </div>
        <div class="content">
          <p>Bonjour ${adminName},</p>
          <p>Veuillez trouver ci-joint l'extraction complète des missions en date du <strong>${dateStr}</strong>.</p>
          <div class="info-box">
            <p><strong>Fichier joint :</strong> ${exportFileName}</p>
            <p>Ce fichier Excel contient :</p>
            <ul>
              <li>La liste de toutes les missions</li>
              <li>Les participants inscrits</li>
              <li>Les sessions de formation</li>
              <li>Les statistiques globales</li>
            </ul>
          </div>
          <p>Cet export est généré automatiquement chaque nuit à 1h00.</p>
        </div>
        <div class="footer">
          <p>CQFD Formation - Export automatique quotidien</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `Bonjour ${adminName},\n\nVeuillez trouver ci-joint l'extraction complète des missions du ${dateStr}.\n\nCQFD Formation`;

  return sendEmail({
    to: adminEmail,
    subject: `[CQFD] Extraction quotidienne des missions - ${dateStr}`,
    html,
    text,
    attachments: [{ filename: exportFileName, path: exportFilePath }],
  });
}

export async function sendMissionAssignmentEmail(
  trainer: User,
  mission: Mission,
  documents: Document[]
): Promise<boolean> {
  // Vérifier que l'email est présent
  if (!trainer.email) {
    console.log(`[Email] Pas d'email pour le formateur ${trainer.id}, email non envoyé`);
    return false;
  }
  const trainerName = `${trainer.firstName || ''} ${trainer.lastName || ''}`.trim() || 'Formateur';
  const missionTitle = mission.title || `Mission #${mission.id}`;

  // Formater la liste des documents
  const documentsList = documents.length > 0
    ? documents.map(doc => `<li><strong>${doc.title}</strong>${doc.type ? ` (${doc.type})` : ''}</li>`).join('\n')
    : '<li>Aucun document pour le moment</li>';

  // Formater les dates
  const startDate = mission.startDate
    ? new Date(mission.startDate).toLocaleDateString('fr-FR', { dateStyle: 'long' })
    : 'Non définie';
  const endDate = mission.endDate
    ? new Date(mission.endDate).toLocaleDateString('fr-FR', { dateStyle: 'long' })
    : 'Non définie';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #2563eb; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { background-color: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
        .footer { background-color: #f3f4f6; padding: 15px; border-radius: 0 0 8px 8px; font-size: 12px; color: #6b7280; }
        .mission-info { background-color: white; padding: 15px; border-radius: 8px; margin: 15px 0; }
        .documents { background-color: white; padding: 15px; border-radius: 8px; margin: 15px 0; }
        h1 { margin: 0; font-size: 24px; }
        h2 { color: #1f2937; font-size: 18px; margin-top: 0; }
        ul { padding-left: 20px; }
        .btn { display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 15px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Nouvelle Mission Assignée</h1>
        </div>
        <div class="content">
          <p>Bonjour ${trainerName},</p>
          <p>Vous avez été assigné(e) à une nouvelle mission de formation. Veuillez trouver ci-dessous les détails de cette mission.</p>

          <div class="mission-info">
            <h2>${missionTitle}</h2>
            <p><strong>Date de début:</strong> ${startDate}</p>
            <p><strong>Date de fin:</strong> ${endDate}</p>
            <p><strong>Lieu:</strong> ${mission.location || 'À définir'}</p>
            <p><strong>Modalité:</strong> ${mission.locationType || 'À définir'}</p>
            ${mission.description ? `<p><strong>Description:</strong> ${mission.description}</p>` : ''}
          </div>

          <div class="documents">
            <h2>Documents liés à votre mission</h2>
            <p>Les documents suivants sont disponibles dans votre espace formateur :</p>
            <ul>
              ${documentsList}
            </ul>
          </div>

          <p>Connectez-vous à votre espace formateur pour accéder à tous les détails de la mission et télécharger les documents.</p>
        </div>
        <div class="footer">
          <p>Cet email a été envoyé automatiquement. Merci de ne pas répondre directement à ce message.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
Bonjour ${trainerName},

Vous avez été assigné(e) à une nouvelle mission de formation.

Mission: ${missionTitle}
Date de début: ${startDate}
Date de fin: ${endDate}
Lieu: ${mission.location || 'À définir'}

Documents liés:
${documents.map(doc => `- ${doc.title}`).join('\n') || '- Aucun document'}

Connectez-vous à votre espace formateur pour accéder à tous les détails.
  `;

  return sendEmail({
    to: trainer.email,
    subject: `Nouvelle mission assignée: ${missionTitle}`,
    html,
    text,
  });
}

// ==================== EMAIL D'ASSIGNATION DE TACHE ====================

export async function sendTaskAssignmentEmail(
  assignee: User,
  mission: Mission,
  stepTitle: string,
  dueDate?: Date | null
): Promise<boolean> {
  if (!assignee.email) {
    console.log(`[Email] Pas d'email pour l'utilisateur ${assignee.id}, email non envoyé`);
    return false;
  }

  const assigneeName = `${assignee.firstName || ''} ${assignee.lastName || ''}`.trim() || 'Utilisateur';
  const missionTitle = mission.title || `Mission #${mission.id}`;
  const dueDateStr = dueDate
    ? new Date(dueDate).toLocaleDateString('fr-FR', { dateStyle: 'long' })
    : null;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #f59e0b; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { background-color: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
        .footer { background-color: #f3f4f6; padding: 15px; border-radius: 0 0 8px 8px; font-size: 12px; color: #6b7280; }
        .task-info { background-color: white; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #f59e0b; }
        h1 { margin: 0; font-size: 24px; }
        h2 { color: #1f2937; font-size: 18px; margin-top: 0; }
        .detail-row { margin: 8px 0; }
        .label { font-weight: bold; color: #6b7280; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Nouvelle tache assignee</h1>
        </div>
        <div class="content">
          <p>Bonjour ${assigneeName},</p>
          <p>Une tache vous a ete assignee sur une mission de formation.</p>

          <div class="task-info">
            <h2>${stepTitle}</h2>
            <div class="detail-row">
              <span class="label">Mission :</span> ${missionTitle}
            </div>
            ${dueDateStr ? `<div class="detail-row"><span class="label">Echeance :</span> ${dueDateStr}</div>` : ''}
          </div>

          <p>Connectez-vous a votre espace pour consulter les details de cette tache.</p>
        </div>
        <div class="footer">
          <p>Cet email a ete envoye automatiquement. Merci de ne pas repondre directement a ce message.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `Bonjour ${assigneeName},

Une tache vous a ete assignee sur une mission de formation.

Tache : ${stepTitle}
Mission : ${missionTitle}
${dueDateStr ? `Echeance : ${dueDateStr}` : ''}

Connectez-vous a votre espace pour consulter les details.
  `;

  return sendEmail({
    to: assignee.email,
    subject: `Nouvelle tache assignee : ${stepTitle} - ${missionTitle}`,
    html,
    text,
  });
}

// ==================== EMAILS DE RAPPEL ====================

interface ReminderEmailData {
  recipientEmail: string;
  recipientName: string;
  recipientType: 'admin' | 'trainer' | 'client';
  mission: Mission;
  trainer?: User | null;
  client?: Client | null;
  daysBefore: number;
  customSubject?: string;
}

export async function sendReminderEmail(data: ReminderEmailData): Promise<boolean> {
  const { recipientEmail, recipientName, recipientType, mission, trainer, client, daysBefore, customSubject } = data;

  if (!recipientEmail) {
    console.log(`[Email] Pas d'email pour le destinataire, rappel non envoyé`);
    return false;
  }

  const missionTitle = mission.title || `Mission #${mission.id}`;
  const startDate = mission.startDate
    ? new Date(mission.startDate).toLocaleDateString('fr-FR', { dateStyle: 'long' })
    : 'Non définie';
  const endDate = mission.endDate
    ? new Date(mission.endDate).toLocaleDateString('fr-FR', { dateStyle: 'long' })
    : 'Non définie';

  const trainerName = trainer
    ? `${trainer.firstName || ''} ${trainer.lastName || ''}`.trim() || 'Non assigné'
    : 'Non assigné';

  const clientName = client?.name || 'Non défini';

  // Construire le lieu
  let locationInfo = mission.location || '';
  if (mission.locationType === 'distanciel') {
    locationInfo = 'Formation à distance';
  }
  locationInfo = locationInfo || 'À définir';

  const subject = customSubject || `Rappel J-${daysBefore}: ${missionTitle}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #f59e0b; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { background-color: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
        .footer { background-color: #f3f4f6; padding: 15px; border-radius: 0 0 8px 8px; font-size: 12px; color: #6b7280; }
        .mission-info { background-color: white; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #f59e0b; }
        .alert { background-color: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 8px; margin: 15px 0; }
        h1 { margin: 0; font-size: 24px; }
        h2 { color: #1f2937; font-size: 18px; margin-top: 0; }
        .detail-row { margin: 8px 0; }
        .label { font-weight: bold; color: #6b7280; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Rappel Formation J-${daysBefore}</h1>
        </div>
        <div class="content">
          <p>Bonjour ${recipientName},</p>

          <div class="alert">
            <strong>Attention:</strong> Une formation est prévue dans <strong>${daysBefore} jour(s)</strong>.
          </div>

          <div class="mission-info">
            <h2>${missionTitle}</h2>
            <div class="detail-row">
              <span class="label">Date de début:</span> ${startDate}
            </div>
            <div class="detail-row">
              <span class="label">Date de fin:</span> ${endDate}
            </div>
            <div class="detail-row">
              <span class="label">Lieu:</span> ${locationInfo}
            </div>
            <div class="detail-row">
              <span class="label">Formateur:</span> ${trainerName}
            </div>
            <div class="detail-row">
              <span class="label">Client:</span> ${clientName}
            </div>
            ${mission.totalHours ? `<div class="detail-row"><span class="label">Durée:</span> ${mission.totalHours}h</div>` : ''}
          </div>

          <p>Merci de vous assurer que tout est prêt pour cette formation.</p>
        </div>
        <div class="footer">
          <p>Cet email a été envoyé automatiquement par le système de rappels.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
Rappel Formation J-${daysBefore}

Bonjour ${recipientName},

Une formation est prévue dans ${daysBefore} jour(s).

Mission: ${missionTitle}
Date de début: ${startDate}
Date de fin: ${endDate}
Lieu: ${locationInfo}
Formateur: ${trainerName}
Client: ${clientName}

Merci de vous assurer que tout est prêt pour cette formation.
  `;

  return sendEmail({
    to: recipientEmail,
    subject,
    html,
    text,
  });
}

// Email spécifique pour le rappel admin J-2 avec tous les détails
export async function sendAdminFormationReminderEmail(
  adminEmail: string,
  adminName: string,
  mission: Mission,
  trainer: User | null,
  client: Client | null
): Promise<boolean> {
  if (!adminEmail) {
    console.log(`[Email] Pas d'email admin, rappel non envoyé`);
    return false;
  }

  const missionTitle = mission.title || `Mission #${mission.id}`;
  const startDate = mission.startDate
    ? new Date(mission.startDate).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
    : 'Non définie';
  const endDate = mission.endDate
    ? new Date(mission.endDate).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
    : 'Non définie';

  const trainerName = trainer
    ? `${trainer.firstName || ''} ${trainer.lastName || ''}`.trim()
    : 'Non assigné';
  const trainerEmail = trainer?.email || 'N/A';
  const trainerPhone = trainer?.phone || 'N/A';

  const clientName = client?.name || 'Non défini';
  const clientContact = client?.contactName || 'N/A';
  const clientEmail = client?.contactEmail || 'N/A';
  const clientPhone = client?.contactPhone || 'N/A';

  // Construire le lieu complet
  let locationInfo = '';
  if (mission.locationType === 'distanciel') {
    locationInfo = 'Formation à distance';
  } else {
    locationInfo = mission.location || 'À définir';
  }

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #dc2626; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { background-color: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
        .footer { background-color: #f3f4f6; padding: 15px; border-radius: 0 0 8px 8px; font-size: 12px; color: #6b7280; }
        .section { background-color: white; padding: 15px; border-radius: 8px; margin: 15px 0; }
        .section-title { font-size: 16px; font-weight: bold; color: #1f2937; margin-bottom: 10px; border-bottom: 2px solid #e5e7eb; padding-bottom: 5px; }
        .alert { background-color: #fef2f2; border: 1px solid #dc2626; padding: 15px; border-radius: 8px; margin: 15px 0; color: #991b1b; }
        h1 { margin: 0; font-size: 24px; }
        .detail-row { margin: 8px 0; }
        .label { font-weight: bold; color: #6b7280; display: inline-block; width: 120px; }
        a { color: #2563eb; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Formation dans 2 jours</h1>
        </div>
        <div class="content">
          <p>Bonjour ${adminName},</p>

          <div class="alert">
            <strong>Rappel important:</strong> Une formation commence dans <strong>2 jours</strong>.
          </div>

          <div class="section">
            <div class="section-title">Informations Formation</div>
            <div class="detail-row">
              <span class="label">Mission:</span> ${missionTitle}
            </div>
            <div class="detail-row">
              <span class="label">Date début:</span> ${startDate}
            </div>
            <div class="detail-row">
              <span class="label">Date fin:</span> ${endDate}
            </div>
            ${mission.totalHours ? `<div class="detail-row"><span class="label">Durée:</span> ${mission.totalHours}h</div>` : ''}
          </div>

          <div class="section">
            <div class="section-title">Lieu</div>
            <div class="detail-row">
              <span class="label">Modalité:</span> ${mission.locationType === 'distanciel' ? 'À distance' : mission.locationType === 'hybride' ? 'Hybride' : 'Présentiel'}
            </div>
            <div class="detail-row">
              <span class="label">Adresse:</span> ${locationInfo}
            </div>
          </div>

          <div class="section">
            <div class="section-title">Formateur</div>
            <div class="detail-row">
              <span class="label">Nom:</span> ${trainerName}
            </div>
            <div class="detail-row">
              <span class="label">Email:</span> ${trainerEmail !== 'N/A' ? `<a href="mailto:${trainerEmail}">${trainerEmail}</a>` : 'N/A'}
            </div>
            <div class="detail-row">
              <span class="label">Téléphone:</span> ${trainerPhone}
            </div>
          </div>

          <div class="section">
            <div class="section-title">Client</div>
            <div class="detail-row">
              <span class="label">Société:</span> ${clientName}
            </div>
            <div class="detail-row">
              <span class="label">Contact:</span> ${clientContact}
            </div>
            <div class="detail-row">
              <span class="label">Email:</span> ${clientEmail !== 'N/A' ? `<a href="mailto:${clientEmail}">${clientEmail}</a>` : 'N/A'}
            </div>
            <div class="detail-row">
              <span class="label">Téléphone:</span> ${clientPhone}
            </div>
          </div>

          <p>Veuillez vous assurer que tous les éléments sont en place pour le bon déroulement de cette formation.</p>
        </div>
        <div class="footer">
          <p>Rappel automatique J-2 - Système de gestion des formations</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: adminEmail,
    subject: `[J-2] Formation à venir: ${missionTitle}`,
    html,
  });
}

// ==================== PASSWORD RESET EMAIL ====================

export async function sendPasswordResetEmail(
  email: string,
  userName: string,
  resetToken: string,
  baseUrl: string
): Promise<boolean> {
  const resetUrl = `${baseUrl}/reset-password?token=${resetToken}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #2563eb; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center; }
        .content { background-color: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
        .footer { background-color: #f3f4f6; padding: 15px; border-radius: 0 0 8px 8px; font-size: 12px; color: #6b7280; text-align: center; }
        h1 { margin: 0; font-size: 24px; }
        .btn { display: inline-block; background-color: #2563eb; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: bold; }
        .btn:hover { background-color: #1d4ed8; }
        .warning { background-color: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 8px; margin: 15px 0; color: #92400e; }
        .link-text { word-break: break-all; background-color: #f3f4f6; padding: 10px; border-radius: 4px; font-size: 12px; color: #6b7280; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Reinitialisation du mot de passe</h1>
        </div>
        <div class="content">
          <p>Bonjour ${userName},</p>
          <p>Vous avez demande la reinitialisation de votre mot de passe pour votre compte CQFD Formation.</p>

          <p style="text-align: center;">
            <a href="${resetUrl}" class="btn">Reinitialiser mon mot de passe</a>
          </p>

          <div class="warning">
            <strong>Important:</strong> Ce lien est valable pendant <strong>1 heure</strong>.
            Si vous n'avez pas fait cette demande, vous pouvez ignorer cet email.
          </div>

          <p>Si le bouton ne fonctionne pas, copiez et collez ce lien dans votre navigateur:</p>
          <p class="link-text">${resetUrl}</p>
        </div>
        <div class="footer">
          <p>Cet email a ete envoye automatiquement. Merci de ne pas repondre directement a ce message.</p>
          <p>CQFD Formation - Gestion des formations</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
Bonjour ${userName},

Vous avez demande la reinitialisation de votre mot de passe pour votre compte CQFD Formation.

Pour reinitialiser votre mot de passe, cliquez sur le lien suivant:
${resetUrl}

Ce lien est valable pendant 1 heure.

Si vous n'avez pas fait cette demande, vous pouvez ignorer cet email.

CQFD Formation
  `;

  return sendEmail({
    to: email,
    subject: 'Reinitialisation de votre mot de passe - CQFD Formation',
    html,
    text,
  });
}

// ==================== WELCOME EMAIL ====================

export async function sendWelcomeEmail(
  email: string,
  firstName: string,
  lastName: string,
  setupToken: string,
  baseUrl: string
): Promise<boolean> {
  const setupUrl = `${baseUrl}/reset-password?token=${setupToken}`;
  const fullName = `${firstName || ''} ${lastName || ''}`.trim() || 'Utilisateur';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #10b981; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center; }
        .content { background-color: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
        .footer { background-color: #f3f4f6; padding: 15px; border-radius: 0 0 8px 8px; font-size: 12px; color: #6b7280; text-align: center; }
        h1 { margin: 0; font-size: 24px; }
        .btn { display: inline-block; background-color: #10b981; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: bold; }
        .info-box { background-color: white; border: 1px solid #e5e7eb; padding: 15px; border-radius: 8px; margin: 15px 0; }
        .info-box .label { font-weight: bold; color: #6b7280; }
        .warning { background-color: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 8px; margin: 15px 0; color: #92400e; }
        .link-text { word-break: break-all; background-color: #f3f4f6; padding: 10px; border-radius: 4px; font-size: 12px; color: #6b7280; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Bienvenue sur CQFD Formation</h1>
        </div>
        <div class="content">
          <p>Bonjour ${fullName},</p>
          <p>Un compte a été créé pour vous sur la plateforme <strong>CQFD Formation</strong>.</p>

          <div class="info-box">
            <p><span class="label">Votre identifiant de connexion :</span> ${email}</p>
          </div>

          <p>Pour activer votre compte, veuillez définir votre mot de passe en cliquant sur le bouton ci-dessous :</p>

          <p style="text-align: center;">
            <a href="${setupUrl}" class="btn">Définir mon mot de passe</a>
          </p>

          <div class="warning">
            <strong>Important :</strong> Ce lien est valable pendant <strong>72 heures</strong>.
            Passé ce délai, vous devrez demander un nouveau lien via la page de connexion.
          </div>

          <p>Si le bouton ne fonctionne pas, copiez et collez ce lien dans votre navigateur :</p>
          <p class="link-text">${setupUrl}</p>
        </div>
        <div class="footer">
          <p>Cet email a été envoyé automatiquement. Merci de ne pas répondre directement à ce message.</p>
          <p>CQFD Formation - Gestion des formations</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `Bienvenue sur CQFD Formation

Bonjour ${fullName},

Un compte a été créé pour vous sur la plateforme CQFD Formation.

Votre identifiant de connexion : ${email}

Pour activer votre compte, veuillez définir votre mot de passe en cliquant sur le lien suivant :
${setupUrl}

Ce lien est valable pendant 72 heures.

Si vous n'avez pas demandé la création de ce compte, veuillez ignorer cet email.

CQFD Formation
  `;

  return sendEmail({
    to: email,
    subject: 'Bienvenue sur CQFD Formation - Activez votre compte',
    html,
    text,
  });
}

// ==================== MISSION NOTIFICATION EMAILS ====================

interface MissionNotificationData {
  mission: Mission;
  modifiedBy: User;
  recipient: User;
  client?: Client | null;
  changeType: 'update' | 'document' | 'comment';
  changeDetails?: string;
  documentTitle?: string;
  commentContent?: string;
}

export async function sendMissionNotificationEmail(data: MissionNotificationData): Promise<boolean> {
  const { mission, modifiedBy, recipient, client, changeType, changeDetails, documentTitle, commentContent } = data;

  if (!recipient.email) {
    console.log(`[Email] Pas d'email pour le destinataire ${recipient.id}, notification non envoyée`);
    return false;
  }

  const recipientName = `${recipient.firstName || ''} ${recipient.lastName || ''}`.trim() || 'Utilisateur';
  const modifierName = `${modifiedBy.firstName || ''} ${modifiedBy.lastName || ''}`.trim() || 'Un utilisateur';
  const modifierRole = modifiedBy.role === 'admin' ? 'Administrateur' : 'Formateur';
  const missionTitle = mission.title || `Mission #${mission.id}`;
  const clientName = client?.name || 'Client non défini';

  // Déterminer le titre et le contenu selon le type de changement
  let headerTitle = '';
  let headerColor = '#2563eb';
  let changeDescription = '';
  let subject = '';

  switch (changeType) {
    case 'update':
      headerTitle = 'Mission modifiée';
      headerColor = '#f59e0b';
      changeDescription = changeDetails || 'Des modifications ont été apportées à la mission.';
      subject = `Mission modifiée: ${missionTitle}`;
      break;
    case 'document':
      headerTitle = 'Nouveau document ajouté';
      headerColor = '#10b981';
      changeDescription = documentTitle
        ? `Un nouveau document a été ajouté: <strong>${documentTitle}</strong>`
        : 'Un nouveau document a été ajouté à la mission.';
      subject = `Nouveau document: ${missionTitle}`;
      break;
    case 'comment':
      headerTitle = 'Nouveau commentaire';
      headerColor = '#8b5cf6';
      changeDescription = commentContent
        ? `<blockquote style="border-left: 3px solid #8b5cf6; padding-left: 15px; margin: 10px 0; color: #4b5563;">${commentContent}</blockquote>`
        : 'Un nouveau commentaire a été ajouté.';
      subject = `Nouveau commentaire: ${missionTitle}`;
      break;
  }

  const startDate = mission.startDate
    ? new Date(mission.startDate).toLocaleDateString('fr-FR', { dateStyle: 'long' })
    : 'Non définie';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: ${headerColor}; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { background-color: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
        .footer { background-color: #f3f4f6; padding: 15px; border-radius: 0 0 8px 8px; font-size: 12px; color: #6b7280; }
        .mission-info { background-color: white; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid ${headerColor}; }
        .change-info { background-color: white; padding: 15px; border-radius: 8px; margin: 15px 0; }
        .modifier-badge { display: inline-block; background-color: #e5e7eb; padding: 4px 12px; border-radius: 20px; font-size: 12px; color: #4b5563; }
        h1 { margin: 0; font-size: 24px; }
        h2 { color: #1f2937; font-size: 18px; margin-top: 0; }
        .detail-row { margin: 8px 0; }
        .label { font-weight: bold; color: #6b7280; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${headerTitle}</h1>
        </div>
        <div class="content">
          <p>Bonjour ${recipientName},</p>

          <p>
            <span class="modifier-badge">${modifierRole}</span>
            <strong>${modifierName}</strong> a effectué une modification sur une mission.
          </p>

          <div class="mission-info">
            <h2>${missionTitle}</h2>
            <div class="detail-row">
              <span class="label">Client:</span> ${clientName}
            </div>
            <div class="detail-row">
              <span class="label">Date de début:</span> ${startDate}
            </div>
          </div>

          <div class="change-info">
            <h2>Détails de la modification</h2>
            <p>${changeDescription}</p>
          </div>

          <p>Connectez-vous à la plateforme pour consulter les détails complets de cette mission.</p>
        </div>
        <div class="footer">
          <p>Cet email a été envoyé automatiquement suite à une modification sur la plateforme.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
Bonjour ${recipientName},

${modifierName} (${modifierRole}) a effectué une modification sur la mission "${missionTitle}".

Mission: ${missionTitle}
Client: ${clientName}
Date de début: ${startDate}

Type de modification: ${changeType === 'update' ? 'Mise à jour' : changeType === 'document' ? 'Nouveau document' : 'Nouveau commentaire'}

Connectez-vous à la plateforme pour consulter les détails.
  `;

  return sendEmail({
    to: recipient.email,
    subject,
    html,
    text,
  });
}

// ==================== ENVOI DE LIEN DE TACHE ====================

export async function sendStepLinkEmail(
  recipients: { email: string; name: string }[],
  link: string,
  missionTitle: string,
  stepTitle: string
): Promise<number> {
  let sent = 0;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #2563eb; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center; }
        .content { background-color: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
        .footer { background-color: #f3f4f6; padding: 15px; border-radius: 0 0 8px 8px; font-size: 12px; color: #6b7280; text-align: center; }
        h1 { margin: 0; font-size: 22px; }
        .info-box { background-color: white; border: 1px solid #e5e7eb; padding: 15px; border-radius: 8px; margin: 15px 0; }
        .btn { display: inline-block; background-color: #2563eb; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: bold; }
        .link-text { word-break: break-all; background-color: #f3f4f6; padding: 10px; border-radius: 4px; font-size: 12px; color: #6b7280; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Lien - ${stepTitle}</h1>
        </div>
        <div class="content">
          <p>Bonjour,</p>
          <p>Vous trouverez ci-dessous le lien associe a la tache <strong>${stepTitle}</strong> de la mission <strong>${missionTitle}</strong>.</p>

          <div class="info-box">
            <p style="text-align: center;">
              <a href="${link}" class="btn">Acceder au lien</a>
            </p>
          </div>

          <p>Si le bouton ne fonctionne pas, copiez et collez ce lien dans votre navigateur :</p>
          <p class="link-text">${link}</p>
        </div>
        <div class="footer">
          <p>Cet email a ete envoye automatiquement. Merci de ne pas repondre directement a ce message.</p>
          <p>CQFD Formation</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `Bonjour,

Vous trouverez ci-dessous le lien associe a la tache "${stepTitle}" de la mission "${missionTitle}".

Lien : ${link}

CQFD Formation`;

  for (const recipient of recipients) {
    const success = await sendEmail({
      to: recipient.email,
      subject: `Lien - ${stepTitle} - Mission ${missionTitle}`,
      html,
      text,
    });
    if (success) sent++;
  }

  return sent;
}

// Fonction utilitaire pour notifier l'autre partie (admin ou formateur)
export async function notifyOtherParty(
  mission: Mission,
  modifiedBy: User,
  trainer: User | null,
  admins: User[],
  client: Client | null,
  changeType: 'update' | 'document' | 'comment',
  options?: { changeDetails?: string; documentTitle?: string; commentContent?: string }
): Promise<void> {
  const isModifierAdmin = modifiedBy.role === 'admin';

  // Toujours notifier tous les admins (sauf celui qui a fait la modification)
  for (const admin of admins) {
    if (admin.email && admin.id !== modifiedBy.id) {
      await sendMissionNotificationEmail({
        mission,
        modifiedBy,
        recipient: admin,
        client,
        changeType,
        ...options,
      });
    }
  }

  // Si c'est un admin qui modifie, notifier aussi le formateur
  if (isModifierAdmin) {
    if (trainer && trainer.email && trainer.id !== modifiedBy.id) {
      await sendMissionNotificationEmail({
        mission,
        modifiedBy,
        recipient: trainer,
        client,
        changeType,
        ...options,
      });
    }
  }
}
