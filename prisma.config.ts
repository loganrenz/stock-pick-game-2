import path from 'node:path';
import { defineConfig } from 'prisma/config';
import { PrismaLibSQL } from '@prisma/adapter-libsql';
import 'dotenv/config';

// Define the required environment variables
const dbUrl = process.env.TURSO_DB_URL
const dbToken = process.env.TURSO_DB_TOKEN

if (!dbUrl) throw new Error('TURSO_DATABASE_URL is not set');
if (!dbToken) throw new Error('TURSO_AUTH_TOKEN is not set');

export default defineConfig({
  earlyAccess: true,
  schema: path.join('prisma', 'schema.prisma'),
  migrate: {
    async adapter() {
      return new PrismaLibSQL({
        url: dbUrl,
        authToken: dbToken,
      });
    },
  },
}); 