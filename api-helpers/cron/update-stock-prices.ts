import { db } from '../lib/db.js';
import { picks, weeks } from '../lib/schema.js';
import { eq, and, gte, lte } from 'drizzle-orm';
import { getMultipleStockData } from '../stocks/stock-data.js';

export async function updateStockPrices() {
  try {
    const todayStr = new Date().toISOString().split('T')[0];

    // Find current week (startDate <= today <= endDate)
    const currentWeek = await db.query.weeks.findFirst({
      where: (w) => w.startDate <= todayStr && w.endDate >= todayStr,
      with: { picks: true },
    });

    // Find next week (startDate > today, closest to today)
    const nextWeek = await db.query.weeks.findFirst({
      where: (w) => w.startDate > todayStr,
      with: { picks: true },
      orderBy: (w) => w.startDate,
    });

    const weeksToUpdate = [];
    if (currentWeek) weeksToUpdate.push({ week: currentWeek, type: 'current' });
    if (nextWeek) weeksToUpdate.push({ week: nextWeek, type: 'next' });

    if (weeksToUpdate.length === 0) {
      console.log('[cron] No weeks to update');
      return { message: 'No weeks to update' };
    }

    // Collect all unique symbols from both weeks
    const allSymbols = new Set<string>();
    for (const { week } of weeksToUpdate) {
      for (const pick of week.picks) {
        allSymbols.add(pick.symbol.toUpperCase());
      }
    }

    const symbolsArray = Array.from(allSymbols);
    console.log(`[cron] Updating ${symbolsArray.length} unique symbols`);

    // Fetch stock data for all symbols efficiently
    const stockDataMap = await getMultipleStockData(symbolsArray);

    let totalPicksUpdated = 0;

    // Update picks with fresh stock data
    for (const { week, type } of weeksToUpdate) {
      console.log(`[cron] Processing ${type} week ${week.weekNum} with ${week.picks.length} picks`);

      for (const pick of week.picks) {
        const symbol = pick.symbol.toUpperCase();
        const stockData = stockDataMap[symbol];

        if (!stockData) {
          console.warn(`[cron] No stock data available for ${symbol}`);
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
        }
      }
    }

    console.log(`[cron] Updated ${totalPicksUpdated} picks total`);
    return {
      message: `Updated ${totalPicksUpdated} picks across ${weeksToUpdate.length} weeks`,
      weeksUpdated: weeksToUpdate.length,
      picksUpdated: totalPicksUpdated,
      symbolsUpdated: symbolsArray.length,
    };
  } catch (error) {
    console.error('[cron] Error:', error);
    throw error;
  }
}
