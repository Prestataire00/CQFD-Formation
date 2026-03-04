import ExcelJS from 'exceljs';
import { db } from './db';
import { missions, users, clients, missionSessions, missionSteps, stepTasks, documents, invoices } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import path from 'path';
import fs from 'fs';

const EXPORTS_DIR = path.join(process.cwd(), 'exports');

if (!fs.existsSync(EXPORTS_DIR)) {
  fs.mkdirSync(EXPORTS_DIR, { recursive: true });
}

function formatDate(date: Date | string | null): string {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  return format(d, 'dd/MM/yyyy', { locale: fr });
}

function formatDateTime(date: Date | string | null): string {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  return format(d, 'dd/MM/yyyy HH:mm', { locale: fr });
}

function translateStatus(status: string): string {
  const statusMap: Record<string, string> = {
    'pending': 'En attente',
    'confirmed': 'Confirmé',
    'in_progress': 'En cours',
    'completed': 'Terminé',
    'cancelled': 'Annulé',
    'draft': 'Brouillon',
    'sent': 'Envoyée',
    'paid': 'Payée',
    'overdue': 'En retard',
  };
  return statusMap[status] || status;
}

function getStepStatusText(step: any): string {
  if (step.isCompleted) return 'Fait';
  if (step.status === 'late') return 'En retard';
  if (step.status === 'priority') return 'Prioritaire';
  if (step.status === 'na') return 'N/A';
  return 'A faire';
}

function getStepStatus(steps: any[], title: string): string {
  const step = steps.find(s => s.title?.toLowerCase().includes(title.toLowerCase()));
  if (!step) return '';
  const status = getStepStatusText(step);
  const comments: string[] = [];
  if (step.comment) comments.push(stripHtml(step.comment));
  if (step.trainerComment) comments.push(`[Formateur] ${stripHtml(step.trainerComment)}`);
  if (comments.length > 0) {
    return `${status}\n---\n${comments.join('\n')}`;
  }
  return status;
}

function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<li>/gi, '- ')
    .replace(/<[^>]*>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function buildCommentsColumn(steps: any[], subTasks: any[], usersMap: Map<string, any>): string {
  const lines: string[] = [];
  for (const step of steps) {
    const stepLines: string[] = [];

    // Commentaire admin de la tâche
    if (step.comment) {
      const text = stripHtml(step.comment);
      const author = step.commentAuthorId ? usersMap.get(step.commentAuthorId) : null;
      const authorName = author ? `${author.firstName || ''} ${author.lastName || ''}`.trim() : '';
      stepLines.push(authorName ? `${authorName}: ${text}` : text);
    }
    // Commentaire formateur de la tâche
    if (step.trainerComment) {
      const text = stripHtml(step.trainerComment);
      const author = step.trainerCommentAuthorId ? usersMap.get(step.trainerCommentAuthorId) : null;
      const authorName = author ? `${author.firstName || ''} ${author.lastName || ''}`.trim() : '';
      stepLines.push(authorName ? `[Formateur] ${authorName}: ${text}` : `[Formateur] ${text}`);
    }

    // Commentaires des sous-tâches
    const children = subTasks.filter(st => st.stepId === step.id);
    for (const child of children) {
      if (child.comment) {
        stepLines.push(`  └ ${child.title}: ${stripHtml(child.comment)}`);
      }
    }

    if (stepLines.length > 0) {
      lines.push(`• ${step.title}\n${stepLines.join('\n')}`);
    }
  }
  return lines.join('\n\n');
}

function getDocByType(docs: any[], type: string): string {
  const doc = docs.find(d => d.type?.toLowerCase().includes(type.toLowerCase()));
  if (!doc) return '';
  return doc.url ? 'Oui' : 'En attente';
}

const HEADER_FILL: ExcelJS.FillPattern = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FFD9E2F3' },
};

const HEADER_FONT: Partial<ExcelJS.Font> = {
  bold: true,
  size: 11,
  name: 'Calibri',
};

const THIN_BORDER: Partial<ExcelJS.Borders> = {
  left: { style: 'thin' },
  right: { style: 'thin' },
  top: { style: 'medium' },
};

