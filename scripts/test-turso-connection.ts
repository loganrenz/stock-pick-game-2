import { createClient } from '@libsql/client';

const url = process.env.TURSO_DB_URL;
const authToken = process.env.TURSO_DB_TOKEN;

async function main() {
  if (!url || !authToken) {
    console.error('Missing TURSO_DB_URL or TURSO_DB_TOKEN');
    process.exit(1);
  }
  console.log('Connecting to:', url);
  try {
    const client = createClient({ url, authToken });
    const result = await client.execute('SELECT name FROM sqlite_master WHERE type="table";');
    console.log('Connection successful! Tables:');
    console.log(result.rows);
    await client.close();
  } catch (err) {
    console.error('Connection failed:', err);
    process.exit(1);
  }
}

main(); 