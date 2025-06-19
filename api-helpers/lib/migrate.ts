import 'dotenv/config';
import { migrate } from 'drizzle-orm/libsql/migrator';
import { db } from './db.js';
import { config } from './config.js';

console.log('[MIGRATE] TURSO_DB_URL:', config.database.url);

async function main() {
  try {
    await migrate(db, { migrationsFolder: './drizzle' });
    console.log('Migrations applied successfully!');
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

export default main;

if (import.meta.url === `file://${process.argv[1]}` || import.meta.url === process.argv[1]) {
  main();
}
