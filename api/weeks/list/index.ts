import type { VercelRequest, VercelResponse } from '@vercel/node';
import { db } from '../../lib/db.js';
import { weeks, picks, users } from '../../lib/schema.js';
import { requireAuth, AuthenticatedRequest } from '../../lib/auth.js';
import { desc } from 'drizzle-orm';
import type { Week as WeekType, Pick as PickType, User as UserType } from '../../../src/types/index';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );
  res.setHeader('Content-Type', 'application/json');

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
      const allWeeks = await db.query.weeks.findMany({
        with: {
          picks: {
            with: {
              user: true
            }
          },
          winner: true
        },
        orderBy: [desc(weeks.startDate)]
      }) as unknown as (Omit<WeekType, 'picks' | 'winner'> & { picks: (Omit<PickType, 'user'> & { user: UserType })[]; winner: UserType | null })[];

      // Format weeks data with type guards
      const formattedWeeks = allWeeks.map(week => ({
        id: week.id,
        weekNum: week.weekNum,
        startDate: week.startDate,
        endDate: week.endDate,
        winner: week.winner && typeof week.winner === 'object' && 'id' in week.winner && 'username' in week.winner ? {
          id: week.winner.id,
          username: week.winner.username
        } : null,
        totalPicks: Array.isArray(week.picks) ? week.picks.length : 0,
        picks: Array.isArray(week.picks) ? week.picks.map((pick: any) => ({
          id: pick.id,
          symbol: pick.symbol,
          entryPrice: pick.entryPrice,
          currentValue: pick.currentValue,
          weekReturn: pick.weekReturn,
          returnPercentage: pick.returnPercentage,
          user: pick.user && typeof pick.user === 'object' && 'id' in pick.user && 'username' in pick.user ? {
            id: pick.user.id,
            username: pick.user.username
          } : null
        })) : []
      }));

      res.status(200).json(formattedWeeks);
    } catch (error) {
      console.error('Error fetching weeks:', error, error instanceof Error ? error.stack : '');
      res.status(500).json({ error: 'Failed to fetch weeks', details: error instanceof Error ? error.message : error });
    }
  });
} 