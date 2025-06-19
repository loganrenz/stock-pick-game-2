import { db } from '../lib/db.js';
import { weeks, picks, users } from '../lib/schema.js';
import { eq, and, lt } from 'drizzle-orm';
import { getCurrentPrice } from '../stocks/stock-data.js';

async function getHistoricalPrice(symbol: string, date: string): Promise<number | null> {
  try {
    // Use the centralized stock data utility
    const currentPrice = await getCurrentPrice(symbol);
    return currentPrice;
  } catch (e) {
    console.error(`[WINNER] Failed to fetch price for ${symbol} on ${date}`);
    return null;
  }
}

async function main() {
  const now = new Date();
  const allWeeks = await db.query.weeks.findMany({
    where: lt(weeks.endDate, now.toISOString()),
    with: { picks: true },
  });
  for (const week of allWeeks) {
    if (!week.picks.length) continue;
    let bestPick = null;
    let bestReturn = -Infinity;
    for (const pick of week.picks) {
      let ret = pick.returnPercentage;
      // If missing, try to calculate
      if (ret == null && pick.entryPrice && pick.symbol) {
        const closePrice = await getHistoricalPrice(pick.symbol, week.endDate);
        if (closePrice != null) {
          ret = ((closePrice - pick.entryPrice) / pick.entryPrice) * 100;
          await db
            .update(picks)
            .set({ currentValue: closePrice, returnPercentage: ret })
            .where(eq(picks.id, pick.id));
        }
      }
      if (ret != null && ret > bestReturn) {
        bestReturn = ret;
        bestPick = pick;
      }
    }
    if (bestPick) {
      await db.update(weeks).set({ winnerId: bestPick.userId }).where(eq(weeks.id, week.id));
      console.log(`[WINNER] Week ${week.weekNum} winner: userId ${bestPick.userId}`);
    }
  }
  console.log('[WINNER] Batch winner calculation complete.');
}

if (import.meta.url === `file://${process.argv[1]}` || import.meta.url === process.argv[1]) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
