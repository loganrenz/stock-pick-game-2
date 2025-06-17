import 'dotenv/config';
import { migrate } from 'drizzle-orm/libsql/migrator';
import { db } from '../api/lib/db.js';

export default async function globalSetup() {
  // Set test database URL and token
  process.env.TURSO_DB_URL = process.env.TURSO_TEST_DB_URL || 'libsql://stockpickgame-test-loganrenz.aws-us-east-1.turso.io';
  process.env.TURSO_DB_TOKEN = process.env.TURSO_TEST_DB_TOKEN || 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3NTAxOTA2ODgsImlkIjoiZDQxNjU0ZjgtNWMyNi00MDFkLWIxMTctMTJhNmVjNWQ4YWQ1IiwicmlkIjoiZmI2MDExYzYtOGIzNS00MDc2LWFkZGQtMTA0YWYzZjgxODJmIn0.mDGEe2AE7TIDfg6CNIlfwyFdeczNBtHWu4zIdQVaEXaemG1es_bpL1xFcRuTAJ7IMel6emG7N5zQSIQIzsGBBg';

  if (!process.env.TURSO_DB_URL || !process.env.TURSO_DB_TOKEN) {
    throw new Error('TURSO_TEST_DB_URL and TURSO_TEST_DB_TOKEN must be set in .env.test');
  }

  console.log('Running migrations...');
  await migrate(db, { migrationsFolder: './drizzle' });
  console.log('Migrations completed');

  // Seed test data
  console.log('Seeding test data...');
  const { main: seed } = await import('../api/lib/seed.js');
  await seed();
  console.log('Test data seeded');
} 