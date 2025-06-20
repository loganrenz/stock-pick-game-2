import type { VercelRequest, VercelResponse } from '@vercel/node';
import { db } from '../../api-helpers/lib/db.js';
import { picks } from '../../api-helpers/lib/schema.js';
import { getStockData } from '../../api-helpers/stocks/stock-data.js';
import { eq, isNotNull } from 'drizzle-orm';

export async function runUpdate() {
  console.log('[CRON] Starting update-last-close job.');

  const allPicks = await db.query.picks.findMany({
    columns: {
      symbol: true,
    },
    where: isNotNull(picks.entryPrice),
  });

  const uniqueSymbols = [...new Set(allPicks.map((p) => p.symbol))];
  console.log(`[CRON] Found ${uniqueSymbols.length} unique symbols to update.`);

  const priceUpdatePromises = uniqueSymbols.map(async (symbol) => {
    const stockData = await getStockData(symbol);
    const lastClose = stockData?.previousClose || stockData?.currentPrice;

    if (lastClose !== null && lastClose !== undefined) {
      console.log(`[CRON] Updating ${symbol} with last close price: ${lastClose}`);
      await db
        .update(picks)
        .set({
          lastClosePrice: lastClose,
          lastClosePriceUpdatedAt: new Date().toISOString(),
        })
        .where(eq(picks.symbol, symbol));
      return { symbol, status: 'success', price: lastClose };
    } else {
      console.warn(`[CRON] Could not find closing price for ${symbol}`);
      return { symbol, status: 'failed' };
    }
  });

  const results = await Promise.all(priceUpdatePromises);
  const successCount = results.filter((r) => r.status === 'success').length;
  const failedCount = results.length - successCount;

  const summary = `[CRON] Job finished. Updated ${successCount} symbols. Failed for ${failedCount} symbols.`;
  console.log(summary);
  return { summary, results };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.headers['authorization'] !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const { summary, results } = await runUpdate();
    res.status(200).json({ message: 'Cron job completed successfully.', summary, results });
  } catch (error) {
    console.error('[CRON] Error running update-last-close job:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
