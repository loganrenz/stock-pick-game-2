import { db } from '../lib/db.js';
import { picks, weeks } from '../lib/schema.js';
import { eq, and, gte, lte } from 'drizzle-orm';
import { getStockData } from '../stocks/stock-data.js';
import { isPriceChangeRealistic } from '../lib/price-utils.js';

export async function updateStockPrices() {
  try {
    const todayStr = new Date().toISOString().split('T')[0];

    // Find current week (startDate <= today <= endDate)
    const currentWeek = await db.query.weeks.findFirst({
      where: (w) => w.startDate <= todayStr && w.endDate >= todayStr,
      with: { picks: true },
    });

    if (!currentWeek) {
      console.log('[cron] No current week to update');
      return { message: 'No current week to update' };
    }

    console.log(
      `[cron] Updating current week ${currentWeek.weekNum} with ${currentWeek.picks.length} picks`,
    );

    let totalPicksUpdated = 0;

    // Update picks sequentially (one at a time)
    for (const pick of currentWeek.picks) {
      const symbol = pick.symbol.toUpperCase();
      console.log(`[cron] Fetching price for ${symbol}...`);

      try {
        // Fetch stock data for this symbol only
        const stockData = await getStockData(symbol);

        if (!stockData) {
          console.warn(`[cron] No stock data available for ${symbol}`);
          continue;
        }

        // Check if price change is realistic
        if (!isPriceChangeRealistic(stockData?.changePercent)) {
          console.warn(`[cron] Unrealistic price change for ${symbol}. Skipping update.`);
          continue;
        }

        // Calculate entry price and current value
        let entryPrice = pick.entryPrice;
        let currentValue = stockData.currentPrice;
        let returnPercentage = null;

        if (stockData.dailyPriceData) {
          // Find Monday open (first available day) for entry price
          const days = Object.keys(stockData.dailyPriceData);
          if (days.length > 0) {
            entryPrice = stockData.dailyPriceData[days[0]].open;
            // Use the latest available close price for current value
            currentValue = stockData.dailyPriceData[days[days.length - 1]].close;
          }
        }

        // Calculate return percentage if we have both entry and current values
        if (entryPrice && currentValue && entryPrice > 0) {
          returnPercentage = ((currentValue - entryPrice) / entryPrice) * 100;
        }

        // Update the pick
        const updateData: any = {
          updatedAt: new Date().toISOString(),
        };

        if (entryPrice && entryPrice !== pick.entryPrice) {
          updateData.entryPrice = entryPrice;
        }

        if (currentValue !== null && currentValue !== pick.currentValue) {
          updateData.currentValue = currentValue;
        }

        if (returnPercentage !== null && returnPercentage !== pick.returnPercentage) {
          updateData.returnPercentage = returnPercentage;
        }

        // Calculate week return if we have current value and entry price
        if (currentValue && entryPrice) {
          const weekReturn = currentValue - entryPrice;
          if (weekReturn !== pick.weekReturn) {
            updateData.weekReturn = weekReturn;
          }
        }

        if (Object.keys(updateData).length > 1) {
          // More than just updatedAt
          await db.update(picks).set(updateData).where(eq(picks.id, pick.id));

          totalPicksUpdated++;
          console.log(
            `[cron] Updated ${pick.symbol}: entryPrice=${entryPrice}, currentValue=${currentValue}, returnPercentage=${returnPercentage}%`,
          );
        } else {
          console.log(`[cron] No updates needed for ${pick.symbol}`);
        }

        // Add a small delay between API calls to be respectful
        await new Promise((resolve) => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`[cron] Error updating ${symbol}:`, error);
        // Continue with next symbol even if one fails
      }
    }

    console.log(`[cron] Updated ${totalPicksUpdated} picks total`);
    return {
      message: `Updated ${totalPicksUpdated} picks for current week`,
      picksUpdated: totalPicksUpdated,
      symbolsProcessed: currentWeek.picks.length,
    };
  } catch (error) {
    console.error('[cron] Error:', error);
    throw error;
  }
}
