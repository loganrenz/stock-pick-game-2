import 'dotenv/config';
import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';

// Dynamically import schema for ESM compatibility
const schema = await import('../api/lib/schema.js');

// Initialize Turso client
const turso = createClient({
  url: process.env.TURSO_DB_URL!,
  authToken: process.env.TURSO_DB_TOKEN,
});

const db = drizzle(turso, { schema });

async function getStockData() {
  try {
    // Get all stock symbols from picks
    const allSymbols = await db.query.picks.findMany({
      columns: {
        symbol: true,
      },
    });
    // Deduplicate symbols in JS
    const uniqueSymbols = Array.from(new Set(allSymbols.map((p: { symbol: string }) => p.symbol)));
    console.log('Found unique symbols:', uniqueSymbols);

    // Get all picks with their associated data
    const picks = await db.query.picks.findMany({
      with: {
        week: true,
        user: true,
      },
      orderBy: (picks, { desc }) => [desc(picks.createdAt)],
    });

    console.log('\nHistorical Pick Data:');
    console.log('====================');
    
    for (const pick of picks) {
      console.log(`\nWeek ${pick.week.weekNum} (${pick.week.startDate}):`);
      console.log(`User: ${pick.user.username}`);
      console.log(`Symbol: ${pick.symbol}`);
      console.log(`Entry Price: $${pick.entryPrice}`);
      if (pick.currentValue) {
        console.log(`Current Value: $${pick.currentValue}`);
        console.log(`Week Return: $${pick.weekReturn}`);
        console.log(`Return Percentage: ${pick.returnPercentage}%`);
      }
      if (pick.dailyPriceData) {
        console.log('Daily Price Data:', pick.dailyPriceData);
      }
    }

  } catch (error) {
    console.error('Error querying database:', error);
  } finally {
    await turso.close();
  }
}

// Run the query
await getStockData(); 