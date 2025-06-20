import { db } from '../lib/db.js';
import { weeks, picks, users } from '../lib/schema.js';
import { eq, and, lt } from 'drizzle-orm';
import { getHistoricalData } from '../stocks/stock-data.js';

async function getHistoricalPrice(symbol: string, date: string): Promise<number | null> {
  try {
    const historicalData = await getHistoricalData(symbol, date, date);
    if (historicalData && historicalData[date]) {
      return historicalData[date].close;
    }
    return null;
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
      const historicalData = await getHistoricalData(pick.symbol, week.startDate, week.endDate);
      const days = historicalData ? Object.keys(historicalData) : [];

      if (days.length > 0) {
        const entryPrice = historicalData[days[0]].open;
        const closePrice = historicalData[days[days.length - 1]].close;
        const returnPercentage = ((closePrice - entryPrice) / entryPrice) * 100;

        await db
          .update(picks)
          .set({ entryPrice, currentValue: closePrice, returnPercentage })
          .where(eq(picks.id, pick.id));

        if (returnPercentage > bestReturn) {
          bestReturn = returnPercentage;
          bestPick = pick;
        }
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
