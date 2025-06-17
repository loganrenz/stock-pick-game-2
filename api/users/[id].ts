import type { VercelRequest, VercelResponse } from '@vercel/node';
import { db } from '../lib/db.js';
import { users, picks, weeks } from '../lib/schema.js';
import { requireAuth, AuthenticatedRequest } from '../lib/auth';
import { eq } from 'drizzle-orm';

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
    const userId = parseInt(req.query.id as string);

    if (!userId || isNaN(userId)) {
      return res.status(400).json({ error: 'Valid user ID is required' });
    }

    try {
      const user = await db.query.users.findFirst({
        where: eq(users.id, userId),
        with: {
          picks: {
            with: {
              week: true
            },
            orderBy: (picks, { desc }) => [desc(picks.createdAt)]
          }
        }
      });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Calculate user stats
      const wins = user.picks.filter(pick => 
        pick.week?.winnerId === user.id
      ).length;

      const totalPicks = user.picks.length;
      const winRate = totalPicks > 0 ? (wins / totalPicks) * 100 : 0;

      // Format picks history
      const picksHistory = user.picks.map(pick => ({
        id: pick.id,
        symbol: pick.symbol,
        entryPrice: pick.entryPrice,
        currentValue: pick.currentValue,
        weekReturn: pick.weekReturn,
        returnPercentage: pick.returnPercentage,
        week: {
          id: pick.week.id,
          weekNum: pick.week.weekNum,
          startDate: pick.week.startDate,
          endDate: pick.week.endDate,
          isWinner: pick.week.winnerId === user.id
        }
      }));

      res.json({
        id: user.id,
        username: user.username,
        wins,
        totalPicks,
        winRate,
        createdAt: user.createdAt,
        picksHistory
      });
    } catch (error) {
      console.error('Error fetching user:', error);
      res.status(500).json({ error: 'Failed to fetch user' });
    }
  });
} 