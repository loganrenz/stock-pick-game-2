import { db } from '../lib/db.js';
import { stockPrices, picks } from '../lib/schema.js';
import { eq } from 'drizzle-orm';
import yahooFinance from 'yahoo-finance2';

// Suppress survey notice to keep logs clean
yahooFinance.suppressNotices(['yahooSurvey', 'ripHistorical']);

// Set concurrency to 1 to prevent issues with multiple simultaneous requests
yahooFinance.setGlobalConfig({ concurrency: 1 });

// Yahoo Finance function to get historical data using chart method
async function getYahooFinanceHistorical(
  symbol: string,
  startDate: Date,
  endDate: Date = new Date(),
) {
  try {
    const chart = await yahooFinance.chart(symbol, {
      period1: startDate,
      period2: endDate,
      interval: '1d',
      timeout: 10000,
      retry: {
        retries: 3,
        factor: 2,
        minTimeout: 1000,
        maxTimeout: 5000,
      },
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        Connection: 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
      },
    });

    // Transform the data into the format we need
    const dailyData: Record<string, { open: number; close: number }> = {};

    if (chart.quotes && Array.isArray(chart.quotes)) {
      chart.quotes.forEach((day) => {
        if (!day.date) {
          console.warn(`Skipping missing date for ${symbol}:`, day);
          return;
        }
        const date = new Date(day.date);
        if (isNaN(date.getTime())) {
          console.warn(`Skipping invalid date for ${symbol}:`, day);
          return;
        }
        const dateKey = date.toISOString().split('T')[0]; // YYYY-MM-DD format
        dailyData[dateKey] = {
          open: day.open,
          close: day.close,
        };
      });
    } else {
      console.warn(`No quotes array found in chart for ${symbol}`);
    }

    return dailyData;
  } catch (error) {
    console.error(`Error getting Yahoo Finance chart data for ${symbol}:`, error);
    throw error;
  }
}

// Function to get historical data in 30-day chunks
async function getYahooFinanceHistoricalChunked(
  symbol: string,
  startDate: Date,
  endDate: Date = new Date(),
) {
  const allData: Record<string, { open: number; close: number }> = {};
  const chunkSize = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds

  let currentStart = new Date(startDate);

  while (currentStart < endDate) {
    const currentEnd = new Date(Math.min(currentStart.getTime() + chunkSize, endDate.getTime()));

    console.log(
      `Fetching ${symbol} from ${currentStart.toISOString()} to ${currentEnd.toISOString()}`,
    );

    try {
      const chunkData = await getYahooFinanceHistorical(symbol, currentStart, currentEnd);

      // Merge the data
      Object.assign(allData, chunkData);

      // Move to next chunk
      currentStart = new Date(currentEnd.getTime() + 24 * 60 * 60 * 1000); // Add 1 day

      // Add delay between chunks
      await new Promise((resolve) => setTimeout(resolve, 200));
    } catch (error) {
      console.error(`Error fetching chunk for ${symbol}:`, error);
      // Continue with next chunk
      currentStart = new Date(currentEnd.getTime() + 24 * 60 * 60 * 1000);
    }
  }

  return allData;
}

async function fetchFullHistoricalData() {
  console.log('🚀 Starting full historical data fetch...\n');

  // Get all unique symbols from picks
  const allPicks = await db.select({ symbol: picks.symbol }).from(picks);
  const symbols = [...new Set(allPicks.map((pick) => pick.symbol))];

  console.log(`📊 Found ${symbols.length} unique symbols to fetch historical data for\n`);

  // Set date range to 1 year back from today
  const endDate = new Date();
  const startDate = new Date();
  startDate.setFullYear(startDate.getFullYear() - 1);

  console.log(`📅 Fetching data from ${startDate.toISOString()} to ${endDate.toISOString()}\n`);

  let updated = 0;
  let failed = 0;

  for (const symbol of symbols) {
    try {
      console.log(`\n📈 Processing ${symbol} (${updated + failed + 1}/${symbols.length})...`);

      const historicalData = await getYahooFinanceHistoricalChunked(symbol, startDate, endDate);

      if (Object.keys(historicalData).length === 0) {
        console.warn(`⚠️  No historical data received for ${symbol}`);
        failed++;
        continue;
      }

      // Update the stock_prices table with historical data
      await db
        .insert(stockPrices)
        .values({
          symbol,
          dailyPriceData: JSON.stringify(historicalData),
          lastUpdated: new Date().toISOString(),
        })
        .onConflictDoUpdate({
          target: stockPrices.symbol,
          set: {
            dailyPriceData: JSON.stringify(historicalData),
            lastUpdated: new Date().toISOString(),
          },
        });

      const dataPoints = Object.keys(historicalData).length;
      const dateRange = Object.keys(historicalData).sort();
      console.log(
        `✅ ${symbol}: ${dataPoints} data points from ${dateRange[0]} to ${dateRange[dateRange.length - 1]}`,
      );

      updated++;

      // Add a delay between symbols to be respectful to Yahoo's servers
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`❌ Failed to update historical data for ${symbol}:`, error);
      failed++;
    }
  }

  console.log(`\n🎉 COMPLETED!`);
  console.log(`   Updated: ${updated} symbols`);
  console.log(`   Failed: ${failed} symbols`);
  console.log(`   Total: ${symbols.length} symbols`);

  return { updated, failed, total: symbols.length };
}

// Run the script if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  fetchFullHistoricalData()
    .then((result) => {
      console.log('\n✅ Script completed successfully');
      process.exit(result.failed > 0 ? 1 : 0);
    })
    .catch((error) => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}

export { fetchFullHistoricalData };
