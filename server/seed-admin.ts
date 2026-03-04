import { db } from './db';
import { users } from '@shared/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { supabaseAdmin } from './supabaseAdmin';

export async function seedDefaultAdmin() {
  try {
    const existingAdmins = await db.select().from(users).where(eq(users.role, 'admin'));
    const activeAdmins = existingAdmins.filter(a => a.status === 'ACTIF');
    
    if (activeAdmins.length === 0) {
      console.log('[seed-admin] Aucun admin actif trouvé, création/réactivation d\'un admin...');
      
      const defaultEmail = process.env.DEFAULT_ADMIN_EMAIL || 'admin@cqfd-formation.fr';
      const defaultPassword = process.env.DEFAULT_ADMIN_PASSWORD || 'Admin2024!';
      const passwordHash = await bcrypt.hash(defaultPassword, 12);

      const existingUser = await db.select().from(users).where(eq(users.email, defaultEmail)).limit(1);

      if (existingUser.length > 0) {
        await db.update(users)
          .set({
            status: 'ACTIF',
            role: 'admin',
            passwordHash,
            firstName: 'Admin',
            lastName: 'CQFD',
          })
          .where(eq(users.email, defaultEmail));
        console.log('[seed-admin] Admin existant réactivé avec nouveau mot de passe');
      } else {
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
        console.log('[seed-admin] Nouvel admin créé');
      }
      
      if (supabaseAdmin) {
        try {
          const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers();
          const authUser = authUsers?.users?.find((u) => u.email === defaultEmail);
          if (authUser) {
            await supabaseAdmin.auth.admin.updateUserById(authUser.id, { password: defaultPassword });
          } else {
            await supabaseAdmin.auth.admin.createUser({
              email: defaultEmail,
              password: defaultPassword,
              email_confirm: true,
              user_metadata: { firstName: 'Admin', lastName: 'CQFD', role: 'admin' },
            });
          }
          console.log('[seed-admin] Admin synchronisé dans Supabase Auth');
        } catch (err) {
          console.error('[seed-admin] Erreur synchro Supabase Auth:', err);
        }
      }

      console.log(`[seed-admin] Email: ${defaultEmail}`);
      console.log('[seed-admin] IMPORTANT: Changez ce mot de passe après la première connexion!');
    } else {
      console.log('[seed-admin] Un admin actif existe déjà, pas de modification');
    }
  } catch (error) {
    console.error('[seed-admin] Erreur lors de la création de l\'admin par défaut:', error);
  }
}
