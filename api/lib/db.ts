import { createClient } from '@libsql/client';
import { PrismaClient } from '@prisma/client';

const isProd = process.env.NODE_ENV === 'production';
const dbUrl = isProd ? process.env.DATABASE_URL_PROD : process.env.DATABASE_URL_DEV;
const dbToken = isProd ? process.env.DATABASE_AUTH_TOKEN_PROD : process.env.DATABASE_AUTH_TOKEN_DEV;

if (!dbUrl) {
  throw new Error('Database URL is not defined');
}

if (!dbToken) {
  throw new Error('Database auth token is not defined');
}

export const libsql = createClient({
  url: dbUrl,
  authToken: dbToken
});

export const prisma = new PrismaClient({
  datasources: {
    db: {
      url: dbUrl
    }
  }
}); 