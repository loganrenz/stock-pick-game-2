import 'dotenv/config';
import { migrate } from 'drizzle-orm/libsql/migrator';
import { db } from './db';

async function main() {
  console.log('Running migration...');
  try {
    await migrate(db, { migrationsFolder: './drizzle' });
    console.log('Migration completed!');
  } catch (err) {
    console.error('Migration failed!');
    console.error(err);
    process.exit(1);
  }
}

main(); 