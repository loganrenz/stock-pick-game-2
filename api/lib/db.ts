import { PrismaClient } from '@prisma/client';
import { PrismaLibSQL } from '@prisma/adapter-libsql';

const isProd = process.env.NODE_ENV === 'production';
const dbUrl = process.env.TURSO_DB_URL
const dbToken = process.env.TURSO_DB_TOKEN

if (!dbUrl) {
  throw new Error('Database URL is not defined');
}

if (!dbToken) {
  throw new Error('Database auth token is not defined');
}

// Create the libsql adapter for Prisma
const adapter = new PrismaLibSQL({
  url: dbUrl,
  authToken: dbToken,
});

// Export a single PrismaClient instance for the whole app
console.log('Creating PrismaClient instance with dbUrl:', dbUrl, 'and dbToken:', dbToken)
export const prisma = new PrismaClient({ adapter });
