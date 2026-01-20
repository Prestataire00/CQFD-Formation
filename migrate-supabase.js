const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function runMigrations() {
  const migrationsDir = './migrations';
  const files = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort();
  
  console.log('Migrations à exécuter:', files);
  
  for (const file of files) {
    console.log(`\n--- Exécution de ${file} ---`);
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
    const statements = sql.split('--> statement-breakpoint').map(s => s.trim()).filter(s => s);
    
    for (const statement of statements) {
      try {
        await pool.query(statement);
        console.log('✓ Statement exécuté');
      } catch (err) {
        if (err.code === '42P07' || err.code === '42710') {
          console.log('⊘ Table/contrainte existe déjà, on continue');
        } else {
          console.error('✗ Erreur:', err.message);
        }
      }
    }
  }
  
  await pool.end();
  console.log('\n✓ Migration terminée !');
}

runMigrations().catch(console.error);
