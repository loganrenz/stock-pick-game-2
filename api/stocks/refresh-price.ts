import type { VercelRequest, VercelResponse } from '@vercel/node';
import { db } from '../../api-helpers/lib/db.js';
import { picks } from '../../api-helpers/lib/schema.js';
import { eq } from 'drizzle-orm';
import { getStockData } from '../../api-helpers/stocks/stock-data.js';
import { isPriceChangeRealistic } from '../../api-helpers/lib/price-utils.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization',
  );

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { symbol } = req.body;

    if (!symbol) {
      return res.status(400).json({ error: 'Symbol is required' });
    }

    const upperSymbol = symbol.toUpperCase();
    console.log(`[REFRESH-PRICE] Refreshing price for ${upperSymbol}...`);

    // Fetch current stock data
    const stockData = await getStockData(upperSymbol);

    if (!stockData || !stockData.currentPrice) {
      return res.status(404).json({ error: `No price data available for ${upperSymbol}` });
    }

    // Check if price change is realistic
    if (!isPriceChangeRealistic(stockData?.changePercent)) {
      console.warn(`[REFRESH-PRICE] Unrealistic price change for ${upperSymbol}. Skipping update.`);
      return res.status(400).json({
        error: `Unrealistic price change detected for ${upperSymbol}`,
        currentPrice: stockData.currentPrice,
        changePercent: stockData.changePercent,
      });
    }

    // Find all picks for this symbol
    const picksToUpdate = await db.query.picks.findMany({
      where: eq(picks.symbol, upperSymbol),
    });

    if (picksToUpdate.length === 0) {
      return res.status(404).json({ error: `No picks found for symbol ${upperSymbol}` });
    }

    let updatedCount = 0;

    // Update all picks for this symbol
    for (const pick of picksToUpdate) {
      const oldPrice = pick.currentValue;
      const newPrice = stockData.currentPrice;

      // Calculate return percentage
      const returnPercentage =
        pick.entryPrice && newPrice ? ((newPrice - pick.entryPrice) / pick.entryPrice) * 100 : null;

      await db
        .update(picks)
        .set({
          currentValue: newPrice,
          returnPercentage,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(picks.id, pick.id));

      updatedCount++;
    }

    console.log(`[REFRESH-PRICE] Successfully updated ${updatedCount} picks for ${upperSymbol}`);

    return res.status(200).json({
      success: true,
      symbol: upperSymbol,
      currentPrice: stockData.currentPrice,
      previousClose: stockData.previousClose,
      change: stockData.change,
      changePercent: stockData.changePercent,
      picksUpdated: updatedCount,
    });
  } catch (error) {
    console.error('[REFRESH-PRICE] Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
