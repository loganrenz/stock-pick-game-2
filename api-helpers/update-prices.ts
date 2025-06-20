import type { VercelRequest, VercelResponse } from '@vercel/node';
import { db } from './lib/db.js';
import { picks, weeks } from './lib/schema.js';
import { eq, and, gte, lte } from 'drizzle-orm';
import { getStockData } from './stocks/stock-data.js';
import { isPriceChangeRealistic } from './lib/price-utils.js';

export async function updatePrices() {
  const allWeeks = await db.query.weeks.findMany({
    with: { picks: true },
  });

  if (!allWeeks || allWeeks.length === 0) {
    throw new Error('No weeks found');
  }

  // Get unique symbols from all weeks
  const allSymbols = new Set<string>();
  for (const week of allWeeks) {
    if (week.picks && week.picks.length > 0) {
      week.picks.forEach((pick) => allSymbols.add(pick.symbol));
    }
  }

  const symbols = Array.from(allSymbols);

  if (symbols.length === 0) {
    return { message: 'No symbols to update', updated: 0 };
  }

  // Process symbols one at a time (sequential)
  const results = {
    total: symbols.length,
    updated: 0,
    failed: 0,
    errors: [] as string[],
  };

  // Process each symbol sequentially
  for (const symbol of symbols) {
    try {
      console.log(`[UPDATE-PRICES] Updating ${symbol}...`);
      const stockData = await getStockData(symbol);

      if (!stockData || !stockData.currentPrice) {
        throw new Error(`No price data for ${symbol}`);
      }

      // Update all picks for this symbol across all weeks
      for (const week of allWeeks) {
        if (!week.picks) continue;

        const picksToUpdate = week.picks.filter((pick) => pick.symbol === symbol);

        for (const pick of picksToUpdate) {
          const oldPrice = pick.currentValue;
          const newPrice = stockData.currentPrice;

          // Sanity check - calculate percentage change
          if (oldPrice && newPrice) {
            const changePercent = ((newPrice - oldPrice) / oldPrice) * 100;
            if (!isPriceChangeRealistic(changePercent)) {
              console.warn(
                `[UPDATE-PRICES] Unrealistic price change for ${symbol}: ${oldPrice} -> ${newPrice} (${changePercent.toFixed(2)}%)`,
              );
              continue;
            }
          }

          const returnPercentage =
            pick.entryPrice && newPrice
              ? ((newPrice - pick.entryPrice) / pick.entryPrice) * 100
              : null;

          await db
            .update(picks)
            .set({
              currentValue: newPrice,
              returnPercentage,
            })
            .where(eq(picks.id, pick.id));
        }
      }

      results.updated++;
      console.log(`[UPDATE-PRICES] Successfully updated ${symbol}`);

      // Small delay between symbols to be respectful to the API
      await new Promise((resolve) => setTimeout(resolve, 20000));
    } catch (error) {
      const errorMsg = `Failed to update ${symbol}: ${error}`;
      console.error(`[UPDATE-PRICES] ${errorMsg}`);
      results.failed++;
      results.errors.push(errorMsg);
    }
  }

  console.log(`[UPDATE-PRICES] Completed: ${results.updated} updated, ${results.failed} failed`);
  return results;
}
