import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import type { Express, Request, Response } from 'express';
import { storage } from '../storage';

const GOOGLE_SCOPES = [
  'openid',
  'email',
  'profile',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/calendar',
];

export function setupGoogleAuth(app: Express) {
  const clientID = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientID || !clientSecret) {
    console.log('[GoogleAuth] GOOGLE_CLIENT_ID ou GOOGLE_CLIENT_SECRET non configuré, Google OAuth désactivé');
    return;
  }

  const callbackURL = (process.env.APP_URL || '') + '/api/auth/google/callback';

  passport.use(
    new GoogleStrategy(
      {
        clientID,
        clientSecret,
        callbackURL,
        accessType: 'offline',
        prompt: 'consent',
      } as any,
      async (accessToken: string, refreshToken: string, profile: any, done: any) => {
        try {
          const googleId = profile.id;
          const email = profile.emails?.[0]?.value;
          const firstName = profile.name?.givenName || '';
          const lastName = profile.name?.familyName || '';
          const profileImageUrl = profile.photos?.[0]?.value || null;

          // 1. Check by googleId
          let user = await storage.getUserByGoogleId(googleId);
          if (user) {
            // Update tokens
            await storage.updateUser(user.id, {
              googleAccessToken: accessToken,
              googleRefreshToken: refreshToken || user.googleRefreshToken,
              profileImageUrl: profileImageUrl || user.profileImageUrl,
            } as any);
            user = await storage.getUser(user.id);
            return done(null, {
              id: user!.id,
              email: user!.email,
              firstName: user!.firstName,
              lastName: user!.lastName,
              role: user!.role,
              status: user!.status,
            });
          }

          // 2. Check by email (link to existing account)
          if (email) {
            user = await storage.getUserByEmail(email);
            if (user) {
              await storage.updateUser(user.id, {
                googleId,
                googleAccessToken: accessToken,
                googleRefreshToken: refreshToken || null,
                profileImageUrl: profileImageUrl || user.profileImageUrl,
              } as any);
              user = await storage.getUser(user.id);
              return done(null, {
                id: user!.id,
                email: user!.email,
                firstName: user!.firstName,
                lastName: user!.lastName,
                role: user!.role,
                status: user!.status,
              });
            }
          }

          // 3. Create new user
          const newUser = await storage.createUser(
            {
              email: email || null,
              firstName,
              lastName,
              profileImageUrl,
              googleId,
              googleAccessToken: accessToken,
              googleRefreshToken: refreshToken || null,
              role: 'subcontractor',
              status: 'ACTIF',
            } as any,
            '' // no password for Google-only accounts
          );

          return done(null, {
            id: newUser.id,
            email: newUser.email,
            firstName: newUser.firstName,
            lastName: newUser.lastName,
            role: newUser.role,
            status: newUser.status,
          });
        } catch (error) {
          console.error('[GoogleAuth] Strategy error:', error);
          return done(error);
        }
      }
    )
  );
}

export function setupGoogleAuthRoutes(app: Express) {
  const clientID = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  // Status endpoint (always available)
  app.get('/api/auth/google/status', (req: Request, res: Response) => {
    res.json({
      enabled: !!(clientID && clientSecret),
    });
  });

  if (!clientID || !clientSecret) {
    return;
  }

  // Initiate Google OAuth
  app.get(
    '/api/auth/google',
    passport.authenticate('google', {
      scope: GOOGLE_SCOPES,
      accessType: 'offline',
      prompt: 'consent',
    } as any)
  );

  // Google OAuth callback
  app.get(
    '/api/auth/google/callback',
    passport.authenticate('google', {
      failureRedirect: '/login?error=google_auth_failed',
    }),
    (req: Request, res: Response) => {
      // Successful authentication, redirect to dashboard
      res.redirect('/');
    }
  );
}
