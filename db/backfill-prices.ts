import { db } from '../api/lib/db.js';
import { picks } from '../api/lib/schema.js';
import { eq, isNull, and, not, or } from 'drizzle-orm';
import axios from 'axios';

const ALPHA_VANTAGE_API_KEY = process.env.ALPHA_VANTAGE_API_KEY;
const API_LIMIT = 10; // For safety, set to 10; increase as needed

async function fetchCurrentPrice(symbol: string): Promise<number | null> {
  try {
    const response = await axios.get(
      `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${ALPHA_VANTAGE_API_KEY}`
    );
    const quote = response.data['Global Quote'];
    if (!quote) {
      console.warn(`[API] No quote found for ${symbol}`);
      return null;
    }
    const price = parseFloat(quote['05. price']);
    console.log(`[API] Current price for ${symbol}: ${price}`);
    return price;
  } catch (error) {
    console.error(`[API] Error fetching current price for ${symbol}:`, error);
    return null;
  }
}

async function fetchDailyPrices(symbol: string): Promise<any | null> {
  try {
    const response = await axios.get(
      `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY_ADJUSTED&symbol=${symbol}&apikey=${ALPHA_VANTAGE_API_KEY}`
    );
    const data = response.data['Time Series (Daily)'];
    if (!data) {
      console.warn(`[API] No daily data found for ${symbol}`);
      return null;
    }
    // Map to { monday: {open, close}, ... } using the most recent 5 days
    const days = Object.keys(data).slice(0, 5);
    const dailyPriceData: any = {};
    for (const [i, day] of days.entries()) {
      dailyPriceData[['monday','tuesday','wednesday','thursday','friday'][i]] = {
        open: parseFloat(data[day]['1. open']),
        close: parseFloat(data[day]['4. close'])
      };
    }
    console.log(`[API] Daily prices for ${symbol}:`, dailyPriceData);
    return dailyPriceData;
  } catch (error) {
    console.error(`[API] Error fetching daily prices for ${symbol}:`, error);
    return null;
  }
}

async function main() {
  const picksToUpdate = await db.select()
    .from(picks)
    .where(
      and(
        not(eq(picks.symbol, '')),
        not(isNull(picks.symbol)),
        or(isNull(picks.currentValue), isNull(picks.dailyPriceData))
      )
    )
    .limit(API_LIMIT);

  console.log(`Found ${picksToUpdate.length} picks to update.`);
  if (picksToUpdate.length > 0) {
    console.log('First few picks:', picksToUpdate.slice(0, 5));
  }

  let apiCalls = 0;
  for (const pick of picksToUpdate) {
    if (!pick.symbol) continue;
    if (apiCalls >= API_LIMIT) {
      console.log('API call limit reached. Stopping.');
      break;
    }
    // Fetch current price
    let currentValue = pick.currentValue;
    if (currentValue == null) {
      currentValue = await fetchCurrentPrice(pick.symbol);
      apiCalls++;
    }
    // Fetch daily prices
    let dailyPriceData = pick.dailyPriceData;
    if (dailyPriceData == null) {
      dailyPriceData = await fetchDailyPrices(pick.symbol);
      apiCalls++;
    }
    // Update pick
    await db.update(picks)
      .set({
        currentValue: currentValue ?? null,
        dailyPriceData: dailyPriceData ? JSON.stringify(dailyPriceData) : null,
      })
      .where(eq(picks.id, pick.id));
    console.log(`[DB] Updated pick ${pick.id} (${pick.symbol}): currentValue=${currentValue}, dailyPriceData=${!!dailyPriceData}`);
  }
  console.log('Backfill complete!');
}

main().catch(console.error); 