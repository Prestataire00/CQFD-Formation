import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

const { Pool } = pg;

const databaseUrl = process.env.NEON_DATABASE_URL || process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({ connectionString: databaseUrl });
export const db = drizzle(pool, { schema });

export async function ensureSchemaSync() {
  try {
    const cols = await pool.query(
      `SELECT column_name FROM information_schema.columns WHERE table_name = 'mission_steps' AND table_schema = 'public'`
    );
    const colNames = cols.rows.map((r: any) => r.column_name);
    console.log('[db] mission_steps columns:', colNames.join(', '));
    if (!colNames.includes('late_date')) {
      await pool.query(`ALTER TABLE mission_steps ADD COLUMN late_date TIMESTAMP`);
      console.log('[db] Added missing column late_date to mission_steps');
    }
    if (!colNames.includes('link')) {
      await pool.query(`ALTER TABLE mission_steps ADD COLUMN link TEXT`);
      console.log('[db] Added missing column link to mission_steps');
    }
    if (!colNames.includes('trainer_comment')) {
      await pool.query(`ALTER TABLE mission_steps ADD COLUMN trainer_comment TEXT`);
      console.log('[db] Added missing column trainer_comment to mission_steps');
    }
    if (!colNames.includes('trainer_comment_author_id')) {
      await pool.query(`ALTER TABLE mission_steps ADD COLUMN trainer_comment_author_id VARCHAR REFERENCES users(id)`);
      console.log('[db] Added missing column trainer_comment_author_id to mission_steps');
    }
    if (!colNames.includes('trainer_comment_updated_at')) {
      await pool.query(`ALTER TABLE mission_steps ADD COLUMN trainer_comment_updated_at TIMESTAMP`);
      console.log('[db] Added missing column trainer_comment_updated_at to mission_steps');
    }
    // Sync participants table
    const partCols = await pool.query(
      `SELECT column_name FROM information_schema.columns WHERE table_name = 'participants' AND table_schema = 'public'`
    );
    const partColNames = partCols.rows.map((r: any) => r.column_name);
    const participantColumns: Record<string, string> = {
      address: 'TEXT',
      company: 'TEXT',
      function: 'TEXT',
      client_id: 'INTEGER',
      phone: 'TEXT',
    };
    for (const [col, type] of Object.entries(participantColumns)) {
      if (!partColNames.includes(col)) {
        await pool.query(`ALTER TABLE participants ADD COLUMN IF NOT EXISTS ${col} ${type}`);
        console.log(`[db] Added missing column ${col} to participants`);
      }
    }

    // Sync clients table
    const clientCols = await pool.query(
      `SELECT column_name FROM information_schema.columns WHERE table_name = 'clients' AND table_schema = 'public'`
    );
    const clientColNames = clientCols.rows.map((r: any) => r.column_name);
    const clientColumns: Record<string, string> = {
      address: 'TEXT',
      city: 'TEXT',
      postal_code: 'TEXT',
      billing_address: 'TEXT',
      billing_postal_code: 'TEXT',
      billing_city: 'TEXT',
      training_address: 'TEXT',
      training_postal_code: 'TEXT',
      training_city: 'TEXT',
      origine: 'TEXT',
      social_media: 'TEXT',
      demand: 'TEXT',
      type: 'TEXT',
      contract_status: "TEXT DEFAULT 'prospect'",
      contract_amount: 'INTEGER DEFAULT 0',
      assigned_trainer_id: 'TEXT',
    };
    for (const [col, type] of Object.entries(clientColumns)) {
      if (!clientColNames.includes(col)) {
        await pool.query(`ALTER TABLE clients ADD COLUMN ${col} ${type}`);
        console.log(`[db] Added missing column ${col} to clients`);
      }
    }

  } catch (e: any) {
    console.error('[db] Schema sync error:', e.message);
  }
}
