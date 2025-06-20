import type { VercelRequest, VercelResponse } from '@vercel/node';
import { db } from '../api-helpers/lib/db.js';
import { picks } from '../api-helpers/lib/schema.js';
import { getStockData } from '../api-helpers/stocks/stock-data.js';

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

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get all unique symbols from the database
    const allPicks = await db.query.picks.findMany({
      columns: {
        symbol: true,
      },
    });

    if (!allPicks || allPicks.length === 0) {
      return res.status(404).json({ error: 'No picks found in database' });
    }

    // Get unique symbols
    const uniqueSymbols = [...new Set(allPicks.map((pick) => pick.symbol))];

    // Pick a random symbol
    const randomIndex = Math.floor(Math.random() * uniqueSymbols.length);
    const randomSymbol = uniqueSymbols[randomIndex];

    console.log(`[TEST-RANDOM] Selected random symbol: ${randomSymbol}`);

    // Fetch current price for this symbol
    const stockData = await getStockData(randomSymbol);

    if (!stockData) {
      return res.status(404).json({
        error: `No stock data available for ${randomSymbol}`,
        symbol: randomSymbol,
      });
    }

    const result = {
      symbol: randomSymbol,
      currentPrice: stockData.currentPrice,
      previousClose: stockData.previousClose,
      change: stockData.change,
      changePercent: stockData.changePercent,
      volume: stockData.volume,
      marketCap: stockData.marketCap,
      timestamp: new Date().toISOString(),
      totalSymbolsInDb: uniqueSymbols.length,
    };

    console.log(`[TEST-RANDOM] Successfully fetched data for ${randomSymbol}:`, result);

    return res.status(200).json(result);
  } catch (error) {
    console.error('[TEST-RANDOM] Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
