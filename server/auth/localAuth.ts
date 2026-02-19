import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import type { Express, Request, Response, NextFunction } from 'express';
import session from 'express-session';
import connectPg from 'connect-pg-simple';
import { storage } from '../storage';
import { verifyPassword } from './passwordUtils';
import type { User } from '@shared/schema';

declare global {
  namespace Express {
    interface User {
      id: string;
      email: string | null;
      firstName: string | null;
      lastName: string | null;
      role: string;
      status: string;
    }
  }
}

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.SUPABASE_DATABASE_URL || process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });

  const isProduction = process.env.NODE_ENV === 'production';
  
  return session({
    secret: process.env.SESSION_SECRET || 'cqfd-formation-secret-key',
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    proxy: isProduction,
    cookie: {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: sessionTtl,
    },
  });
}

export function setupLocalAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  // Configure local strategy
  passport.use(new LocalStrategy(
    {
      usernameField: 'email',
      passwordField: 'password',
    },
    async (email, password, done) => {
      try {
        const user = await storage.getUserByEmail(email);

        if (!user) {
          return done(null, false, { message: 'Email ou mot de passe incorrect' });
        }

        if (!user.passwordHash) {
          return done(null, false, { message: 'Compte non configuré pour la connexion locale' });
        }

        if (user.status !== 'ACTIF') {
          return done(null, false, { message: 'Compte désactivé ou supprimé' });
        }

        const isValid = await verifyPassword(password, user.passwordHash);
        if (!isValid) {
          return done(null, false, { message: 'Email ou mot de passe incorrect' });
        }

        return done(null, {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          status: user.status,
        });
      } catch (error) {
        return done(error);
      }
    }
  ));

  // Serialize user to session
  passport.serializeUser((user: Express.User, done) => {
    done(null, user.id);
  });

  // Deserialize user from session
  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await storage.getUser(id);
      if (!user) {
        return done(null, false);
      }
      done(null, {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        status: user.status,
      });
    } catch (error) {
      done(error);
    }
  });
}

// Middleware to check if user is authenticated
export function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated()) {
    // Check if user is still active
    if (req.user?.status !== 'ACTIF') {
      return res.status(403).json({ message: 'Compte désactivé ou supprimé' });
    }
    return next();
  }
  return res.status(401).json({ message: 'Non authentifié' });
}

// Auth routes
export function setupAuthRoutes(app: Express) {
  // Login
  app.post('/api/auth/login', (req: Request, res: Response, next: NextFunction) => {
    passport.authenticate('local', (err: Error | null, user: Express.User | false, info: { message: string }) => {
      if (err) {
        console.error('Login error:', err);
        return res.status(500).json({ message: 'Erreur serveur', error: err.message });
      }
      if (!user) {
        return res.status(401).json({ message: info?.message || 'Authentification échouée' });
      }
      req.logIn(user, (loginErr) => {
        if (loginErr) {
          return res.status(500).json({ message: 'Erreur de connexion' });
        }
        // Get full user data (without passwordHash)
        storage.getUser(user.id).then((fullUser) => {
          if (fullUser) {
            const { passwordHash, ...userWithoutPassword } = fullUser as User & { passwordHash?: string };
            return res.json({ user: userWithoutPassword });
          }
          return res.json({ user });
        });
      });
    })(req, res, next);
  });

  // Logout
  app.post('/api/auth/logout', (req: Request, res: Response) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: 'Erreur de déconnexion' });
      }
      req.session.destroy((sessionErr) => {
        if (sessionErr) {
          return res.status(500).json({ message: 'Erreur de destruction de session' });
        }
        res.clearCookie('connect.sid');
        return res.json({ success: true });
      });
    });
  });

  // Get current user
  app.get('/api/auth/me', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const user = await storage.getUser(req.user!.id);
      if (!user) {
        return res.status(404).json({ message: 'Utilisateur non trouvé' });
      }
      const { passwordHash, ...userWithoutPassword } = user as User & { passwordHash?: string };
      return res.json(userWithoutPassword);
    } catch (error) {
      return res.status(500).json({ message: 'Erreur serveur' });
    }
  });

  // Forgot password - request reset token
  app.post('/api/auth/forgot-password', async (req: Request, res: Response) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ message: 'Email requis' });
      }

      const user = await storage.getUserByEmail(email);

      // Always return success to prevent email enumeration
      if (!user) {
        console.log(`[Auth] Password reset requested for unknown email: ${email}`);
        return res.json({ message: 'Si cette adresse existe, un email de reinitialisation a ete envoye.' });
      }

      // Create reset token
      const resetToken = await storage.createPasswordResetToken(user.id);

      // Send email
      const { sendPasswordResetEmail } = await import('../email');
      const baseUrl = process.env.APP_URL || `${req.protocol}://${req.get('host')}`;
      const userName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Utilisateur';

      await sendPasswordResetEmail(user.email!, userName, resetToken.token, baseUrl);

      console.log(`[Auth] Password reset email sent to: ${email}`);
      return res.json({ message: 'Si cette adresse existe, un email de reinitialisation a ete envoye.' });
    } catch (error) {
      console.error('[Auth] Error in forgot-password:', error);
      return res.status(500).json({ message: 'Erreur serveur' });
    }
  });

  // Reset password - verify token and set new password
  app.post('/api/auth/reset-password', async (req: Request, res: Response) => {
    try {
      const { token, password } = req.body;

      if (!token || !password) {
        return res.status(400).json({ message: 'Token et mot de passe requis' });
      }

      if (password.length < 6) {
        return res.status(400).json({ message: 'Le mot de passe doit contenir au moins 6 caracteres' });
      }

      // Get and validate token
      const resetToken = await storage.getPasswordResetToken(token);

      if (!resetToken) {
        return res.status(400).json({ message: 'Lien invalide ou expire' });
      }

      if (resetToken.used) {
        return res.status(400).json({ message: 'Ce lien a deja ete utilise' });
      }

      if (new Date() > new Date(resetToken.expiresAt)) {
        return res.status(400).json({ message: 'Ce lien a expire' });
      }

      // Update password
      const bcrypt = await import('bcrypt');
      const passwordHash = await bcrypt.hash(password, 10);

      await storage.updateUser(resetToken.userId, { passwordHash } as any);

      // Mark token as used
      await storage.markTokenAsUsed(token);

      console.log(`[Auth] Password reset successful for user: ${resetToken.userId}`);
      return res.json({ message: 'Mot de passe reinitialise avec succes' });
    } catch (error) {
      console.error('[Auth] Error in reset-password:', error);
      return res.status(500).json({ message: 'Erreur serveur' });
    }
  });

  // Verify reset token (check if valid before showing form)
  app.get('/api/auth/verify-reset-token', async (req: Request, res: Response) => {
    try {
      const { token } = req.query;

      if (!token || typeof token !== 'string') {
        return res.status(400).json({ valid: false, message: 'Token requis' });
      }

      const resetToken = await storage.getPasswordResetToken(token);

      if (!resetToken) {
        return res.json({ valid: false, message: 'Lien invalide ou expire' });
      }

      if (resetToken.used) {
        return res.json({ valid: false, message: 'Ce lien a deja ete utilise' });
      }

      if (new Date() > new Date(resetToken.expiresAt)) {
        return res.json({ valid: false, message: 'Ce lien a expire' });
      }

      return res.json({ valid: true });
    } catch (error) {
      console.error('[Auth] Error in verify-reset-token:', error);
      return res.status(500).json({ valid: false, message: 'Erreur serveur' });
    }
  });
}
