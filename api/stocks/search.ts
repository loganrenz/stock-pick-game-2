import { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import { requireAuth, AuthenticatedRequest } from '../lib/auth';

const ALPHA_VANTAGE_API_KEY = process.env.ALPHA_VANTAGE_API_KEY;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  return requireAuth(req as AuthenticatedRequest, res, async () => {
    const { query } = req.query;

    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'Query parameter is required' });
    }

    try {
      const response = await axios.get(
        `https://www.alphavantage.co/query?function=SYMBOL_SEARCH&keywords=${query}&apikey=${ALPHA_VANTAGE_API_KEY}`
      );

      if (response.data.bestMatches) {
        const stocks = response.data.bestMatches.map((match: any) => ({
          symbol: match['1. symbol'],
          name: match['2. name'],
          type: match['3. type'],
          region: match['4. region'],
          currency: match['8. currency']
        }));

        res.json(stocks);
      } else {
        res.json([]);
      }
    } catch (error) {
      console.error('Error searching stocks:', error);
      res.status(500).json({ error: 'Failed to search stocks' });
    }
  });
} 