export async function generateMissionsExcel(): Promise<string> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'CQFD Formation CRM';
  workbook.created = new Date();

  const allMissions = await db.select().from(missions);
  const allUsers = await db.select().from(users);
  const allClients = await db.select().from(clients);
  const allSessions = await db.select().from(missionSessions);
  const allSteps = await db.select().from(missionSteps);
  const allStepTasks = await db.select().from(stepTasks);
  const allDocuments = await db.select().from(documents);

  let allInvoices: any[] = [];
  try {
    allInvoices = await db.select().from(invoices);
  } catch {}

  const usersMap = new Map(allUsers.map(u => [u.id, u]));
  const clientsMap = new Map(allClients.map(c => [c.id, c]));

  const sheet = workbook.addWorksheet('Projets');

  const columns = [
    { header: 'Statut mission', key: 'statutMission', width: 14 },
    { header: 'Intervenant', key: 'intervenant', width: 20 },
    { header: 'Dates intervention', key: 'datesIntervention', width: 18 },
    { header: 'Nom du client', key: 'nomClient', width: 22 },
    { header: 'Contact et Tél', key: 'contactTel', width: 20 },
    { header: 'Adresse de facturation', key: 'adresseFacturation', width: 25 },
    { header: 'Origine', key: 'origine', width: 14 },
    { header: 'Réseaux sociaux', key: 'reseauxSociaux', width: 14 },
    { header: 'Titre formation et Modalité\n(inter intra conseil conf)', key: 'titreFormation', width: 28 },
    { header: 'Prog initial', key: 'progInitial', width: 12 },
    { header: 'Observations', key: 'observations', width: 20 },
    { header: 'Pub / Communication', key: 'pubCommunication', width: 14 },
    { header: 'Base tarifaire', key: 'baseTarifaire', width: 14 },
    { header: 'Convention', key: 'convention', width: 12 },
    { header: 'Modalité financière', key: 'modaliteFinanciere', width: 16 },
    { header: 'Récap', key: 'recap', width: 10 },
    { header: 'Nbre pax', key: 'nbrePax', width: 10 },
    { header: 'Liste participants', key: 'listeParticipants', width: 20 },
    { header: "Situation d'handicap", key: 'situationHandicap', width: 14 },
    { header: 'Coordonnées des stagiaires', key: 'coordonneesStagiaires', width: 20 },
    { header: 'Envoi questionnaire\nde cadrage', key: 'questionnaireCadrage', width: 14 },
    { header: 'Questionnaire\nde positionnement\n+ programme', key: 'questionnairePositionnement', width: 14 },
    { header: 'Besoin salle matériel\net repas formateur', key: 'besoinSalle', width: 14 },
    { header: 'Envoi Convocation', key: 'envoiConvocation', width: 14 },
    { header: 'Observation', key: 'observation2', width: 16 },
    { header: 'Horaires', key: 'horaires', width: 14 },
    { header: 'Adresse formation', key: 'adresseFormation', width: 22 },
    { header: 'Questionnaire de cadrage\net coordonnées référent', key: 'questionnaireCadrageRef', width: 14 },
    { header: 'Compte rendu\nentretien et liste besoins', key: 'compteRenduEntretien', width: 14 },
    { header: 'Programme ajusté\n(le cas échéant)\n+ Séquençage envisagé', key: 'programmeAjuste', width: 14 },
    { header: 'Commande spécifique', key: 'commandeSpecifique', width: 14 },
    { header: 'Envoi au client\nProg ajusté / séquençage', key: 'envoiProgAjuste', width: 14 },
    { header: 'Lien visio\n(si f° à distance)', key: 'lienVisio', width: 14 },
    { header: 'Consignes formateurs', key: 'consignesFormateurs', width: 14 },
    { header: 'Cahier des charges\net Bonnes pratiques', key: 'cahierCharges', width: 14 },
    { header: 'Budget dépl/héb', key: 'budgetDeplHeb', width: 14 },
    { header: 'Contrat CDD\net déclaration urssaf', key: 'contratCDD', width: 14 },
    { header: 'Contrat prestation\nde sous-traitance', key: 'contratPrestation', width: 14 },
    { header: 'Livret à imprimer\net annexes', key: 'livretImprimer', width: 14 },
    { header: 'Envoi par CQFD du\ndossier avec feuilles\nde présence\net quest. Satisf', key: 'envoiDossier', width: 18 },
    { header: 'Scan feuille\nde présence', key: 'scanPresence', width: 14 },
    { header: 'Scan avis satisfaction', key: 'scanSatisfaction', width: 14 },
    { header: 'Bilan qualité', key: 'bilanQualite', width: 14 },
    { header: 'Scan annexes', key: 'scanAnnexes', width: 14 },
    { header: 'Synthèse évaluation\ndes acquis', key: 'syntheseEvaluation', width: 14 },
    { header: 'Envoi par courrier\ndes originaux', key: 'envoiOriginaux', width: 14 },
    { header: 'Fiche de paie,\nattestation et STC', key: 'fichePaie', width: 14 },
    { header: 'Facture(s) prestataires', key: 'facturePrestataires', width: 14 },
    { header: 'Commentaires tâches', key: 'commentairesTaches', width: 40 },
  ];

  sheet.columns = columns;

  const headerRow = sheet.getRow(1);
  headerRow.height = 120;
  headerRow.font = HEADER_FONT;
  headerRow.fill = HEADER_FILL;
  headerRow.alignment = {
    vertical: 'middle',
    wrapText: true,
    textRotation: 77,
  };
  headerRow.border = THIN_BORDER;

  for (const mission of allMissions) {
    const trainer = mission.trainerId ? usersMap.get(mission.trainerId) : null;
    const client = mission.clientId ? clientsMap.get(mission.clientId) : null;
    const missionSess = allSessions.filter(s => s.missionId === mission.id);
    const missionStepsList = allSteps.filter(s => s.missionId === mission.id);
    const missionStepIds = new Set(missionStepsList.map(s => s.id));
    const missionSubTasks = allStepTasks.filter(st => missionStepIds.has(st.stepId));
    const missionDocs = allDocuments.filter(d => d.missionId === mission.id);
    const missionInvoices = allInvoices.filter((inv: any) => inv.missionId === mission.id);

    const datesStr = mission.startDate ? formatDate(mission.startDate) : '';

    const contactTel = client
      ? [client.contactName, client.contactPhone || client.phone].filter(Boolean).join(' - ')
      : '';

    const billingAddr = client
      ? [client.billingAddress, client.billingPostalCode, client.billingCity].filter(Boolean).join(', ')
      : '';

    const horaires = missionSess.length > 0
      ? missionSess.map(s => `${s.startTime || ''}-${s.endTime || ''}`).filter(h => h !== '-')[0] || ''
      : '';

    const trainerName = trainer ? `${trainer.firstName} ${trainer.lastName}` : '';
    const typologyStr = mission.typology || '';
    const titleFormation = `${mission.title} - ${typologyStr}`;

    const hasInvoice = missionInvoices.length > 0 ? 'Oui' : '';

    sheet.addRow({
      statutMission: translateStatus(mission.status),
      intervenant: trainerName,
      datesIntervention: datesStr,
      nomClient: client?.name || '',
      contactTel: contactTel,
      adresseFacturation: billingAddr,
      origine: client?.origine || '',
      reseauxSociaux: client?.socialMedia || '',
      titreFormation: titleFormation,
      progInitial: mission.programTitle || '',
      observations: mission.description || '',
      pubCommunication: '',
      baseTarifaire: mission.rateBase ? `${mission.rateBase}` : '',
      convention: '',
      modaliteFinanciere: mission.financialTerms || '',
      recap: '',
      nbrePax: mission.expectedParticipants ? `${mission.expectedParticipants}` : '',
      listeParticipants: mission.participantsList || '',
      situationHandicap: mission.hasDisability ? (mission.disabilityDetails || 'Oui') : 'Non',
      coordonneesStagiaires: '',
      questionnaireCadrage: getStepStatus(missionStepsList, 'questionnaire de cadrage'),
      questionnairePositionnement: getStepStatus(missionStepsList, 'questionnaire de positionnement'),
      besoinSalle: getStepStatus(missionStepsList, 'salle'),
      envoiConvocation: getStepStatus(missionStepsList, 'convocation'),
      observation2: '',
      horaires: horaires,
      adresseFormation: mission.location || '',
      questionnaireCadrageRef: getStepStatus(missionStepsList, 'cadrage'),
      compteRenduEntretien: getStepStatus(missionStepsList, 'compte-rendu') || getStepStatus(missionStepsList, 'compte rendu') || getStepStatus(missionStepsList, 'bilan'),
      programmeAjuste: getStepStatus(missionStepsList, 'programme'),
      commandeSpecifique: '',
      envoiProgAjuste: getStepStatus(missionStepsList, 'séquençage') || getStepStatus(missionStepsList, 'programme'),
      lienVisio: mission.locationType === 'distanciel' || mission.locationType === 'hybride' ? '' : 'N/A',
      consignesFormateurs: getDocByType(missionDocs, 'consigne') || getStepStatus(missionStepsList, 'consignes'),
      cahierCharges: getDocByType(missionDocs, 'cahier des charges'),
      budgetDeplHeb: '',
      contratCDD: '',
      contratPrestation: '',
      livretImprimer: getDocByType(missionDocs, 'annexe') || getDocByType(missionDocs, 'impression'),
      envoiDossier: getStepStatus(missionStepsList, 'dossier') || getStepStatus(missionStepsList, 'feuilles de présence'),
      scanPresence: getDocByType(missionDocs, 'emargement') || getStepStatus(missionStepsList, 'emargement'),
      scanSatisfaction: getStepStatus(missionStepsList, 'satisfaction'),
      bilanQualite: getStepStatus(missionStepsList, 'bilan qualité') || getStepStatus(missionStepsList, 'bilan'),
      scanAnnexes: getDocByType(missionDocs, 'annexe'),
      syntheseEvaluation: getStepStatus(missionStepsList, 'évaluation') || getStepStatus(missionStepsList, 'evaluation'),
      envoiOriginaux: getStepStatus(missionStepsList, 'originaux') || getStepStatus(missionStepsList, 'courrier'),
      fichePaie: '',
      facturePrestataires: hasInvoice,
      commentairesTaches: buildCommentsColumn(missionStepsList, missionSubTasks, usersMap),
    });
  }

  for (let r = 2; r <= sheet.rowCount; r++) {
    const row = sheet.getRow(r);
    row.alignment = { vertical: 'middle', wrapText: true };
    row.border = {
      left: { style: 'thin' },
      right: { style: 'thin' },
      bottom: { style: 'thin' },
    };

    const statusCell = row.getCell(1);
    const status = statusCell.value as string;
    if (status === 'Confirmé') {
      statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2EFDA' } };
    } else if (status === 'En cours') {
      statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFCE4D6' } };
    } else if (status === 'Terminé') {
      statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9E2F3' } };
    } else if (status === 'Annulé') {
      statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFCE4EC' } };
    } else if (status === 'En attente') {
      statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF2CC' } };
    }

    for (let c = 21; c <= 49; c++) {
      const cell = row.getCell(c);
      const val = cell.value as string;
      if (val === 'Fait') {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2EFDA' } };
      } else if (val === 'En retard') {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFCE4D6' } };
        cell.font = { color: { argb: 'FFFF0000' }, bold: true };
      } else if (val === 'Prioritaire') {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF2CC' } };
      }
    }
  }

  const timestamp = format(new Date(), 'yyyy-MM-dd_HH-mm', { locale: fr });
  const filename = `extraction_missions_${timestamp}.xlsx`;
  const filepath = path.join(EXPORTS_DIR, filename);

  await workbook.xlsx.writeFile(filepath);

  console.log(`[excel-export] Export généré: ${filepath}`);
  return filepath;
}

