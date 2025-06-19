import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireAuth, AuthenticatedRequest } from '../lib/auth';
import { getStockData } from './stock-data.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  return requireAuth(req as AuthenticatedRequest, res, async () => {
    const { symbol } = req.query;

    if (!symbol || typeof symbol !== 'string') {
      return res.status(400).json({ error: 'Symbol parameter is required' });
    }

    try {
      const stockData = await getStockData(symbol);

      if (!stockData) {
        return res.status(404).json({ error: 'Stock not found' });
      }

      const stockDetails = {
        symbol: stockData.symbol,
        price: stockData.currentPrice,
        change: stockData.change,
        changePercent: stockData.changePercent,
        volume: stockData.volume,
        latestTradingDay: new Date().toISOString().split('T')[0], // Today's date
        previousClose: stockData.previousClose,
        overview: {
          name: stockData.symbol, // We'll get this from search if needed
          description: null,
          sector: null,
          industry: null,
          marketCap: stockData.marketCap,
          peRatio: stockData.peRatio,
          eps: stockData.eps,
          dividendYield: stockData.dividendYield,
          beta: stockData.beta,
        },
      };

      res.json(stockDetails);
    } catch (error) {
      console.error('Error fetching stock details:', error);
      res.status(500).json({ error: 'Failed to fetch stock details' });
    }
  });
}
