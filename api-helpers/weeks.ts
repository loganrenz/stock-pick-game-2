import { db } from './lib/db.js';
import { weeks, picks } from './lib/schema.js';
import { desc, sql, and, gte, lte } from 'drizzle-orm';
import { getStockData } from './stocks/stock-data.js';
import { isPriceChangeRealistic } from './lib/price-utils.js';

export async function getLivePrice(symbol: string): Promise<number | null> {
  console.log(`[WEEKS] Getting live price for ${symbol}`);
  try {
    const stockData = await getStockData(symbol);

    if (!isPriceChangeRealistic(stockData?.changePercent)) {
      console.warn(`[WEEKS] Unrealistic price change for ${symbol}. Using stale data.`);
      const stalePrice = await db.query.stockPrices.findFirst({
        where: eq(picks.symbol, symbol),
        columns: { currentPrice: true },
        orderBy: [desc(picks.updatedAt)],
      });
      return stalePrice?.currentPrice ?? null;
    }

    const price = stockData?.currentPrice || null;
    if (price === null) {
      console.warn(`[WEEKS] Could not retrieve live price for ${symbol}`);
      return null;
    }
    console.log(`[WEEKS] Live price for ${symbol} is ${price}`);
    return price;
  } catch (error) {
    console.error(`[WEEKS] Error getting live price for ${symbol}:`, error);
    return null;
  }
}

/**
 * Get the currently active week, if one exists
 */
async function getActiveWeek(): Promise<
  (typeof weeks.$inferSelect & { picks: (typeof picks.$inferSelect)[] }) | null
> {
  const now = new Date().toISOString();
  try {
    const week = await db.query.weeks.findFirst({
      where: and(lte(weeks.startDate, now), gte(weeks.endDate, now)),
      with: { picks: true },
    });
    return week || null;
  } catch (error) {
    console.error('[WEEKS] Error getting active week:', error);
    return null;
  }
}

/**
 * Get the current week (active or most recent)
 */
export async function getCurrentWeek(): Promise<
  (typeof weeks.$inferSelect & { picks: (typeof picks.$inferSelect)[] }) | null
> {
  try {
    // First, try to find an active week
    let week = await getActiveWeek();

    // If no active week, get the most recent one
    if (!week) {
      week = await db.query.weeks.findFirst({
        orderBy: [desc(weeks.startDate)],
        with: { picks: true },
      });
    }

    return week || null;
  } catch (error) {
    console.error('[WEEKS] Error getting current week:', error);
    return null;
  }
}

/**
 * Create a new week
 */
// ... existing code ...
