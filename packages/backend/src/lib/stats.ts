import { db } from './db.js';
import { users, weeks, picks, stockPrices } from './schema.js';
import { eq, isNotNull, count } from 'drizzle-orm';

export async function getStats() {
  try {
    const [totalUsers] = await db.select({ count: count() }).from(users);
    const [totalWeeks] = await db.select({ count: count() }).from(weeks);
    const [totalPicks] = await db.select({ count: count() }).from(picks);
    const [totalStocks] = await db.select({ count: count() }).from(stockPrices);
    const [completedWeeks] = await db
      .select({ count: count() })
      .from(weeks)
      .where(isNotNull(weeks.winnerId));

    return {
      totalUsers: totalUsers.count,
      totalWeeks: totalWeeks.count,
      totalPicks: totalPicks.count,
      totalStocks: totalStocks.count,
      completedWeeks: completedWeeks.count,
    };
  } catch (error) {
    console.error('Error fetching stats:', error);
    throw error;
  }
}
