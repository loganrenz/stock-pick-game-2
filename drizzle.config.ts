import type { Config } from 'drizzle-kit';

export default {
  schema: './api-helpers/lib/schema.ts',
  out: './drizzle',
  dialect: 'sqlite',
  dbCredentials: {
    url: process.env.TURSO_DB_URL!,
    token: process.env.TURSO_DB_TOKEN!,
  },
} satisfies Config; 