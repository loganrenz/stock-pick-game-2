import type { VercelRequest, VercelResponse } from '@vercel/node';
import { db } from '../api-helpers/lib/db.js';
import { picks, weeks } from '../api-helpers/lib/schema.js';
import { eq, and, gte, lte } from 'drizzle-orm';
import { getStockData } from '../api-helpers/stocks/stock-data.js';
import { isPriceChangeRealistic } from '../api-helpers/lib/price-utils.js';

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
    const { batchSize = 5, maxConcurrent = 5 } = req.body;

    // Get all unique symbols that need updating (from current week picks)
    const todayStr = new Date().toISOString().split('T')[0];
    const currentWeek = await db.query.weeks.findFirst({
      where: (w) => w.startDate <= todayStr && w.endDate >= todayStr,
      with: { picks: true },
    });

    if (!currentWeek) {
      return res.status(404).json({ message: 'No current week found' });
    }

    // Get unique symbols from current week picks
    const symbols = [...new Set(currentWeek.picks.map((pick) => pick.symbol))];

    if (symbols.length === 0) {
      return res.status(200).json({ message: 'No symbols to update', updated: 0 });
    }

    // Process symbols in batches
    const results = {
      total: symbols.length,
      updated: 0,
      failed: 0,
      errors: [] as string[],
    };

    // Process in batches of maxConcurrent
    for (let i = 0; i < symbols.length; i += maxConcurrent) {
      const batch = symbols.slice(i, i + maxConcurrent);

      // Process batch concurrently
      const batchPromises = batch.map(async (symbol) => {
        try {
          console.log(`[UPDATE-PRICES] Updating ${symbol}...`);
          const stockData = await getStockData(symbol);

          if (!stockData || !stockData.currentPrice) {
            throw new Error(`No price data for ${symbol}`);
          }

          // Update all picks for this symbol in the current week
          const picksToUpdate = currentWeek.picks.filter((pick) => pick.symbol === symbol);

          for (const pick of picksToUpdate) {
            const oldPrice = pick.currentValue;
            const newPrice = stockData.currentPrice;

            // Sanity check
            if (oldPrice && !isPriceChangeRealistic(oldPrice, newPrice)) {
              console.warn(
                `[UPDATE-PRICES] Unrealistic price change for ${symbol}: ${oldPrice} -> ${newPrice}`,
              );
              continue;
            }

            const returnPercentage = pick.entryPrice
              ? ((newPrice - pick.entryPrice) / pick.entryPrice) * 100
              : null;

            await db
              .update(picks)
              .set({
                currentValue: newPrice,
                returnPercentage,
                lastUpdated: new Date().toISOString(),
              })
              .where(eq(picks.id, pick.id));
          }

          results.updated++;
          console.log(`[UPDATE-PRICES] Successfully updated ${symbol}`);
          return { symbol, success: true };
        } catch (error) {
          const errorMsg = `Failed to update ${symbol}: ${error}`;
          console.error(`[UPDATE-PRICES] ${errorMsg}`);
          results.failed++;
          results.errors.push(errorMsg);
          return { symbol, success: false, error: errorMsg };
        }
      });

      // Wait for batch to complete
      await Promise.all(batchPromises);

      // Small delay between batches to be respectful
      if (i + maxConcurrent < symbols.length) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }

    console.log(`[UPDATE-PRICES] Completed: ${results.updated} updated, ${results.failed} failed`);
    return res.status(200).json(results);
  } catch (error) {
    console.error('[UPDATE-PRICES] Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
