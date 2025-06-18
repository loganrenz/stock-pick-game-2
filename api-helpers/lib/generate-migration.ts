import 'dotenv/config';
console.log('TURSO_DB_URL:', process.env.TURSO_DB_URL);
console.log('TURSO_DB_TOKEN:', process.env.TURSO_DB_TOKEN);
import { drizzle } from 'drizzle-orm/libsql';
import { migrate } from 'drizzle-orm/libsql/migrator';
import { createClient } from '@libsql/client';
import * as schema from './schema.js';
import { config } from './config.js';

const turso = createClient({
  url: config.database.url!,
  authToken: config.database.token,
});

const db = drizzle(turso, { schema });

async function main() {
  console.log('Generating migration...');
  
  await migrate(db, { migrationsFolder: './drizzle' });
  
  console.log('Migration generated!');
}

main().catch((err) => {
  console.error('Migration generation failed!');
  console.error(err);
  process.exit(1);
}); 