import { drizzle } from 'drizzle-orm/libsql';
import { migrate } from 'drizzle-orm/libsql/migrator';
import { createClient } from '@libsql/client';
import { config } from './config.js';

const client = createClient({
  url: config.database.url,
  authToken: config.database.token,
});

const db = drizzle(client);

async function main() {
  try {
    // Use the same path logic as in index.ts
    const migrationsPath =
      process.env.NODE_ENV === 'production' ? './packages/backend/drizzle' : './drizzle';

    await migrate(db, { migrationsFolder: migrationsPath });
    console.log('Migrations applied successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

main();
