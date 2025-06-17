import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import * as schema from './schema.js';

if (!process.env.TURSO_DB_URL) {
  throw new Error('TURSO_DB_URL is required');
}

if (!process.env.TURSO_DB_TOKEN) {
  throw new Error('TURSO_DB_TOKEN is required');
}

const client = createClient({
  url: process.env.TURSO_DB_URL,
  authToken: process.env.TURSO_DB_TOKEN,
});

export const db = drizzle(client, { schema });