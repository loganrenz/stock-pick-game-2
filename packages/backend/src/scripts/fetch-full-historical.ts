import { db } from '../lib/db.js';
import { stockPrices } from '../lib/schema.js';
import yahooFinance from 'yahoo-finance2';
import { sql } from 'drizzle-orm';

// Suppress survey notice to keep logs clean
yahooFinance.suppressNotices(['yahooSurvey', 'ripHistorical']);

// yahooFinance.setGlobalConfig({ concurrency: 1 }); // DEPRECATED

async function fetchHistoricalDataForStock(symbol: string) {
  console.log(`Fetching historical data for ${symbol}...`);
  try {
    const twoYearsAgo = new Date();
    twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);

    const chart = await yahooFinance.chart(symbol, {
      period1: twoYearsAgo.toISOString().split('T')[0],
      interval: '1d',
    });

    if (!chart || chart.quotes.length === 0) {
      console.log(`No historical data found for ${symbol}.`);
      return;
    }

    const priceInserts = chart.quotes.map((day: any) => ({
      symbol: symbol,
      currentPrice: day.close,
      lastUpdated: day.date.toISOString(),
    }));

    if (priceInserts.length > 0) {
      await db
        .insert(stockPrices)
        .values(priceInserts)
        .onConflictDoUpdate({
          target: stockPrices.symbol,
          set: { currentPrice: sql`excluded.currentPrice`, lastUpdated: sql`excluded.lastUpdated` },
        });
      console.log(
        `Inserted or updated ${priceInserts.length} historical price points for ${symbol}`,
      );
    }
  } catch (error: any) {
    console.error(`Failed to fetch historical data for ${symbol}:`, error.message);
  }
}

async function main() {
  console.log('Starting to fetch full historical data for all stocks...');
  // This script assumes stocks are already in the stockPrices table.
  // It iterates over them to fill in historical data.
  const allSymbols = await db.selectDistinct({ symbol: stockPrices.symbol }).from(stockPrices);

  for (const { symbol } of allSymbols) {
    await fetchHistoricalDataForStock(symbol);
    await new Promise((resolve) => setTimeout(resolve, 500)); // Rate limit
  }

  console.log('Finished fetching historical data.');
}

main().catch(console.error);

// Run the script if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main()
    .then(() => {
      console.log('\n✅ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}

export { main };
