import { db } from '../lib/db.js';
import { stockPrices } from '../lib/schema.js';
import { eq } from 'drizzle-orm';

async function debugHistoricalData() {
  console.log('🔍 Debugging historical data structure...\n');

  // Get a few sample records
  const sampleStocks = await db.select().from(stockPrices).limit(5);

  for (const stock of sampleStocks) {
    console.log(`\n📊 Symbol: ${stock.symbol}`);
    console.log(`   Current Price: ${stock.currentPrice}`);
    console.log(`   Last Updated: ${stock.lastUpdated}`);

    if (stock.dailyPriceData) {
      try {
        const parsedData = JSON.parse(stock.dailyPriceData);
        const dates = Object.keys(parsedData).sort();

        console.log(`   Historical Data Points: ${dates.length}`);
        console.log(`   Date Range: ${dates[0]} to ${dates[dates.length - 1]}`);

        if (dates.length <= 5) {
          console.log(`   All Dates: ${dates.join(', ')}`);
        } else {
          console.log(`   First 3: ${dates.slice(0, 3).join(', ')}`);
          console.log(`   Last 3: ${dates.slice(-3).join(', ')}`);
        }

        // Show sample data
        const firstDate = dates[0];
        const lastDate = dates[dates.length - 1];
        console.log(
          `   Sample - ${firstDate}: Open: $${parsedData[firstDate].open}, Close: $${parsedData[firstDate].close}`,
        );
        if (firstDate !== lastDate) {
          console.log(
            `   Sample - ${lastDate}: Open: $${parsedData[lastDate].open}, Close: $${parsedData[lastDate].close}`,
          );
        }
      } catch (error) {
        console.log(`   Error parsing JSON: ${error}`);
      }
    } else {
      console.log(`   No historical data`);
    }
  }

  // Check VIX specifically
  console.log('\n🔍 Checking VIX specifically...');
  const vixData = await db.select().from(stockPrices).where(eq(stockPrices.symbol, 'VIX'));

  if (vixData.length > 0) {
    const vix = vixData[0];
    console.log(`VIX dailyPriceData: ${vix.dailyPriceData}`);
    if (vix.dailyPriceData) {
      try {
        const parsed = JSON.parse(vix.dailyPriceData);
        console.log(`VIX parsed data:`, parsed);
      } catch (error) {
        console.log(`VIX parse error: ${error}`);
      }
    }
  }
}

debugHistoricalData().catch(console.error);
