import { google } from 'googleapis';
import { storage } from '../storage';
import { refreshGoogleToken } from './gmail';

const OAuth2 = google.auth.OAuth2;

function getOAuth2Client() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;
  return new OAuth2(clientId, clientSecret);
}

// Color IDs in Google Calendar (1-11)
const STATUS_COLORS: Record<string, string> = {
  draft: '8',       // graphite
  confirmed: '2',   // green
  in_progress: '5', // banana yellow
  completed: '10',  // basil green
  cancelled: '11',  // tomato red
};

/**
 * Sync a mission to Google Calendar (create or update)
 */
export async function syncMissionToCalendar(
  missionId: number,
  adminUserId: string
): Promise<string | null> {
  try {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    if (!clientId || !clientSecret) return null;

    const admin = await storage.getUser(adminUserId);
    if (!admin?.googleRefreshToken) {
      console.log('[Calendar] Admin has no Google refresh token');
      return null;
    }

    const accessToken = await refreshGoogleToken(adminUserId);
    if (!accessToken) return null;

    const mission = await storage.getMission(missionId);
    if (!mission) return null;

    // Get client info
    let clientName = '';
    if (mission.clientId) {
      const client = await storage.getClient(mission.clientId);
      clientName = client?.name || '';
    }

    // Get trainer info
    let trainerName = '';
    if (mission.trainerId) {
      const trainer = await storage.getUser(mission.trainerId);
      if (trainer) {
        trainerName = `${trainer.firstName || ''} ${trainer.lastName || ''}`.trim();
      }
    }

    // Build event
    const startDate = mission.startDate || new Date();
    const endDate = mission.startDate || new Date();

    const description = [
      clientName ? `Client : ${clientName}` : '',
      trainerName ? `Formateur : ${trainerName}` : '',
      mission.typology ? `Type : ${mission.typology}` : '',
      mission.locationType ? `Modalite : ${mission.locationType}` : '',
      mission.description || '',
    ].filter(Boolean).join('\n');

    const event: any = {
      summary: mission.title || `Mission #${mission.id}`,
      description,
      start: {
        dateTime: new Date(startDate).toISOString(),
        timeZone: 'Europe/Paris',
      },
      end: {
        dateTime: new Date(endDate).toISOString(),
        timeZone: 'Europe/Paris',
      },
      colorId: STATUS_COLORS[mission.status] || '1',
    };

    if (mission.location && mission.locationType !== 'distanciel') {
      event.location = mission.location;
    }

    const oauth2Client = getOAuth2Client()!;
    oauth2Client.setCredentials({
      access_token: accessToken,
      refresh_token: admin.googleRefreshToken,
    });

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    let eventId = mission.googleCalendarEventId;

    if (eventId) {
      // Update existing event
      try {
        await calendar.events.update({
          calendarId: 'primary',
          eventId,
          requestBody: event,
        });
        console.log(`[Calendar] Updated event ${eventId} for mission ${missionId}`);
      } catch (updateError: any) {
        if (updateError.code === 404) {
          // Event was deleted from Calendar, create new one
          eventId = null;
        } else {
          throw updateError;
        }
      }
    }

    if (!eventId) {
      // Create new event
      const created = await calendar.events.insert({
        calendarId: 'primary',
        requestBody: event,
      });
      eventId = created.data.id || null;
      console.log(`[Calendar] Created event ${eventId} for mission ${missionId}`);
    }

    // Save event ID to mission
    if (eventId) {
      await storage.updateMission(missionId, { googleCalendarEventId: eventId } as any);
    }

    return eventId;
  } catch (error) {
    console.error(`[Calendar] Failed to sync mission ${missionId}:`, error);
    return null;
  }
}

/**
 * Delete a mission's event from Google Calendar
 */
export async function deleteMissionFromCalendar(
  missionId: number,
  adminUserId: string
): Promise<boolean> {
  try {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    if (!clientId || !clientSecret) return false;

    const mission = await storage.getMission(missionId);
    if (!mission?.googleCalendarEventId) return false;

    const admin = await storage.getUser(adminUserId);
    if (!admin?.googleRefreshToken) return false;

    const accessToken = await refreshGoogleToken(adminUserId);
    if (!accessToken) return false;

    const oauth2Client = getOAuth2Client()!;
    oauth2Client.setCredentials({
      access_token: accessToken,
      refresh_token: admin.googleRefreshToken,
    });

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    await calendar.events.delete({
      calendarId: 'primary',
      eventId: mission.googleCalendarEventId,
    });

    await storage.updateMission(missionId, { googleCalendarEventId: null } as any);
    console.log(`[Calendar] Deleted event for mission ${missionId}`);
    return true;
  } catch (error: any) {
    if (error.code === 404) {
      // Event already deleted
      await storage.updateMission(missionId, { googleCalendarEventId: null } as any);
      return true;
    }
    console.error(`[Calendar] Failed to delete event for mission ${missionId}:`, error);
    return false;
  }
}

/**
 * Find admin user with Google connected
 */
export async function getGoogleAdminUserId(): Promise<string | null> {
  const allUsers = await storage.getUsers();
  const admin = allUsers.find((u) => u.role === 'admin' && u.googleRefreshToken);
  return admin?.id || null;
}
