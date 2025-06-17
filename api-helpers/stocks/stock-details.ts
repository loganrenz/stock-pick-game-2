import type { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';
import { requireAuth, AuthenticatedRequest } from '../lib/auth';

const ALPHA_VANTAGE_API_KEY = process.env.ALPHA_VANTAGE_API_KEY;

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
      const [quoteResponse, overviewResponse] = await Promise.all([
        axios.get(
          `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${ALPHA_VANTAGE_API_KEY}`
        ),
        axios.get(
          `https://www.alphavantage.co/query?function=OVERVIEW&symbol=${symbol}&apikey=${ALPHA_VANTAGE_API_KEY}`
        )
      ]);

      const quote = quoteResponse.data['Global Quote'];
      const overview = overviewResponse.data;

      if (!quote) {
        return res.status(404).json({ error: 'Stock not found' });
      }

      const stockData = {
        symbol: quote['01. symbol'],
        price: parseFloat(quote['05. price']),
        change: parseFloat(quote['09. change']),
        changePercent: quote['10. change percent'].replace('%', ''),
        volume: parseInt(quote['06. volume']),
        latestTradingDay: quote['07. latest trading day'],
        previousClose: parseFloat(quote['08. previous close']),
        overview: {
          name: overview.Name,
          description: overview.Description,
          sector: overview.Sector,
          industry: overview.Industry,
          marketCap: overview.MarketCapitalization,
          peRatio: overview.PERatio,
          eps: overview.EPS,
          dividendYield: overview.DividendYield,
          beta: overview.Beta
        }
      };

      res.json(stockData);
    } catch (error) {
      console.error('Error fetching stock details:', error);
      res.status(500).json({ error: 'Failed to fetch stock details' });
    }
  });
} 