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
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });

  return session({
    secret: process.env.SESSION_SECRET || 'cqfd-formation-secret-key',
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
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
}
