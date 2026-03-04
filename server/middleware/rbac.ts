import { Request, Response, NextFunction } from 'express';
import { storage } from '../storage';
import type { UserRole } from '@shared/models/auth';

// Extend Express Request to include user role info
declare global {
  namespace Express {
    interface Request {
      userRole?: UserRole;
      userId?: string;
      userDetails?: {
        id: string;
        email: string | null;
        firstName: string | null;
        lastName: string | null;
        role: UserRole;
      };
    }
  }
}

// Permission definitions by role
export const permissions = {
  // Missions
  'missions:read': ['admin', 'formateur', 'prestataire'] as UserRole[],
  'missions:read-all': ['admin'] as UserRole[],
  'missions:create': ['admin'] as UserRole[],
  'missions:update': ['admin'] as UserRole[],
  'missions:delete': ['admin'] as UserRole[],
  'missions:assign-trainer': ['admin'] as UserRole[],

  // Clients
  'clients:read': ['admin', 'formateur', 'prestataire'] as UserRole[],
  'clients:create': ['admin'] as UserRole[],
  'clients:update': ['admin'] as UserRole[],
  'clients:delete': ['admin'] as UserRole[],

  // Training Programs
  'programs:read': ['admin', 'formateur', 'prestataire'] as UserRole[],
  'programs:create': ['admin'] as UserRole[],
  'programs:update': ['admin'] as UserRole[],
  'programs:delete': ['admin'] as UserRole[],

  // Participants
  'participants:read': ['admin', 'formateur', 'prestataire'] as UserRole[],
  'participants:create': ['admin'] as UserRole[],
  'participants:update': ['admin', 'formateur', 'prestataire'] as UserRole[],

  // Attendance
  'attendance:read': ['admin', 'formateur', 'prestataire'] as UserRole[],
  'attendance:validate': ['admin', 'formateur', 'prestataire'] as UserRole[],

  // Documents
  'documents:read': ['admin', 'formateur', 'prestataire'] as UserRole[],
  'documents:upload': ['admin', 'formateur', 'prestataire'] as UserRole[],
  'documents:generate': ['admin'] as UserRole[],
  'documents:delete': ['admin'] as UserRole[],

  // Invoices
  'invoices:read-own': ['prestataire'] as UserRole[],
  'invoices:read-all': ['admin'] as UserRole[],
  'invoices:submit': ['prestataire'] as UserRole[],
  'invoices:approve': ['admin'] as UserRole[],
  'invoices:reject': ['admin'] as UserRole[],

  // Users
  'users:read': ['admin'] as UserRole[],
  'users:create': ['admin'] as UserRole[],
  'users:update': ['admin'] as UserRole[],
  'users:delete': ['admin'] as UserRole[],

  // Reports
  'reports:read': ['admin'] as UserRole[],

  // Evaluations
  'evaluations:read': ['admin', 'formateur', 'prestataire'] as UserRole[],
  'evaluations:create': ['admin', 'formateur', 'prestataire'] as UserRole[],
} as const;

export type Permission = keyof typeof permissions;

/**
 * Middleware to require a specific permission
 * Checks if the authenticated user has the required permission based on their role
 */
export function requirePermission(permission: Permission) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Check if user is authenticated
      const user = req.user;
      if (!user || !user.id) {
        return res.status(401).json({ message: 'Non authentifié' });
      }

      // Check if user is active (status from session)
      if (user.status !== 'ACTIF') {
        return res.status(403).json({ message: 'Compte désactivé ou supprimé' });
      }

      // Check if user's role has the required permission
      const allowedRoles = permissions[permission];
      if (!allowedRoles.includes(user.role as UserRole)) {
        return res.status(403).json({
          message: 'Accès refusé',
          requiredPermission: permission,
          userRole: user.role
        });
      }

      // Attach user info to request for use in route handlers
      req.userRole = user.role as UserRole;
      req.userId = user.id;
      req.userDetails = {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role as UserRole,
      };

      next();
    } catch (error) {
      console.error('RBAC middleware error:', error);
      return res.status(500).json({ message: 'Erreur interne du serveur' });
    }
  };
}

/**
 * Middleware to require specific roles
 * Simpler alternative when you just need to check roles without fine-grained permissions
 */
export function requireRole(...roles: UserRole[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user;
      if (!user || !user.id) {
        return res.status(401).json({ message: 'Non authentifié' });
      }

      if (user.status !== 'ACTIF') {
        return res.status(403).json({ message: 'Compte désactivé ou supprimé' });
      }

      if (!roles.includes(user.role as UserRole)) {
        return res.status(403).json({
          message: 'Accès refusé',
          requiredRoles: roles,
          userRole: user.role
        });
      }

      req.userRole = user.role as UserRole;
      req.userId = user.id;
      req.userDetails = {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role as UserRole,
      };

      next();
    } catch (error) {
      console.error('Role check middleware error:', error);
      return res.status(500).json({ message: 'Erreur interne du serveur' });
    }
  };
}

/**
 * Convenience middleware shortcuts
 */
export const requireAdmin = requireRole('admin');
export const requireTrainer = requireRole('admin', 'formateur', 'prestataire');
export const requireSubcontractor = requireRole('admin', 'prestataire');

/**
 * Helper to check if a user has a specific permission
 * Useful for conditional logic in route handlers
 */
export function hasPermission(role: UserRole, permission: Permission): boolean {
  const allowedRoles = permissions[permission];
  return allowedRoles.includes(role);
}

/**
 * Helper to check if user can access a specific mission
 * Admins can access all, trainers/subcontractors only their assigned missions
 */
export async function canAccessMission(userId: string, userRole: UserRole, missionId: number): Promise<boolean> {
  if (userRole === 'admin') {
    return true;
  }

  // For formateurs and prestataires, check if they are assigned to the mission
  const mission = await storage.getMission(missionId);
  if (!mission) {
    return false;
  }

  return mission.trainerId === userId;
}

/**
 * Helper to check if user can access a specific invoice
 * Admins can access all, prestataires only their own invoices
 */
export async function canAccessInvoice(userId: string, userRole: UserRole, invoiceId: number): Promise<boolean> {
  if (userRole === 'admin') {
    return true;
  }

  if (userRole === 'prestataire') {
    const invoice = await storage.getInvoice(invoiceId);
    if (!invoice) {
      return false;
    }
    return invoice.userId === userId;
  }

  return false;
}
