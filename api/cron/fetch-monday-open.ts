import type { VercelRequest, VercelResponse } from '@vercel/node';
import { db } from '../../api-helpers/lib/db.js';
import { picks } from '../../api-helpers/lib/schema.js';
import { eq } from 'drizzle-orm';
import { fetchAlphaVantage, fetchFMP } from '../../api-helpers/stocks/price-data.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow GET requests (Vercel cron jobs use GET)
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Fetch all picks for the current week
    const currentWeek = await db.query.weeks.findFirst({
      where: eq(weeks.startDate, new Date().toISOString().split('T')[0]),
      with: { picks: true }
    });

    if (!currentWeek || !currentWeek.picks.length) {
      return res.status(200).json({ message: 'No picks found for the current week' });
    }

    // For each pick, fetch the Monday open price and update dailyPriceData
    for (const pick of currentWeek.picks) {
      const { dailyPriceData } = await fetchAlphaVantage(pick.symbol);
      if (dailyPriceData && dailyPriceData.monday) {
        await db.update(picks)
          .set({ dailyPriceData: JSON.stringify(dailyPriceData) })
          .where(eq(picks.id, pick.id));
      }
    }

    return res.status(200).json({ message: 'Monday open prices updated successfully' });
  } catch (error) {
    console.error('Cron job error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
} 