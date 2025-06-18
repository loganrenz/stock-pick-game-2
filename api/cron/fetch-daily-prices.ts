import type { VercelRequest, VercelResponse } from '@vercel/node';
import { db } from '../../api-helpers/lib/db.js';
import { picks, weeks } from '../../api-helpers/lib/schema.js';
import { eq } from 'drizzle-orm';
import { fetchAlphaVantage } from '../../api-helpers/stocks/price-data.js';

function getMondayAndFriday(dates: string[]): { monday: string | null, friday: string | null } {
  // dates: array of 'YYYY-MM-DD' strings
  let monday = null, friday = null;
  for (const d of dates) {
    const day = new Date(d).getDay();
    if (day === 1) monday = d; // Monday
    if (day === 5) friday = d; // Friday
  }
  return { monday, friday };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow GET requests (Vercel cron jobs use GET)
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const type = req.query.type as string | undefined;

  try {
    // Find the current week (startDate <= today <= endDate)
    const todayStr = new Date().toISOString().split('T')[0];
    const currentWeek = await db.query.weeks.findFirst({
      where: (w) => w.startDate <= todayStr && w.endDate >= todayStr,
      with: { picks: true }
    });

    if (!currentWeek || !currentWeek.picks.length) {
      console.log('[cron] No picks found for the current week');
      return res.status(200).json({ message: 'No picks found for the current week' });
    }

    // For each pick, fetch the daily price data and update dailyPriceData
    for (const pick of currentWeek.picks) {
      const { dailyPriceData } = await fetchAlphaVantage(pick.symbol);
      if (!dailyPriceData) {
        console.warn(`[cron] No daily price data for ${pick.symbol}`);
        continue;
      }
      const dates = Object.keys(dailyPriceData).sort();
      const { monday, friday } = getMondayAndFriday(dates);
      let update: any = {};
      if (type === 'open' && monday && dailyPriceData[monday]) {
        update.mondayOpen = dailyPriceData[monday].open;
        console.log(`[cron] Set Monday open for ${pick.symbol}: ${update.mondayOpen}`);
      } else if (type === 'close' && friday && dailyPriceData[friday]) {
        update.fridayClose = dailyPriceData[friday].close;
        console.log(`[cron] Set Friday close for ${pick.symbol}: ${update.fridayClose}`);
      } else if (!type) {
        update.dailyPriceData = JSON.stringify(dailyPriceData);
        console.log(`[cron] Set all daily prices for ${pick.symbol}`);
      }
      if (Object.keys(update).length > 0) {
        await db.update(picks).set(update).where(eq(picks.id, pick.id));
      }
    }

    return res.status(200).json({ message: 'Prices updated successfully' });
  } catch (error) {
    console.error('[cron] Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
} 