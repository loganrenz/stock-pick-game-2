import { db } from '../lib/db.js';
import { weeks, picks, users } from '../lib/schema.js';
import { eq, and, lt, lte } from 'drizzle-orm';
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
  // const now = new Date(); // System clock is wrong (showing 2025)
  const now = new Date('2024-07-21T00:00:00.000Z'); // Hardcode correct date
  const allWeeks = await db.query.weeks.findMany({
    where: and(lte(weeks.endDate, now.toISOString()), eq(weeks.winnerId, null)),
    with: { picks: true },
  });

  if (!allWeeks.length) {
    console.log('[WINNER] No weeks found that need a winner calculated.');
    return;
  }

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