export async function cleanOldExports(keepDays: number = 7): Promise<void> {
  const files = fs.readdirSync(EXPORTS_DIR);
  const now = Date.now();
  const maxAge = keepDays * 24 * 60 * 60 * 1000;

  for (const file of files) {
    const filepath = path.join(EXPORTS_DIR, file);
    const stats = fs.statSync(filepath);
    if (now - stats.mtimeMs > maxAge) {
      fs.unlinkSync(filepath);
      console.log(`[excel-export] Fichier supprimé (ancien): ${file}`);
    }
  }
}

export function getLatestExport(): string | null {
  if (!fs.existsSync(EXPORTS_DIR)) return null;
  
  const files = fs.readdirSync(EXPORTS_DIR)
    .filter(f => f.endsWith('.xlsx'))
    .map(f => ({
      name: f,
      path: path.join(EXPORTS_DIR, f),
      mtime: fs.statSync(path.join(EXPORTS_DIR, f)).mtimeMs
    }))
    .sort((a, b) => b.mtime - a.mtime);

  return files.length > 0 ? files[0].path : null;
}

export function listExports(): Array<{ name: string; path: string; date: Date; size: number }> {
  if (!fs.existsSync(EXPORTS_DIR)) return [];
  
  return fs.readdirSync(EXPORTS_DIR)
    .filter(f => f.endsWith('.xlsx'))
    .map(f => {
      const filepath = path.join(EXPORTS_DIR, f);
      const stats = fs.statSync(filepath);
      return {
        name: f,
        path: filepath,
        date: new Date(stats.mtimeMs),
        size: stats.size
      };
    })
    .sort((a, b) => b.date.getTime() - a.date.getTime());
}
