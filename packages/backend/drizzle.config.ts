import 'dotenv/config';
import type { Config } from 'drizzle-kit';

export default {
  schema: './src/lib/schema.ts',
  out: './drizzle',
  dialect: 'sqlite',
  driver: 'libsql',
  dbCredentials: {
    url: process.env.DATABASE_URL || 'file:../../data/stonx.db',
    authToken: process.env.DATABASE_AUTH_TOKEN,
  },
} satisfies Config;
