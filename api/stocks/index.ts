import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireAuth, AuthenticatedRequest } from '../../api-helpers/lib/auth.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const path = req.url?.split('/').pop() || '';

  switch (path) {
    case 'search':
      if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
      }
      return requireAuth(req as AuthenticatedRequest, res, async () => {
        try {
          const { query } = req.query;
          if (!query) {
            return res.status(400).json({ error: 'Search query is required' });
          }
          // Implement stock search logic here
          return res.status(200).json({ message: 'Stock search endpoint' });
        } catch (error) {
          console.error('Stock search error:', error);
          return res.status(500).json({ error: 'Internal server error' });
        }
      });

    case 'price':
      if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
      }
      return requireAuth(req as AuthenticatedRequest, res, async () => {
        try {
          const { symbol } = req.query;
          if (!symbol) {
            return res.status(400).json({ error: 'Stock symbol is required' });
          }
          // Implement stock price fetch logic here
          return res.status(200).json({ message: 'Stock price endpoint' });
        } catch (error) {
          console.error('Stock price error:', error);
          return res.status(500).json({ error: 'Internal server error' });
        }
      });

    default:
      return res.status(404).json({ error: 'Not found' });
  }
} 