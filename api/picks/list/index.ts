import type { VercelRequest, VercelResponse } from '@vercel/node';
import { db } from '../../lib/db.js';
import { picks, weeks, users } from '../../lib/schema.js';
import { requireAuth, AuthenticatedRequest } from '../../lib/auth';
import { eq, and, desc } from 'drizzle-orm';

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

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  return requireAuth(req as AuthenticatedRequest, res, async () => {
    try {
      const { userId, weekId } = req.query;
      let whereClause = {};

      if (userId) {
        whereClause = { ...whereClause, userId: parseInt(userId as string) };
      }

      if (weekId) {
        whereClause = { ...whereClause, weekId: parseInt(weekId as string) };
      }

      const allPicks = await db.query.picks.findMany({
        where: whereClause,
        with: {
          user: true,
          week: true
        },
        orderBy: [desc(picks.createdAt)]
      });

      // Format picks data
      const formattedPicks = allPicks.map(pick => ({
        id: pick.id,
        symbol: pick.symbol,
        entryPrice: pick.entryPrice,
        currentValue: pick.currentValue,
        weekReturn: pick.weekReturn,
        returnPercentage: pick.returnPercentage,
        createdAt: pick.createdAt,
        user: {
          id: pick.user.id,
          username: pick.user.username
        },
        week: {
          id: pick.week.id,
          weekNum: pick.week.weekNum,
          startDate: pick.week.startDate,
          endDate: pick.week.endDate,
          isWinner: pick.week.winnerId === pick.userId
        }
      }));

      res.json(formattedPicks);
    } catch (error) {
      console.error('Error fetching picks:', error);
      res.status(500).json({ error: 'Failed to fetch picks' });
    }
  });
} 