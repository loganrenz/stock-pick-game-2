import type { VercelRequest, VercelResponse } from '@vercel/node';
import { db } from '../../api-helpers/lib/db.js';
import { picks, weeks } from '../../api-helpers/lib/schema.js';
import { eq } from 'drizzle-orm';
import { getStockData } from '../../api-helpers/stocks/stock-data.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { pickId } = req.body;

  if (!pickId) {
    return res.status(400).json({ error: 'pickId is required' });
  }

  try {
    const pick = await db.query.picks.findFirst({
      where: eq(picks.id, pickId),
      with: {
        week: true,
      },
    });

    if (!pick) {
      return res.status(404).json({ error: 'Pick not found' });
    }

    const stockData = await getStockData(pick.symbol);

    if (!stockData || !stockData.dailyPriceData) {
      return res.status(404).json({ error: `Could not find stock data for ${pick.symbol}` });
    }

    const week = pick.week;
    const dailyPrices = stockData.dailyPriceData as Record<string, { open: number; close: number }>;
    const days = Object.keys(dailyPrices);

    let entryPrice = pick.entryPrice;
    let currentValue = pick.currentValue;

    if (days.length > 0) {
      entryPrice = dailyPrices[days[0]].open;
      currentValue = dailyPrices[days[days.length - 1]].close;
    }

    const returnPercentage =
      entryPrice && currentValue ? ((currentValue - entryPrice) / entryPrice) * 100 : 0;

    const [updatedPick] = await db
      .update(picks)
      .set({
        entryPrice,
        currentValue,
        returnPercentage,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(picks.id, pickId))
      .returning();

    return res.status(200).json(updatedPick);
  } catch (error) {
    console.error(`[Picks Update Prices Error]:`, error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
