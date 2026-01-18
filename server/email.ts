import nodemailer from 'nodemailer';
import type { User, Mission, Document, Client, Reminder, ReminderSetting } from '@shared/schema';

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

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
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
    return true;
  }

  try {
    await transporter.sendMail({
      from: fromEmail,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });
    console.log(`[Email] Email envoyé avec succès à ${options.to}`);
    return true;
  } catch (error) {
    console.error('[Email] Erreur lors de l\'envoi:', error);
    return false;
  }
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
            <p><strong>Référence:</strong> ${mission.reference || 'N/A'}</p>
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
Référence: ${mission.reference || 'N/A'}
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
              <span class="label">Référence:</span> ${mission.reference || 'N/A'}
            </div>
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
Référence: ${mission.reference || 'N/A'}
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
              <span class="label">Référence:</span> ${mission.reference || 'N/A'}
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
