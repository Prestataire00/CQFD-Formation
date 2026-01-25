import { db } from './db';
import { users } from '@shared/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';

export async function seedDefaultAdmin() {
  try {
    const existingAdmins = await db.select().from(users).where(eq(users.role, 'admin')).limit(1);
    
    if (existingAdmins.length === 0) {
      console.log('[seed-admin] Aucun admin trouvé, création d\'un admin par défaut...');
      
      const defaultPassword = 'admin123';
      const passwordHash = await bcrypt.hash(defaultPassword, 12);
      
      await db.insert(users).values({
        id: randomUUID(),
        email: 'admin@cqfd-formation.fr',
        passwordHash,
        firstName: 'Admin',
        lastName: 'CQFD',
        role: 'admin',
        status: 'ACTIF',
        currentLevel: 1,
        totalXP: 0,
        streakDays: 0,
      });
      
      console.log('[seed-admin] Admin par défaut créé avec succès');
      console.log('[seed-admin] Email: admin@cqfd-formation.fr');
      console.log('[seed-admin] Mot de passe: admin123');
      console.log('[seed-admin] IMPORTANT: Changez ce mot de passe immédiatement après la première connexion!');
    } else {
      console.log('[seed-admin] Un admin existe déjà, pas de création nécessaire');
    }
  } catch (error) {
    console.error('[seed-admin] Erreur lors de la création de l\'admin par défaut:', error);
  }
}
