import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

const testEnvVarsPath = path.resolve(process.cwd(), 'testenvvars');
if (fs.existsSync(testEnvVarsPath)) {
  dotenv.config({ path: testEnvVarsPath });
}
if (!process.env.TURSO_DB_URL) {
  process.env.TURSO_DB_URL = 'file:test.db';
}
if (!process.env.TURSO_DB_TOKEN) {
  process.env.TURSO_DB_TOKEN = 'test-token';
}

console.log('[SETUP ENV] TURSO_DB_URL:', process.env.TURSO_DB_URL);
console.log('[SETUP ENV] TURSO_DB_TOKEN:', process.env.TURSO_DB_TOKEN); 