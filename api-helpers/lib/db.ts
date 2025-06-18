import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import * as schema from './schema.js';
import { config } from './config.js';

if (!config.database.url) {
  throw new Error('Database URL is required');
}

// For SQLite local database, we don't need a token
const isLocalDatabase = config.database.url.startsWith('file:');
const client = createClient({
  url: config.database.url,
  authToken: isLocalDatabase ? undefined : config.database.token,
});

export const db = drizzle(client, { schema });