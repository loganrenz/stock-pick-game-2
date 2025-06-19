import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireAuth, AuthenticatedRequest } from '../lib/auth';
import { searchStocks } from './stock-data.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  return requireAuth(req as AuthenticatedRequest, res, async () => {
    const { query } = req.query;

    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'Query parameter is required' });
    }

    try {
      const stocks = await searchStocks(query);
      res.json(stocks);
    } catch (error) {
      console.error('Error searching stocks:', error);
      res.status(500).json({ error: 'Failed to search stocks' });
    }
  });
}
