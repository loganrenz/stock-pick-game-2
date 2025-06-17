import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config({ path: path.resolve(__dirname, '../.env') });
import { createClient } from '@libsql/client';

async function main() {
    
  const dbUrl = process.env['TURSO_DB_URL'];
  const dbToken = process.env['TURSO_DB_TOKEN'];
  if (!dbUrl || !dbToken) {
    throw new Error('Missing TURSO_DB_URL or TURSO_DB_TOKEN in environment');
  }

  const client = createClient({
    url: dbUrl,
    authToken: dbToken,
  });

  try {
    // Query picks with missing dailyPriceData, joining weeks for the date range
    const sql = `
      SELECT Pick.id as pickId, Pick.symbol, Week.startDate, Week.endDate
      FROM Pick
      JOIN Week ON Pick.weekId = Week.id
      WHERE Pick.dailyPriceData IS NULL OR Pick.dailyPriceData = ''
    `;
    const result = await client.execute(sql);
    const missing = result.rows.map((row: any) => ({
      pickId: row.pickId,
      symbol: row.symbol,
      startDate: row.startDate,
      endDate: row.endDate,
    }));
    console.log('Missing price data (symbol, startDate, endDate, pickId):');
    console.log(JSON.stringify(missing, null, 2));
    // Write to file
    fs.writeFileSync(path.resolve(__dirname, 'missing_price_data.json'), JSON.stringify(missing, null, 2));
    console.log('Wrote missing data to missing_price_data.json');
    return missing;
  } catch (error) {
    console.error('Error querying database:', error);
  } finally {
    await client.close();
  }
}

main().catch((err) => {
  console.error('Uncaught error in main:', err);
}); 