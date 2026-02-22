import { google } from 'googleapis';
import nodemailer from 'nodemailer';
import { storage } from '../storage';
import { db } from '../db';
import { users } from '@shared/schema';
import { eq } from 'drizzle-orm';

const OAuth2 = google.auth.OAuth2;

function getOAuth2Client() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;
  return new OAuth2(clientId, clientSecret);
}

/**
 * Refresh a user's Google access token using their refresh token
 */
export async function refreshGoogleToken(userId: string): Promise<string | null> {
  try {
    const user = await storage.getUser(userId);
    if (!user?.googleRefreshToken) {
      console.log(`[Gmail] No refresh token for user ${userId}`);
      return null;
    }

    const oauth2Client = getOAuth2Client();
    if (!oauth2Client) return null;

    oauth2Client.setCredentials({ refresh_token: user.googleRefreshToken });
    const { credentials } = await oauth2Client.refreshAccessToken();

    if (credentials.access_token) {
      await storage.updateUser(userId, {
        googleAccessToken: credentials.access_token,
      } as any);
      return credentials.access_token;
    }
    return null;
  } catch (error) {
    console.error(`[Gmail] Failed to refresh token for user ${userId}:`, error);
    return null;
  }
}

/**
 * Find admin user with Google connected and return a nodemailer transport using Gmail API
 */
export async function getGmailTransport(): Promise<nodemailer.Transporter | null> {
  try {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    if (!clientId || !clientSecret) return null;

    // Find admin with Google account connected
    const allUsers = await storage.getUsers();
    const adminWithGoogle = allUsers.find(
      (u) => u.role === 'admin' && u.googleRefreshToken
    );

    if (!adminWithGoogle) {
      console.log('[Gmail] No admin with Google account connected');
      return null;
    }

    // Refresh the token
    const accessToken = await refreshGoogleToken(adminWithGoogle.id);
    if (!accessToken) return null;

    const transport = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        type: 'OAuth2',
        user: adminWithGoogle.email!,
        clientId,
        clientSecret,
        refreshToken: adminWithGoogle.googleRefreshToken!,
        accessToken,
      },
    } as any);

    return transport;
  } catch (error) {
    console.error('[Gmail] Failed to create Gmail transport:', error);
    return null;
  }
}
