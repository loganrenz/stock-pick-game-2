import type { Config } from 'drizzle-kit';

export default {
  schema: './api/lib/schema.ts',
  out: './drizzle',
  dialect: 'sqlite',
  dbCredentials: {
    url: process.env.TURSO_DB_URL!,
  },
} satisfies Config; 