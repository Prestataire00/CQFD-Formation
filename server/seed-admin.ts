import { db } from './db';
import { users } from '@shared/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { supabaseAdmin } from './supabaseAdmin';

export async function seedDefaultAdmin() {
  try {
    // Ne créer un admin par défaut que si la table users est COMPLETEMENT vide
    // (aucun utilisateur n'a jamais été créé)
    const allUsers = await db.select().from(users);

    if (allUsers.length === 0) {
      console.log('[seed-admin] Base vide, création d\'un admin par défaut...');

      const defaultEmail = process.env.DEFAULT_ADMIN_EMAIL || 'admin@cqfd-formation.fr';
      const defaultPassword = process.env.DEFAULT_ADMIN_PASSWORD || 'Admin2024!';
      const passwordHash = await bcrypt.hash(defaultPassword, 12);

      await db.insert(users).values({
        id: randomUUID(),
        email: defaultEmail,
        passwordHash,
        firstName: 'Admin',
        lastName: 'CQFD',
        role: 'admin',
        status: 'ACTIF',
        currentLevel: 1,
        totalXP: 0,
        streakDays: 0,
      });

      if (supabaseAdmin) {
        try {
          await supabaseAdmin.auth.admin.createUser({
            email: defaultEmail,
            password: defaultPassword,
            email_confirm: true,
            user_metadata: { firstName: 'Admin', lastName: 'CQFD', role: 'admin' },
          });
          console.log('[seed-admin] Admin créé dans Supabase Auth');
        } catch (err) {
          console.error('[seed-admin] Erreur création Supabase Auth:', err);
        }
      }

      console.log(`[seed-admin] Email: ${defaultEmail}`);
      console.log('[seed-admin] IMPORTANT: Changez ce mot de passe après la première connexion!');
    } else {
      console.log('[seed-admin] Des utilisateurs existent déjà, pas de seed');
    }
  } catch (error) {
    console.error('[seed-admin] Erreur lors de la création de l\'admin par défaut:', error);
  }
}
