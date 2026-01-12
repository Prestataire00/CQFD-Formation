import { sql } from "drizzle-orm";
import { index, jsonb, pgTable, timestamp, varchar, text, integer, boolean } from "drizzle-orm/pg-core";

// Session storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)]
);

// User roles for CQFD Formation
export type UserRole = 'admin' | 'formateur' | 'prestataire';

// User status
export type UserStatus = 'ACTIF' | 'INACTIF' | 'SUPPRIME';

// User storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  passwordHash: varchar("password_hash"),
  profileImageUrl: varchar("profile_image_url"),
  role: text("role").$type<UserRole>().default("formateur").notNull(),
  status: text("status").$type<UserStatus>().default("ACTIF").notNull(),
  // Additional fields for trainers/subcontractors
  phone: varchar("phone"),
  address: text("address"),
  siret: varchar("siret"), // For prestataires (subcontractors)
  specialties: jsonb("specialties").$type<string[]>(), // Training domains
  dailyRate: integer("daily_rate"), // in cents, for prestataires
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
