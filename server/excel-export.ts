import ExcelJS from 'exceljs';
import { db } from './db';
import { missions, users, clients, participants, missionSessions, missionParticipants, attendanceRecords } from '@shared/schema';
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
    'registered': 'Inscrit',
    'attending': 'Présent',
    'absent': 'Absent',
    'abandoned': 'Abandonné',
  };
  return statusMap[status] || status;
}

function translateTypology(typology: string): string {
  const typologyMap: Record<string, string> = {
    'Inter': 'Inter-entreprise',
    'Intra': 'Intra-entreprise',
    'Conseil': 'Conseil',
  };
  return typologyMap[typology] || typology;
}

function translateLocationType(locationType: string): string {
  const locationMap: Record<string, string> = {
    'presentiel': 'Présentiel',
    'distanciel': 'Distanciel',
    'hybride': 'Hybride',
  };
  return locationMap[locationType] || locationType;
}

export async function generateMissionsExcel(): Promise<string> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'CQFD Formation CRM';
  workbook.created = new Date();

  const allMissions = await db.select().from(missions);
  const allUsers = await db.select().from(users);
  const allClients = await db.select().from(clients);
  const allParticipants = await db.select().from(participants);
  const allMissionParticipants = await db.select().from(missionParticipants);
  const allSessions = await db.select().from(missionSessions);
  const allAttendance = await db.select().from(attendanceRecords);

  const usersMap = new Map(allUsers.map(u => [u.id, u]));
  const clientsMap = new Map(allClients.map(c => [c.id, c]));
  const participantsMap = new Map(allParticipants.map(p => [p.id, p]));

  const missionsSheet = workbook.addWorksheet('Missions');
  missionsSheet.columns = [
    { header: 'Référence', key: 'reference', width: 25 },
    { header: 'Titre', key: 'title', width: 30 },
    { header: 'Description', key: 'description', width: 40 },
    { header: 'Statut', key: 'status', width: 15 },
    { header: 'Typologie', key: 'typology', width: 18 },
    { header: 'Type lieu', key: 'locationType', width: 15 },
    { header: 'Lieu', key: 'location', width: 25 },
    { header: 'Date début', key: 'startDate', width: 12 },
    { header: 'Date fin', key: 'endDate', width: 12 },
    { header: 'Heures totales', key: 'totalHours', width: 14 },
    { header: 'Formateur', key: 'trainer', width: 25 },
    { header: 'Email formateur', key: 'trainerEmail', width: 30 },
    { header: 'Client', key: 'client', width: 25 },
    { header: 'Contact client', key: 'clientContact', width: 25 },
    { header: 'Email client', key: 'clientEmail', width: 30 },
    { header: 'Nb participants', key: 'participantCount', width: 15 },
    { header: 'Nb sessions', key: 'sessionCount', width: 12 },
    { header: 'Mission parent', key: 'parentMission', width: 25 },
    { header: 'Date création', key: 'createdAt', width: 18 },
    { header: 'Dernière MAJ', key: 'updatedAt', width: 18 },
  ];

  const headerRow = missionsSheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF0055A4' }
  };
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

  for (const mission of allMissions) {
    const trainer = mission.trainerId ? usersMap.get(mission.trainerId) : null;
    const client = mission.clientId ? clientsMap.get(mission.clientId) : null;
    const parentMission = mission.parentMissionId 
      ? allMissions.find(m => m.id === mission.parentMissionId)?.reference 
      : null;
    const missionPartCount = allMissionParticipants.filter(mp => mp.missionId === mission.id).length;
    const missionSessionCount = allSessions.filter(s => s.missionId === mission.id).length;

    missionsSheet.addRow({
      reference: mission.reference,
      title: mission.title,
      description: mission.description,
      status: translateStatus(mission.status),
      typology: translateTypology(mission.typology),
      locationType: mission.locationType ? translateLocationType(mission.locationType) : '',
      location: mission.location,
      startDate: formatDate(mission.startDate),
      endDate: formatDate(mission.endDate),
      totalHours: mission.totalHours,
      trainer: trainer ? `${trainer.firstName} ${trainer.lastName}` : '',
      trainerEmail: trainer?.email || '',
      client: client?.name || '',
      clientContact: client?.contactName || '',
      clientEmail: client?.email || '',
      participantCount: missionPartCount,
      sessionCount: missionSessionCount,
      parentMission: parentMission || '',
      createdAt: formatDateTime(mission.createdAt),
      updatedAt: formatDateTime(mission.updatedAt),
    });
  }

  const participantsSheet = workbook.addWorksheet('Participants');
  participantsSheet.columns = [
    { header: 'Mission', key: 'mission', width: 25 },
    { header: 'Prénom', key: 'firstName', width: 20 },
    { header: 'Nom', key: 'lastName', width: 20 },
    { header: 'Email', key: 'email', width: 30 },
    { header: 'Téléphone', key: 'phone', width: 18 },
    { header: 'Entreprise', key: 'company', width: 25 },
    { header: 'Fonction', key: 'function', width: 20 },
    { header: 'Statut', key: 'status', width: 15 },
    { header: 'Convocation envoyée', key: 'convocationSent', width: 18 },
    { header: 'Présence validée', key: 'attendanceValidated', width: 16 },
    { header: 'Date inscription', key: 'registeredAt', width: 18 },
  ];

  const participantsHeader = participantsSheet.getRow(1);
  participantsHeader.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  participantsHeader.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF0055A4' }
  };

  for (const mp of allMissionParticipants) {
    const mission = allMissions.find(m => m.id === mp.missionId);
    const participant = participantsMap.get(mp.participantId);
    if (!participant) continue;

    participantsSheet.addRow({
      mission: mission?.reference || '',
      firstName: participant.firstName,
      lastName: participant.lastName,
      email: participant.email,
      phone: participant.phone,
      company: participant.company,
      function: participant.function,
      status: translateStatus(mp.status),
      convocationSent: mp.convocationSentAt ? formatDateTime(mp.convocationSentAt) : 'Non',
      attendanceValidated: mp.attendanceValidated ? 'Oui' : 'Non',
      registeredAt: formatDateTime(mp.registeredAt),
    });
  }

  const sessionsSheet = workbook.addWorksheet('Sessions');
  sessionsSheet.columns = [
    { header: 'Mission', key: 'mission', width: 25 },
    { header: 'Date', key: 'date', width: 12 },
    { header: 'Heure début', key: 'startTime', width: 12 },
    { header: 'Heure fin', key: 'endTime', width: 12 },
    { header: 'Lieu', key: 'location', width: 25 },
    { header: 'Nb présents', key: 'presentCount', width: 12 },
    { header: 'Nb absents', key: 'absentCount', width: 12 },
  ];

  const sessionsHeader = sessionsSheet.getRow(1);
  sessionsHeader.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  sessionsHeader.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF0055A4' }
  };

  for (const session of allSessions) {
    const mission = allMissions.find(m => m.id === session.missionId);
    const sessionAttendance = allAttendance.filter(a => a.sessionId === session.id);
    const presentCount = sessionAttendance.filter(a => a.isPresent).length;
    const absentCount = sessionAttendance.filter(a => !a.isPresent).length;

    sessionsSheet.addRow({
      mission: mission?.reference || '',
      date: formatDate(session.sessionDate),
      startTime: session.startTime || '',
      endTime: session.endTime || '',
      location: session.location || '',
      presentCount,
      absentCount,
    });
  }

  const statsSheet = workbook.addWorksheet('Statistiques');
  statsSheet.columns = [
    { header: 'Indicateur', key: 'indicator', width: 35 },
    { header: 'Valeur', key: 'value', width: 20 },
  ];

  const statsHeader = statsSheet.getRow(1);
  statsHeader.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  statsHeader.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF0055A4' }
  };

  const stats = [
    { indicator: 'Total missions', value: allMissions.length.toString() },
    { indicator: 'Missions en attente', value: allMissions.filter(m => m.status === 'pending').length.toString() },
    { indicator: 'Missions confirmées', value: allMissions.filter(m => m.status === 'confirmed').length.toString() },
    { indicator: 'Missions en cours', value: allMissions.filter(m => m.status === 'in_progress').length.toString() },
    { indicator: 'Missions terminées', value: allMissions.filter(m => m.status === 'completed').length.toString() },
    { indicator: 'Missions annulées', value: allMissions.filter(m => m.status === 'cancelled').length.toString() },
    { indicator: 'Total participants inscrits', value: allMissionParticipants.length.toString() },
    { indicator: 'Total sessions planifiées', value: allSessions.length.toString() },
    { indicator: 'Total formateurs', value: allUsers.filter(u => u.role === 'formateur' || u.role === 'prestataire').length.toString() },
    { indicator: 'Total clients', value: allClients.length.toString() },
    { indicator: "Date d'extraction", value: format(new Date(), 'dd/MM/yyyy HH:mm', { locale: fr }) },
  ];

  stats.forEach(stat => statsSheet.addRow(stat));

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
