import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load testenvvars if it exists BEFORE any DB imports
const testEnvVarsPath = path.resolve(process.cwd(), 'testenvvars');
if (fs.existsSync(testEnvVarsPath)) {
  dotenv.config({ path: testEnvVarsPath });
  console.log('[GLOBAL SETUP] After loading testenvvars:');
  console.log('  TURSO_DB_URL:', process.env.TURSO_DB_URL);
}

// Set SQLite database for testing
process.env.TURSO_DB_URL = 'file:test.db';
process.env.TURSO_DB_TOKEN = 'test-token';

export default async function globalSetup() {
  // Import after env vars are set
  const { migrate } = await import('drizzle-orm/libsql/migrator');
  const { db } = await import('../api-helpers/lib/db.js');
  // Run migrations first!
  console.log('Running migrations...');
  await migrate(db, { migrationsFolder: './drizzle' });
  console.log('Migrations completed');

  // Only now import and start the test server
  const { TestServer } = await import('./helpers/test-server.js');
  const testServer = TestServer.getInstance();
  await testServer.start();
  console.log('[GLOBAL SETUP] Test server started at', testServer.baseUrl);
} 